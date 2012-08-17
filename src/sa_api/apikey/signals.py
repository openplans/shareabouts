"""
Signals sent when saving REST API Keys.
Derived from django-apikey,
copyright (c) 2011 Steve Scoursen and Jorge Eduardo Cardona.
BSD license.
http://pypi.python.org/pypi/django-apikey
"""

from django.db.models.signals import post_save
from django.db.models.signals import post_delete
from .models import ApiKey


def save_api_key( sender, instance, created, **kwargs ):
    try:
        instance.user.get_profile().save()
    except:
        pass
post_save.connect(save_api_key, sender=ApiKey)



def post_delete_api_key( sender, instance, **kwargs ):
    try:
        instance.user.get_profile().save()
    except:
        pass
post_delete.connect(post_delete_api_key, sender=ApiKey)
