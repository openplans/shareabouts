from django.urls import include, path
from django.conf import settings
from django.contrib import admin
from django.views.i18n import set_language

admin.autodiscover()

urlpatterns = [
    path('admin/', admin.site.urls),
    path('choose-language', set_language, name='set_language'),
    path('', include('sa_web.urls')),
]

if settings.SHAREABOUTS['DATASET_ROOT'].startswith('/'):
    urlpatterns = [
        path('full-api/', include('sa_api_v2.urls')),
    ] + urlpatterns
