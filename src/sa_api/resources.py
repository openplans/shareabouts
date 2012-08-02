import json
from collections import defaultdict
from django.core.urlresolvers import reverse
from djangorestframework import resources
from . import models
from . import utils
from . import forms


class ModelResourceWithDataBlob (resources.ModelResource):
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
    exclude = ['data', 'submittedthing_ptr']
    include = ['url', 'submissions']

    @utils.cached_property
    def submission_sets(self):
        """
        A mapping from Place ids to attributes.  Helps to cut down
        significantly on the number of queries.

        """
        submission_sets = defaultdict(list)

        from django.db.models import Count
        for submission_set in models.SubmissionSet.objects.all().annotate(count=Count('children')):
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

    def url(self, place):
        return reverse('place_instance', args=[place.pk])

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


class SubmissionResource (ModelResourceWithDataBlob):
    model = models.Submission
    form = forms.SubmissionForm
    exclude = ['parent', 'data', 'submittedthing_ptr']


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
