import dateutil.parser
import ujson as json
import logging
import os
import time
import hashlib

from sa_util.api import make_auth_root, make_resource_uri, ShareaboutsApi
from sa_util.config import get_shareabouts_config
from django.shortcuts import render
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMultiAlternatives
from django.http import HttpRequest, HttpResponse, Http404
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.utils import translation
from django.utils.timezone import now, make_aware
from django.utils.translation import (
    LANGUAGE_SESSION_KEY, check_for_language, get_language,
)
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.i18n import LANGUAGE_QUERY_PARAMETER
from django.urls import resolve
from proxy.views import proxy_view as remote_proxy_view

log = logging.getLogger(__name__)


def calc_adding_support(adding_supported):
    if isinstance(adding_supported, dict):
        # Get the first list item. If there is no list item, then adding is not
        # supported.
        try:
            start = adding_supported['from']
        except KeyError:
            return False

        # Try to parse the start time. If now is before the start time then
        # adding is not supported.
        if dateutil.parser.parse(start) > now():
            return False

        # Get the next list item. If there is no next list item, then the
        # adding period never ends and adding is supported.
        try:
            end = adding_supported['until']
        except KeyError:
            return True

        # Try to parse the end time. If now is before the end time then adding
        # is supported.
        if dateutil.parser.parse(end) > now():
            return True

        return False

    else:
        return adding_supported


def apply_language(viewfunc):
    def view_wrapper(request: HttpRequest, *args, **kwargs) -> HttpResponse:
        """
        Use the code from the django.views.i18n.set_language view to update the language
        in response to a GET request.

        Use as a decorator around a view function.
        """
        lang_code = request.GET.get(LANGUAGE_QUERY_PARAMETER)
        if not (lang_code and check_for_language(lang_code)):
            return viewfunc(request, *args, **kwargs)

        # Because we don't have a language cookie set yet, we need to activate the
        # language, as would normally happen in django.middleware.locale.LocaleMiddleware.
        translation.activate(lang_code)
        request.LANGUAGE_CODE = get_language()

        if hasattr(request, 'session'):
            # Storing the language in the session is deprecated.
            # (RemovedInDjango40Warning)
            request.session[LANGUAGE_SESSION_KEY] = lang_code

        response = viewfunc(request, *args, **kwargs)

        # Finally, set the language cookie so that future requests will have the
        # language set.
        response.set_cookie(
            settings.LANGUAGE_COOKIE_NAME, lang_code,
            max_age=settings.LANGUAGE_COOKIE_AGE,
            path=settings.LANGUAGE_COOKIE_PATH,
            domain=settings.LANGUAGE_COOKIE_DOMAIN,
            secure=settings.LANGUAGE_COOKIE_SECURE,
            httponly=settings.LANGUAGE_COOKIE_HTTPONLY,
            samesite=settings.LANGUAGE_COOKIE_SAMESITE,
        )
        return response
    return view_wrapper


@ensure_csrf_cookie
@apply_language
def index(request, place_id=None):
    config = get_shareabouts_config()
    api = ShareaboutsApi(config, request)

    go_live_date = config.get('app', {}).get('go_live_date')
    if go_live_date:
        try:
            go_live_date = dateutil.parser.parse(go_live_date)
        except Exception as e:
            raise ImproperlyConfigured(f'Invalid go_live_date: {go_live_date} -- {e}')

        # Make the go_live_date timezone-aware if it's not already.
        if not go_live_date.tzinfo:
            go_live_date = make_aware(go_live_date)

        if go_live_date > now():
            return render(request, 'prelaunch.html', {'config': config, 'go_live_date': go_live_date})

    # Get the content of the static pages linked in the menu.
    pages_config = config.get('pages', [])
    pages_config_json = json.dumps(pages_config)

    # Set the map adding enabled statuses
    place_config = config.get('place', {})
    survey_config = config.get('survey', {})
    support_config = config.get('support', {})

    place_config['adding_supported'] = calc_adding_support(place_config.get('adding_supported'))
    survey_config['adding_supported'] = calc_adding_support(survey_config.get('adding_supported'))
    support_config['adding_supported'] = calc_adding_support(support_config.get('adding_supported'))

    # The user token will be a pair, with the first element being the type
    # of identification, and the second being an identifier. It could be
    # 'username:mjumbewu' or 'ip:123.231.132.213', etc.  If the user is
    # unauthenticated, the token will be session-based.
    if 'user_token' not in request.session:
        t = int(time.time() * 1000)
        ip = request.META['REMOTE_ADDR']
        unique_string = (str(t) + str(ip)).encode()
        session_token = 'session:' + hashlib.md5(unique_string).hexdigest()
        request.session['user_token'] = session_token
        request.session.set_expiry(0)

    user_token_json = u'"{0}"'.format(request.session['user_token'])

    place = None
    if place_id and place_id != 'new':
        place = api.get('places/' + place_id)
        if place:
            place = json.loads(place)

    try:
        uses_mapbox_layers = 'mapbox' in {layer['type'] for layer in config['map']['layers']}
    except KeyError:
        uses_mapbox_layers = False

    path_prefix = settings.SHAREABOUTS.get('PREFIX', '').rstrip('/')
    if path_prefix and not path_prefix.startswith('/'):
        path_prefix = '/' + path_prefix

    context = {'config': config,

               'route_prefix': path_prefix + '/',
               'api_prefix': path_prefix + '/api/',

               'user_token_json': user_token_json,
               'pages_config': pages_config,
               'pages_config_json': pages_config_json,
               # Useful for customized meta tags
               'place': place,

               'API_ROOT': api.root,
               'DATASET_ROOT': api.dataset_root,

               'api_user': api.current_user(default=None),
               'uses_mapbox_layers': uses_mapbox_layers,
               }

    return api.respond_with_session_cookie(render(request, 'index.html', context))


def place_was_created(request, path, response):
    path = path.strip('/')
    return (
        path.startswith('places') and
        not path.startswith('places/') and
        response.status_code == 201)


def send_place_created_notifications(request, response):
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))

    # Before we start, check whether we're configured to send at all on new
    # place.
    should_send = config.get('notifications', {}).get('on_new_place', False)
    if not should_send:
        return

    # First, check that we have all the settings and data we need. Do not bail
    # after each error, so that we can report on all the validation problems
    # at once.
    errors = []

    try:
        # The request has any potentially private data fields, so we want to be
        # careful about what we include from it in the notification email.
        requested_place = json.loads(request.body)
    except ValueError:
        errors.append('Received invalid place JSON from request: %r' % (request.body,))

    try:
        # The response has things like ID and cretated datetime, which may be
        # useful in the notification email.
        try: response.render()
        except: pass
        place = json.loads(response.content)
    except ValueError:
        errors.append('Received invalid place JSON from response: %r' % (response.content,))

    try:
        from_email = settings.EMAIL_ADDRESS
    except AttributeError:
        errors.append('EMAIL_ADDRESS setting must be configured in order to send notification emails.')

    try:
        email_field = config.get('notifications', {}).get('submitter_email_field', 'submitter_email')
        recipient_email = requested_place['properties'][email_field]
    except KeyError:
        errors.append('No "%s" field found on the place. Be sure to configure the "notifications.submitter_email_field" property if necessary.' % (email_field,))

    # Bail if any errors were found. Send all errors to the logs and otherwise
    # fail silently.
    if errors:
        for error_msg in errors:
            log.error(error_msg)
        return

    # If the user didn't provide an email address, then no need to go further.
    if not recipient_email:
        return

    # Set optional values
    bcc_list = getattr(settings, 'EMAIL_NOTIFICATIONS_BCC', [])

    # If we didn't find any errors, then render the email and send.
    context_data = {
        'place': place,
        'email': recipient_email,
        'config': config,
        'site_root': request.build_absolute_uri('/' + settings.SHAREABOUTS.get('PREFIX', '')),
    }
    subject = render_to_string('new_place_email_subject.txt', context_data, request)
    body = render_to_string('new_place_email_body.txt', context_data, request)

    try:
        html_body = render_to_string('new_place_email_body.html', context_data, request)
    except TemplateDoesNotExist:
        html_body = None

    # connection = smtp.EmailBackend(
    #     host=...,
    #     port=...,
    #     username=...,
    #     use_tls=...)

    # NOTE: Django's send_mail function is not able to handle BCC lists, so we
    # must construct the multipart message manually.
    msg = EmailMultiAlternatives(
        subject,
        body,
        from_email,
        to=[recipient_email],
        bcc=bcc_list)#,
        # connection=connection)

    if html_body:
        msg.attach_alternative(html_body, 'text/html')

    msg.send()
    return msg


def proxy_view(request, url, requests_args={}):
    # For full URLs, use a real proxy.
    if url.startswith('http:') or url.startswith('https:'):
        return remote_proxy_view(request, url, requests_args=requests_args)

    # For local paths, use a simpler proxy. If there are headers specified
    # in the requests_args, keep those.
    else:
        match = resolve(url)
        for name, value in requests_args.get('headers', {}).items():
            name = name.upper().replace('-', '_')
            if name not in ('ACCEPT', 'CONTENT_TYPE'):
                name = 'HTTP_' + name
            request.META[name] = value
        return match.func(request, *match.args, **match.kwargs)


def readonly_response(request, data):
    response_string = json.dumps(data)
    content_type = 'application/json'

    if 'callback' in request.GET:
        response_string = '%s(%s);' % (request.GET['callback'], response_string)
        content_type = 'application/javascript'

    return HttpResponse(response_string, content_type=content_type)


def readonly_file_api(request, path, datafilename='data.json'):
    if path.endswith('actions'):
        return readonly_response(request, {
            'results': [],
            'metadata': {
                'length': 0,
                'next': None,
                'previous': None
            },
        })

    with open(datafilename) as datafile:
        data = json.load(datafile)

        try:
            page_size = int(request.GET.get('page_size'))
        except (TypeError, ValueError):
            page_size = 100

        try:
            page = int(request.GET.get('page'))
        except (TypeError, ValueError):
            page = 1

        start = (page - 1) * page_size
        end = page * page_size
        count = len(data['features'])

        if path.endswith('places'):
            return readonly_response(request, {
                'type': 'FeatureCollection',
                'features': data['features'][start:end],
                'metadata': {
                    'length': count,
                    'next': (end < count) or None,
                    'previous': (start > 0) or None,
                    'page': page,
                    'num_pages': count // page_size + (0 if count % page_size == 0 else 1)
                },
            })

        components = path.split('/')

        seen_places = False
        place_id = set_name = submission_id = None

        for component in components:
            if component == 'places':
                seen_places = True
                continue

            if not seen_places:
                continue

            if place_id is None:
                place_id = int(component)
                continue

            if set_name is None:
                set_name = component
                continue

            if submission_id is None:
                submission_id = int(component)

        for feature in data['features']:
            if feature['id'] != place_id:
                continue

            submissions = feature['properties']['submission_sets'].get(set_name, [])

            # If there's a submission_id, then we're getting a submission
            # instance.
            if submission_id:
                for submission in submissions:
                    if submission['id'] != submission_id:
                        continue

                    return readonly_response(request, submission)
                else:
                    raise Http404

            # If there's no submission_id but there's a set_name, then we're
            # getting a list of submissions.
            elif set_name:
                return readonly_response(request, {
                    'results': submissions,
                    'metadata': {
                        'length': len(submissions),
                        'next': None,
                        'previous': None,
                        'page': 1,
                        'num_pages': 1
                    },
                })

            # Otherwise, we're getting a place instance (place lists and actions
            # are covered above).
            else:
                return readonly_response(request, feature)
        else:
            raise Http404


def api(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')

    if root.startswith('file://'):
        return readonly_file_api(request, path, datafilename=root[7:])

    api_key = settings.SHAREABOUTS.get('DATASET_KEY')
    api_session_cookie = request.COOKIES.get('sa-api-sessionid')

    # It doesn't matter what the CSRF token value is, as long as the cookie and
    # header value match.
    api_csrf_token = '1234csrf567token'

    url = make_resource_uri(path, root)
    headers = {'X-SHAREABOUTS-KEY': api_key,
               'X-CSRFTOKEN': api_csrf_token}
    cookies = {'sessionid': api_session_cookie,
               'csrftoken': api_csrf_token} \
              if api_session_cookie else {'csrftoken': api_csrf_token}

    # Clear cookies from the current domain, so that they don't interfere with
    # our settings here.
    request.META.pop('HTTP_COOKIE', None)
    response = proxy_view(request, url, requests_args={
        'headers': headers,
        'cookies': cookies
    })

    if place_was_created(request, path, response):
        send_place_created_notifications(request, response)

    return response


def users(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    user authentication.
    """
    if settings.SHAREABOUTS.get('DATASET_ROOT').startswith('file://'):
        return readonly_response(request, None)

    root = make_auth_root(settings.SHAREABOUTS.get('DATASET_ROOT'))
    api_key = settings.SHAREABOUTS.get('DATASET_KEY')
    api_session_cookie = request.COOKIES.get('sa-api-session')

    url = make_resource_uri(path, root)
    headers = {'X-Shareabouts-Key': api_key} if api_key else {}
    cookies = {'sessionid': api_session_cookie} if api_session_cookie else {}
    response = proxy_view(request, url, requests_args={
        'headers': headers,
        'allow_redirects': False,
        'cookies': cookies
    })
    return response


def csv_download(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')

    if root.startswith('file://'):
        return readonly_file_api(request, path, datafilename=root[7:])

    api_key = settings.SHAREABOUTS.get('DATASET_KEY')
    api_session_cookie = request.COOKIES.get('sa-api-session')

    url = make_resource_uri(path, root)
    headers = {
        'X-Shareabouts-Key': api_key,
        'ACCEPT': 'text/csv'
    }
    cookies = {'sessionid': api_session_cookie} if api_session_cookie else {}
    return proxy_view(request, url, requests_args={
        'headers': headers,
        'cookies': cookies
    })

    # Send the csv as a timestamped download
    filename = '.'.join([os.path.split(path)[1],
                        now().strftime('%Y%m%d%H%M%S'),
                        'csv'])
    response['Content-disposition'] = 'attachment; filename=' + filename

    return response
