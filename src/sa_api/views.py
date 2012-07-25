from datetime import datetime, timedelta
from django.utils import timezone
from djangorestframework import views, authentication, status, response
from . import resources
from . import models
from . import forms

class PlaceCollectionView (views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class PlaceInstanceView (views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class ActivityView (views.View):
    """
    Get a list of activities ordered by the `created_datetime` in reverse.

    Query String Parameters
    -----------------------
    - `before` -- The date and time of the latest activity to return.  The
                  most recent results on and after the given time will be
                  returned.
    - `after` -- The date and time of the earliest activity to return.  The
                 most recent results before *but not up to* the given time
                 will be returned.
    - `limit` -- The maximum number of results to be returned.

    Examples
    --------
    Get up to the 50 most recent activities:

        /activity/?limit=50

    When polling for all new updates, use the `created_date` of the last known
    activity:

        /activity/?earliest=<last_known_datetime>
    """
    form = forms.ActivityForm

    def get(self, request):
        # Validate the query and get the parameters
        params = self.PARAMS
        latest_time = params.get('before')
        earliest_time = params.get('after')
        limit = params.get('limit')

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
