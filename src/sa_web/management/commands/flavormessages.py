from django.core.management import call_command
from django.core.management.commands.makemessages import Command as MakeMessagesCommand
import os
import os.path

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


class Command(MakeMessagesCommand):
    def handle_noargs(self, *args, **options):
        # Load the config file
        print "Loading config file from", settings.SHAREABOUTS.get('CONFIG')
        config = get_shareabouts_config(settings.SHAREABOUTS.get('CONFIG'))
        config.raw = True  # So that we don't preprocess through the translator

        # Generate an intermediary Python file
        mfile_path = os.path.join(config.path, '_config.translations.py')
        print "Writing intermediary file", mfile_path
        with open(mfile_path, 'w') as mfile:
            spit_to_file(config.data, mfile)

        try:
            call_command('makemessages', *args, **options)
        finally:
            os.unlink(mfile_path)
