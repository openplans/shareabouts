import requests

from django.shortcuts import render
from django.template import RequestContext
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


@ensure_csrf_cookie
def index(request):
    # Bootstrapping initial data.
    apiroot = settings.SHAREABOUTS_API_ROOT

    places_res = requests.get(apiroot + 'places/',
                              headers={'Accepts':'application/json'})
    if places_res.status_code == 200:
        places_json = places_res.text
    else:
        import pdb; pdb.set_trace()
        places_json = u'[]'

    context = {
        'places_json': places_json
    }
    return render(request, 'index.html', context)


def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
