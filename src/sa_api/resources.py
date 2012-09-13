"""
DjangoRestFramework resources for the Shareabouts REST API.
"""
import json
import apikey.models
from collections import defaultdict
from django.core.urlresolvers import reverse
from djangorestframework import resources
from . import models
from . import utils
from . import forms


def simple_user(user):
    """Return a minimal representation of an auth.User"""
    return {
        'id': user.pk,
        'username': user.username,
    }


class ModelResourceWithDataBlob (resources.ModelResource):

    """
    Like ModelResource, but automatically serializes/deserializes a
    'data' JSON blob of arbitrary key/value pairs.
    """

    def serialize(self, obj, *args, **kwargs):
        # If the object is a place, parse the data blob and add it to the
        # place's fields.
        serialization = super(ModelResourceWithDataBlob, self).serialize(obj, *args, **kwargs)
        if isinstance(obj, self.model):
            data = json.loads(obj.data)
            serialization.update(data)

        return serialization

    def validate_request(self, origdata, files=None):
        if origdata:
            data = origdata.copy()
            blob_data = {}

            # Pull off any fields that the model doesn't know about directly
            # and put them into the data blob.
            known_fields = set(self.model._meta.get_all_field_names())

            # Also ignore the following field names (treat them like reserved
            # words).
            known_fields.update(['submissions'])

            # And allow an arbitrary value field named 'data' (don't let the
            # data blob get in the way).
            known_fields.remove('data')

            for key in origdata:
                if key not in known_fields:
                    blob_data[key] = data[key]
                    del data[key]
            data['data'] = json.dumps(blob_data, indent=2)

        else:
            data = origdata
        return super(ModelResourceWithDataBlob, self).validate_request(data, files)


class PlaceResource (ModelResourceWithDataBlob):
    model = models.Place
    form = forms.PlaceForm

    # TODO: un-exclude dataset once i figure out how to avoid exposing user info
    # in related resources.
    exclude = ['data', 'submittedthing_ptr']
    include = ['url', 'submissions']

    @utils.cached_property
    def submission_sets(self):
        """
        A mapping from Place ids to attributes.  Helps to cut down
        significantly on the number of queries.

        There should be at most one SubmissionSet of a given type for one place.
        """
        submission_sets = defaultdict(list)

        from django.db.models import Count
        qs = models.SubmissionSet.objects.all().select_related('place__dataset').select_related('place__dataset__owner')
        for submission_set in qs.annotate(count=Count('children')):
            submission_sets[submission_set.place_id].append({
                'type': submission_set.submission_type,
                'count': submission_set.count,
                'url': reverse('submission_collection_by_dataset', kwargs={
                    'dataset__owner__username': submission_set.place.dataset.owner.username,
                    'dataset__slug': submission_set.place.dataset.slug,
                    'place_id': submission_set.place_id,
                    'submission_type': submission_set.submission_type
                })
            })

        return submission_sets

    # TODO: Included vote counts, without an additional query if possible.
    def location(self, place):
        return {
            'lat': place.location.y,
            'lng': place.location.x,
        }

    def dataset(self, place):
        url = reverse('dataset_instance_by_user',
                      kwargs={
                         'owner__username': place.dataset.owner.username,
                         'slug': place.dataset.slug})
        return {'url': url}

    def _get_dataset_url_args(self, dataset_id):
        # Looking up the same parent dataset for 1000 places would be
        # pointless and expensive.
        self._reverse_args_cache = getattr(self, '_reverse_args_cache', {})
        if dataset_id in self._reverse_args_cache:
            args = self._reverse_args_cache[dataset_id]
        else:
            dataset = models.DataSet.objects.get(id=dataset_id)
            args = self._reverse_args_cache[dataset_id] = (
                dataset.owner.username,
                dataset.slug,
            )
        return args

    def url(self, place):
        args = self._get_dataset_url_args(place.dataset_id)
        args = args + (place.id,)
        return reverse('place_instance_by_dataset', args=args)

    def submissions(self, place):
        return self.submission_sets[place.id]

    def validate_request(self, origdata, files=None):
        if origdata:
            data = origdata.copy()

            # Convert the location into something that GeoDjango knows how to
            # deal with.
            data['location'] = utils.to_wkt(origdata.get('location'))

        else:
            data = origdata
        return super(PlaceResource, self).validate_request(data, files)


class DataSetResource (resources.ModelResource):
    model = models.DataSet
    form = forms.DataSetForm
    fields = ['id', 'url', 'owner', 'places', 'slug', 'display_name', 'keys', 'submissions']

    @utils.cached_property
    def submission_sets(self):
        """
        A mapping from DataSet ids to attributes.  Helps to cut down
        significantly on the number of queries.
        """
        submission_sets = defaultdict(set)

        from django.db.models import Count
        qs = models.SubmissionSet.objects.all().select_related('place__dataset').select_related('place__dataset__owner')
        for submission_set in qs.annotate(count=Count('children')):
            submission_sets[submission_set.place.dataset_id].add((
                ('type', submission_set.submission_type),
                ('url', reverse('all_submissions_by_dataset', kwargs={
                    'dataset__owner__username': submission_set.place.dataset.owner.username,
                    'dataset__slug': submission_set.place.dataset.slug,
                    'submission_type': submission_set.submission_type
                }))
            ))

        for dataset_id, submission_sets_data in submission_sets.items():
            submission_sets[dataset_id] = [dict(data) for data in submission_sets_data]

        return submission_sets

    def owner(self, dataset):
        return simple_user(dataset.owner)

    def places(self, dataset):
        url = reverse('place_collection_by_dataset',
                      kwargs={
                         'dataset__owner__username': dataset.owner.username,
                         'dataset__slug': dataset.slug})
        return {'url': url}

    def submissions(self, dataset):
        return self.submission_sets[dataset.id]

    def url(self, instance):
        return reverse('dataset_instance_by_user',
                       kwargs={'owner__username': instance.owner.username,
                               'slug': instance.slug})

    def keys(self, instance):
        url = reverse('api_key_collection_by_dataset',
                      kwargs={'datasets__owner__username': instance.owner.username,
                              'datasets__slug': instance.slug,
                              })
        return {'url': url}


class SubmissionResource (ModelResourceWithDataBlob):
    model = models.Submission
    form = forms.SubmissionForm
    # TODO: show dataset, but not detailed owner info
    exclude = ['parent', 'data', 'submittedthing_ptr']
    include = ['type', 'place']
    queryset = model.objects.select_related('parent').select_related('dataset').order_by('created_datetime')

    def type(self, submission):
        return submission.parent.submission_type

    def place(self, submission):
        url = reverse('place_instance_by_dataset',
                      kwargs={
                         'dataset__owner__username': submission.dataset.owner.username,
                         'dataset__slug': submission.dataset.slug,
                         'pk': submission.parent.place_id})
        return {'url': url}

    def dataset(self, submission):
        url = reverse('dataset_instance_by_user',
                      kwargs={
                         'owner__username': submission.dataset.owner.username,
                         'slug': submission.dataset.slug})
        return {'url': url}


class GeneralSubmittedThingResource (ModelResourceWithDataBlob):
    model = models.SubmittedThing
    fields = ['created_datetime', 'updated_datetime', 'submitter_name', 'id']


class ActivityResource (resources.ModelResource):
    model = models.Activity
    fields = ['action', 'type', 'id', 'place_id', ('data', GeneralSubmittedThingResource)]

    @property
    def queryset(self):
        return models.Activity.objects.filter(data_id__in=self.things)

    @utils.cached_property
    def things(self):
        """
        A mapping from SubmittedThing ids to attributes.  Helps to cut down
        significantly on the number of queries.

        """
        things = {}

        for place in self.view.get_places():
            things[place.submittedthing_ptr_id] = {
                'type': 'places',
                'place_id': place.id,
                'data': place
            }
        for submission in self.view.get_submissions():
            things[submission.submittedthing_ptr_id] = {
                'type': submission.parent.submission_type,
                'place_id': submission.parent.place_id,
                'data': submission
            }

        return things

    def type(self, obj):
        return self.things[obj.data_id]['type']

    def place_id(self, obj):
        return self.things[obj.data_id]['place_id']

    def data(self, obj):
        return self.things[obj.data_id]['data']


class ApiKeyResource(resources.ModelResource):

    model = apikey.models.ApiKey

    fields = ('key', 'logged_ip', 'last_used')
