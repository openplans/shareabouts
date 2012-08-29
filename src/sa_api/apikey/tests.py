from django.core.exceptions import PermissionDenied
import mock
import unittest2


class TestApiKeyAuth(unittest2.TestCase):

    def test_check_api_auth__no_credentials(self):
        from .auth import check_api_authorization
        from .auth import ApiKeyAuthentication
        ip = '1.2.3.4'
        request = mock.Mock(**{'user.is_authenticated.return_value': False,
                               'META': {'REMOTE_ADDR': ip},
                               'GET': {}, 'POST': {}})
        self.assertRaises(PermissionDenied, check_api_authorization,
                          request)
        self.assertEqual(None, ApiKeyAuthentication(None).authenticate(request))

    def test_check_api_auth__logged_in(self):
        from .auth import check_api_authorization
        from .auth import ApiKeyAuthentication
        ip = '1.2.3.4'
        request = mock.Mock(**{'user.is_authenticated.return_value': True,
                               'META': {'REMOTE_ADDR': ip},
                               'GET': {}, 'POST': {}})
        self.assertEqual(True, check_api_authorization(request))
        self.assertEqual(request.user,
                         ApiKeyAuthentication(None).authenticate(request))

    def test_check_api_auth__key_invalid(self):
        from .auth import check_api_authorization, KEY_HEADER
        from .auth import ApiKeyAuthentication
        from django.core.exceptions import PermissionDenied
        key = '12345'
        ip = '1.2.3.4'
        get_request = mock.Mock(**{'user.is_authenticated.return_value': False,
                                   'META': {'REMOTE_ADDR': ip,
                                            KEY_HEADER: key},
                                   'GET': {}, 'POST': {}})
        self.assertRaises(PermissionDenied, check_api_authorization,
                          get_request)
        self.assertEqual(None,
                         ApiKeyAuthentication(None).authenticate(get_request))

    def test_check_api_auth__key(self):
        from .auth import check_api_authorization, KEY_HEADER
        from .auth import ApiKeyAuthentication
        from .models import generate_unique_api_key
        from .models import ApiKey
        from django.contrib.auth.models import User
        User.objects.all().delete()
        ApiKey.objects.all().delete()
        ip = '1.2.3.4'
        user = User.objects.create(username='bob@bob.com')
        key = ApiKey.objects.create(key=generate_unique_api_key(), user=user)
        get_request = mock.Mock(**{'user.is_authenticated.return_value': False,
                                   'META': {'REMOTE_ADDR': ip,
                                            KEY_HEADER: key},
                                   'session': mock.MagicMock(),
                                   'GET': {}, 'POST': {}})
        self.assertEqual(True, check_api_authorization(get_request))
        self.assertEqual(get_request.user,
                         ApiKeyAuthentication(None).authenticate(get_request))
