"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from contextlib import contextmanager
from django.conf import settings
from django.test import Client, override_settings, SimpleTestCase
from os.path import abspath, dirname, join as path_join
from pathlib import Path
from threading import Thread
from . import config

class SimpleTest(SimpleTestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)


class ShareaboutsConfigTest (SimpleTestCase):
    def test_apply_env_overrides(self):
        config_data = {
            'prop0': 'a',
            'prop1': 'b',
            'prop2': {
                'prop3': 'c',
                'prop4': 'd'
            },
            'prop5': 'e'
        }

        env_values = {
            # Ignore props that don't start with SHAREABOUTS__
            'SHAREABOUTS_DATASET_KEY': '123',

            # Change an existing top-level property
            'SHAREABOUTS__PROP0': 'f',

            # Change an existing nested property
            'SHAREABOUTS__PROP2__PROP3': 'g',

            # Change an existing top-level prop to one that has nested vals
            'SHAREABOUTS__PROP5__PROP6': 'h',
            'SHAREABOUTS__PROP5__PROP7': 'i',

            # Create a new top-level prop
            'SHAREABOUTS__PROP8': 'j',

            # Add a new nested prop to an existing top-level prop
            'SHAREABOUTS__PROP2__PROP9': 'k',
        }

        env_data = config.apply_env_overrides(config_data, env_values)

        # Ensure the original data is unchanged
        self.assertDictEqual(config_data, {
            'prop0': 'a',
            'prop1': 'b',
            'prop2': {
                'prop3': 'c',
                'prop4': 'd'
            },
            'prop5': 'e'
        })

        # Ensure the new data is as expected
        self.assertDictEqual(env_data, {
            'prop0': 'f',
            'prop1': 'b',
            'prop2': {
                'prop3': 'g',
                'prop4': 'd',
                'prop9': 'k'
            },
            'prop5': {
                'prop6': 'h',
                'prop7': 'i'
            },
            'prop8': 'j'
        })


# """
# Tests to write:
# * simple request with a sample config
#
# """
#
# class StaticFileAPIBackend (TestCase):
#     def test_can_read_places(self):
#         pass
#
#     def test_can_read_submissions(self):
#         pass
#
#
class StubAPIServerThread (Thread):
    def __init__(self, directory: str):
        self.directory = directory
        super().__init__()

    def run(self):
        from http.server import (
            HTTPServer,
            SimpleHTTPRequestHandler,
        )
        from functools import partial

        StubAPIRequestHandler = partial(SimpleHTTPRequestHandler, directory=self.directory)

        server_address = ('', 8001)
        request_handler = StubAPIRequestHandler
        with HTTPServer(server_address, request_handler) as server:
            self.server = server
            server.serve_forever()


@contextmanager
def start_stub_api_server(directory):
    from time import sleep
    from urllib.error import URLError
    from urllib.request import urlopen

    # Start the server
    thread = StubAPIServerThread(str(directory))
    thread.start()

    # Wait until the server is up
    while True:
        try:
            with urlopen('http://localhost:8001/') as response:
                if response.code == 200:
                    break
        except URLError:
            pass
        sleep(0.1)

    try:
        # After the server's up, proceed with the test
        yield thread.server
    finally:
        # Shut the server down and wait for it to be done
        thread.server.shutdown()
        thread.join()


DATA_FIXTURES_DIR = Path(__file__).resolve().parent
APP_DIR = abspath(dirname(__file__))


@override_settings(
    DEBUG=True,
    SHAREABOUTS={
        'DATASET_ROOT': 'http://localhost:8001/',
        'CONFIG': abspath(path_join(APP_DIR, '..', 'flavors', 'defaultflavor'))
    })
class APIServerBackend (SimpleTestCase):
    def test_index(self):
        with start_stub_api_server(DATA_FIXTURES_DIR / 'test_fixtures') as server:
            client = Client()
            response = client.get('/')
            self.assertEqual(response.status_code, 200)

    def test_api_proxy(self):
        with (DATA_FIXTURES_DIR / 'test_fixtures' / 'places').open('rb') as datafile:
            places_data = datafile.read()

        with start_stub_api_server(DATA_FIXTURES_DIR / 'test_fixtures') as server:
            client = Client()
            response = client.get('/api/places')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, places_data)