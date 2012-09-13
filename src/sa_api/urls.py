from django.conf.urls import patterns, url
from . import views

places_base_regex = r'^datasets/(?P<dataset__owner__username>[^/]+)/(?P<dataset__slug>[^/]+)/places/'

urlpatterns = patterns('sa_api',
    url(r'^datasets/(?P<owner__username>[^/]+)/$',
        views.DataSetCollectionView.as_view(),
        name='dataset_collection_by_user'),

    url(r'^datasets/(?P<owner__username>[^/]+)/(?P<slug>[^/]+)/$',
        views.DataSetInstanceView.as_view(),
        name='dataset_instance_by_user'),

    url(r'^datasets/(?P<datasets__owner__username>[^/]+)/(?P<datasets__slug>[^/]+)/keys/$',
        views.ApiKeyCollectionView.as_view(),
        name='api_key_collection_by_dataset'),

    url(places_base_regex + '$',
        views.PlaceCollectionView.as_view(),
        name='place_collection_by_dataset'),

    url(places_base_regex + r'(?P<pk>\d+)/$',
        views.PlaceInstanceView.as_view(),
        name='place_instance_by_dataset'),

    url(r'^datasets/(?P<dataset__owner__username>[^/]+)/(?P<dataset__slug>[^/]+)/(?P<submission_type>[^/]+)/$',
        views.AllSubmissionCollectionsView.as_view(),
        name='all_submissions_by_dataset'),

    url(places_base_regex + r'(?P<place_id>\d+)/(?P<submission_type>[^/]+)/$',
        views.SubmissionCollectionView.as_view(),
        name='submission_collection_by_dataset'),

    url(places_base_regex + r'(?P<place_id>\d+)/(?P<submission_type>[^/]+)/(?P<pk>\d+)/$',
        views.SubmissionInstanceView.as_view(),
        name='submission_instance_by_dataset'),

    url(r'^datasets/(?P<data__dataset__owner__username>[^/]+)/(?P<data__dataset__slug>[^/]+)/activity/$',
        views.ActivityView.as_view(),
        name='activity_collection_by_dataset'),


    ###############################################
    # Views with no specified dataset. Deprecate?

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
