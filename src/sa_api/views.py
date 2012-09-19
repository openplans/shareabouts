from . import forms
from . import models
from . import parsers
from . import renderers
from . import resources
from . import utils
from django.contrib import auth
from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from djangorestframework import views, permissions, mixins, authentication
from djangorestframework.response import Response, ErrorResponse
import apikey.auth
import json
import logging

logger = logging.getLogger('sa_api.views')


def raise_error_if_not_authenticated(view, request):
    # TODO: delete this
    if getattr(request, 'user', None) is None:
        # Probably happens only in tests that have forgotten to set the user.
        raise permissions._403_FORBIDDEN_RESPONSE
    if isinstance(view, mixins.AuthMixin):
        # This triggers authentication (view.user is a property).
        user = view.user
    else:
        user = request.user
    permissions.IsAuthenticated(view).check_permission(user)


class IsOwnerOrSuperuser(permissions.BasePermission):
    def check_permission(self, user):
        """
        Allows only superusers or the user named by
        ``self.view.allowed_username``.

        (If the view has no such attribute, raises a 403 Forbidden
        exception.  Subclasses of AuthMixin should have it.)
        """
        if user.is_superuser:
            # XXX Watch out when mocking users in tests: bool(mock.Mock()) is True
            return
        username = getattr(user, 'username', None)
        if username and (self.view.allowed_username == username):
            return
        raise permissions._403_FORBIDDEN_RESPONSE


class IsOwnerOrSuperuserWithoutApiKey(IsOwnerOrSuperuser):
    def check_permission(self, user):
        """Like IsOwnerOrSuperuser, but will not respond to any
        request with the API key http header.

        For protecting views related to API keys that should require
        'real' authentication, to avoid users abusing one API key to
        obtain others.
        """
        from .apikey.auth import KEY_HEADER
        if KEY_HEADER in self.view.request.META:
            raise permissions._403_FORBIDDEN_RESPONSE
        return super(IsOwnerOrSuperuserWithoutApiKey, self).check_permission(user)


class AuthMixin(object):
    """
    Inherit from this to protect all unsafe requests
    with permissions listed in ``self.unsafe_permissions``.

    You should set the ``allowed_user_kwarg`` attribute to tell dispatch()
    how to get the name of the resource's owner from the request kwargs;
    """
    authentication = [authentication.BasicAuthentication,
                      authentication.UserLoggedInAuthentication,
                      apikey.auth.ApiKeyAuthentication]

    unsafe_permissions = [IsOwnerOrSuperuser]

    allowed_username = None
    allowed_user_kwarg = None

    def dispatch(self, request, *args, **kwargs):
        # We do this in dispatch() so we can apply permission checks
        # to only some request methods.
        self.request = request  # Not sure what needs this.
        if getattr(request, 'user', None) is None:
            # Probably happens only in tests that have forgotten to
            # set the user?
            raise permissions._403_FORBIDDEN_RESPONSE
        # This triggers authentication (view.user is a property).
        user = self.user

        if self.allowed_user_kwarg:
            self.allowed_username = kwargs[self.allowed_user_kwarg]
        elif self.allowed_username:
            pass
        else:
            logger.error("Subclass %s of AuthMixin is supposed to provide .allowed_user_kwarg or .allowed_username" % self)
            raise permissions._403_FORBIDDEN_RESPONSE

        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            try:
                for perm in getattr(self, 'unsafe_permissions', []):
                    perm(self).check_permission(user)
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

    allowed_user_kwarg = 'owner__username'

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to make args to build an instance for POST
        kwargs.pop('owner__username', None)
        content['owner'] = get_object_or_404(auth.models.User, username=self.allowed_username)
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

    allowed_user_kwarg = 'owner__username'

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

    allowed_user_kwarg = 'dataset__owner__username'

    def get_instance_data(self, model, content, **kwargs):
        # Used by djangorestframework to make args to build an instance for POST
        dataset = get_object_or_404(
            models.DataSet,
            slug=kwargs.pop('dataset__slug'),
            owner__username=kwargs.pop('dataset__owner__username'),
        )
        content['dataset'] = dataset
        return super(PlaceCollectionView, self).get_instance_data(model, content, **kwargs)

    def get_queryset(self):
        # Expects 'all' or not defined
        visibility = self.request.GET.get('visible', 'true')
        queryset = super(PlaceCollectionView, self).get_queryset()

        if (visibility == 'all'):
            return queryset
        elif visibility == 'true':
            return queryset.filter(visible=True)

    def post(self, request, *args, **kwargs):
        response = super(PlaceCollectionView, self).post(request, *args, **kwargs)
        # djangorestframework automagically sets Location, but ...
        # see comment on DataSetCollectionView.post()
        response.headers['Location'] = self._resource.url(response.raw_content)
        return response


class PlaceInstanceView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.InstanceModelView):

    allowed_user_kwarg = 'dataset__owner__username'

    resource = resources.PlaceResource


class ApiKeyCollectionView (Ignore_CacheBusterMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListModelView):
    """
    Get a list of API keys valid for this DataSet.

    This resource cannot itself be accessed using an API key, as that
    could allow a client to use one key to obtain all the other keys.

    Accordingly, we require HTTP basic auth for all requests to this
    resource, and you have to be the DataSet owner or a superuser.

    The resource should only be exposed via https.
    """

    resource = resources.ApiKeyResource
    permissions = (permissions.IsAuthenticated, IsOwnerOrSuperuserWithoutApiKey)
    # We do NOT allow key-based auth here, as that would allow
    # using one key to obtain other keys.
    # Only the owner of a dataset can use this child resource.
    authentication = (authentication.BasicAuthentication,
                      authentication.UserLoggedInAuthentication)

    allowed_user_kwarg = 'datasets__owner__username'

    def dispatch(self, request, *args, **kwargs):
        # Set up context needed by permissions checks.
        self.allowed_username = kwargs[self.allowed_user_kwarg]
        self.dataset = get_object_or_404(
            models.DataSet,
            owner__username=self.allowed_username,
            slug=kwargs['datasets__slug'])
        self.request = request  # Not sure what needs this.
        return super(ApiKeyCollectionView, self).dispatch(request, *args, **kwargs)

    # TODO: handle POST, DELETE


class AllSubmissionCollectionsView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListModelView):
    resource = resources.SubmissionResource

    allowed_user_kwarg = 'dataset__owner__username'

    def get(self, request, submission_type, **kwargs):
        # If the submission_type is specific, then filter by that type.
        if submission_type != 'submissions':
            kwargs['parent__submission_type'] = submission_type

        return super(AllSubmissionCollectionsView, self).get(
            request,
            **kwargs
        )


class SubmissionCollectionView (Ignore_CacheBusterMixin, AuthMixin, AbsUrlMixin, ModelViewWithDataBlobMixin, views.ListOrCreateModelView):
    resource = resources.SubmissionResource

    allowed_user_kwarg = 'dataset__owner__username'

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

    allowed_user_kwarg = 'dataset__owner__username'

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
    - `visible` -- Set to `all` to return activity for both visible and
                   invisible places.

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

    allowed_user_kwarg = 'data__dataset__owner__username'

    def get_places(self):
        visibility = self.PARAMS.get('visible', 'true')
        if (visibility == 'all'):
            return models.Place.objects.all()
        elif visibility == 'true' or visibility == '':
            return models.Place.objects.all().filter(visible=True)
        else:
            raise Exception('Invalid visibility: ' + repr(visibility))

    def get_submissions(self):
        visibility = self.PARAMS.get('visible', 'true')
        if (visibility == 'all'):
            return models.Submission.objects.all().select_related('parent')
        elif visibility == 'true' or visibility == '':
            return models.Submission.objects.all().select_related('parent').filter(parent__place__visible=True)
        else:
            raise Exception('Invalid visibility: ' + repr(visibility))

    def get_queryset(self):
        """
        Get a list containing objects of all the activity matching the given
        query parameters.

        We don't do 'limit' here because subclasses may want to do
        additional filtering; do it in get() instead. (Also easier to test.)
        """
        # Validate the query and get the parameters
        activity = self._resource.queryset
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
