from django.test import TestCase
from django.test.client import Client
from django.test.client import RequestFactory
from django.core.urlresolvers import reverse
from mock import patch
from nose.tools import istest, assert_equal, assert_in
from ..models import Place, Submission, SubmissionSet
from ..models import SubmittedThing, Activity
from ..views import SubmissionCollectionView
import json


class TestDataSetCollectionView(TestCase):

    @istest
    def post_creates_an_api_key(self):
        from ..models import DataSet
        from ..apikey.models import ApiKey
        from django.contrib.auth.models import User
        DataSet.objects.all().delete()
        ApiKey.objects.all().delete()
        User.objects.all().delete()
        user = User.objects.create(username='bob')
        # TODO: mock the models?

        url = reverse('dataset_collection')
        data = {
            'owner': user.id,
            'display_name': 'Test DataSet',
            'short_name': 'test-dataset',
        }

        from ..views import DataSetCollectionView

        # Simulate a POST with logged-in user.
        request = RequestFactory().post(url, data=json.dumps(data),
                                        content_type='application/json')
        request.user = user
        view = DataSetCollectionView().as_view()
        response = view(request)

        assert_equal(response.status_code, 201)
        assert_in(url + 'bob/test-dataset', response.get('Location'))

        response_data = json.loads(response.content)
        assert_equal(response_data['display_name'], 'Test DataSet')
        assert_equal(response_data['short_name'], 'test-dataset')


class TestMakingAGetRequestToASubmissionTypeCollectionUrl (TestCase):

    @istest
    def should_call_view_with_place_id_and_submission_type_name(self):
        client = Client()

        with patch('sa_api.views.SubmissionCollectionView.get') as getter:
            client.get('/api/v1/places/1/comments/')
            args, kwargs = getter.call_args
            assert_equal(
                kwargs,
                {'place_id': u'1',
                 'submission_type': u'comments'}
            )

    @istest
    def should_return_a_list_of_submissions_of_the_type_for_the_place(self):
        Place.objects.all().delete()
        Submission.objects.all().delete()
        SubmissionSet.objects.all().delete()

        place = Place.objects.create(location='POINT(0 0)')
        comments = SubmissionSet.objects.create(place_id=place.id, submission_type='comments')
        Submission.objects.create(parent_id=comments.id)
        Submission.objects.create(parent_id=comments.id)

        request = RequestFactory().get('/places/%d/comments/' % place.id)
        view = SubmissionCollectionView.as_view()

        response = view(request, place_id=place.id,
                        submission_type='comments')
        data = json.loads(response.content)
        assert_equal(len(data), 2)


    @istest
    def should_return_an_empty_list_if_the_place_has_no_submissions_of_the_type(self):
        Place.objects.all().delete()
        Submission.objects.all().delete()

        place = Place.objects.create(location='POINT(0 0)')
        comments = SubmissionSet.objects.create(place_id=place.id, submission_type='comments')
        Submission.objects.create(parent_id=comments.id)
        Submission.objects.create(parent_id=comments.id)

        request = RequestFactory().get('/places/%d/votes/' % place.id)
        view = SubmissionCollectionView.as_view()

        response = view(request, place_id=place.id,
                        submission_type='votes')
        data = json.loads(response.content)
        assert_equal(len(data), 0)


class TestMakingAPostRequestToASubmissionTypeCollectionUrl (TestCase):

    @istest
    def should_create_a_new_submission_of_the_given_type_on_the_place(self):
        Place.objects.all().delete()
        Submission.objects.all().delete()
        SubmissionSet.objects.all().delete()

        place = Place.objects.create(location='POINT(0 0)')
        comments = SubmissionSet.objects.create(place_id=place.id, submission_type='comments')

        data = {
            'submitter_name': 'Mjumbe Poe',
            'age': 12,
            'comment': 'This is rad!',
        }
        request = RequestFactory().post('/places/%d/comments/' % place.id,
                                        data=json.dumps(data), content_type='application/json')
        view = SubmissionCollectionView.as_view()

        response = view(request, place_id=place.id,
                        submission_type='comments')
        data = json.loads(response.content)
        #print response
        assert_equal(response.status_code, 201)
        assert_in('age', data)


class TestSubmissionInstanceAPI (TestCase):

    def setUp(self):
        Place.objects.all().delete()
        Submission.objects.all().delete()
        SubmissionSet.objects.all().delete()

        self.place = Place.objects.create(location='POINT(0 0)')
        self.comments = SubmissionSet.objects.create(place_id=self.place.id,
                                                submission_type='comments')
        self.submission = Submission.objects.create(parent_id=self.comments.id)
        self.url = reverse('submission_instance',
                           kwargs=dict(place_id=self.place.id,
                                       pk=self.submission.id,
                                       submission_type='comments'))
        from ..views import SubmissionInstanceView
        self.view = SubmissionInstanceView.as_view()

    @istest
    def put_request_should_modify_instance(self):
        data = {
            'submitter_name': 'Paul Winkler',
            'age': 99,
            'comment': 'Get off my lawn!',
        }

        request = RequestFactory().put(self.url, data=json.dumps(data),
                                       content_type='application/json')

        response = self.view(request, place_id=self.place.id,
                             pk=self.submission.id,
                             submission_type='comments')
        response_data = json.loads(response.content)
        assert_equal(response.status_code, 200)
        self.assertDictContainsSubset(data, response_data)

    @istest
    def delete_request_should_delete_submission(self):
        request = RequestFactory().delete(self.url)
        response = self.view(request, place_id=self.place.id,
                             pk=self.submission.id,
                             submission_type='comments')

        assert_equal(response.status_code, 204)
        assert_equal(Submission.objects.all().count(), 0)

    @istest
    def submission_get_request_retrieves_data(self):
        self.submission.data = json.dumps({'animal': 'tree frog'})
        self.submission.save()
        request = RequestFactory().get(self.url)
        response = self.view(request, place_id=self.place.id,
                             pk=self.submission.id,
                             submission_type='comments')

        assert_equal(response.status_code, 200)
        data = json.loads(response.content)
        assert_equal(data['animal'], 'tree frog')


class TestActivityView(TestCase):

    def setUp(self):
        SubmittedThing.objects.all().delete()
        Activity.objects.all().delete()
        self.submitted_thing = SubmittedThing.objects.create()
        # Note this implicitly creates an Activity.
        activity1 = Activity.objects.get(data_id=self.submitted_thing.id)
        self.activities = [
            activity1,
            Activity.objects.create(data=self.submitted_thing, action='update'),
            Activity.objects.create(data=self.submitted_thing, action='delete'),
        ]
        self.url = reverse('activity_collection')

    @istest
    def get_queryset_no_params_returns_all(self):
        from ..views import ActivityView
        view = ActivityView()
        view.request = RequestFactory().get(self.url)
        qs = view.get_queryset()
        self.assertEqual(qs.count(), len(self.activities))

    @istest
    def get_queryset_before(self):
        from ..views import ActivityView
        view = ActivityView()
        ids = sorted([a.id for a in self.activities])
        view.request = RequestFactory().get(self.url + '?before=%d' % ids[0])
        self.assertEqual(view.get_queryset().count(), 1)
        view.request = RequestFactory().get(self.url + '?before=%d' % ids[-1])
        self.assertEqual(view.get_queryset().count(), len(self.activities))

    @istest
    def get_queryset_after(self):
        from ..views import ActivityView
        view = ActivityView()
        ids = sorted([a.id for a in self.activities])
        view.request = RequestFactory().get(self.url + '?after=%d' % (ids[0] - 1))
        self.assertEqual(view.get_queryset().count(), 3)
        view.request = RequestFactory().get(self.url + '?after=%d' % ids[0])
        self.assertEqual(view.get_queryset().count(), 2)
        view.request = RequestFactory().get(self.url + '?after=%d' % ids[-1])
        self.assertEqual(view.get_queryset().count(), 0)

    @istest
    def get_with_limit(self):
        from ..views import ActivityView
        view = ActivityView()
        view.request = RequestFactory().get(self.url + '?limit')
        self.assertEqual(view.get(view.request).count(), len(self.activities))

        view.request = RequestFactory().get(self.url + '?limit=99')
        self.assertEqual(view.get(view.request).count(), len(self.activities))

        view.request = RequestFactory().get(self.url + '?limit=0')
        self.assertEqual(view.get(view.request).count(), 0)

        view.request = RequestFactory().get(self.url + '?limit=1')
        self.assertEqual(view.get(view.request).count(), 1)


class TestAbsUrlMixin (object):

    @istest
    def test_process_urls(self):
        data = {
            'url': '/foo/bar',
            'x': 'y',
            'children': [{'x': 'y', 'url': '/hello/cats'},
                         {'a': 'b', 'url': 'bye/../dogs'},
                         ]
        }
        from ..views import AbsUrlMixin
        aum = AbsUrlMixin()
        aum.request = RequestFactory().get('/path_is_irrelevant')
        aum.process_urls(data)
        assert_equal(data['url'], 'http://testserver/foo/bar')
        assert_equal(data['children'][0]['url'],
                     'http://testserver/hello/cats')
        assert_equal(data['children'][1]['url'],
                     'http://testserver/dogs')


class TestPlaceCollectionView(TestCase):

    def _cleanup(self):
        from sa_api import models
        from django.contrib.auth.models import User
        models.Submission.objects.all().delete()
        models.SubmissionSet.objects.all().delete()
        models.Place.objects.all().delete()
        models.DataSet.objects.all().delete()
        User.objects.all().delete()

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    @istest
    def post_creates_a_place(self):
        from ..views import PlaceCollectionView, models
        view = PlaceCollectionView().as_view()
        # Need an existing DataSet.
        from django.contrib.auth.models import User
        user = User.objects.create(username='test-user')
        ds = models.DataSet.objects.create(owner=user, id=789,
                                           short_name='stuff')
        #place = models.Place.objects.create(dataset=ds, id=123)
        uri_args = {
            'dataset__owner__username': user.username,
            'dataset__short_name': ds.short_name,
        }
        uri = reverse('place_collection_by_dataset', kwargs=uri_args)
        data = {'location': {'lat': 39.94494, 'lng': -75.06144},
                'description': 'hello', 'location_type': 'School',
                'name': 'Ward Melville HS',
                'submitter_name': 'Joe',
                }
        request = RequestFactory().post(uri, data=json.dumps(data),
                                        content_type='application/json')
        # Ready to post. Verify there are no Places yet...
        assert_equal(models.Place.objects.count(), 0)

        response = view(request, **uri_args)

        # We got a Created status...
        assert_equal(response.status_code, 201)
        assert_in(uri, response.get('Location'))

        # And we have a place:
        assert_equal(models.Place.objects.count(), 1)
