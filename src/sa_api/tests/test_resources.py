from mock_django.models import ModelMock
from nose.tools import istest
from nose.tools import assert_equal, assert_raises
from djangorestframework.response import ErrorResponse
import mock


def make_model_mock(model, **kw):
    spec = [attr for attr in dir(model) if not attr.endswith('__')]
    spec += kw.keys()
    from mock_django.models import _ModelMock
    mock = _ModelMock(model, spec)
    for k, v in kw.items():
        setattr(mock, k, v)
    return mock


class TestFunctions(object):

    @istest
    def simple_user(self):
        class MockUser(object):
            pk = 1
            username = 'bob'
            anything_else = 'ignored'

        from ..resources import simple_user
        assert_equal(simple_user(MockUser()),
                     {'id': 1, 'username': 'bob'})


class TestModelResourceWithDataBlob(object):

    def _get_resource_and_instance(self):
        from ..resources import ModelResourceWithDataBlob
        from ..models import SubmittedThing
        resource = ModelResourceWithDataBlob()
        resource.model = SubmittedThing
        mock_instance = ModelMock(SubmittedThing)
        # Need an instance to avoid auto-creating one.
        resource.view = mock.Mock()
        resource.view.model_instance = mock_instance
        # ... and it needs some other attributes to avoid making a
        # useless mock form.
        resource.view.form = None
        resource.view.method = None
        return resource, mock_instance

    @istest
    def serialize_with_data_blob(self):
        resource, mock_instance = self._get_resource_and_instance()

        mock_instance.data = '{"animals": ["dogs", "cats"]}'
        mock_instance.submitter_name = 'Jacques Tati'
        result = resource.serialize(mock_instance)
        assert_equal(result, {'animals': ['dogs', 'cats']})
        # TODO: why isn't submitter_name in there?

    @istest
    def validate_request_with_origdata(self):
        resource, mock_instance = self._get_resource_and_instance()
        result = resource.validate_request({'submitter_name': 'ralphie',
                                            'x': 'xylophone'})
        # Anything not in the model's fields gets converted to the 'data'
        # JSON blog.
        assert_equal(
            result,
            {'submitter_name': u'ralphie', 'dataset': None,
             'data': u'{\n  "x": "xylophone"\n}'}
        )

    @istest
    def validate_request_without_origdata(self):
        resource, mock_instance = self._get_resource_and_instance()
        # Missing required fieldsd.
        assert_raises(ErrorResponse, resource.validate_request, {})


class TestPlaceResource(object):

    @istest
    def submission_sets_empty(self):
        from ..resources import models, PlaceResource
        from mock_django.managers import ManagerMock
        mock_manager = ManagerMock(models.SubmissionSet.objects)
        with mock.patch.object(models.SubmissionSet, 'objects', mock_manager):
            assert_equal(PlaceResource().submission_sets, {})

    @istest
    def submission_sets_non_empty(self):
        from ..resources import models, PlaceResource
        from mock_django.managers import ManagerMock
        mock_manager = ManagerMock(models.SubmissionSet.objects,
                                   make_model_mock(models.SubmissionSet,
                                                   count=3, place_id=123,
                                                   submission_type='foo'),
                                   make_model_mock(models.SubmissionSet,
                                                   count=2, place_id=456,
                                                   submission_type='bar'),
                                   )

        with mock.patch.object(models.SubmissionSet, 'objects', mock_manager):
            result = {
                123: [{'count': 3, 'url': '/api/v1/places/123/foo/', 'type': 'foo'}],
                456: [{'count': 2, 'url': '/api/v1/places/456/bar/', 'type': 'bar'}],
            }
            assert_equal(PlaceResource().submission_sets.items(), result.items())

    @istest
    def test_location(self):
        from ..resources import PlaceResource
        place = mock.Mock()
        place.location.x = 123
        place.location.y = 456
        assert_equal(PlaceResource().location(place),
                     {'lng': 123, 'lat': 456})

    @istest
    def test_validate_request(self):
        from ..resources import PlaceResource, ModelResourceWithDataBlob
        resource = PlaceResource()
        with mock.patch.object(ModelResourceWithDataBlob, 'validate_request') as patched_super_validate:
            # To avoid needing to wire up ModelResourceWithDataBlob
            # for this test, we have its super_validate just return its args
            # unchanged.
            patched_super_validate.side_effect = lambda *args: args

            data, files = resource.validate_request({'location': {'lat': 1, 'lng': 2}})
            assert_equal(data, {'location': 'POINT (2 1)'})

            data, files = resource.validate_request({})
            assert_equal(data, {})


class TestDataSetResource(object):

    @istest
    def test_owner(self):
        from ..resources import DataSetResource
        resource = DataSetResource()
        dataset = mock.Mock()
        dataset.owner.pk = 123
        dataset.owner.username = 'freddy'
        assert_equal(resource.owner(dataset), {'id': 123, 'username': 'freddy'})

    @istest
    def test_places_empty(self):
        from ..resources import DataSetResource
        from mock_django.managers import ManagerMock
        from ..models import Place
        place_mgr = ManagerMock(Place.objects)
        with mock.patch.object(Place, 'objects', place_mgr):
            resource = DataSetResource()
            dataset = mock.Mock()
            assert_equal(resource.places(dataset), [])

    @istest
    def test_places(self):
        from ..resources import DataSetResource
        from mock_django.managers import ManagerMock
        from ..models import Place
        place1 = mock.Mock()
        place1.id = 123
        place2 = mock.Mock()
        place2.id = 456
        place_mgr = ManagerMock(Place.objects, place1, place2)

        with mock.patch.object(Place, 'objects', place_mgr):
            resource = DataSetResource()
            dataset = mock.Mock()
            assert_equal(resource.places(dataset),
                         [{'id': 123, 'url': '/api/v1/places/123/'},
                          {'id': 456, 'url': '/api/v1/places/456/'}
                          ])


class TestActivityResource(object):

    @istest
    def test_things(self):
        from ..resources import ActivityResource, models
        from mock_django.managers import ManagerMock
        p1 = mock.Mock(submittedthing_ptr_id=1, id=10)
        p2 = mock.Mock(submittedthing_ptr_id=2, id=20)
        mock_places = [p1, p2]

        s1 = mock.Mock(submittedthing_ptr_id=30, id=300)
        s1.parent.submission_type = 'stype1'
        s1.parent.place_id = 300
        s2 = mock.Mock(submittedthing_ptr_id=40)
        s2.parent.submission_type = 'stype2'
        s2.parent.place_id = 400
        mock_submissions = [s1, s2]

        place_mgr = ManagerMock(models.Place.objects, *mock_places)
        submission_mgr = ManagerMock(models.Submission.objects, *mock_submissions)

        with mock.patch.object(models.Place, 'objects', place_mgr):
            with mock.patch.object(models.Submission, 'objects', submission_mgr):
                resource = ActivityResource()

                assert_equal(
                    resource.things,
                    {
                        1: {'data': p1, 'place_id': 10, 'type': 'places'},
                        2: {'data': p2, 'place_id': 20, 'type': 'places'},
                        30: {'data': s1, 'place_id': 300, 'type': 'stype1'},
                        40: {'data': s2, 'place_id': 400, 'type': 'stype2'},
                    }
                )
