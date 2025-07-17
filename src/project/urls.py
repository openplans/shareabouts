from django.urls import include, path
from django.conf import settings
from django.contrib import admin
from django.views.i18n import set_language

from urllib.parse import urlparse
base_url = urlparse(settings.BASE_URL)
if base_url.path:
    base_path = base_url.path.strip('/') + '/'
else:
    base_path = ''


admin.autodiscover()

urlpatterns = [
    path(base_path + 'choose-language', set_language, name='set_language'),
    path(base_path + 'login/', include('sa_login.urls')),
    path(base_path + 'admin/', include('sa_admin.urls')),
    path(base_path + '', include('sa_web.urls')),
]

if settings.SHAREABOUTS['DATASET_ROOT'].startswith('/'):
    urlpatterns = [
        path(base_path + 'full-api/', include('sa_api_v2.urls')),
    ] + urlpatterns
