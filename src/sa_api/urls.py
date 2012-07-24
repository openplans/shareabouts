from django.conf.urls import patterns, url
from . import views

urlpatterns = patterns('sa_api',
    url(r'^places/$',
        views.PlaceCollectionView.as_view(),
        name='place_collection'),
    url(r'^recent_activity/$',
        views.RecentActivityView.as_view(),
        name='recent_activity_collection'),
)
