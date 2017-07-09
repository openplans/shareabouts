from gzip import GzipFile
from wsgiref.headers import Headers
import re
from io import BytesIO


# Precompile the regex to check for gzip headers
re_accepts_gzip = re.compile(r'\bgzip\b')

# Precompile the regex to split a comma delimitered string of Vary headers
cc_delim_re = re.compile(r'\s*,\s*')


def gzip_buffer(string, compression_level=6):
    """gzips a string."""
    zbuf = BytesIO()
    f = GzipFile(filename=None, mode='wb',
            compresslevel=compression_level, fileobj=zbuf)
    f.write(string)
    f.close()
    return zbuf.getvalue()


def client_accepts_gzip(environ):
    """Checks whether the client accepts gzipped output."""
    accept_header = environ.get('HTTP_ACCEPT_ENCODING', '')
    return re_accepts_gzip.search(accept_header)


def patch_vary_headers(headers, new_values):
    """Patches any existing Vary headers to add new_values to it.  Returns
    nothing, but modifies the headers array in-place.
    """
    if 'vary' in headers:
        vary_headers = cc_delim_re.split(headers['vary'])
    else:
        vary_headers = []

    existing_values = set([header.lower() for header in vary_headers])
    additional_values = [new_value for new_value in new_values
                         if new_value.lower() not in existing_values]
    headers['Vary'] = ', '.join(vary_headers + additional_values)


class GzipMiddleware(object):
    """The actual WSGI middleware to wrap around your app and gzip all output.
    This automatically adds the required HTTP headers.
    """
    def __init__(self, app, compresslevel=6):
        self.app = app
        self.compresslevel = compresslevel

    def __call__(self, environ, start_response):
        if not client_accepts_gzip(environ):
            return self.app(environ, start_response)

        def collect_response(response):
            """Intercepts the response from the WSGI app, and stores the
            output in the given response dict for later inspection.
            """
            def _intercept_response(status, headers, *args, **kwargs):
                response['status'] = status
                response['headers'] = headers

            return _intercept_response

        # Now get the raw response from the WSGI app
        app_response = {}
        raw_response = b''.join(self.app(environ,
            collect_response(app_response)))

        def pass_through(app_response, raw_response):
            start_response(app_response['status'], app_response['headers'])
            return [raw_response]

        headers = Headers(app_response['headers'])
        if 'content-encoding' in headers:
            # Since there already is a content encoding, apparently, we just
            # return the respons without compression
            return pass_through(app_response, raw_response)

        # Perform the gzip
        buflen = len(raw_response)
        if buflen <= 200:
            return pass_through(app_response, raw_response)
        gzipped_response = gzip_buffer(raw_response)

        # Last check: only send the response if it's actually shorter
        if len(gzipped_response) >= buflen:
            return pass_through(app_response, raw_response)
        del raw_response  # garbage collect early

        # Set headers accordingly
        headers['Content-Encoding'] = 'gzip'
        headers['Content-Length'] = str(len(gzipped_response))
        if 'ETag' in headers:
            headers['ETag'] = re.sub('"$', ';gzip"', headers['ETag'])
        patch_vary_headers(headers, ('Accept-Encoding',))

        # Send the headers and the contents
        start_response(app_response['status'], app_response['headers'])
        return [gzipped_response]
