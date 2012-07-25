from django.conf.urls import patterns, url
from . import views

urlpatterns = patterns('sa_api',
    url(r'^places/$',
        views.PlaceCollectionView.as_view(),
        name='place_collection'),
    url(r'^activity/$',
        views.ActivityView.as_view(),
        name='activity_collection'),
)
