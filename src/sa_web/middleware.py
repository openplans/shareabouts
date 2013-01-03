"""
Middleware to come before the CsrfViewMiddleware so that the request body can
be accessed even after a POST request with multipart data.
"""

class CacheRequestBody (object):
    def process_request(self, request):
        # Call request.body, so that the request remembers the contents of the
        # body.
        request.body
