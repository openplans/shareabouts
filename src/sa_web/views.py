import requests
import yaml
import json
import logging
import os
import time
import hashlib
import httpagentparser
import urllib2
from .config import get_shareabouts_config
from django.shortcuts import render
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.template import TemplateDoesNotExist, RequestContext
from django.template.loader import render_to_string
from django.utils.timezone import now
from django.views.decorators.csrf import ensure_csrf_cookie
from proxy.views import proxy_view


log = logging.getLogger(__name__)


def make_api_root(dataset_root):
    components = dataset_root.split('/')
    if dataset_root.endswith('/'):
        return '/'.join(components[:-4]) + '/'
    else:
        return '/'.join(components[:-3]) + '/'

def make_auth_root(dataset_root):
    return make_api_root(dataset_root) + 'users/'

def make_resource_uri(resource, root):
    resource = resource.strip('/')
    root = root.rstrip('/')
    uri = '%s/%s' % (root, resource)
    return uri


class ShareaboutsApi (object):
    def __init__(self, dataset_root):
        self.dataset_root = dataset_root
        self.auth_root = make_auth_root(dataset_root)
        self.root = make_api_root(dataset_root)

    def get(self, resource, default=None, **kwargs):
        uri = make_resource_uri(resource, root=self.dataset_root)
        res = requests.get(uri, params=kwargs,
                           headers={'Accept': 'application/json'})
        return (res.text if res.status_code == 200 else default)

    def current_user(self, default=u'null', **kwargs):
        uri = make_resource_uri('current', root=self.auth_root)
        res = requests.get(uri, headers={'Accept': 'application/json'}, **kwargs)

        return (res.text if res.status_code == 200 else default)


@ensure_csrf_cookie
def index(request, place_id=None):
    # Load app config settings
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))

    # Get initial data for bootstrapping into the page.
    api = ShareaboutsApi(dataset_root=settings.SHAREABOUTS.get('DATASET_ROOT'))

    # Get the content of the static pages linked in the menu.
    pages_config = config.get('pages', [])
    pages_config_json = json.dumps(pages_config)

    # The user token will be a pair, with the first element being the type
    # of identification, and the second being an identifier. It could be
    # 'username:mjumbewu' or 'ip:123.231.132.213', etc.  If the user is
    # unauthenticated, the token will be session-based.
    if 'user_token' not in request.session:
        t = int(time.time() * 1000)
        ip = request.META['REMOTE_ADDR']
        unique_string = str(t) + str(ip)
        session_token = 'session:' + hashlib.md5(unique_string).hexdigest()
        request.session['user_token'] = session_token
        request.session.set_expiry(0)

    user_token_json = u'"{0}"'.format(request.session['user_token'])

    # Get the browser that the user is using.
    user_agent_string = request.META['HTTP_USER_AGENT']
    user_agent = httpagentparser.detect(user_agent_string)
    user_agent_json = json.dumps(user_agent)

    place = None
    if place_id:
        place = api.get('places/' + place_id)
        if place:
            place = json.loads(place)

    context = {'config': config,

               'user_token_json': user_token_json,
               'pages_config': pages_config,
               'pages_config_json': pages_config_json,
               'user_agent_json': user_agent_json,
               # Useful for customized meta tags
               'place': place,

               'API_ROOT': api.root,
               'DATASET_ROOT': api.dataset_root,
               }

    return render(request, 'index.html', context)


def place_was_created(request, path, response):
    path = path.strip('/')
    return (
        path.startswith('places') and
        not path.startswith('places/') and
        response.status_code == 201)


def send_place_created_notifications(request, response):
    config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))

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
        # The reuest has any potentially private data fields.
        requested_place = json.loads(request.body)
    except ValueError:
        errors.append('Received invalid place JSON from request: %r' % (request.body,))

    try:
        # The response has things like ID and cretated datetime
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
    context_data = RequestContext(request, {
        'place': place,
        'email': recipient_email,
        'config': config,
    })
    subject = render_to_string('new_place_email_subject.txt', context_data)
    body = render_to_string('new_place_email_body.txt', context_data)

    try:
        html_body = render_to_string('new_place_email_body.html', context_data)
    except TemplateDoesNotExist:
        html_body = None

    # connection = smtp.EmailBackend(
    #     host=...,
    #     port=...,
    #     username=...,
    #     use_tls=...)

    # NOTE: In Django 1.7+, send_mail can handle multi-part email with the
    # html_message parameter, but pre 1.7 cannot and we must construct the
    # multipart message manually.
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
    return


def api(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')
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
    root = make_auth_root(settings.SHAREABOUTS.get('DATASET_ROOT'))
    api_key = settings.SHAREABOUTS.get('DATASET_KEY')
    api_session_cookie = request.COOKIES.get('sa-api-session')

    url = make_resource_uri(path, root)
    headers = {'X-Shareabouts-Key': api_key} if api_key else {}
    cookies = {'sessionid': api_session_cookie} if api_session_cookie else {}
    return proxy_view(request, url, requests_args={
        'headers': headers,
        'allow_redirects': False,
        'cookies': cookies
    })


def csv_download(request, path):
    """
    A small proxy for a Shareabouts API server, exposing only
    one configured dataset.
    """
    root = settings.SHAREABOUTS.get('DATASET_ROOT')
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
