from . import forms
from . import models
from . import parsers
from . import resources
from . import utils
from django.contrib import auth
from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from djangorestframework import views, permissions, mixins
from djangorestframework.response import Response, ErrorResponse
import apikey.auth
import json


def raise_error_if_not_authenticated(view, request):
    if getattr(request, 'user', None) is None:
        # Probably happens only in tests that have forgotten to set the user.
        raise permissions._403_FORBIDDEN_RESPONSE
    if isinstance(view, mixins.AuthMixin):
        # This triggers authentication (view.user is a property).
        user = view.user
    else:
        user = request.user
    permissions.IsAuthenticated(view).check_permission(user)


class AuthMixin(object):
    """
    Inherit from this to protect all unsafe requests.
    """
    authentication = [apikey.auth.ApiKeyAuthentication]

    def dispatch(self, request, *args, **kwargs):
        # We do this in dispatch() so we can apply permission checks
        # to only some request methods.
        self.request = request  # Not sure what needs this.
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            try:
                raise_error_if_not_authenticated(self, request)
            except ErrorResponse as e:
                content = json.dumps(e.response.raw_content)
                response = HttpResponse(content, status=e.response.status)
                response['Content-Type'] = 'application/json'
                return response
        return super(AuthMixin, self).dispatch(request, *args, **kwargs)


class CachedMixin (object):
    @property
    def cache_prefix(self):
        return self.__class__.__name__.lower()

    @csrf_exempt
    def dispatch(self, request, *args, **kwargs):
        # Only do the cache for GET method.
        if request.method.lower() != 'get':
            return super(CachedMixin, self).dispatch(request, *args, **kwargs)

        # Check whether the response data is in the cache.
        key = ''.join([self.cache_prefix,
                       request.META['QUERY_STRING'],
                       request.META['HTTP_ACCEPT'],
                       request.META.get(apikey.auth.KEY_HEADER, ''),
                       ])
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


class Ignore_CacheBusterMixin (object):
    @csrf_exempt
    def dispatch(self, request, *args, **kwargs):
        # In order to ensure the return of a non-cached version of the view,
        # jQuery adds an _ query parameter with random data.  Ignore that
        # parameter so that it doesn't get passed along to our form validation.
        get_params = request.GET.copy()
        if '_' in get_params:
            get_params.pop('_')
        request.GET = get_params

        return super(Ignore_CacheBusterMixin, self).dispatch(request, *args, **kwargs)


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
class DataSetCollectionView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    resource = resources.DataSetResource
    cache_prefix = 'dataset_collection'

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to make args to build an instance for POST
        username = kwargs.pop('owner__username', None)
        content['owner'] = get_object_or_404(auth.models.User, username=username)
        return super(DataSetCollectionView, self).get_instance_data(model, content, **kwargs)

    def post(self, request, *args, **kwargs):
        response = super(DataSetCollectionView, self).post(request, *args, **kwargs)
        # Create an API key for the DataSet we just created.
        dataset = response.raw_content
        from .apikey.models import ApiKey, generate_unique_api_key
        key = ApiKey()
        key.user_id = dataset.owner.id  # TODO: do not allow anonymous
        key.key = generate_unique_api_key()
        key.save()
        dataset.api_keys.add(key)
        return response


class DataSetInstanceView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.DataSetResource

    def put(self, request, *args, **kwargs):
        instance = super(DataSetInstanceView, self).put(request, *args, **kwargs)
        renamed = ('slug' in kwargs and
                   (kwargs['slug'] != instance.slug))
        headers = {}
        if renamed:
            headers['Location'] = self.resource(self).url(instance)
            # http://en.wikipedia.org/wiki/HTTP_303
            response = Response(303, instance, headers)
            return response
        else:
            # djangorestframework will wrap it in a 200 response.
            return instance


# TODO derive from CachedMixin to enable caching
class PlaceCollectionView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    # TODO: Decide whether pagination is appropriate/necessary.
    resource = resources.PlaceResource
    cache_prefix = 'place_collection'

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to make args to build an instance for POST
        dataset = get_object_or_404(
            models.DataSet,
            slug=kwargs.pop('dataset__slug'),
            owner__username=kwargs.pop('dataset__owner__username'),
        )
        content['dataset'] = dataset
        return super(PlaceCollectionView, self).get_instance_data(model, content, **kwargs)

    def post(self, request, *args, **kwargs):
        response = super(PlaceCollectionView, self).post(request, *args, **kwargs)
        # djangorestframework automagically sets Location, but ...
        # see comment on DataSetCollectionView.post()
        response.headers['Location'] = self._resource.url(response.raw_content)
        return response


class PlaceInstanceView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.PlaceResource


class SubmissionCollectionView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
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
        # TODO: Location
        return super(SubmissionCollectionView, self).post(
            request, place_id=place_id, submission_type=submission_type, **kwargs)

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to make args to build an instance for POST
        # From the URL string, we should have the necessary
        # information to get the submission set.  The DataSet is
        # implicit from the Place, which we get by ID, so ignore the
        # extra kwargs.
        place_id = kwargs['place_id']
        submission_type = kwargs['submission_type']
        place = get_object_or_404(models.Place, id=place_id)
        submission_set, created = models.SubmissionSet.objects.get_or_create(
            place_id=place_id, submission_type=submission_type)

        # TODO If there's a validation error with the submission, we may end up
        #      with a dangling submission_set.  We should either defer the
        #      creation of the set, or make sure it gets cleaned up on error.

        content['dataset'] = place.dataset
        content['parent'] = submission_set
        # We don't pass the remaining kwargs as we already have the
        # DatSet they indirectly identify, and Submission can't
        # directly handle them anyway.
        return super(SubmissionCollectionView, self).get_instance_data(model, content,)


class SubmissionInstanceView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):
    resource = resources.SubmissionResource

    def get_instance(self, **kwargs):
        """
        Get a model instance for read/update/delete requests.
        """
        # This could do more joins using the kwargs if necessary,
        # but as long as we have pk in the URL, that's a fast query...
        return super(SubmissionInstanceView, self).get_instance(pk=kwargs['pk'])


# TODO derive from CachedMixin to enable caching
class ActivityView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, views.ListModelView):
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
