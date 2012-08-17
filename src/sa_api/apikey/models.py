"""
REST API Key model implementation derived from django-apikey,
copyright (c) 2011 Steve Scoursen and Jorge Eduardo Cardona.
BSD license.
http://pypi.python.org/pypi/django-apikey

Key generation derived from
http://jetfar.com/simple-api-key-generation-in-python/
license unknown.
"""

from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

# Changing this would require a migration, ugh.
KEY_SIZE = 32


class ApiKey(models.Model):
    user = models.ForeignKey(User, related_name='api_keys')
    key = models.CharField(max_length=KEY_SIZE, unique=True)
    logged_ip = models.IPAddressField(blank=True, null=True)
    last_used = models.DateTimeField(blank=True, default=datetime.utcnow)

    # I think we are going to only have one key per dataset,
    # but that could change on either end.
    datasets = models.ManyToManyField('sa_api.DataSet', blank=True,
                                      related_name='api_keys')

    def login(self, ip_address):
        self.logged_ip = ip_address
        self.save()

    def logout(self):
        # YAGNI?
        self.logged_ip = None
        self.save()

    def __unicode__(self):
        return self.key


def generate_unique_api_key():
    """random string suitable for use with ApiKey.

    Algorithm from http://jetfar.com/simple-api-key-generation-in-python/
    """
    import base64
    import hashlib
    import random
    api_key = ''
    while len(api_key) < KEY_SIZE:
        more_key = str(random.getrandbits(256))
        more_key = hashlib.sha256(more_key).hexdigest()
        more_key = base64.b64encode(
            more_key,
            random.choice(['rA', 'aZ', 'gQ', 'hH', 'hG', 'aR', 'DD']))
        more_key = more_key.rstrip('=')
        api_key += more_key
    api_key = api_key[:KEY_SIZE]
    return api_key
