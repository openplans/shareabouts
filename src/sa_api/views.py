from datetime import datetime, timedelta
from django.core.cache import cache
from django.http import HttpResponse
from django.utils import timezone
from djangorestframework import views, authentication, status, response
from djangorestframework.response import Response
from itertools import chain
from . import resources
from . import models
from . import forms


class CachedMixin (object):
    def dispatch(self, request, *args, **kwargs):
        # Check whether the response data is in the cache.
        key = ''.join([self.__class__.__name__,
                       request.META['QUERY_STRING'],
                       request.META['HTTP_ACCEPT']])
        response_data = cache.get(key)

        if response_data:
            return self.respond_from_cache(response_data)
        else:
            response = super(CachedMixin, self).dispatch(request, *args, **kwargs)
            self.cache_response(key, response)
            return response

    def respond_from_cache(self, cached_data):
        content, status, headers = cached_data
        response = HttpResponse(content,
                                status=status)
        for key, value in headers:
            response[key] = value

        return response

    def cache_response(self, key, response):
        content = response.content
        status = response.status_code
        headers = response.items()
        cache.set(key, (content, status, headers))


class PlaceCollectionView (views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class PlaceInstanceView (views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)

class ActivityView (CachedMixin, views.View):
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
    resource = resources.ActivityResource

    def get_queryset(self, query_params):
        """
        Get a list containing objects of all the activity matching the given
        query parameters.
        """
        # Validate the query and get the parameters
        latest_time = query_params.get('before')
        earliest_time = query_params.get('after')
        limit = query_params.get('limit')

        # For each type of activity, get enough to satisfy the query.
        places = models.Place.objects.order_by('-created_datetime')

        if earliest_time:
            places = places.filter(created_datetime__gt=earliest_time)

        if latest_time:
            places = places.filter(created_datetime__lte=latest_time)

        if limit:
            places = places[:limit]

        # Merge the lists and sort them all.
        all_activity = chain(places, )# other lists
        all_activity = sorted(all_activity,
                              key=lambda m: m.created_datetime)

        # Now, only keep however many the user wanted.
        if limit:
            all_activity = all_activity[-limit:]

        return all_activity

    def get(self, request):
        """
        Handler for HTTP GET method.
        """
        activity = self.get_queryset(self.PARAMS)

        # Reverse the list (latest first) and return.
        # TODO If I just merge-sorted them in get_queryset, I wouldn't have to
        #      reverse them here.
        return activity[::-1]
