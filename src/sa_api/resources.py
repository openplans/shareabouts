from djangorestframework import resources
from . import models

class PlaceResource (resources.ModelResource):
    model = models.Place
    include = ['lat', 'lng']
    exclude = ['location']

    # TODO: Included vote counts, without an additional query if possible.
    def lat(self, place):
        return place.location.y

    def lng(self, place):
        return place.location.x
