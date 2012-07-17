import requests
from django.http import HttpResponse

def proxy_view(request, url):
    """
    Forward as close to an exact copy of the request as possible along to the
    given url.  Respond with as close to an exact copy of the resulting
    response as possible.
    """
    response = requests.request(
        request.method, url,
        params=request.GET,
        data=request.body,
        headers=get_headers(request.META))

    proxy_response = HttpResponse(
        response.content,
        status=response.status_code)
    for key, value in response.headers.iteritems():
        proxy_response[key] = value

    return proxy_response

def get_headers(environ):
    """
    Retrieve the HTTP headers from a WSGI environment dictionary.  See
    https://docs.djangoproject.com/en/dev/ref/request-response/#django.http.HttpRequest.META
    """
    headers = {}
    for key, value in environ.iteritems():
        if key.startswith('HTTP_'):
            headers[key[5:].replace('_', '-')] = value
        elif key in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            headers[key.replace('_', '-')] = value

    return headers
