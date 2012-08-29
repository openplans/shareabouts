from django.core.exceptions import PermissionDenied
import mock
import unittest2


class TestApiKeyAuth(unittest2.TestCase):

    def _cleanup(self):
        from .models import ApiKey
        from django.contrib.auth.models import User
        User.objects.all().delete()
        ApiKey.objects.all().delete()

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    def test_check_api_auth__no_credentials(self):
        from .auth import check_api_authorization
        from .auth import ApiKeyAuthentication
        ip = '1.2.3.4'
        request = mock.Mock(**{'user.is_authenticated.return_value': False,
                               'user.is_active': True,
                               'META': {'REMOTE_ADDR': ip},
                               'GET': {}, 'POST': {}})
        # Starts logged out...
        self.assertEqual(request.user.is_authenticated(), False)
        self.assertRaises(PermissionDenied, check_api_authorization,
                          request)
        self.assertEqual(None, ApiKeyAuthentication(None).authenticate(request))
        # Still logged out.
        self.assertEqual(request.user.is_authenticated(), False)

    def test_check_api_auth__logged_in(self):
        from .auth import check_api_authorization
        from .auth import ApiKeyAuthentication
        ip = '1.2.3.4'
        request = mock.Mock(**{'user.is_authenticated.return_value': True,
                               'user.is_active': True,
                               'META': {'REMOTE_ADDR': ip},
                               'GET': {}, 'POST': {}})
        # Starts logged in...
        self.assertEqual(request.user.is_authenticated(), True)
        self.assertEqual(True, check_api_authorization(request))
        self.assertEqual(request.user,
                         ApiKeyAuthentication(None).authenticate(request))
        # And still logged in.
        self.assertEqual(request.user.is_authenticated(), True)

    def test_check_api_auth__logged_in_but_disabled(self):
        from .auth import check_api_authorization
        from .auth import ApiKeyAuthentication
        from django.core.exceptions import PermissionDenied
        ip = '1.2.3.4'
        get_request = mock.Mock(**{'user.is_authenticated.return_value': True,
                                   'user.is_active': False,
                                   'META': {'REMOTE_ADDR': ip},
                                   'GET': {}, 'POST': {}})
        # User is logged in...
        self.assertEqual(get_request.user.is_authenticated(), True)
        # ... but still denied.
        self.assertRaises(PermissionDenied, check_api_authorization,
                          get_request)
        self.assertEqual(None,
                         ApiKeyAuthentication(None).authenticate(get_request))
        # Still logged in.
        self.assertEqual(get_request.user.is_authenticated(), True)

    def test_check_api_auth__key_invalid(self):
        from .auth import check_api_authorization, KEY_HEADER
        from .auth import ApiKeyAuthentication
        from django.core.exceptions import PermissionDenied
        key = '12345'
        ip = '1.2.3.4'
        get_request = mock.Mock(**{'user.is_authenticated.return_value': False,
                                   'user.is_active': True,
                                   'META': {'REMOTE_ADDR': ip,
                                            KEY_HEADER: key},
                                   'GET': {}, 'POST': {}})
        # Starts logged out...
        self.assertEqual(get_request.user.is_authenticated(), False)
        self.assertRaises(PermissionDenied, check_api_authorization,
                          get_request)
        self.assertEqual(None,
                         ApiKeyAuthentication(None).authenticate(get_request))
        # Still logged out.
        self.assertEqual(get_request.user.is_authenticated(), False)

    def test_check_api_auth__key(self):
        from .auth import check_api_authorization, KEY_HEADER
        from .auth import ApiKeyAuthentication
        from .models import generate_unique_api_key
        from .models import ApiKey
        from django.contrib.auth.models import User
        ip = '1.2.3.4'
        user = User.objects.create(username='bob@bob.com')
        key = ApiKey.objects.create(key=generate_unique_api_key(), user=user)
        get_request = mock.Mock(**{'user.is_authenticated.return_value': False,
                                   'user.is_active': True,
                                   'META': {'REMOTE_ADDR': ip,
                                            KEY_HEADER: key},
                                   'session': mock.MagicMock(),
                                   'GET': {}, 'POST': {}})

        # Starts logged out...
        self.assertEqual(get_request.user.is_authenticated(), False)
        self.assertEqual(True, check_api_authorization(get_request))
        self.assertEqual(get_request.user,
                         ApiKeyAuthentication(None).authenticate(get_request))
        # And now logged in.
        self.assertEqual(get_request.user.is_authenticated(), True)

    def test_check_api_auth__key__with_disabled_user(self):
        from .auth import check_api_authorization, KEY_HEADER
        from .auth import ApiKeyAuthentication
        from django.core.exceptions import PermissionDenied
        ip = '1.2.3.4'
        from .models import generate_unique_api_key
        from .models import ApiKey
        from django.contrib.auth.models import User
        user = User.objects.create(username='bob@bob.com', is_active=False)
        key = ApiKey.objects.create(key=generate_unique_api_key(), user=user)
        get_request = mock.Mock(**{'user.is_authenticated.return_value': False,
                                   'META': {'REMOTE_ADDR': ip,
                                            KEY_HEADER: key},
                                   'GET': {}, 'POST': {}})
        # User is logged out...
        self.assertEqual(get_request.user.is_authenticated(), False)
        # ... and denied.
        self.assertRaises(PermissionDenied, check_api_authorization,
                          get_request)
        self.assertEqual(None,
                         ApiKeyAuthentication(None).authenticate(get_request))
        # Still logged out.
        self.assertEqual(get_request.user.is_authenticated(), False)
