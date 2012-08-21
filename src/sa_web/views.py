import requests
import yaml
import json
import time
import hashlib

from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


def make_resource_uri(dataset, resource, root=settings.SHAREABOUTS_API_ROOT):
    resource = resource.strip('/')
    dataset = dataset.strip('/')
    root = root.rstrip('/')
    uri = '%s/datasets/%s/%s/' % (root, dataset, resource)
    return uri


class ShareaboutsApi (object):
    def __init__(self, dataset, root=settings.SHAREABOUTS_API_ROOT):
        self.root = root
        self.dataset = dataset

    def get(self, resource, default=None, **kwargs):
        uri = make_resource_uri(self.dataset, resource, root=self.root)
        res = requests.get(uri, params=kwargs,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)


@ensure_csrf_cookie
def index(request):

    # Load app config settings
    with open(settings.SHAREABOUTS_CONFIG) as config_yml:
        config = yaml.load(config_yml)

    # TODO: Is it weird to get the API_ROOT and the dataset path from
    # separate config files?

    # Bootstrapping initial data.
    api = ShareaboutsApi(dataset=config['dataset'])

    place_types_json = json.dumps(config['place_types'])
    place_type_icons_json = json.dumps(config['place_type_icons'])
    survey_config_json = json.dumps(config['survey'])
    support_config_json = json.dumps(config['support'])

    # TODO These requests should be done asynchronously (in parallel).
    places_json = api.get('places', default=u'[]')
    activity_json = api.get('activity', limit=20, default=u'[]')

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
#    user_token_json = u'"{0}"'.format(12345)

    context = {'places_json': places_json,
               'activity_json': activity_json,
               'place_types_json': place_types_json,
               'place_type_icons_json': place_type_icons_json,
               'survey_config_json': survey_config_json,
               'support_config_json': support_config_json,
               'user_token_json': user_token_json}
    return render(request, 'index.html', context)


def api(request, path):
    with open(settings.SHAREABOUTS_CONFIG) as config_yml:
        config = yaml.load(config_yml)
    dataset = config['dataset']
    url = make_resource_uri(dataset, path)
    return proxy_view(request, url)
