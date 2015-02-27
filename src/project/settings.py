# Django settings for project project.
import datetime
import os.path

HERE = os.path.abspath(os.path.join(os.path.dirname(__file__)))

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy',
    }
}

ALLOWED_HOSTS = ['*']

# How long to keep api cache values. Since the api will invalidate the cache
# automatically when appropriate, this can (and should) be set to something
# large.
API_CACHE_TIMEOUT = 3600  # an hour

REST_FRAMEWORK = {
    'PAGINATE_BY': 100,
    'PAGINATE_BY_PARAM': 'page_size'
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Chicago'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
from os.path import dirname, abspath, join as pathjoin
STATIC_ROOT=abspath(pathjoin(dirname(__file__), '..', '..', 'staticfiles'))
COMPRESS_ROOT = STATIC_ROOT

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'
COMPRESS_URL = STATIC_URL

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

ATTACHMENT_STORAGE = 'django.core.files.storage.FileSystemStorage'

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
    'compressor.finders.CompressorFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'pbv(g=%7$$4rzvl88e24etn57-%n0uw-@y*=7ak422_3!zrc9+'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.auth.context_processors.auth",

    "project.context_processors.settings_context",
)

MIDDLEWARE_CLASSES = (
    'sa_web.middleware.CacheRequestBody',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # Uncomment the next line for simple clickjacking protection:
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_COOKIE_NAME = 'sa-web-session'

ROOT_URLCONF = 'project.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'project.wsgi.application'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',

    # 3rd-party reusaple apps
    'jstemplate',
    'compressor',
    'django_extensions',

    # Project apps
    'sa_web',
    'proxy',
)

# Use a test runner that does not use a database.
TEST_RUNNER = 'sa_web.test_runner.DatabaselessTestSuiteRunner'

# A sample logging configuration. The only tangible logging
# performed by this configuration is to send an email to
# the site admins on every HTTP 500 error when DEBUG=False.
# See http://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        }
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler'
        }
    },
    'loggers': {
        'django.request': {
            'handlers': ['mail_admins'],
            'level': 'ERROR',
            'propagate': True,
        },
        'sa_web': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    }
}

##############################################################################
# Environment overrides
# ---------------------
# Pull in certain values from the environment.

env = os.environ

if 'DEBUG' in env:
    DEBUG = TEMPLATE_DEBUG = (env.get('DEBUG').lower() in ('true', 'on', 't', 'yes'))

if 'DATABASE_URL' in env:
    import dj_database_url
    # NOTE: Be sure that your DATABASE_URL has the 'postgis://' scheme.
    DATABASES = {'default': dj_database_url.config()}
    DATABASES['default']['ENGINE'] = 'django.contrib.gis.db.backends.postgis'

if 'REDIS_URL' in env or 'REDISCLOUD_URL' in env:
    redis_url = env.get('REDIS_URL') or env.get('REDISCLOUD_URL')
    scheme, connstring = redis_url.split('://')
    if '@' in connstring:
        userpass, netloc = connstring.split('@')
        userename, password = userpass.split(':')
    else:
        userpass = None
        netloc = connstring
    CACHES = {
        "default": {
            "BACKEND": "redis_cache.cache.RedisCache",
            "LOCATION": "%s:0" % (netloc,),
            "OPTIONS": {
                "CLIENT_CLASS": "redis_cache.client.DefaultClient",
                "PASSWORD": password,
            } if userpass else {}
        }
    }

    # Django sessions
    SESSION_ENGINE = "django.contrib.sessions.backends.cache"

    # Celery broker
    BROKER_URL = redis_url.strip('/') + '/1'

SHAREABOUTS = {}
if 'SHAREABOUTS_FLAVOR' in env:
    SHAREABOUTS['FLAVOR'] = env.get('SHAREABOUTS_FLAVOR')
if 'SHAREABOUTS_DATASET_ROOT' in env:
    SHAREABOUTS['DATASET_ROOT'] = env.get('SHAREABOUTS_DATASET_ROOT')
if 'SHAREABOUTS_DATASET_KEY' in env:
    SHAREABOUTS['DATASET_KEY'] = env.get('SHAREABOUTS_DATASET_KEY')

if all([key in env for key in ('SHAREABOUTS_AWS_KEY',
                                   'SHAREABOUTS_AWS_SECRET',
                                   'SHAREABOUTS_AWS_BUCKET')]):
    AWS_ACCESS_KEY_ID = env['SHAREABOUTS_AWS_KEY']
    AWS_SECRET_ACCESS_KEY = env['SHAREABOUTS_AWS_SECRET']
    AWS_STORAGE_BUCKET_NAME = env['SHAREABOUTS_AWS_BUCKET']
    AWS_QUERYSTRING_AUTH = False
    AWS_PRELOAD_METADATA = True

    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto.S3BotoStorage'
    ATTACHMENT_STORAGE = DEFAULT_FILE_STORAGE
    STATICFILES_STORAGE = DEFAULT_FILE_STORAGE
    STATIC_URL = 'https://%s.s3.amazonaws.com/' % AWS_STORAGE_BUCKET_NAME

if 'SHAREABOUTS_TWITTER_KEY' in env \
    and 'SHAREABOUTS_TWITTER_SECRET' in env:
    SOCIAL_AUTH_TWITTER_KEY = env['SHAREABOUTS_TWITTER_KEY']
    SOCIAL_AUTH_TWITTER_SECRET = env['SHAREABOUTS_TWITTER_SECRET']

if 'SHAREABOUTS_FACEBOOK_KEY' in env \
    and 'SHAREABOUTS_FACEBOOK_SECRET' in env:
    SOCIAL_AUTH_FACEBOOK_KEY = env['SHAREABOUTS_FACEBOOK_KEY']
    SOCIAL_AUTH_FACEBOOK_SECRET = env['SHAREABOUTS_FACEBOOK_SECRET']

if 'EMAIL_ADDRESS' in env:
    EMAIL_ADDRESS = env['EMAIL_ADDRESS']
if 'EMAIL_HOST' in env:
    EMAIL_HOST = env['EMAIL_HOST']
if 'EMAIL_PORT' in env:
    EMAIL_PORT = env['EMAIL_PORT']
if 'EMAIL_USERNAME' in env:
    EMAIL_HOST_USER = env['EMAIL_USERNAME']
if 'EMAIL_PASSWORD' in env:
    EMAIL_HOST_PASSWORD = env['EMAIL_PASSWORD']
if 'EMAIL_USE_TLS' in env:
    EMAIL_USE_TLS = env['EMAIL_USE_TLS']

if 'EMAIL_NOTIFICATIONS_BCC' in env:
    EMAIL_NOTIFICATIONS_BCC = env['EMAIL_NOTIFICATIONS_BCC'].split(',')

if all(['S3_MEDIA_BUCKET' in env, 'AWS_ACCESS_KEY' in env, 'AWS_SECRET_KEY' in env]):
    AWS_STORAGE_BUCKET_NAME = env.get('S3_MEDIA_BUCKET')
    AWS_ACCESS_KEY_ID = env.get('AWS_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = env.get('AWS_SECRET_KEY')

    # Set the compress storage, but not the static files storage, to S3.
    COMPRESS_ENABLED = env.get('COMPRESS_ENABLED', str(not DEBUG)).lower() in ('true', 't')
    COMPRESS_STORAGE = 'project.backends.S3BotoStorage'
    COMPRESS_URL = '//%s.s3.amazonaws.com/' % AWS_STORAGE_BUCKET_NAME


# For sitemaps and caching -- will be a new value every time the server starts
LAST_DEPLOY_DATE = datetime.datetime.now().replace(second=0, microsecond=0).isoformat()


if 'GOOGLE_ANALYTICS_ID' in env:
    GOOGLE_ANALYTICS_ID = env.get('GOOGLE_ANALYTICS_ID')
if 'GOOGLE_ANALYTICS_DOMAIN' in env:
    GOOGLE_ANALYTICS_DOMAIN = env.get('GOOGLE_ANALYTICS_DOMAIN')

MAPQUEST_KEY = env.get('MAPQUEST_KEY', 'Fmjtd%7Cluur2g0bnl%2C25%3Do5-9at29u')

##############################################################################
# Local settings overrides
# ------------------------
# Override settings values by importing the local_settings.py module.

LOCAL_SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'local_settings.py')
if os.path.exists(LOCAL_SETTINGS_FILE):
    # By doing this instead of import, local_settings.py can refer to
    # local variables from settings.py without circular imports.
    execfile(LOCAL_SETTINGS_FILE)


##############################################################################
# Flavor defaults
# ---------------
# By default, the flavor is assumed to be a local python package.  If no
# CONFIG_FILE or PACKAGE is specified, they are constructed as below.

try:
    SHAREABOUTS
    flavor = SHAREABOUTS['FLAVOR']
except (NameError, TypeError, KeyError):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured('No SHAREABOUTS configuration defined. '
        'Did you forget to copy the local settings template?')

here = os.path.abspath(os.path.dirname(__file__))
if 'CONFIG' not in SHAREABOUTS:
    SHAREABOUTS['CONFIG'] = os.path.abspath(os.path.join(here, '..', 'flavors', flavor))
if 'PACKAGE' not in SHAREABOUTS:
    SHAREABOUTS['PACKAGE'] = '.'.join(['flavors', flavor])
    INSTALLED_APPS = (SHAREABOUTS['PACKAGE'],) + INSTALLED_APPS


##############################################################################
# Locale paths
# ------------
# Help Django find any translation files.

LOCALE_PATHS = (
    os.path.join(HERE, '..', 'sa_web', 'locale'),
    os.path.join(HERE, '..', 'flavors', flavor, 'locale'),
)

if SHAREABOUTS['DATASET_ROOT'].startswith('/'):
    INSTALLED_APPS += (
        # =================================
        # 3rd-party reusaple apps
        # =================================
        'rest_framework',
        'django_nose',
        'storages',
        'social.apps.django_app.default',
        'raven.contrib.django.raven_compat',
        'django_ace',
        'django_object_actions',
        'djcelery',

        # OAuth
        'provider',
        'provider.oauth2',
        'corsheaders',

        # =================================
        # Project apps
        # =================================
        'sa_api_v2',
        'sa_api_v2.apikey',
        'sa_api_v2.cors',
        'remote_client_user',
    )


    ###############################################################################
    #
    # Authentication
    #

    AUTHENTICATION_BACKENDS = (
        # See http://django-social-auth.readthedocs.org/en/latest/configuration.html
        # for list of available backends.
        'social.backends.twitter.TwitterOAuth',
        'social.backends.facebook.FacebookOAuth2',
        'sa_api_v2.auth_backends.CachedModelBackend',
    )

    AUTH_USER_MODEL = 'sa_api_v2.User'
    SOCIAL_AUTH_USER_MODEL = 'sa_api_v2.User'
    SOCIAL_AUTH_PROTECTED_USER_FIELDS = ['email',]

    SOCIAL_AUTH_FACEBOOK_EXTRA_DATA = ['name', 'picture', 'bio']
    SOCIAL_AUTH_TWITTER_EXTRA_DATA = ['name', 'description', 'profile_image_url']

    # Explicitly request the following extra things from facebook
    SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {'fields': 'id,name,picture.width(96).height(96),first_name,last_name,bio'}

    SOCIAL_AUTH_LOGIN_ERROR_URL = 'remote-social-login-error'


    ###############################################################################
    #
    # Background task processing
    #

    CELERY_RESULT_BACKEND='djcelery.backends.database:DatabaseBackend'


