from djangorestframework import views, authentication
from . import resources

class PlaceCollectionView (views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class PlaceInstanceView (views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)
