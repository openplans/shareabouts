from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from proxy.views import proxy_view


def index(request):
    return render(request, 'index.html')


# TODO Should this really be exempt?
@csrf_exempt
def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
