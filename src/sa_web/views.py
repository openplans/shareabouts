import requests
import yaml
import json
import logging
import os
import time
import hashlib
import httpagentparser
import urllib2
from .config import get_shareabouts_config
from django.shortcuts import render
from django.conf import settings
from django.core.cache import cache
from django.utils.timezone import now
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


def make_resource_uri(resource, root):
    resource = resource.strip('/')
    root = root.rstrip('/')
    uri = '%s/%s' % (root, resource)
    return uri


class ShareaboutsApi (object):
    def __init__(self, root):
        self.dataset_root = root

        components = root.split('/')
        if root.endswith('/'):
            auth_root = '/'.join(components[:-4] + ['users', ''])
        else:
            auth_root = '/'.join(components[:-3] + ['users', ''])

        self.auth_root = auth_root

    def get(self, resource, default=None, **kwargs):
        uri = make_resource_uri(resource, root=self.dataset_root)
        res = requests.get(uri, params=kwargs,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)

    def current_user(self, default=u'null', **kwargs):
        uri = make_resource_uri('current', root=self.auth_root)
        res = requests.get(uri, headers={'Accept': 'application/json'}, **kwargs)

        return (res.text if res.status_code == 200 else default)            


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

    # Get the content of the static pages linked in the menu.
    pages_config = config.get('pages', [])
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

               'config': config,

               'user_token_json': user_token_json,
               'pages_config_json': pages_config_json,
               'user_agent_json': user_agent_json,
               'default_place_type': validated_default_place_type,

               'AUTH_ROOT': api.auth_root,
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


def users(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    user authentication.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')
    api_key = settings.SHAREABOUTS.get('DATASET_KEY')

    components = root.split('/')
    if root.endswith('/'):
        auth_root = '/'.join(components[:-4] + ['users', ''])
    else:
        auth_root = '/'.join(components[:-3] + ['users', ''])

    url = make_resource_uri(path, auth_root)
    headers = {'X-Shareabouts-Key': api_key}
    return proxy_view(request, url, requests_args={'headers': headers, 'allow_redirects': False})


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
