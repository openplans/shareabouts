import requests
import yaml
import json
import time
import hashlib

from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


class ShareaboutsApi (object):
    def __init__(self, root=settings.SHAREABOUTS_API_ROOT):
        self.root = root

    def get(self, path, default=None):
        res = requests.get(self.root + path,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)


@ensure_csrf_cookie
def index(request):
    # Get initial data for bootstrapping into the page.
    api = ShareaboutsApi()

    # TODO These requests should be done asynchronously (in parallel).
    places_json = api.get('places/', u'[]')
    activity_json = api.get('activity/?limit=20', u'[]')

    # Load app config settings
    with open(settings.SHAREABOUTS_CONFIG) as config_yml:
        config = yaml.load(config_yml)

    place_types_json = json.dumps(config['place_types'])
    place_type_icons_json = json.dumps(config['place_type_icons'])
    survey_config_json = json.dumps(config['survey'])
    support_config_json = json.dumps(config['support'])

    # Get the content of the static pages linked in the menu.
    pages_config = config.get('pages', [])
    for page_config in pages_config:
        page_url = page_config.pop('url')
        page_url = request.build_absolute_uri(page_url)

        # TODO It would be best if this were also asynchronous.
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

    context = {'places_json': places_json,
               'activity_json': activity_json,
               'place_types_json': place_types_json,
               'place_type_icons_json': place_type_icons_json,
               'survey_config_json': survey_config_json,
               'support_config_json': support_config_json,
               'user_token_json': user_token_json,
               'pages_config_json': pages_config_json }
    return render(request, 'index.html', context)


def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
