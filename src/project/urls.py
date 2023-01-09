from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib import admin
from django.views.i18n import set_language

admin.autodiscover()

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

# By default, static assets will be served from Django.  It is recommended that
# you use a better suited server instead.  Consult the documentation on serving
# static files with Django for your deploy platform.

urlpatterns = staticfiles_urlpatterns() + [
    # Examples:
    # url(r'^$', 'project.views.home', name='home'),
    # url(r'^project/', include('project.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^choose-language$', set_language, name='set_language'),
    url(r'^', include('sa_web.urls')),
]

from django.conf import settings
if settings.SHAREABOUTS['DATASET_ROOT'].startswith('/'):
    urlpatterns = [
        url(r'^full-api/', include('sa_api_v2.urls')),
    ] + urlpatterns