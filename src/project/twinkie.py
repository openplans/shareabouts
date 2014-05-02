# -*- coding: utf-8 -*-

from django.conf import settings
from wsgiref.headers import Headers
from wsgiref.handlers import format_date_time
from time import time

from logging import getLogger
log = getLogger(__name__)

## The following is useful for local debugging
# from logging import DEBUG, StreamHandler
# from sys import stderr
# log.setLevel(DEBUG)
# log.addHandler(StreamHandler(stderr))


class ExpiresMiddleware (object):
    """WSGI middleware that intercepts calls to the static files
    directory, as defined by the STATIC_URL setting, and serves those files.
    """
    def __init__(self, application, expire_seconds):
        self.application = application
        self.expire_seconds = expire_seconds

    @property
    def debug(self):
        return False
        return settings.DEBUG

    def make_expire_time_for(self, mime):
        expire_stamp = time() + self.expire_seconds[mime]
        return format_date_time(expire_stamp)

    def start_response_with_expiration(self, start_response):
        def patched_start_response(status, headers, exc_info=None):
            # if self._should_handle(headers)
            wsgi_headers = Headers(headers)

            # If we're debugging, or the response already has an expires
            # header, just skip this.
            log.debug('Skipping expired headers' if self.debug else 'Calculating expires headers')
            if not self.debug and 'Expires' not in wsgi_headers:
                mime = wsgi_headers.get('Content-Type', '*').split(';')[0]
                log.debug('See mime type ' + mime)

                # If the mime type is explicitly called out, use the expire
                # delay specified.
                if mime in self.expire_seconds:
                    log.debug('Matched mimetype exactly.')
                    expire_time = self.make_expire_time_for(mime)

                # If there's a catch-all wildcard delay, use that.
                elif '*' in self.expire_seconds:
                    log.debug('Matched mimetype with universal.')
                    expire_time = self.make_expire_time_for('*')

                # Otherwise, don't set the header.
                else:
                    log.debug('No mimetype match.')
                    expire_time = None

                if expire_time is not None:
                    log.debug('Adding expires header value: ' + expire_time)
                    headers.append(('Expires', expire_time))

            log.debug('-'*60)
            return start_response(status, headers, exc_info)
        return patched_start_response

    def __call__(self, environ, start_response):
        return self.application(environ, self.start_response_with_expiration(start_response))
