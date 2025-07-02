from django.shortcuts import render, redirect
from django.urls import reverse
from sa_util.config import get_shareabouts_config
from sa_util.api import ShareaboutsApi


def shareabouts_loggedin(viewfunc):
    def wrapper(request, *args, **kwargs):
        config = get_shareabouts_config()
        api = ShareaboutsApi(config, request)

        api_user = api.current_user()
        if not api_user:
            return redirect(reverse('login') + '?next=' + request.path)

        return viewfunc(request, config, api, *args, **kwargs)

    return wrapper


@shareabouts_loggedin
def admin_home(request, config, api):
    return render(request, 'sa_admin/dashboard.html', {
        'api': api,
        'config': config,
    })


@shareabouts_loggedin
def place_detail(request, config, api, place_id):
    return render(request, 'sa_admin/place_detail.html', {
        'place_id': place_id,
        'api': api,
        'config': config,
    })
