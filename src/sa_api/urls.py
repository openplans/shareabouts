from django.conf.urls import patterns, url
from . import views

urlpatterns = patterns('sa_api',
    url(r'^places/$',
        views.PlaceCollectionView.as_view(),
        name='place_collection'),
    url(r'^places/(?P<pk>\d+)/$',
        views.PlaceInstanceView.as_view(),
        name='place_instance'),

    url((r'^places/(?P<parent__place_id>\d+)/'
         r'(?P<parent__submission_type>[^/]+)/$'),
        views.SubmissionCollectionView.as_view(),
        name='submission_collection'),

    url(r'^activity/$',
        views.ActivityView.as_view(),
        name='activity_collection'),
)
