import requests
from django.http import HttpResponse

def proxy_view(request, url):
    """
    Forward as close to an exact copy of the request as possible along to the
    given url.  Respond with as close to an exact copy of the resulting
    response as possible.
    """
    headers = get_headers(request.META)

    # Explicitly set content-length request header, as some servers will
    # want it and complain without it.
    headers['CONTENT-LENGTH'] = unicode(len(request.body))

    response = requests.request(
        request.method, url,
        params=request.GET,
        data=request.body,
        headers=headers)

    proxy_response = HttpResponse(
        response.content,
        status=response.status_code)

    # Certain response headers should NOT be just tunneled through.  These are
    # they.  For more info, see:
    # http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.5.1
    #
    # Note that, although content-encoding is not listed among the hop-by-hop
    # headers, it can cause trouble as well.  Just let the server set the value
    # as it should be.
    hop_by_hop = ['connection', 'keep-alive', 'proxy-authenticate',
                  'proxy-authorization', 'te', 'trailers', 'transfer-encoding',
                  'upgrade', 'content-encoding']
    for key, value in response.headers.iteritems():
        if key.lower() in hop_by_hop: continue
        proxy_response[key] = value

    return proxy_response

def get_headers(environ):
    """
    Retrieve the HTTP headers from a WSGI environment dictionary.  See
    https://docs.djangoproject.com/en/dev/ref/request-response/#django.http.HttpRequest.META
    """
    headers = {}
    for key, value in environ.iteritems():
        # Sometimes, things don't like when you send the requesting host through.
        if key.startswith('HTTP_') and key != 'HTTP_HOST':
            headers[key[5:].replace('_', '-')] = value
        elif key in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            headers[key.replace('_', '-')] = value

    return headers
