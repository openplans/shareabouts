import json
from djangorestframework import resources
from . import models
from . import utils

class PlaceResource (resources.ModelResource):
    model = models.Place
    exclude = ['data']

    # TODO: Included vote counts, without an additional query if possible.
    def location(self, place):
        return {
            'lat': place.location.y,
            'lng': place.location.x,
        }

    def serialize(self, obj):
        # If the object is a place, parse the data blob and add it to the
        # place's fields.
        serialization = super(PlaceResource, self).serialize(obj)

        if isinstance(obj, models.Place):
            data = json.loads(obj.data)
            serialization.update(data)

        return rep

    def validate_request(self, origdata, files=None):
        if origdata:
            data = origdata.copy()
            blob_data = {}

            # Pull off any fields that the model doesn't know about directly
            # and put them into the data blob.
            known_fields = set(self.model._meta.get_all_field_names())
            known_fields -= set(['data'])
            for key in origdata:
                if key not in known_fields:
                    blob_data[key] = data[key]
                    del data[key]
            data['data'] = json.dumps(blob_data, indent=2)

            # Convert the location into something that GeoDjango knows how to
            # deal with.
            data['location'] = utils.to_wkt(origdata.get('location'))

        else:
            data = origdata
        return super(PlaceResource, self).validate_request(data, files)

class ActivityResource (resources.ModelResource):
    model = models.Activity
    fields = ['action', 'type', 'id', 'place_id']

    def get_fields(self, obj):
        self.fields = ActivityResource.fields[:]

        if obj.data_content_type.name == 'place':
            self.fields.append(('data', PlaceResource))

        return super(ActivityResource, self).get_fields(obj)

    def type(self, obj):
        return obj.data_content_type.name

    def place_id(self, obj):
        if obj.data_content_type.name == 'place':
            return obj.data.id
