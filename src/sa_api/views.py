from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.core.urlresolvers import reverse
from djangorestframework import views, authentication
from . import resources
from . import models
from . import forms
from . import parsers
from . import utils


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
            if data.get('url') is not None:
                data['url'] = self.request.build_absolute_uri(data['url'])

            for val in data.itervalues():
                self.process_urls(val)

        return data


class ModelViewWithDataBlobMixin (object):
    parsers = parsers.DEFAULT_DATA_BLOB_PARSERS

    def _perform_form_overloading(self):
        """
        Overloaded to handle the data blob as submitted from a form.
        """
        super(ModelViewWithDataBlobMixin, self)._perform_form_overloading()
        if hasattr(self, '_data'):
            utils.unpack_data_blob(self._data)


# TODO derive from CachedMixin to enable caching
class DataSetCollectionView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    resource = resources.DataSetResource
    authentication = (authentication.BasicAuthentication,)
    cache_prefix = 'dataset_collection'

    def post(self, request, *args, **kwargs):
        response = super(DataSetCollectionView, self).post(request, *args, **kwargs)
        # Create an API key for the DataSet we just created.
        dataset = response.raw_content
        from .apikey.models import ApiKey, generate_unique_api_key
        key = ApiKey()
        key.user_id = request.user.id  # TODO: do not allow anonymous
        key.key = generate_unique_api_key()
        key.save()
        dataset.api_keys.add(key)
        response.headers['Location'] = reverse(
            'dataset_instance_by_user',
            kwargs={'owner__username': request.user.username,
                    'short_name': dataset.short_name})
        return response


class DataSetInstanceView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.DataSetResource
    authentication = (authentication.BasicAuthentication,)


def dataset_instance_by_user(request, username, short_name):
    # This kind of implies that 'datasets/<username>' is
    # also a resource, but let's ignore that for now...
    view = DataSetInstanceView().as_view()
    return view(request, owner__username=username, short_name=short_name)


# TODO derive from CachedMixin to enable caching
class PlaceCollectionView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)
    cache_prefix = 'place_collection'

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to build an instance for POST
        dataset = get_object_or_404(
            models.DataSet,
            short_name=kwargs.pop('dataset__short_name'),
            owner__username=kwargs.pop('dataset__owner__username'),
        )
        content['dataset'] = dataset
        return super(PlaceCollectionView, self).get_instance_data(model, content, **kwargs)


class PlaceInstanceView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.PlaceResource
    authentication = (authentication.BasicAuthentication,)


class SubmissionCollectionView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    resource = resources.SubmissionResource

    def get(self, request, place_id, submission_type, **kwargs):
        # rename the URL parameters as necessary, and pass to the
        # base class's handler
        return super(SubmissionCollectionView, self).get(
            request,
            parent__place_id=place_id,
            parent__submission_type=submission_type,
            **kwargs
        )

    def post(self, request, place_id, submission_type, **kwargs):
        # From the URL string, we should have the necessary information to get
        # the submission set.
        submission_set, created = models.SubmissionSet.objects.get_or_create(
            place_id=place_id,
            submission_type=submission_type,
            **kwargs
        )

        # TODO If there's a validation error with the submission, we may end up
        #      with a dangling submission_set.  We should either defer the
        #      creation of the set, or make sure it gets cleaned up on error.

        # Pass the submission set in to the base class's
        return super(SubmissionCollectionView, self).post(
            request,
            parent_id=submission_set.id
        )


class SubmissionInstanceView (AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.SubmissionResource

    def get(self, request, place_id, submission_type, pk):
        return super(SubmissionInstanceView, self).get(
            request,
            parent__place_id=place_id,
            parent__submission_type=submission_type,
            pk=pk
        )

    def put(self, request, place_id, submission_type, pk):
        return super(SubmissionInstanceView, self).put(
            request,
            parent__place_id=place_id,
            parent__submission_type=submission_type,
            pk=pk
        )

    def delete(self, request, place_id, submission_type, pk):
        return super(SubmissionInstanceView, self).delete(
            request,
            parent__place_id=place_id,
            parent__submission_type=submission_type,
            pk=pk
        )


# TODO derive from CachedMixin to enable caching
class ActivityView (AbsUrlMixin, views.ListModelView):
    """
    Get a list of activities ordered by the `created_datetime` in reverse.

    Query String Parameters
    -----------------------
    - `before` -- The id of the latest activity to return.  The
                  most recent results with the given id or lower will be
                  returned.
    - `after` -- The id of the earliest activity to return.  The
                 most recent results with ids higher than *but not including*
                 the given time will be returned.
    - `limit` -- The maximum number of results to be returned.

    Examples
    --------
    Get up to the 50 most recent activities:

        /activity/?limit=50

    When polling for all new updates, use the id of the last known
    activity with the `after` parameter:

        /activity/?after=<last_known_id>
    """
    resource = resources.ActivityResource
    form = forms.ActivityForm
    cache_prefix = 'activity'

    def get_queryset(self):
        """
        Get a list containing objects of all the activity matching the given
        query parameters.

        We don't do 'limit' here because subclasses may want to do
        additional filtering; do it in get() instead. (Also easier to test.)
        """
        # Validate the query and get the parameters
        activity = super(ActivityView, self).get_queryset()
        query_params = self.PARAMS
        latest_id = query_params.get('before')
        earliest_id = query_params.get('after')

        activity = activity.order_by('-id')

        if earliest_id:
            activity = activity.filter(id__gt=earliest_id)

        if latest_id:
            activity = activity.filter(id__lte=latest_id)

        return activity

    def get(self, request, *args, **kwargs):
        """
        Optionally limit number of items per the 'limit' query param.
        """
        queryset = super(ActivityView, self).get(request, *args, **kwargs)
        limit = self.PARAMS.get('limit')
        if limit is not None:
            queryset = queryset[:limit]
        return queryset
