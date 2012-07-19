from django.shortcuts import render
from django.conf import settings
from proxy.views import proxy_view


def index(request):
    return render(request, 'index.html')


def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
