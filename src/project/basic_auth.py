from __future__ import unicode_literals

import base64
import os
import re

import logging
log = logging.getLogger(__name__)


def BasicAuthMiddleware(application, exempt=()):
    username = os.environ.get('BASIC_AUTH_USERNAME')
    password = os.environ.get('BASIC_AUTH_PASSWORD')
    is_protected = (username and password)

    def not_authorized(environ, start_response, msg=None):
        start_response('401 NOT AUTHORIZED', [('WWW-Authenticate', 'Basic')])
        if msg:
            log.warn('Not authorized: ' + msg)
        yield (msg or b'Not Authorized')

    def protected_application(environ, start_response):
        auth = environ.pop('HTTP_AUTHORIZATION', b'').split()

        # Check if the path is exempt. Specifying exempt path patterns is useful
        # when, for example, you're using a proxy to pass information at certain
        # routes ahead to another service. You don't want to pass the basic auth
        # credentials along as well, as the auth on the proxied service may be
        # different.
        path = environ['PATH_INFO']
        for pattern in exempt:
            if re.match(pattern, path):
                break

        # If the path is not exempt, enforce the basic auth.
        else:
            if not auth or auth[0].lower() != b'basic':
                return not_authorized(environ, start_response)

            if len(auth) == 1:
                return not_authorized(environ, start_response, 'Invalid basic header. No credentials provided.')

            if len(auth) > 2:
                return not_authorized(environ, start_response, 'Invalid basic header. Credentials string should not contain spaces.')

            try:
                auth_parts = base64.b64decode(auth[1]).decode('iso-8859-1').partition(':')
            except (TypeError, UnicodeDecodeError):
                return not_authorized(environ, start_response, 'Invalid basic header. Credentials not correctly base64 encoded.')

            if (username, password) != (auth_parts[0], auth_parts[2]):
                return not_authorized(environ, start_response, 'Invalid username/password.')

        return application(environ, start_response)

    return protected_application if is_protected else application
