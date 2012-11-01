import requests
import yaml
import json
import logging
import os
import time
import hashlib
import httpagentparser
import urllib2
from contextlib import closing
from django.shortcuts import render
from django.conf import settings
from django.utils.timezone import now
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


def make_resource_uri(resource, root):
    resource = resource.strip('/')
    root = root.rstrip('/')
    uri = '%s/%s/' % (root, resource)
    return uri


class ShareaboutsApi (object):
    def __init__(self, root):
        self.root = root

    def get(self, resource, default=None, **kwargs):
        uri = make_resource_uri(resource, root=self.root)
        res = requests.get(uri, params=kwargs,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)


def init_pages_config(pages_config, request):
    """
    Get the content of the static pages linked in the menu.
    """

    for page_config in pages_config:
        external = page_config.get('external', False)

        page_url = page_config.pop('url', None)
        sub_pages = page_config.pop('pages', [])
        page_config['sub_pages'] = []

        if external:
            page_config['external'] = True
            page_config['url'] = page_url

        if not external and page_url is not None:
            page_url = request.build_absolute_uri(page_url)
            # TODO It would be good if this were also asynchronous. It would be
            #      even better if we just popped some code into the template to
            #      tell the client to load this URL.  Should we use an iframe?
            #      Maybe an object tag? Something like:
            #
            #      response = ('<object type="text/html" data="{0}">'
            #                  '</object>').format(page_url)
            response = requests.get(page_url)

            # If we successfully got the content, stick it into the config instead
            # of the URL.
            if response.status_code == 200:
                page_config['content'] = response.text

            # If there was an error, let the client know what the URL, status code,
            # and text of the error was.
            else:
                page_config['url'] = page_url
                page_config['status'] = response.status_code
                page_config['error'] = response.text

        if sub_pages:
            # Do menus recursively.
            page_config['sub_pages'] = init_pages_config(sub_pages, request)

    return pages_config


def get_shareabouts_config(path_or_url):
    if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
        return ShareaboutsRemoteConfig(path_or_url)
    else:
        return ShareaboutsLocalConfig(path_or_url)


class _ShareaboutsConfig (object):
    """
    Base class representing Shareabouts configuration options
    """
    @property
    def data(self):
        if not hasattr(self, '_yml'):
            with closing(self.config_file()) as config_yml:
                self._yml = yaml.load(config_yml)

        return self._yml

    def __getitem__(self, key):
        return self.data[key]

    def get(self, key, default=None):
        return self.data.get(key, default)

    def update(self, other):
        self.data.update(other)


#
# TODO: Remote configuration is an attractive thing to support, but it has
#       several tricky implications:
#
#       1. Security
#          --------
#          The config.yml file contains the API key for the dataset.  If the
#          file is available over HTTP for this application to download, it is
#          available for anyone else as well.  It could be secured with some
#          authentication scheme, but this has to be thought about further. It
#          might be best to remove the dataset meta-information from the config
#          file and have people put it in the settings with the flavor.
#
#       2. Internationalization
#          --------------------
#          We're using the gettext format for translations, but there are some
#          things that are specific to the flavor should be translated from the
#          flavor config.  How we would load the translations for the flavor is
#          not yet known.
#
#       For these reasons, we are not yet officially supporting remote
#       configuration.
#
class ShareaboutsRemoteConfig (_ShareaboutsConfig):
    def __init__(self, url):
        self.url = url

    def static_url(self):
        return os.path.join(self.url, 'static/')

    def config_file(self):
        config_fileurl = os.path.join(self.url, 'config.yml')
        return urllib2.urlopen(config_fileurl)


class ShareaboutsLocalConfig (_ShareaboutsConfig):
    def __init__(self, path):
        self.path = path

    def static_url(self):
        return settings.STATIC_URL

    def config_file(self):
        config_filename = os.path.join(self.path, 'config.yml')
        return open(config_filename)


@ensure_csrf_cookie
def index(request, default_place_type):

    # Load app config settings
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))

    # Get initial data for bootstrapping into the page.
    api = ShareaboutsApi(root=settings.SHAREABOUTS.get('DATASET_ROOT'))

    # Handle place types in case insensitive way (park works just like Park)
    lower_place_types = [k.lower() for k in config['place_types'].keys()]
    if default_place_type.lower() in lower_place_types:
        validated_default_place_type = default_place_type
    else:
        validated_default_place_type = ''

    # TODO These requests should be done asynchronously (in parallel).
    places_json = api.get('places', default=u'[]')
    activity_json = api.get('activity', limit=20, default=u'[]')

    # Get the content of the static pages linked in the menu.
    pages_config = init_pages_config(config.get('pages', []), request)
    pages_config_json = json.dumps(pages_config)

    # The user token will be a pair, with the first element being the type
    # of identification, and the second being an identifier. It could be
    # 'username:mjumbewu' or 'ip:123.231.132.213', etc.  If the user is
    # unauthenticated, the token will be session-based.
    if 'user_token' not in request.session:
        t = int(time.time() * 1000)
        ip = request.META['REMOTE_ADDR']
        unique_string = str(t) + str(ip)
        session_token = 'session:' + hashlib.md5(unique_string).hexdigest()
        request.session['user_token'] = session_token
        request.session.set_expiry(0)

    user_token_json = u'"{0}"'.format(request.session['user_token'])

    # Get the browser that the user is using.
    user_agent_string = request.META['HTTP_USER_AGENT']
    user_agent = httpagentparser.detect(user_agent_string)
    user_agent_json = json.dumps(user_agent)

    context = {'places_json': places_json,
               'activity_json': activity_json,

               'config': config,

               'user_token_json': user_token_json,
               'pages_config_json': pages_config_json,
               'user_agent_json': user_agent_json,
               'default_place_type': validated_default_place_type,
               }
    return render(request, 'index.html', context)


def api(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')
    api_key = settings.SHAREABOUTS.get('DATASET_KEY')

    url = make_resource_uri(path, root)
    headers = {'X-Shareabouts-Key': api_key}
    return proxy_view(request, url, requests_args={'headers': headers})


def csv_download(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')
    api_key = settings.SHAREABOUTS.get('DATASET_KEY')

    url = make_resource_uri(path, root)
    headers = {
        'X-Shareabouts-Key': api_key,
        'ACCEPT': 'text/csv'
    }
    response = proxy_view(request, url, requests_args={'headers': headers})

    # Send the csv as a timestamped download
    filename = '.'.join([os.path.split(path)[1],
                        now().strftime('%Y%m%d%H%M%S'),
                        'csv'])
    response['Content-disposition'] = 'attachment; filename=' + filename

    return response


def geocode(request):
    """
    A proxy over a geocoder service. A GEOCODER setting must be present in the
    project settings.
    """
    url = settings.GEOCODER.get('URL')
    auth = {}
    geocoder_params = request.GET.copy()
    if '_' in geocoder_params:
        geocoder_params.pop('_')
    
    if 'OAUTH' in settings.GEOCODER:
        consumer_key = settings.GEOCODER['OAUTH'].get('CONSUMER_KEY')
        consumer_secret = settings.GEOCODER['OAUTH'].get('CONSUMER_SECRET')

        from requests.auth import OAuth1
        queryoauth = OAuth1(consumer_key, consumer_secret)
    
        response = requests.get(url, params=geocoder_params, auth=queryoauth)
    
    else:
        response = requests.get(url, params=geocoder_params)
    
    from django.http import HttpResponse
    return HttpResponse(response.content, 
        content_type=response.headers['content-type'], 
        status=response.status_code)

