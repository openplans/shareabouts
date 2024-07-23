from django.http import HttpRequest, HttpResponse
from django.urls import reverse
import requests
from urllib.parse import urlparse

from django.conf import settings
from .config import get_shareabouts_config, _ShareaboutsConfig


def make_api_root(dataset_root):
    components = dataset_root.split('/')
    if dataset_root.endswith('/'):
        return '/'.join(components[:-4]) + '/'
    else:
        return '/'.join(components[:-3]) + '/'


def make_auth_root(dataset_root):
    return make_api_root(dataset_root) + 'users/'


def make_resource_uri(resource, root):
    resource = resource.lstrip('/')
    root = root.rstrip('/')
    uri = '%s/%s' % (root, resource)
    return uri


ApiSessionInfo = dict


def get_api_sessioninfo(django_http_request: HttpRequest) -> ApiSessionInfo:
    """
    Pull session cookie information from a Django HTTP request.
    """
    return {
        'id': django_http_request.COOKIES.get('sa-api-sessionid'),
        'domain': django_http_request.COOKIES.get('sa-api-sessiondomain'),
    }


def make_api_session(dataset_root, api_sessioninfo: ApiSessionInfo):
    """
    Create a requests session for the Shareabouts API.
    """
    api_session = requests.Session()
    api_session.headers['Content-type'] = 'application/json'
    api_session.headers['Accept'] = 'application/json'

    if api_sessioninfo:
        api_session.cookies.set(
            'sessionid',
            api_sessioninfo.get('id'),
            domain=api_sessioninfo.get('domain'),
        )

    return api_session


class ShareaboutsApiError (Exception):
    def __init__(self, msg, errors):
        super().__init__(msg)
        self.errors = errors


class ShareaboutsApi:
    def __init__(
        self,
        config: _ShareaboutsConfig,
        request: HttpRequest,
        dataset_root: str | None = None,
        sessioninfo: dict | None = None
    ):
        if config is None:
            config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
            config.update(settings.SHAREABOUTS.get('CONTEXT', {}))

        if dataset_root is None:
            dataset_root = settings.SHAREABOUTS.get('DATASET_ROOT')

        if (dataset_root.startswith('file:')):
            if not request:
                raise ValueError('A request object is required to use a file-based dataset_root.')
            dataset_root = request.build_absolute_uri(reverse('api_proxy', args=('',)))

        if sessioninfo is None:
            if not request:
                raise ValueError('A request object is required to dynamically get the sessioninfo.')
            sessioninfo = get_api_sessioninfo(request)
            print(f'Got sessioninfo: {sessioninfo}')

        self.config = config
        self.dataset_root = dataset_root
        self.auth_root = make_auth_root(dataset_root)
        self.root = make_api_root(dataset_root)
        self.sessioninfo = sessioninfo
        self.session = make_api_session(dataset_root, sessioninfo)

    def get(self, resource, default=None, **kwargs):
        uri = make_resource_uri(resource, root=self.dataset_root)
        res = self.session.get(uri, params=kwargs)
        self.update_session_cookie()
        return (res.text if res.status_code == 200 else default)

    def current_user(self, default=None, **kwargs):
        if not hasattr(self, '_cached_user'):
            uri = make_resource_uri('current', root=self.auth_root)
            res = self.session.get(uri, **kwargs)
            self.update_session_cookie()

            self._cache_user(res.json() if res.status_code == 200 else default)
        return self._cached_user

    def login(self, username, password, **kwargs):
        payload = {
            'username': username,
            'password': password,
        }
        uri = make_resource_uri('current', root=self.auth_root)
        res = self.session.post(uri, json=payload, **kwargs)
        self.update_session_cookie()

        if res.status_code == 200:
            self._cache_user(res.json())
            return True
        else:
            raise ShareaboutsApiError(res.text, res.json().get('errors'))

    def get_provider_client_id(self, provider):
        try:
            return os.environ[f'SOCIAL_AUTH_{provider.upper()}_KEY']
        except KeyError:
            raise ShareaboutsAuthProviderError(f'No client_id found for provider "{provider}"', {})

    def get_provider_client_secret(self, provider):
        try:
            return os.environ[f'SOCIAL_AUTH_{provider.upper()}_SECRET']
        except KeyError:
            raise ShareaboutsAuthProviderError(f'No client_secret found for provider "{provider}"', {})

    def get_provider_redirect_uri(self, provider):
        return os.environ.get(
            f'SOCIAL_AUTH_{provider.upper()}_REDIRECT',
            self.request.build_absolute_uri(
                reverse('oauth_complete', args=[provider])
            )
        )

    def oauth_begin(self, provider, **kwargs) -> str:
        """
        Begin the OAuth process for the given provider. Returns the URL to
        redirect to. May raise a ShareaboutsApiError if the request fails, or
        ShareaboutsAuthProviderError if the provider is not configured.
        """
        uri = make_resource_uri(f'login/{provider}/', root=self.auth_root)
        params = {
            'client_id': self.get_provider_client_id(provider),
            'client_secret': self.get_provider_client_secret(provider),
            'redirect_uri': self.get_provider_redirect_uri(provider),
        }

        res = self.session.get(uri, params=params, allow_redirects=False, **kwargs)
        self.update_session_cookie()

        if res.status_code == 302:
            return res.headers['Location']
        else:
            raise ShareaboutsApiError(res.text, {})

    def oauth_complete(self, provider, params, **kwargs):
        uri = make_resource_uri(f'complete/{provider}/', root=self.auth_root)
        params = {
            'client_id': self.get_provider_client_id(provider),
            'client_secret': self.get_provider_client_secret(provider),
            'redirect_uri': self.get_provider_redirect_uri(provider),
            **params,
        }

        res = self.session.get(uri, params=params, **kwargs)
        self.update_session_cookie()

        if res.status_code == 200:
            return True
        else:
            raise ShareaboutsApiError(res.text, {})

    def logout(self, **kwargs):
        uri = make_resource_uri('current', root=self.auth_root)
        res = self.session.delete(uri, **kwargs)
        self.update_session_cookie()

        if res.status_code == 204:
            self._cache_user(None)
            return True
        else:
            raise ShareaboutsApiError(res.text, {})

    def update_session_cookie(self):
        """
        Update the sessionid from the cookies in the session.
        """
        for cookie in self.session.cookies:
            if cookie.name == 'sessionid':
                self.sessioninfo = {
                    'id': cookie.value,
                    'domain': cookie.domain,
                }
                break
        else:
            self.sessioninfo = None

    def _cache_user(self, user):
        self._cached_user = user

    def _invalidate_user(self):
        del self._cached_user

    def respond_with_session_cookie(self, response: HttpResponse):
        if self.sessioninfo:
            response.set_cookie('sa-api-sessionid', self.sessioninfo['id'])
            response.set_cookie('sa-api-sessiondomain', self.sessioninfo['domain'])
            print(f'Updating session cookie: {self.sessioninfo}')
        else:
            response.delete_cookie('sa-api-sessionid')
            response.delete_cookie('sa-api-sessiondomain')
            print('Deleting session cookie')
        return response
