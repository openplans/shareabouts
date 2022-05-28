"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from unittest import TestCase
from . import config

class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)


class ShareaboutsConfigTest (TestCase):
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
