import yaml
import os.path
try:
    from urllib2 import urlopen
except:
    from urllib.request import urlopen
from contextlib import closing
from django.conf import settings
from django.utils.translation import ugettext as _


def get_shareabouts_config(path_or_url):
    if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
        return ShareaboutsRemoteConfig(path_or_url)
    else:
        return ShareaboutsLocalConfig(path_or_url)


def translate(data):
    i18n_data = {}

    # If it's an object, recurse
    if isinstance(data, dict):
        return dict([(k, translate(v))
                     for k, v in data.items()])

    # If it's a list, recurse on each item
    elif isinstance(data, list):
        return [translate(item)
                for item in data]

    # If it's a string, output it, unless it should be excluded
    elif isinstance(data, str):
        msg = parse_msg(data)
        if msg is not None:
            return _(msg)
        else:
            return data

    else:
        return data

def parse_msg(s):
    s = s.strip()
    if s.startswith('_(') and s.endswith(')'):
        return s[2:-1]


class _ShareaboutsConfig (object):
    """
    Base class representing Shareabouts configuration options
    """
    raw = False

    @property
    def data(self):
        if not hasattr(self, '_yml'):
            with closing(self.config_file()) as config_yml:
                self._yml = yaml.load(config_yml)
                if not self.raw:
                    self._yml = translate(self._yml)

        return self._yml

    def __getitem__(self, key):
        return self.data[key]

    def get(self, key, default=None):
        return self.data.get(key, default)

    def items(self):
        return self.data.items()

    def update(self, other):
        self.data.update(other)


class ShareaboutsRemoteConfig (_ShareaboutsConfig):
    def __init__(self, url):
        self.url = url

    def static_url(self):
        return os.path.join(self.url, 'static/')

    def config_file(self):
        config_fileurl = os.path.join(self.url, 'config.yml')
        return urlopen(config_fileurl)


class ShareaboutsLocalConfig (_ShareaboutsConfig):
    def __init__(self, path):
        self.path = path

    def static_url(self):
        return settings.STATIC_URL

    def config_file(self):
        config_filename = os.path.join(self.path, 'config.yml')
        return open(config_filename)
