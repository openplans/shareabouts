from django.conf import settings
from django.shortcuts import render
from sa_web.config import get_shareabouts_config
from sa_web.views import make_auth_root


def login(request):
    # Load app config settings
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))
    dataset_root = settings.SHAREABOUTS.get('DATASET_ROOT')
    auth_root = make_auth_root(dataset_root)

    return render(request, 'sa_login.html', {'config': config, 'dataset_root': dataset_root, 'auth_root': auth_root})
