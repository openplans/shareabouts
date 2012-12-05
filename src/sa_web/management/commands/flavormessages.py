from django.core.management.base import NoArgsCommand, CommandError
from django.core.management.commands.makemessages import process_file, write_po_file
import django
import optparse
from optparse import make_option
import sys
import os
import os.path
import re
import glob
import subprocess
import tempfile

from sa_web.config import get_shareabouts_config
from django.conf import settings


def spit_to_file(data, outfile, exclude=[]):
    # If it's an object, recurse
    if isinstance(data, dict):
        for k, v in data.items():
            spit_to_file(v, outfile)
    
    # If it's a list, recurse on each item
    elif isinstance(data, list):
        for item in data:
            spit_to_file(item, outfile)
    
    # If it's a string, output it, unless it should be excluded
    elif isinstance(data, basestring):
        msg = parse_msg(data)
        if msg is not None:
            outfile.write('_(r"""' + msg + '""")\n')

def parse_msg(s):
    s = s.strip()
    if s.startswith('_(') and s.endswith(')'):
        return s[2:-1]
        

def make_messages(flavor_dir, msgfile, locale=None, verbosity=1, all=False, 
        no_wrap=False, no_location=True, no_obsolete=False, 
        stdout=sys.stdout, domain='django'):
    """
    Uses the ``locale/`` directory from the Django SVN tree or an
    application/project to process all files with translatable literals for
    the :param domain: domain and :param locale: locale.
    """
    invoked_for_django = False
    localedir = os.path.abspath(os.path.join(flavor_dir, 'locale'))

    if (locale is None and not all):
        message = "Type '%s help %s' for usage information." % (os.path.basename(sys.argv[0]), sys.argv[1])
        raise CommandError(message)

    # We require gettext version 0.15 or newer.
    output = subprocess.check_output('xgettext --version', shell=True)
    match = re.search(r'(?P<major>\d+)\.(?P<minor>\d+)', output)
    if match:
        xversion = (int(match.group('major')), int(match.group('minor')))
        if xversion < (0, 15):
            raise CommandError("Django internationalization requires GNU "
                    "gettext 0.15 or newer. You are using version %s, please "
                    "upgrade your gettext toolset." % match.group())

    locales = []
    if locale is not None:
        locales.append(locale)
    elif all:
        locale_dirs = filter(os.path.isdir, glob.glob('%s/*' % localedir))
        locales = [os.path.basename(l) for l in locale_dirs]

    wrap = '--no-wrap' if no_wrap else ''
    location = '--no-location' if no_location else ''

    for locale in locales:
        if verbosity > 0:
            stdout.write("processing language %s\n" % locale)
        basedir = os.path.join(localedir, locale, 'LC_MESSAGES')
        if not os.path.isdir(basedir):
            os.makedirs(basedir)

        pofile = os.path.join(basedir, '%s.po' % domain)
        potfile = os.path.join(basedir, '%s.pot' % domain)

        if os.path.exists(potfile):
            os.unlink(potfile)

        dirpath, file = os.path.split(msgfile)
        extensions = []
        process_file(file, dirpath, potfile, domain, verbosity, extensions,
                wrap, location, stdout)

        if os.path.exists(potfile):
            write_po_file(pofile, potfile, domain, locale, verbosity, stdout,
                    not invoked_for_django, wrap, location, no_obsolete)


class Command(NoArgsCommand):
    option_list = NoArgsCommand.option_list + (
        make_option('--locale', '-l', default=None, dest='locale',
            help='Creates or updates the message files for the given locale (e.g. pt_BR).'),
        make_option('--all', '-a', action='store_true', dest='all',
            default=False, help='Updates the message files for all existing locales.'),
        make_option('--no-wrap', action='store_true', dest='no_wrap',
            default=False, help="Don't break long message lines into several lines"),
        make_option('--no-location', action='store_true', dest='no_location',
            default=True, help="Don't write '#: filename:line' lines"),
        make_option('--no-obsolete', action='store_true', dest='no_obsolete',
            default=False, help="Remove obsolete message strings"),
    )
    help = ("Runs over the entire source tree of the current directory and "
"pulls out all strings marked for translation. It creates (or updates) a message "
"file in the conf/locale (in the django tree) or locale (for projects and "
"applications) directory.\n\nYou must run this command with one of either the "
"--locale or --all options.")

    def handle_noargs(self, *args, **options):
        locale = options.get('locale')
        domain = options.get('domain')
        verbosity = int(options.get('verbosity'))
        process_all = options.get('all')
        extensions = options.get('extensions')
        no_wrap = options.get('no_wrap')
        no_location = options.get('no_location')
        no_obsolete = options.get('no_obsolete')

        # Load the config file
        print "Loading config file from", settings.SHAREABOUTS.get('CONFIG')
        config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
        config.raw = True  # So that we don't preprocess through the translator
        
        # Generate an intermediary Python file
        mfile_handle, mfile_path = tempfile.mkstemp(suffix='.py')
        print "Writing intermediary file", mfile_path
        with os.fdopen(mfile_handle, 'w') as mfile:
            spit_to_file(config.data, mfile)
        
        # Run xgettext on the Python file
        flavor_dir = config.path
        make_messages(flavor_dir, mfile_path, locale, verbosity, process_all,
            no_wrap, no_location, no_obsolete, self.stdout)
