from django.test import TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse
import mock
import collections

class TestSaManager(TestCase):

    #fixtures = []

    def setUp(self):
        self.patcher = mock.patch('sa_manager.views.ShareaboutsApi')
        self.mock_api = self.patcher.start()
        self.mock_api.return_value = self.mock_api
        # We need a user.
        from django.contrib.auth.models import User
        self.user = User.objects.create_user('riley', password='pass')

    def tearDown(self):
        self.patcher.stop()

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

    def test_manager_dataset_list(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_dataset_list',
                      args=[])
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

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
                      kwargs={'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_keys_list(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_keys_list',
                      kwargs={'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_list(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_list',
                      kwargs={'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_create(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_create',
                      kwargs={'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_detail(self):
        client = Client()
        client.login(username='riley', password='pass')
        kwargs = {'pk': 123, 'dataset_slug': 'ds1'}
        url = reverse('manager_place_detail', kwargs=kwargs)

        # Some mocking to ensure that we control what the API returns
        # from various URIs.
        def build_uri(viewname, *args, **kwargs):
            return viewname

        self.mock_api.build_uri.side_effect = build_uri

        def get(uri):
            if uri == 'place_instance':
                return collections.defaultdict(id=kwargs['pk'])
            elif uri == 'dataset_instance':
                return collections.defaultdict(slug=kwargs['dataset_slug'])

        self.mock_api.get.side_effect = get
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_submission_list(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_list',
                      kwargs={'place_id': 'test', 'submission_type': 'test', 'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_submission_create(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_create',
                      kwargs={'place_id': 'test', 'submission_type': 'test', 'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_manager_place_submission_detail(self):
        client = Client()
        client.login(username='riley', password='pass')
        url = reverse('manager_place_submission_detail',
                      kwargs={'pk': 'test', 'place_id': 'test', 'submission_type': 'test', 'dataset_slug': 'test'})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)

