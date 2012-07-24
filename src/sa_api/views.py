from datetime import datetime, timedelta
from django.utils import timezone
from djangorestframework import views, authentication
from . import resources
from . import models

class PlaceCollectionView (views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class PlaceInstanceView (views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class RecentActivityView (views.View):
    def get(self, request):
        latest_time = request.GET.get('before')
        earliest_time = request.GET.get('after')
        limit = request.GET.get('limit')

        # For each type of activity, get enough to satisfy the query.
        places = models.Place.objects.order_by('-created_datetime')

        if earliest_time:
            places = places.filter(created_datetime__gt=earliest_time)

        if latest_time:
            places = places.filter(created_datetime__lte=latest_time)

        if limit:
            places = places[:limit]

        # Serialize into lists of POD
        places = resources.PlaceResource().serialize(places)

        # Merge the lists and sort them all.
        all_activity = places # + other lists
        all_activity = sorted(all_activity,
                              key=lambda m: m['created_datetime'])

        # Now, only keep however many the user wanted.
        if limit:
            all_activity = all_activity[-limit:]

        # Reverse the list (latest first) and return.
        # TODO If I just merge-sorted them above, I wouldn't have to reverse
        #      them here.
        return all_activity[::-1]
