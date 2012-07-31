from django.conf.urls import patterns, url
from . import views

urlpatterns = patterns('sa_api',
    url(r'^$',
        views.index_view,
        name='manager_index'),
    url(r'^places/$',
        views.places_view,
        name='manager_place_list'),
    url(r'^places/new$',
        views.new_place_view,
        name='manager_place_create'),
    url(r'^places/(?P<pk>\d+)$',
        views.place_view,
        name='manager_place_detail'),
)
