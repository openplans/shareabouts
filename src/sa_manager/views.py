from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.shortcuts import render, redirect
from django.utils.decorators import method_decorator
from django.views.generic import View
import json
import requests


API_ROOT = '/api/v1/'


class ShareaboutsApi (object):
    uri_templates = {
        'dataset_collection': r'datasets/{username}/',
        'dataset_instance': r'datasets/{username}/{slug}/',
        'keys_collection': r'datasets/{username}/{dataset_slug}/keys/',
        'place_collection': r'datasets/{username}/{dataset_slug}/places/?visible=all',
        'place_instance': r'datasets/{username}/{dataset_slug}/places/{pk}/',
        'submission_collection': r'datasets/{username}/{dataset_slug}/places/{place_pk}/{type}/',
        'submission_instance': r'datasets/{username}/{dataset_slug}/places/{place_pk}/{type}/{pk}/',
    }

    def __init__(self, request=None, root='/api/v1/'):
        if request:
            self.uri_root = request.build_absolute_uri(root)
        else:
            self.uri_root = root

    def __unicode__(self):
        return '<Shareabouts API object with root "{0}">'.format(self.uri_root)

    def build_uri(self, name, *args, **kwargs):
        uri_template = self.uri_templates[name]
        uri_path = uri_template.format(*args, **kwargs)
        return (self.uri_root + uri_path)

    def authenticate(self, request):
        self.csrf_token = request.META.get('CSRF_COOKIE', '')
        self.cookies = request.META.get('HTTP_COOKIE', '')

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


@login_required
def index_view(request):
    return redirect('manager_dataset_list')


@login_required
def places_view(request, dataset_slug):
    api = ShareaboutsApi(request)
    api.authenticate(request)
    dataset_uri = api.build_uri('dataset_instance', username=request.user.username, slug=dataset_slug)
    places_uri = api.build_uri('place_collection', username=request.user.username, dataset_slug=dataset_slug)

    places = api.get(places_uri)
    dataset = api.get(dataset_uri)

    for place in places:
        place['submission_count'] = sum([s['length'] for s in place['submissions']])

    return render(request, "manager/places.html", {'places': places,
                                                   'dataset': dataset})


@login_required
def keys_view(request, dataset_slug):
    api = ShareaboutsApi(request)
    api.authenticate(request)
    dataset_uri = api.build_uri('dataset_instance',
                                username=request.user.username,
                                slug=dataset_slug)
    keys_uri = api.build_uri('keys_collection',
                             username=request.user.username,
                             dataset_slug=dataset_slug)
    keys = api.get(keys_uri)
    dataset = api.get(dataset_uri)
    return render(request, "manager/keys.html", {'keys': keys,
                                                 'dataset': dataset})


class BaseDataBlobMixin (object):
    def make_data_fields_tuples(self, data):
        """
        Take a dictionary of data and turn it into tuples containing a label, a
        key and a value.  Reqires special_fields to be defined on the view.

        """
        data_fields = []
        for key, value in data.items():
            if key not in self.special_fields:
                label = key.replace('_', ' ').title()
                data_fields.append((label, key, value))
        data_fields.sort()

        return data_fields


class BaseDataBlobFormMixin (BaseDataBlobMixin):
    def process_new_attr(self, num):
        data = self.data_blob

        meta_key = '_new_key{0}'.format(num)
        meta_val = '_new_val{0}'.format(num)

        new_key = data.get(meta_key, '').strip()
        new_val = data.get(meta_val, '')

        if meta_key in data:
            del data[meta_key]
        if meta_val in data:
            del data[meta_val]

        if new_key and new_val:
            data[new_key] = new_val

        return new_key, new_val

    def eliminate_unwanted_fields(self):
        """
        Pull data out of the blob that we don't want to send to the Shareabouts
        service server.
        """
        data = self.data_blob
        if 'csrfmiddlewaretoken' in data:
            del data['csrfmiddlewaretoken']
        if 'action' in data:
            del data['action']

    def process_specific_fields(self):
        """
        Override this in the child view to do any extra processing necessary.
        """
        raise NotImplementedError()

    def check_for_new_fields(self):
        data = self.data_blob

        for key, value in data.items():
            # Get rid of any empty data
            if value == '':
                del data[key]
                continue

            # Add any new keys to the data dictionary
            if key.startswith('_new_key'):
                num = key[8:]
                self.process_new_attr(num)
                continue

    def process_data_blob(self):
        """
        Prepare place data to be sent to the service for creating or updating.
        """
        self.eliminate_unwanted_fields()
        self.process_specific_fields()
        self.check_for_new_fields()


class PlaceFormMixin (BaseDataBlobFormMixin):

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        self.special_fields = ('id', 'location', 'submitter_name', 'name',
                               'created_datetime', 'updated_datetime', 'url',
                               'visible', 'submissions', 'dataset')
        return super(PlaceFormMixin, self).dispatch(request, *args, **kwargs)

    def process_specific_fields(self):
        data = self.data_blob

        # Fix the location to be something the server will understand
        location = {
            'lat': data.get('lat'),
            'lng': data.get('lng')
        }
        del data['lat']
        del data['lng']
        data['location'] = location

        # Fix the visibility to be either true or false (boolean)
        data['visible'] = ('visible' in data)

    def initial(self, request, dataset_slug):
        api = ShareaboutsApi(request)
        api.authenticate(request)
        dataset = api.get(self.dataset_uri)
        return render(request, "manager/place.html", {'dataset': dataset})

    def create(self, request, dataset_slug):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = self.api.send('POST', self.places_uri, data)

        if response.status_code == 201:
            data = json.loads(response.text)
            place_id = data.get('id')

            messages.success(request, 'Successfully saved!')
            return redirect(reverse('manager_place_detail', args=[dataset_slug, place_id]))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())

    def read(self, request, dataset_slug, pk):
        # Retrieve the place data.
        place = self.api.get(self.place_uri)
        dataset = self.api.get(self.dataset_uri)

        # Arrange the place data fields for display on the form
        data_fields = self.make_data_fields_tuples(place)

        return render(request, "manager/place.html", {
            'place': place,
            'dataset': dataset,
            'data_fields': data_fields
        })

    def update(self, request, dataset_slug, pk):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = self.api.send('PUT', self.place_uri, data)

        if response.status_code == 200:
            messages.success(request, 'Successfully saved!')

        else:
            messages.error(request, 'Error: ' + response.text)

        return redirect(request.get_full_path())

    def delete(self, request, dataset_slug, pk):
        # Send the delete request
        response = self.api.send('DELETE', self.place_uri)

        if response.status_code == 204:
            messages.success(request, 'Successfully deleted!')
            return redirect(reverse('manager_place_list', args=[dataset_slug]))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())


class NewPlaceView (PlaceFormMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug):
        self.api = ShareaboutsApi(request)
        self.api.authenticate(request)

        self.dataset_uri = self.api.build_uri('dataset_instance', username=request.user.username, slug=dataset_slug)
        self.places_uri = self.api.build_uri('place_collection', username=request.user.username, dataset_slug=dataset_slug)

        return super(NewPlaceView, self).dispatch(request, dataset_slug)

    def get(self, request, dataset_slug):
        return self.initial(request, dataset_slug)

    def post(self, request, dataset_slug):
        return self.create(request, dataset_slug)


class ExistingPlaceView (PlaceFormMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug, pk):
        self.api = ShareaboutsApi(request)
        self.api.authenticate(request)

        self.dataset_uri = self.api.build_uri('dataset_instance', username=request.user.username, slug=dataset_slug)
        self.place_uri = self.api.build_uri('place_instance', username=request.user.username, dataset_slug=dataset_slug, pk=pk)

        return super(ExistingPlaceView, self).dispatch(request, dataset_slug, pk)

    def get(self, request, dataset_slug, pk):
        return self.read(request, dataset_slug, pk)

    def post(self, request, dataset_slug, pk):
        if request.POST.get('action') == 'save':
            return self.update(request, dataset_slug, pk)
        elif request.POST.get('action') == 'delete':
            return self.delete(request, dataset_slug, pk)
        else:
            # TODO ???
            pass


@login_required
def datasets_view(request):
    api = ShareaboutsApi(request)
    api.authenticate(request)

    datasets_uri = api.build_uri('dataset_collection', username=request.user.username)

    datasets = api.get(datasets_uri)
    for ds in datasets:
        ds['manage_uri'] = reverse('manager_dataset_detail',
                                   kwargs={'dataset_slug': ds['slug']})
    return render(request, "manager/datasets.html", {'datasets': datasets})


class DataSetFormMixin (BaseDataBlobFormMixin):

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        self.api = ShareaboutsApi(request)
        self.api.authenticate(request)

        self.datasets_uri = self.api.build_uri('dataset_collection', username=request.user.username)
        self.special_fields = ('id', 'owner', 'display_name', 'slug')

        dataset_slug = None
        if args:
            dataset_slug = args[0]
        if 'dataset_slug' in kwargs:
            dataset_slug = kwargs['dataset_slug']

        if dataset_slug is not None:
            self.dataset_uri = self.api.build_uri('dataset_instance', username=request.user.username, slug=dataset_slug)

        return super(DataSetFormMixin, self).dispatch(request, *args, **kwargs)

    def read(self, request, dataset_slug):
        # Retrieve the dataset data.
        dataset = self.api.get(self.dataset_uri)

        # Arrange the data fields for display on the form
        data_fields = self.make_data_fields_tuples(dataset)

        return render(request, "manager/dataset.html", {
            'dataset': dataset,
            'data_fields': data_fields
        })

    def process_specific_fields(self):
        pass
#        owner = self.request.user.id  # Needs to be a django.contrib.auth id
#        self.data_blob['owner'] = owner

    def initial(self, request):
        return render(request, "manager/dataset.html")

    def create(self, request):
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        response = self.api.send('POST', self.datasets_uri, data)

        if response.status_code == 201:
            data = json.loads(response.text)
            messages.success(request, 'Successfully saved!')
            return redirect(reverse('manager_dataset_detail', kwargs=(
                {'dataset_slug': data['slug']})))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())

    def update(self, request, dataset_slug):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = self.api.send('PUT', self.dataset_uri, data)

        if response.status_code == 200:
            # Note that we end up with 200 even if the dataset is
            # renamed and we get redirected... this is *after* the redirect
            # completes.
            if response.json['slug'] == dataset_slug:
                messages.success(request, 'Successfully saved!')
            else:
                messages.warning(
                    request,
                    """WARNING: The URL of this dataset has
                    changed. This will affect lots of other URLs, notably
                    your shareabouts client application(s) MUST be
                    reconfigured to use the new dataset URL!
                    It is: %s""" % response.json['url'],
                )
                new_url = reverse(
                    'manager_dataset_detail',
                    kwargs={'dataset_slug': response.json['slug']})
                return redirect(new_url)
        else:
            messages.error(request, 'Error: ' + response.text)

        return redirect(request.get_full_path())

    def delete(self, request, dataset_slug):
        # Send the delete request
        response = self.api.send('DELETE', self.dataset_uri)

        if response.status_code == 204:
            messages.success(request, 'Successfully deleted!')
            return redirect(reverse('manager_dataset_list'))
        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())


class NewDataSetView (DataSetFormMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request):
        return super(NewDataSetView, self).dispatch(request)

    def get(self, request):
        return self.initial(request)

    def post(self, request):
        return self.create(request)


class ExistingDataSetView (DataSetFormMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug):
        return super(ExistingDataSetView, self).dispatch(request, dataset_slug)

    def get(self, request, dataset_slug):
        return self.read(request, dataset_slug)

    def post(self, request, dataset_slug):
        if request.POST.get('action') == 'save':
            return self.update(request, dataset_slug)
        elif request.POST.get('action') == 'delete':
            return self.delete(request, dataset_slug)
        else:
            # TODO ???
            pass


class SubmissionMixin (BaseDataBlobFormMixin):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug, place_id, submission_type, *args, **kwargs):
        self.api = ShareaboutsApi(request)
        self.api.authenticate(request)

        self.dataset_uri = self.api.build_uri('dataset_instance', username=request.user.username, slug=dataset_slug)
        self.place_uri = self.api.build_uri('place_instance', username=request.user.username, dataset_slug=dataset_slug, pk=place_id)

        pk = None
        if args:
            pk = args[0]
        if 'pk' in kwargs:
            pk = kwargs['pk']

        if pk is not None:
            self.submission_uri = self.api.build_uri('submission_instance', username=request.user.username, dataset_slug=dataset_slug, place_pk=place_id, type=submission_type, pk=pk)

        self.special_fields = ('id', 'submitter_name', 'url', 'visible',
                               'created_datetime', 'updated_datetime', 'type',
                               'place', 'dataset')
        return super(SubmissionMixin, self).dispatch(request, dataset_slug, place_id, submission_type, *args, **kwargs)

    def index(self, request, dataset_slug, place_id, submission_type):
        # Retrieve the dataset data.
        dataset = self.api.get(self.dataset_uri)

        # Retrieve the place data.
        place = self.api.get(self.place_uri)

        submission_sets = place['submissions']
        for submission_set in submission_sets:
            # Don't bother with sets we didn't ask for.  If submission_type is
            # 'submissions', then all sets are requested.
            if submission_type not in (submission_set['type'], 'submissions'):
                submission_set['is_shown'] = False
                continue

            # Retrieve each submission set.
            submission_set['submissions'] = self.api.get(submission_set['url'])

            # Process some data for display
            submission_set['is_shown'] = True
            submission_set['label'] = submission_set['type'].replace('_', ' ').title()

            for submission in submission_set['submissions']:
                # Arrange the submission data fields for display in the table
                submission['data_fields'] = self.make_data_fields_tuples(submission)

                # Make the dates a little prettier
                submission['created_datetime'] = submission['created_datetime'].replace('T', ' ').replace('Z', ' GMT')
                submission['updated_datetime'] = submission['updated_datetime'].replace('T', ' ').replace('Z', ' GMT')

        return render(request, "manager/place_submissions.html", {
            'place': place,
            'dataset': dataset
        })

    def initial(self, request, dataset_slug, place_id, submission_type):
        # Retrieve the dataset data.
        dataset = self.api.get(self.dataset_uri)

        # Retrieve the place and submission data.
        place = self.api.get(self.place_uri)

        return render(request, "manager/place_submission.html", {
            'type': None if submission_type == 'submissions' else submission_type,
            'place': place,
            'dataset': dataset
        })

    def process_specific_fields(self):
        data = self.data_blob

        # Grab the submission type off of the form.  This will be in a hidden
        # field if the submission type was known before-hand, or in a text
        # field if the user had to enter it.
        self.actual_submission_type = data['type']
        del data['type']

        # Fix the visibility to be either true or false (boolean)
        data['visible'] = ('visible' in data)

    def create(self, request, dataset_slug, place_id, submission_type):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Construct the submission_uri, taking into account the submission
        # type according to the POST variables.
        self.submissions_uri = request.build_absolute_uri(API_ROOT + 'datasets/' + request.user.username + '/' + dataset_slug + '/places/{0}/{1}/'.format(place_id, self.actual_submission_type))

        # Send the save request
        response = self.api.send('POST', self.submissions_uri, data)

        if response.status_code == 201:
            data = json.loads(response.text)
            submission_id = data.get('id')

            messages.success(request, 'Successfully saved!')
            return redirect(reverse('manager_place_submission_detail', args=[dataset_slug, place_id, self.actual_submission_type, submission_id]))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())

    def read(self, request, dataset_slug, place_id, submission_type, pk):
        # Retrieve the dataset data.
        dataset = self.api.get(self.dataset_uri)

        # Retrieve the place and submission data.
        place = self.api.get(self.place_uri)
        submission = self.api.get(self.submission_uri)

        # Arrange the submission data fields for display in the form
        data_fields = self.make_data_fields_tuples(submission)

        return render(request, "manager/place_submission.html", {
            'place': place,
            'dataset': dataset,
            'submission': submission,
            'type': submission_type,
            'data_fields': data_fields
        })

    def update(self, request, dataset_slug, place_id, submission_type, pk):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = self.api.send('PUT', self.submission_uri, data)

        if response.status_code == 200:
            messages.success(request, 'Successfully saved!')

        else:
            messages.error(request, 'Error: ' + response.text)

        return redirect(request.get_full_path())

    def delete(self, request, dataset_slug, place_id, submission_type, pk):
        # Send the delete request
        response = self.api.send('DELETE', self.submission_uri)

        if response.status_code == 204:
            messages.success(request, 'Successfully deleted!')
            return redirect(reverse('manager_place_submission_list', args=(dataset_slug, place_id, submission_type)))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())


class SubmissionListView (SubmissionMixin, View):
    def get(self, request, dataset_slug, place_id, submission_type):
        return self.index(request, dataset_slug, place_id, submission_type)


class NewSubmissionView (SubmissionMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug, place_id, submission_type):
        return super(NewSubmissionView, self).dispatch(request, dataset_slug, place_id, submission_type)

    def get(self, request, dataset_slug, place_id, submission_type):
        return self.initial(request, dataset_slug, place_id, submission_type)

    def post(self, request, dataset_slug, place_id, submission_type):
        return self.create(request, dataset_slug, place_id, submission_type)


class ExistingSubmissionView (SubmissionMixin, View):

    @method_decorator(login_required)
    def dispatch(self, request, dataset_slug, place_id, submission_type, pk):
        return super(ExistingSubmissionView, self).dispatch(request, dataset_slug, place_id, submission_type, pk)

    def get(self, request, dataset_slug, place_id, submission_type, pk):
        return self.read(request, dataset_slug, place_id, submission_type, pk)

    def post(self, request, dataset_slug, place_id, submission_type, pk):
        if request.POST.get('action') == 'save':
            return self.update(request, dataset_slug, place_id, submission_type, pk)
        elif request.POST.get('action') == 'delete':
            return self.delete(request, dataset_slug, place_id, submission_type, pk)
        else:
            # TODO ???
            pass
