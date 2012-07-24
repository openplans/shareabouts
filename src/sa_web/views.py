import requests

from django.shortcuts import render
from django.template import RequestContext
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


class ShareaboutsApi (object):
    def __init__(self, root=settings.SHAREABOUTS_API_ROOT):
        self.root = root

    def get(self, path, default=None):
        res = requests.get(self.root + path)
        return (res.text if res.status_code == 200 else default)


@ensure_csrf_cookie
def index(request):
    # Bootstrapping initial data.
    api = ShareaboutsApi()
    places_json = api.get('places/?format=json', u'[]')

    context = {'places_json': places_json}
    return render(request, 'index.html', context)


def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
