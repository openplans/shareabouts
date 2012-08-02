import json
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

    # TODO: Included vote counts, without an additional query if possible.
    def location(self, place):
        return {
            'lat': place.location.y,
            'lng': place.location.x,
        }

    def url(self, place):
        return reverse('place_instance', args=[place.pk])

    def submissions(self, place):
        submissions_metadata = []
        for submission_set in place.submission_sets.all():
            submissions_metadata.append({
                'type': submission_set.submission_type,
                'count': submission_set.children.count(),
                'url': reverse('submission_collection', kwargs={
                    'place_id': place.id,
                    'submission_type': submission_set.submission_type
                })
            })
        return submissions_metadata

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
    exclude = ['data']


class ActivityResource (resources.ModelResource):
    model = models.Activity
    fields = ['action', 'type', 'id', 'place_id', ('data', GeneralSubmittedThingResource)]

    def type(self, obj):
        try:
            return obj.data.submission.parent.submission_type
        except models.Submission.DoesNotExist:
            pass

        return 'place'

    def place_id(self, obj):
        # If the obj is a Place, get the place_id directly from it.
        try:
            return obj.data.place.id
        except models.Place.DoesNotExist:
            pass

        # If the obj is a Submission, get the place_id from the attached Place.
        try:
            return obj.data.submission.parent.place.id
        except models.Submission.DoesNotExist:
            pass
