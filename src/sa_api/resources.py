from djangorestframework import resources
from . import models
from . import utils

class PlaceResource (resources.ModelResource):
    model = models.Place

    # TODO: Included vote counts, without an additional query if possible.
    def location(self, place):
        return {
            'lat': place.location.y,
            'lon': place.location.x,
        }

    def validate_request(self, origdata, files=None):
        data = origdata.copy()
        data['location'] = utils.to_wkt(origdata.get('location'))
        return super(PlaceResource, self).validate_request(data, files)
