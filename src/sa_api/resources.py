"""
DjangoRestFramework resources for the Shareabouts REST API.
"""
import json
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

    def serialize(self, obj):
        # If the object is a place, parse the data blob and add it to the
        # place's fields.
        serialization = super(ModelResourceWithDataBlob, self).serialize(obj)
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

    # TODO: un-exclude dataset once i figure out how to avoid exposing user info
    # in related resources.
    exclude = ['data', 'submittedthing_ptr', 'dataset']
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
        qs = models.SubmissionSet.objects.all()
        for submission_set in qs.annotate(count=Count('children')):
            submission_sets[submission_set.place_id].append({
                'type': submission_set.submission_type,
                'count': submission_set.count,
                'url': reverse('submission_collection', kwargs={
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
                dataset.short_name,
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
    fields = ['id', 'url', 'owner', 'places', 'short_name', 'display_name']

    def owner(self, dataset):
        return simple_user(dataset.owner)

    def _simple_place(self, place):
        # TODO: it's a pain to explicitly serialize this, but if I don't
        # override place_set below, the automatic serialization includes all
        # of the DataSet.owner info, which is a security hole.
        # There must be an easier way?
        return {'id': place.id,
                'url': reverse('place_instance', args=[place.id])}

    def places(self, dataset):
        # TODO: this should probably just be a (paginated) child resource
        # as there may be thousands, millions, ...
        places = models.Place.objects.filter(dataset=dataset)
        return [self._simple_place(place) for place in places]

    def url(self, instance):
        return reverse('dataset_instance_by_user',
                       kwargs={'owner__username': instance.owner.username,
                               'short_name': instance.short_name})


class SubmissionResource (ModelResourceWithDataBlob):
    model = models.Submission
    form = forms.SubmissionForm
    # TODO: show dataset, but not detailed owner info
    exclude = ['parent', 'data', 'submittedthing_ptr', 'dataset']
    include = ['type']
    queryset = model.objects.order_by('created_datetime')

    def type(self, submission):
        return submission.parent.submission_type


class GeneralSubmittedThingResource (ModelResourceWithDataBlob):
    model = models.SubmittedThing
    fields = ['created_datetime', 'updated_datetime', 'submitter_name', 'id']


class ActivityResource (resources.ModelResource):
    model = models.Activity
    fields = ['action', 'type', 'id', 'place_id', ('data', GeneralSubmittedThingResource)]

    @utils.cached_property
    def things(self):
        """
        A mapping from SubmittedThing ids to attributes.  Helps to cut down
        significantly on the number of queries.

        """
        things = {}

        for place in models.Place.objects.all():
            things[place.submittedthing_ptr_id] = {
                'type': 'places',
                'place_id': place.id,
                'data': place
            }
        for submission in models.Submission.objects.all().select_related('parent'):
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
