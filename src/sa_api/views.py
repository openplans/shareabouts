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
    @property
    def cache_prefix(self):
        return self.__class__.__name__.lower()

    def dispatch(self, request, *args, **kwargs):
        # Only do the cache for GET method.
        if request.method.lower() != 'get':
            return super(CachedMixin, self).dispatch(request, *args, **kwargs)

        # Check whether the response data is in the cache.
        key = ''.join([self.cache_prefix,
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
        # Given some cached data, construct a response.
        content, status, headers = cached_data
        response = HttpResponse(content,
                                status=status)
        for key, value in headers:
            response[key] = value

        return response

    def cache_response(self, key, response):
        # Cache enough info to recreate the response.
        content = response.content
        status = response.status_code
        headers = response.items()
        cache.set(key, (content, status, headers))

        # Also, add the key to the set of pages cached from this view.
        keys = cache.get(self.cache_prefix + '_keys') or set()
        keys.add(key)
        cache.set(self.cache_prefix + '_keys', keys)


class AbsUrlMixin (object):
    def filter_response(self, obj):
        """
        Given the response content, filter it into a serializable object.
        """
        filtered = super(AbsUrlMixin, self).filter_response(obj)
        return self.process_urls(filtered)

    def process_urls(self, data):
        """
        Recursively replace all 'url' attributes with absolute URIs.  Operation
        is done in place.
        """
        if isinstance(data, list):
            for val in data:
                self.process_urls(val)

        elif isinstance(data, dict):
            if 'url' in data:
                data['url'] = self.request.build_absolute_uri(data['url'])

            for val in data.itervalues():
                self.process_urls(val)

        return data


# TODO derive from CachedMixin to enable caching
class PlaceCollectionView (AbsUrlMixin, views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)
    cache_prefix = 'place_collection'


class PlaceInstanceView (AbsUrlMixin, views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)


class SubmissionCollectionView (AbsUrlMixin, views.ListOrCreateModelView):
    resource = resources.SubmissionResource

    def post(self, request, place_id, submission_type):
        # From the URL string, we should have the necessary information to get
        # the submission set.
        submission_set, created = models.SubmissionSet.objects.get_or_create(
            place_id=place_id,
            submission_type=submission_type,
        )

        # TODO If there's a validation error with the submission, we may end up
        #      with a dangling submission_set.  We should either defer the
        #      creation of the set, or make sure it gets cleaned up on error.

        # Pass the submission set in to the base class's
        return super(SubmissionCollectionView, self).post(
            request,
            parent_id=submission_set.id
        )


# TODO derive from CachedMixin to enable caching
class ActivityView (AbsUrlMixin, views.ListModelView):
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
    form = forms.ActivityForm
    cache_prefix = 'activity'

    def get_queryset(self):
        """
        Get a list containing objects of all the activity matching the given
        query parameters.
        """
        # Validate the query and get the parameters
        query_params = self.PARAMS
        latest_id = query_params.get('before')
        earliest_id = query_params.get('after')
        limit = query_params.get('limit')

        activity = models.Activity.objects.order_by('-id')

        if earliest_id:
            activity = activity.filter(id__gt=earliest_id)

        if latest_id:
            activity = activity.filter(id__lte=latest_id)

        if limit:
            activity = activity[:limit]

        return activity
