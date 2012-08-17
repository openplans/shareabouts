"""
Views for managing REST API keys.

Derived from django-apikey,
copyright (c) 2011 Steve Scoursen and Jorge Eduardo Cardona.
BSD license.
http://pypi.python.org/pypi/django-apikey
"""

from .models import ApiKey, generate_unique_api_key
from django.contrib import messages
from ebpub.accounts.utils import login_required
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.cache import cache_page
from django.views.decorators.http import condition
import datetime


def get_etag_key(request):
    try:
        lm = request.user.get_profile().last_accessed
    except:
        try:
            lm = request.get_profile().last_accessed
        except:
            lm = datetime.datetime.utcnow()
    k = 'etag.%s' % (lm)
    return k.replace(' ', '_')

def etag_func(request, *args, **kwargs):
    etag_key = get_etag_key(request)
    etag = cache.get(etag_key, None)
    return etag

def latest_access(request, *args, **kwargs):
    try:
        return request.user.get_profile().last_accessed
    except:
        return datetime.datetime.utcnow()



@login_required
@condition(etag_func=etag_func, last_modified_func=latest_access)
@cache_page(1)
def generate_key(request):
    if request.method == 'POST':
        # Trigger loading the real user object (not a LazyUser proxy),
        # and use it.
        user = request.user.user
        profile = user.get_profile()
        if profile.can_make_api_key():
            key = generate_unique_api_key()
            apikey = ApiKey(user=user, key=key)
            apikey.clean()
            apikey.save()
            messages.add_message(request, messages.INFO, 'Key %s created.' % key)
        else:
            messages.add_message(request, messages.ERROR,
                                 "You can't have more keys unless you delete some.")

    return do_generate_key_list(request)


@login_required
@condition(etag_func=etag_func, last_modified_func=latest_access)
@cache_page(1)
def list_keys(request):
    return do_generate_key_list(request)

def do_generate_key_list(request):
    # Trigger loading the real user object (not a LazyUser proxy),
    # and use it.
    user = request.user.user
    profile = user.get_profile()
    keys = ApiKey.objects.filter(user=user)
    cmak = profile.can_make_api_key()
    ak = profile.available_keys()
    return render_to_response('key/key.html',
                              { 'keys': keys, 'user': user,
                                'can_make_api_key': cmak,
                                'available_keys': ak },
                              context_instance=RequestContext(request))

@login_required
@condition(etag_func=etag_func, last_modified_func=latest_access)
@cache_page(1)
def delete_key(request):
    user = request.user.user
    to_delete = request.POST.getlist('key')
    if to_delete:
        # TODO: verify that there actually was a matching key.
        ApiKey.objects.filter(user=user, key__in=to_delete).delete()
        for key in to_delete:
            messages.add_message(request, messages.INFO, 'Key %s deleted.' % key)
    else:
        messages.add_message(request, messages.ERROR, 'No key to delete was specified.')
    return HttpResponseRedirect(reverse(list_keys))
