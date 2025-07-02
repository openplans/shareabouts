import yaml
import os
import os.path
try:
    from urllib2 import urlopen
except:
    from urllib.request import urlopen
from contextlib import closing
from copy import deepcopy
from django.conf import settings
from django.utils.translation import gettext as _


def apply_env_overrides(data, env):
    '''
    Allow overriding of configuration data with environment data. Environment
    variable keys starting with `SHAREABOUTS__` get inserted into the config.
    For example, a var named `SHAREABOUTS__MAP__OPTIONS__ZOOM` will override a
    config path:

        map:
          options:
            zoom: ...

    Double-underscores in environment variable keys serve to delineate nested
    attribute names.
    '''
    env_data = deepcopy(data)
    for env_key, val in env.items():
        if env_key.startswith('SHAREABOUTS__'):
            config_path = [k.lower() for k in env_key.split('__')[1:]]

            # Iterate through the config key path components
            current_node = env_data
            while config_path:
                key = config_path.pop(0)
                if not config_path:
                    # Assign the final key to the environment variable's value
                    current_node[key] = val
                else:
                    # If you're not on the final key, ensure that the current
                    # node supports key assignment (e.g., like a dict)
                    nested_node = current_node.get(key)
                    if hasattr(nested_node, '__setitem__'):
                        current_node = nested_node
                    else:
                        current_node[key] = {}
                        current_node = current_node[key]
    return env_data


def translate(data):
    # If it's an object, recurse
    if isinstance(data, dict):
        return {k: translate(v)
                for k, v in data.items()}

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


class _ShareaboutsConfig:
    """
    Base class representing Shareabouts configuration options
    """
    raw = False
    apply_env = True

    def __init__(self, translate=True, apply_env=True):
        self.translate = translate
        self.apply_env = apply_env

    @property
    def data(self):
        if not hasattr(self, '_data'):
            with closing(self.config_file()) as config_yml:
                self._data = yaml.safe_load(config_yml)

            if self.apply_env:
                self._data = apply_env_overrides(self._data, os.environ)

            if self.translate:
                self._data = translate(self._data)

        return self._data

    def __getitem__(self, key):
        return self.data[key]

    def get(self, key, default=None):
        return self.data.get(key, default)

    def items(self):
        return self.data.items()

    def update(self, other):
        self.data.update(other)


class ShareaboutsRemoteConfig (_ShareaboutsConfig):
    def __init__(self, url, **kwargs):
        super().__init__(**kwargs)
        self.url = url

    def static_url(self):
        return os.path.join(self.url, 'static/')

    def config_file(self):
        config_fileurl = os.path.join(self.url, 'config.yml')
        return urlopen(config_fileurl)


class ShareaboutsLocalConfig (_ShareaboutsConfig):
    def __init__(self, path, **kwargs):
        super().__init__(**kwargs)
        self.path = path

    def static_url(self):
        return settings.STATIC_URL

    def config_file(self):
        config_filename = os.path.join(self.path, 'config.yml')
        return open(config_filename)


def get_shareabouts_config(path_or_url: str | None = None, **kwargs) -> _ShareaboutsConfig:
    if path_or_url is None:
        path_or_url = settings.SHAREABOUTS.get('CONFIG')

    if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
        config = ShareaboutsRemoteConfig(path_or_url, **kwargs)
    else:
        config = ShareaboutsLocalConfig(path_or_url, **kwargs)

    config.update(settings.SHAREABOUTS.get('CONTEXT', {}))
    return config

