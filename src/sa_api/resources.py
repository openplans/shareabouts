from djangorestframework import resources
from . import forms
from . import models
from . import utils

class PlaceResource (resources.ModelResource):
    model = models.Place
    exclude = []

    # TODO: Included vote counts, without an additional query if possible.
    def location(self, place):
        return {
            'lat': place.location.y,
            'lng': place.location.x,
        }

    def validate_request(self, origdata, files=None):
        if origdata:
            data = origdata.copy()

            # For now, ignore fields we don't know how to deal with.
            known_fields = set(self.model._meta.get_all_field_names())
            for key in origdata:
                if key not in known_fields:
                    del data[key]

            # Convert the location into something that GeoDjango knows how to
            # deal with.
            data['location'] = utils.to_wkt(origdata.get('location'))

        else:
            data = origdata
        return super(PlaceResource, self).validate_request(data, files)

class ActivityResource (resources.FormResource):
    form = forms.ActivityForm

    def serialize(self, obj):
        if isinstance(obj, models.Place):
            activity = {
              'action': u'create',
              'instance': u'place',
              'place_id': obj.id,
              'data': PlaceResource().serialize(obj)
            }
            return activity
        return super(ActivityResource, self).serialize(obj)
