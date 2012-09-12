from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse
import mock
import collections


class TestSaManager(TestCase):

    """
    Tests of the management views, using a mocked API proxy.

    So this makes no contact with the database except for setting up a
    user for authentication (we could probably fake that too).

    Individual test cases can set up data for return by the API by doing
    eg. self.mock_api._dataset_collection = [dict1, dict2, ...]
    and this would be returned for all GETs to the dataset list URL.
    There are some canned, minimal dicts provided during setUp(),
    override as needed.
    """
    #fixtures = []

    def setUp(self):
        self.patcher = mock.patch('sa_manager.views.ShareaboutsApi')
        self.mock_api = self.patcher.start()
        self.mock_api.return_value = self.mock_api
        # We need a user.
        from django.contrib.auth.models import User
        self.user = User.objects.create_user('riley', password='pass')

        # Some mocking to ensure that we control what the API returns
        # from various URIs.
        def build_uri(viewname, *args, **kwargs):
            return viewname

        self.mock_api.build_uri.side_effect = build_uri

        def get(uri):
            # This assumes that uri is something returned by
            # our mocked build_uri().
            if uri == 'place_instance':
                return self.mock_api._place_instance
            elif uri == 'dataset_instance':
                return self.mock_api._dataset_instance
            elif uri == 'submission_instance':
                return self.mock_api._submission_instance
            elif uri == 'place_collection':
                return self.mock_api._place_collection
            elif uri == 'dataset_collection':
                return self.mock_api._dataset_collection
            elif uri == 'keys_collection':
                return self.mock_api._keys_collection
            # TODO: mock any other responses?
            return None

        self.mock_api.get.side_effect = get

        # Having done that, test methods can modify or replace these
        # canned objects as needed.
        self.mock_api._place_instance = collections.defaultdict(
            id=123, submissions=[])
        self.mock_api._dataset_instance = collections.defaultdict(
            slug='dataset1')
        self.mock_api._submission_instance = collections.defaultdict(
            id=456)
        # All collection URIs are empty by default.
        self.mock_api._place_collection = []
        self.mock_api._dataset_collection = []
        self.mock_api._keys_collection = []

    def tearDown(self):
        self.patcher.stop()
        self.user.delete()

    def test_manager_index_needs_auth(self):
        client = Client()
        url = reverse('manager_index')
        response = client.get(url)
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response['location'])
        # Bad credentials don't work either.
        client.login(username='nobody', pasword='nope')
        response = client.get(url)
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response['location'])

    def test_manager_index(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_index')
        response = client.get(url)
        self.assertEqual(response.status_code, 302)
        self.assertIn('datasets', response['location'])

    def test_manager_dataset_list__empty(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_dataset_list',
                      args=[])
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['datasets'], [])

    def test_manager_dataset_create(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_dataset_create',
                      args=[])
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_dataset_detail(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_dataset_detail',
                      kwargs={'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_keys_list__empty(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_keys_list',
                      kwargs={'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['keys'], [])

    def test_manager_place_list__empty(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_list',
                      kwargs={'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['places'], [])

    def test_manager_place_create(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_create',
                      kwargs={'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_detail(self):
        client = Client()
        client.login(username='riley', password='pass')
        kwargs = {'pk': 123, 'dataset_slug': 'dataset1'}
        url = reverse('manager_place_detail', kwargs=kwargs)

        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_submission_list__empty(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_list',
                      kwargs={'place_id': 123,
                              'submission_type': 'comments',
                              'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['place']['submissions'], [])

    def test_manager_place_submission_create(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_create',
                      kwargs={'place_id': 123,
                              'submission_type': 'comments',
                              'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_submission_detail(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_detail',
                      kwargs={'pk': 456,
                              'place_id': 123,
                              'submission_type': 'comments',
                              'dataset_slug': 'dataset1'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
