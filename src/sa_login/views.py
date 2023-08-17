from urllib.parse import urlparse
from django.conf import settings
from django.shortcuts import render
import requests
from sa_web.config import get_shareabouts_config
from sa_web.views import make_auth_root, get_api_sessionid, ShareaboutsApi, ShareaboutsApiError


def login(request):
    # Load app config settings
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))
    dataset_root = settings.SHAREABOUTS.get('DATASET_ROOT')
    auth_root = make_auth_root(dataset_root)

    api_sessionid = get_api_sessionid(request)
    api = ShareaboutsApi(dataset_root, api_sessionid)

    api_cookie = ''
    api_user = ''
    error_str = ''

    # GET the current user session from the API
    if request.method == 'GET':
        api_user = api.current_user()
        api_cookie = api.sessionid

    # POST a new user session to log in to the API
    elif request.method == 'POST' and request.POST.get('shadowmethod', '').upper() != 'DELETE':
        try:
            api.login(request.POST.get('username'), request.POST.get('password'))
            api_user = api.current_user()
            api_cookie = api.sessionid
        except ShareaboutsApiError as exc:
            error_str = f'Login failed. {"; ".join(exc.errors.values()) if exc.errors else "Please try again."}'

    # DELETE the current user session to log out of the API
    elif request.method == 'POST' and request.POST.get('shadowmethod', '').upper() == 'DELETE':
        try:
            api.logout()
            api_user = api.current_user()
            api_cookie = api.sessionid
        except ShareaboutsApiError:
            error_str = 'Failed to log out. Please try again.'

    response = render(request, 'sa_login.html', {
        'api_user': api_user,
        'errors': error_str,
        'config': config,
        'dataset_root': dataset_root,
        'auth_root': auth_root,
    })

    if api_cookie:
        response.set_cookie('sa-api-sessionid', api_cookie)
    else:
        response.delete_cookie('sa-api-sessionid')

    return response