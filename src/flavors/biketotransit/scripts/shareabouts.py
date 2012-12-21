import json
import requests

class ShareaboutsApi (object):
    uri_templates = {
        'dataset_collection': r'datasets/{username}/',
        'dataset_instance': r'datasets/{username}/{slug}/',
        'keys_collection': r'datasets/{username}/{dataset_slug}/keys/',
        'place_collection': r'datasets/{username}/{dataset_slug}/places/',
        'place_instance': r'datasets/{username}/{dataset_slug}/places/{pk}/',
        'all_submissions': r'datasets/{username}/{dataset_slug}/{type}/',
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

    def send(self, method, url, data=None, silent=False):
        if data is not None:
            data = json.dumps(data)

        headers = {'Content-type': 'application/json',
                   'Accept': 'application/json',
                   'X-Shareabouts-Silent': str(silent)}

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

    def get(self, url, default=None, silent=False):
        """
        Returns decoded data from a GET request, or default on non-200
        responses.
        """
        response = self.send('GET', url, silent=silent)
        
        if res.status_code != 200:
            return default
        
        data = self.parse(response.text)
        return data
    
    def parse(self, response_text):
        data = json.loads(response_text)
        # TODO: Raise appropriate exception on invalid JSON data
        return data

    #
    # CRUD
    def retrieve(self, url):
        """
        Returns decoded data from a GET request, or default on non-200
        responses.
        """
        response = self.send('GET', url, silent=silent)
        
        if res.status_code != 200:
            raise Exception()
            # TODO: raise appropriate exception
        
        data = self.parse(response.text)
        return data
    
    def update(self, instance, url=None, silent=False):
        if url is None:
            url = instance['url']
            # TODO: Raise specific error on KeyError
        
        data = instance.copy()
        
        # Reserved Attributes
        # -------------------
        # For everything:
        data.pop('created_datetime')
        data.pop('updated_datetime')
        data.pop('id')
        # For submitted things:
        data.pop('dataset', None)
        data.pop('submissions', None)
        
        response = self.send('PUT', url, data, silent)
        data = self.parse(response.text)
        return data
    
    def create(self, collection_url, data, silent=False):
        response = self.send('POST', collection_url, data, silent)
        new_data = self.parse(response.text)
        return new_data
