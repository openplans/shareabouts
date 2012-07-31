"""
GET /places/:id/:type/
  - should return a list of submissions of the type for the place
  - should return an empty list if the place has no submissions of the type
POST /places/:id/:type/
  - should create a new submission of the given type on the place
  - should create the submission set of the given type if none exists for the place

"""

from django.test import TestCase
from django.test.client import Client
from django.test.client import RequestFactory
from mock import patch
from nose.tools import *
from ..models import Place, Submission, SubmissionSet
from ..views import SubmissionCollectionView

class TestMakingAGetRequestToASubmissionTypeCollectionUrl (TestCase):

    @istest
    def should_call_view_with_place_id_and_submission_type_name(self):
        client = Client()

        with patch('sa_api.views.SubmissionCollectionView.get') as getter:
            client.get('/v1/places/1/comment_list/')
            args, kwargs = getter.call_args
            assert_equal(
                kwargs,
                {'parent__place_id': u'1',
                 'parent__submission_type': u'comment'}
            )

    @istest
    def should_return_a_list_of_submissions_of_the_type_for_the_place(self):
        import json

        Place.objects.all().delete()
        Submission.objects.all().delete()

        place = Place.objects.create(location='POINT(0 0)')
        comments = SubmissionSet.objects.create(place_id=place.id, submission_type='comment')
        Submission.objects.create(parent_id=comments.id)
        Submission.objects.create(parent_id=comments.id)

        request = RequestFactory().get('/places/1/comment_list/')
        view = SubmissionCollectionView.as_view()

        response = view(request, parent__place_id=1,
                        parent__submission_type='comment')
        data = json.loads(response.content)
        assert_equal(len(data), 2)


    @istest
    def should_return_an_empty_list_if_the_place_has_no_submissions_of_the_type(self):
        import json

        Place.objects.all().delete()
        Submission.objects.all().delete()

        place = Place.objects.create(location='POINT(0 0)')
        comments = SubmissionSet.objects.create(place_id=place.id, submission_type='comment')
        Submission.objects.create(parent_id=comments.id)
        Submission.objects.create(parent_id=comments.id)

        request = RequestFactory().get('/places/1/vote_list/')
        view = SubmissionCollectionView.as_view()

        response = view(request, parent__place_id=1,
                        parent__submission_type='vote')
        data = json.loads(response.content)
        assert_equal(len(data), 0)
