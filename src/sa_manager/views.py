from django.contrib import messages
from django.core.urlresolvers import reverse
from django.shortcuts import render, redirect
from django.views.generic import View
import json
import requests

API_ROOT = '/api/v1/'

class ShareaboutsApi (object):
    def __init__(self, root=API_ROOT):
        self.root = root

    def get(self, path, default=None):
        res = requests.get(self.root + path,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)


def index_view(request):
    return render(request, "manager/index.html")


def places_view(request):
    places_uri = request.build_absolute_uri(API_ROOT + 'places/')

    # TODO Is this the best way to get the API data?
    response = requests.get(places_uri)

    places = json.loads(response.text)
    return render(request, "manager/places.html", {'places': places})


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
    def dispatch(self, request, *args, **kwargs):
        self.special_fields = ('id', 'location', 'submitter_name', 'name',
                               'created_datetime', 'updated_datetime', 'url',
                               'visible', 'submissions')
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

    def initial(self, request):
        return render(request, "manager/place.html")

    def create(self, request):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = requests.post(self.places_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})
        if response.status_code == 201:
            data = json.loads(response.text)
            place_id = data.get('id')

            messages.success(request, 'Successfully saved!')
            return redirect(reverse('manager_place_detail', args=[place_id]))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())

    def read(self, request, pk):
        # Retrieve the place data.
        response = requests.get(self.place_uri)
        place = json.loads(response.text)

        # Arrange the place data fields for display on the form
        data_fields = self.make_data_fields_tuples(place)

        return render(request, "manager/place.html", {
            'place': place,
            'data_fields': data_fields
        })

    def update(self, request, pk):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = requests.put(self.place_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})

        if response.status_code == 200:
            messages.success(request, 'Successfully saved!')

        else:
            messages.error(request, 'Error: ' + response.text)

        return redirect(request.get_full_path())

    def delete(self, request, pk):
        # Send the delete request
        response = requests.delete(self.place_uri)

        if response.status_code == 204:
            messages.success(request, 'Successfully deleted!')
            return redirect(reverse('manager_place_list'))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())


class NewPlaceView (PlaceFormMixin, View):
    def dispatch(self, request):
        self.places_uri = request.build_absolute_uri(API_ROOT + 'places/')
        return super(NewPlaceView, self).dispatch(request)

    def get(self, request):
        return self.initial(request)

    def post(self, request):
        return self.create(request)


class ExistingPlaceView (PlaceFormMixin, View):
    def dispatch(self, request, pk):
        self.place_uri = request.build_absolute_uri(API_ROOT + 'places/{0}/'.format(pk))
        return super(ExistingPlaceView, self).dispatch(request, pk)

    def get(self, request, pk):
        return self.read(request, pk)

    def post(self, request, pk):
        if request.POST.get('action') == 'save':
            return self.update(request, pk)
        elif request.POST.get('action') == 'delete':
            return self.delete(request, pk)
        else:
            # TODO ???
            pass


def datasets_view(request):
    # TODO: do this in-process, not with a subrequest
    datasets_uri = request.build_absolute_uri(reverse('dataset_collection'))
    response = requests.get(datasets_uri)
    datasets = json.loads(response.text)
    for ds in datasets:
        ds['manage_uri'] = reverse('manager_dataset_detail', kwargs={'pk': ds['id']})
    return render(request, "manager/datasets.html", {'datasets': datasets})


class DataSetFormMixin (BaseDataBlobFormMixin):
    pass

class NewDataSetView (DataSetFormMixin, View):
    pass
    # def dispatch(self, request):
    #     self.places_uri = request.build_absolute_uri(API_ROOT + 'places/')
    #     return super(NewPlaceView, self).dispatch(request)

    # def get(self, request):
    #     return self.initial(request)

    # def post(self, request):
    #     return self.create(request)


class ExistingDataSetView (DataSetFormMixin, View):
    pass
    # def dispatch(self, request, pk):
    #     self.place_uri = request.build_absolute_uri(API_ROOT + 'places/{0}/'.format(pk))
    #     return super(ExistingPlaceView, self).dispatch(request, pk)

    # def get(self, request, pk):
    #     return self.read(request, pk)

    # def post(self, request, pk):
    #     if request.POST.get('action') == 'save':
    #         return self.update(request, pk)
    #     elif request.POST.get('action') == 'delete':
    #         return self.delete(request, pk)
    #     else:
    #         # TODO ???
    #         pass


class SubmissionMixin (BaseDataBlobFormMixin):
    def dispatch(self, request, place_id, submission_type, *args, **kwargs):
        self.place_uri = request.build_absolute_uri(API_ROOT + 'places/{0}/'.format(place_id))
        self.special_fields = ('id', 'submitter_name', 'url', 'visible',
                               'created_datetime', 'updated_datetime')
        return super(SubmissionMixin, self).dispatch(request, place_id, submission_type, *args, **kwargs)

    def index(self, request, place_id, submission_type):
        # Retrieve the place data.
        response = requests.get(self.place_uri)
        place = json.loads(response.text)

        submission_sets = place['submissions']
        for submission_set in submission_sets:
            # Don't bother with sets we didn't ask for.  If submission_type is
            # 'submissions', then all sets are requested.
            if submission_type not in (submission_set['type'], 'submissions'):
                submission_set['is_shown'] = False
                continue

            # Retrieve each submission set.
            response = requests.get(submission_set['url'])
            submission_set['submissions'] = json.loads(response.text)

            # Process some data for display
            submission_set['is_shown'] = True
            submission_set['label'] = submission_set['type'].replace('_', ' ').title()

            for submission in submission_set['submissions']:
                # Arrange the submission data fields for display in the table
                data_fields = []
                submission['data_fields'] = self.make_data_fields_tuples(submission)

                # Make the dates a little prettier
                submission['created_datetime'] = submission['created_datetime'].replace('T', ' ').replace('Z', ' GMT')
                submission['updated_datetime'] = submission['updated_datetime'].replace('T', ' ').replace('Z', ' GMT')

        return render(request, "manager/place_submissions.html", {
            'place': place,
        })

    def initial(self, request, place_id, submission_type):
        # Retrieve the place and submission data.
        response = requests.get(self.place_uri)
        place = json.loads(response.text)

        return render(request, "manager/place_submission.html", {
            'submission_type': None if submission_type == 'submissions'\
                                    else submission_type,
            'place': place
        })

    def process_specific_fields(self):
        data = self.data_blob

        # Grab the submission type off of the form.  This will be in a hidden
        # field if the submission type was known before-hand, or in a text
        # field if the user had to enter it.
        self.actual_submission_type = data['submission_type']
        del data['submission_type']

        # Fix the visibility to be either true or false (boolean)
        data['visible'] = ('visible' in data)

    def create(self, request, place_id, submission_type):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Construct the submission_uri, taking into account the submission
        # type according to the POST variables.
        self.submissions_uri = request.build_absolute_uri(API_ROOT + 'places/{0}/{1}/'.format(place_id, self.actual_submission_type))

        # Send the save request
        response = requests.post(self.submissions_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})
        if response.status_code == 201:
            data = json.loads(response.text)
            submission_id = data.get('id')

            messages.success(request, 'Successfully saved!')
            return redirect(reverse('manager_place_submission_detail', args=[place_id, self.actual_submission_type, submission_id]))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())

    def read(self, request, place_id, submission_type, pk):
        # Retrieve the place and submission data.
        response = requests.get(self.place_uri)
        place = json.loads(response.text)

        response = requests.get(self.submission_uri)
        submission = json.loads(response.text)

        # Arrange the submission data fields for display in the form
        data_fields = self.make_data_fields_tuples(submission)

        return render(request, "manager/place_submission.html", {
            'place': place,
            'submission': submission,
            'submission_type': submission_type,
            'data_fields': data_fields
        })

    def update(self, request, place_id, submission_type, pk):
        # Make a copy of the POST data, since we can't edit the original.
        self.data_blob = data = request.POST.dict()
        self.process_data_blob()

        # Send the save request
        response = requests.put(self.submission_uri, data=json.dumps(data),
            headers={'Content-type': 'application/json'})

        if response.status_code == 200:
            messages.success(request, 'Successfully saved!')

        else:
            messages.error(request, 'Error: ' + response.text)

        return redirect(request.get_full_path())

    def delete(self, request, place_id, submission_type, pk):
        # Send the delete request
        response = requests.delete(self.submission_uri)

        if response.status_code == 204:
            messages.success(request, 'Successfully deleted!')
            return redirect(reverse('manager_place_submission_list', args=(place_id, submission_type)))

        else:
            messages.error(request, 'Error: ' + response.text)
            return redirect(request.get_full_path())


class SubmissionListView (SubmissionMixin, View):
    def get(self, request, place_id, submission_type):
        return self.index(request, place_id, submission_type)


class NewSubmissionView (SubmissionMixin, View):
    def dispatch(self, request, place_id, submission_type):
        return super(NewSubmissionView, self).dispatch(request, place_id, submission_type)

    def get(self, request, place_id, submission_type):
        return self.initial(request, place_id, submission_type)

    def post(self, request, place_id, submission_type):
        return self.create(request, place_id, submission_type)


class ExistingSubmissionView (SubmissionMixin, View):
    def dispatch(self, request, place_id, submission_type, pk):
        self.submission_uri = request.build_absolute_uri(API_ROOT + 'places/{0}/{1}/{2}/'.format(place_id, submission_type, pk))
        return super(ExistingSubmissionView, self).dispatch(request, place_id, submission_type, pk)

    def get(self, request, place_id, submission_type, pk):
        return self.read(request, place_id, submission_type, pk)

    def post(self, request, place_id, submission_type, pk):
        if request.POST.get('action') == 'save':
            return self.update(request, place_id, submission_type, pk)
        elif request.POST.get('action') == 'delete':
            return self.delete(request, place_id, submission_type, pk)
        else:
            # TODO ???
            pass
