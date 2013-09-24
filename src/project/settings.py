# Django settings for project project.
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
STATIC_ROOT = './'

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
)

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
    # 'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',

    # 3rd-party reusaple apps
    'jstemplate',
    'compressor',

    # Project apps
    'sa_web',
    'proxy',
)

# Use a test runner that does not use a database.
TEST_RUNNER = 'sa_web.test_runner.DatabaselessTestSuiteRunner'

# Shareabouts flavor config
SHAREABOUTS = {
    'FLAVOR': 'default_config',
    # The name of the flavor. Optional, but useful for using the default settings.

    'DATASET_ROOT': 'http://api.shareabouts.org/api/v1/datasets/demo-user/demo-data/',
    # The root URL of the dataset API

    'DATASET_KEY': 'abc123',
    # The API key for writing to the dataset.  You must set this in order to be
    # able to write to the dataset

  # 'CONFIG': '...',
    # The path to the config file for the flavor. By default, this is a file
    # called 'config.yml' in a project folder called 'flavors/<name>/'

  # 'PACKAGE': '...',
    # The django app package for the flavor.  By default, this is
    # 'flavors.<name>'

  # 'CONTEXT': {},
    # Additional values to make available in the template context
}

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
    }
}

##############################################################################
# Environment overrides
# ---------------------
# Pull in certain values from the environment.

env = os.environ

if 'SHAREABOUTS_FLAVOR' in env:
    SHAREABOUTS['FLAVOR'] = env.get('SHAREABOUTS_FLAVOR')
if 'SHAREABOUTS_DATASET_ROOT' in env:
    SHAREABOUTS['DATASET_ROOT'] = env.get('SHAREABOUTS_DATASET_ROOT')
if 'SHAREABOUTS_DATASET_KEY' in env:
    SHAREABOUTS['DATASET_KEY'] = env.get('SHAREABOUTS_DATASET_KEY')

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

here = os.path.abspath(os.path.dirname(__file__))
flavor = SHAREABOUTS.get('FLAVOR')
if 'CONFIG' not in SHAREABOUTS:
    SHAREABOUTS['CONFIG'] = os.path.abspath(os.path.join(here, '..', 'flavors', flavor))
if 'PACKAGE' not in SHAREABOUTS:
    SHAREABOUTS['PACKAGE'] = '.'.join(['flavors', flavor])
    INSTALLED_APPS = (SHAREABOUTS['PACKAGE'],) + INSTALLED_APPS
