from django.shortcuts import render
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


@ensure_csrf_cookie
def index(request):
    return render(request, 'index.html')


def api(request, path):
    url = settings.SHAREABOUTS_API_ROOT + path
    return proxy_view(request, url)
