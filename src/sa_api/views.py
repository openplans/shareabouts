from djangorestframework import views
from . import resources

class PlaceCollectionView (views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
