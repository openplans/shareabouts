"""
Middleware to come before the CsrfViewMiddleware so that the request body can
be accessed even after a POST request with multipart data.
"""


class CacheRequestBody:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Call request.body, so that the request remembers the contents of the
        # body. This is necessary because the CsrfViewMiddleware will read the
        # body, and then the request will be unable to read it again.
        #
        # (This line is thus not pointless, even though pylint thinks it is)
        request.body  # pylint: disable=pointless-statement
        response = self.get_response(request)
        return response
