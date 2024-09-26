from django.http import HttpRequest
from django.shortcuts import render, redirect
from sa_util.config import get_shareabouts_config
from sa_util.api import ShareaboutsApi, ShareaboutsApiError


def login(request: HttpRequest):
    # Load app config settings
    config = get_shareabouts_config()
    api = ShareaboutsApi(config, request)

    api_user = ''
    error_str = ''

    # GET the current user session from the API
    if request.method == 'GET':
        api_user = api.current_user()
        next_url = request.GET.get('next', None)

    # POST a new user session to log in to the API
    elif request.method == 'POST' and request.POST.get('shadowmethod', '').upper() != 'DELETE':
        print('Logging in...')
        try:
            api.login(request.POST.get('username'), request.POST.get('password'))
            api_user = api.current_user()
            print('Successfully logged in to the API session.')
        except ShareaboutsApiError as exc:
            error_str = f'Login failed. {"; ".join(exc.errors.values()) if exc.errors else "Please try again."}'
            print('Failed to log in to the API session:', exc)
        next_url = request.POST.get('next', None)

    # DELETE the current user session to log out of the API
    elif request.method == 'POST' and request.POST.get('shadowmethod', '').upper() == 'DELETE':
        print('Logging out...')
        try:
            api.logout()
            api_user = api.current_user()
            print('Successfully logged out of the API session.')
        except ShareaboutsApiError as exc:
            error_str = 'Failed to log out. Please try again.'
            print('Failed to log out of the API session:', exc)
        next_url = request.POST.get('next', None)

    if api_user and next_url:
        response = redirect(next_url)
        print(f'Redirecting to {next_url}...')
    else:
        response = render(request, 'sa_login.html', {
            'api_user': api_user,
            'errors': error_str,
            'config': config,
            'dataset_root': api.dataset_root,
            'auth_root': api.auth_root,
            'next_url': next_url,
        })
        print('Rendering the login page...')

    return api.respond_with_session_cookie(response)
