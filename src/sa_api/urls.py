from django.conf.urls import patterns, url
from . import views

places_base_regex = r'^datasets/(?P<dataset__owner__username>[^/]+)/(?P<dataset__short_name>[^/]+)/places/'

urlpatterns = patterns('sa_api',
    # TODO: Should we have all of the datasets in one collection? Drop this?
    url(r'^datasets/$',
        views.DataSetCollectionView.as_view(),
        name='dataset_collection'),

    url(r'^datasets/(?P<owner__username>[^/]+)/$',
        views.DataSetCollectionView.as_view(),
        name='dataset_collection_by_user'),

    url(r'^datasets/(?P<owner__username>[^/]+)/(?P<short_name>[^/]+)/$',
        views.DataSetInstanceView.as_view(),
        name='dataset_instance_by_user'),

   # TODO: Do we have any actual use for exposing dataset pk in the API? Drop this?
    url(r'^datasets/(?P<pk>\d+)/$',
        views.DataSetInstanceView.as_view(),
        name='dataset_instance'),

    url(places_base_regex + '$',
        views.PlaceCollectionView.as_view(),
        name='place_collection_by_dataset'),

    url(places_base_regex + r'(?P<pk>\d+)/$',
        views.PlaceInstanceView.as_view(),
        name='place_instance_by_dataset'),

    url(places_base_regex + r'(?P<place_id>\d+)/(?P<submission_type>[^/]+)/$',
        views.SubmissionCollectionView.as_view(),
        name='submission_collection_by_dataset'),

    url(places_base_regex + r'(?P<place_id>\d+)/(?P<submission_type>[^/]+)/(?P<pk>\d+)/$',
        views.SubmissionInstanceView.as_view(),
        name='submission_instance_by_dataset'),

    url(r'^datasets/(?P<data__dataset__owner__username>[^/]+)/(?P<data__dataset__short_name>[^/]+)/activity/$',
        views.ActivityView.as_view(),
        name='activity_collection_by_dataset'),


    ###############################################
    # Views with no specified dataset. Deprecate?

    url(r'^places/$',
        views.PlaceCollectionView.as_view(),
        name='place_collection'),
    url(r'^places/(?P<pk>\d+)/$',
        views.PlaceInstanceView.as_view(),
        name='place_instance'),

    url((r'^places/(?P<place_id>\d+)/'
         r'(?P<submission_type>[^/]+)/$'),
        views.SubmissionCollectionView.as_view(),
        name='submission_collection'),
    url((r'^places/(?P<place_id>\d+)/'
         r'(?P<submission_type>[^/]+)/(?P<pk>\d+)/$'),
        views.SubmissionInstanceView.as_view(),
        name='submission_instance'),

    url(r'^activity/$',
        views.ActivityView.as_view(),
        name='activity_collection'),
)
