"""
WSGI config for project project.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""
import os
import sys

projectdir = os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
sys.path.insert(0, projectdir)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

from dj_static import Cling
application = Cling(application)

from .gzip_middleware import GzipMiddleware
application = GzipMiddleware(application)

from .twinkie import ExpiresMiddleware
application = ExpiresMiddleware(application, {
    'application/javascript': 365*24*60*60,
    'text/css':               365*24*60*60,
    'image/png':              365*24*60*60,
})

from .basic_auth import BasicAuthMiddleware
application = BasicAuthMiddleware(application, exempt=(
    r'^/api/',
))
