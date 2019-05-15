from django.conf.urls import patterns, url
from . import views
from sa_login import views as login_views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'project.views.home', name='home'),
    # url(r'^project/', include('project.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),

    url(r'^api/(.*)$', views.api, name='api_proxy'),
    url(r'^users/(.*)$', views.users, name='auth_proxy'),
    url(r'^download/(.*).csv$', views.csv_download, name='csv_proxy'),
    url(r'^place/(?P<place_id>[^/]+)$', views.index, name='place'),
    url(r'^login/$', login_views.login, name='login'),
    url(r'^', views.index, name='index'),
)
