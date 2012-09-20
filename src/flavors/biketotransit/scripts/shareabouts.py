import json
import requests

class ShareaboutsApi (object):
    uri_templates = {
        'dataset_collection': r'datasets/{username}/',
        'dataset_instance': r'datasets/{username}/{slug}/',
        'keys_collection': r'datasets/{username}/{dataset_slug}/keys/',
        'place_collection': r'datasets/{username}/{dataset_slug}/places/',
        'place_instance': r'datasets/{username}/{dataset_slug}/places/{pk}/',
        'submission_collection': r'datasets/{username}/{dataset_slug}/places/{place_pk}/{type}/',
        'submission_instance': r'datasets/{username}/{dataset_slug}/places/{place_pk}/{type}/{pk}/',
    }

    def __init__(self, root='/api/v1/'):
        self.uri_root = root

    def __unicode__(self):
        return '<Shareabouts API object with root "{0}">'.format(self.uri_root)

    def build_uri(self, name, *args, **kwargs):
        uri_template = self.uri_templates[name]
        uri_path = uri_template.format(*args, **kwargs)
        return (self.uri_root + uri_path)

    def authenticate_with_django_request(self, request):
        self.authenticate_with_csrf_token(request.META.get('CSRF_COOKIE', ''),
                                          request.META.get('HTTP_COOKIE', ''))

    def authenticate_with_csrf_token(self, token, cookies):
        self.csrf_token = token
        self.cookies = cookies

    def authenticate_with_key(self, key):
        self.key = key

    def send(self, method, url, data=None):
        if data is not None:
            data = json.dumps(data)

        headers = {'Content-type': 'application/json',
                   'Accept': 'application/json'}

        # Set authentication headers
        if hasattr(self, 'csrf_token') and hasattr(self, 'cookies'):
            headers.update({
                'Cookie': self.cookies,
                'X-CSRFToken': self.csrf_token
            })

        if hasattr(self, 'key'):
            headers.update({
                'X-Shareabouts-Key': self.key
            })

        # Explicitly set the content length for delete
        if method == 'DELETE':
            headers.update({'Content-Length': '0'})

        response = requests.request(method, url, data=data, headers=headers)
        return response

    def get(self, url, default=None):
        """
        Returns decoded data from a GET request, or default on non-200
        responses.
        """
        res = self.send('GET', url)
        res_json = res.text
        return (json.loads(res_json) if res.status_code == 200 else default)
