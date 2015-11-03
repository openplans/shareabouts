"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from unittest import TestCase
from django.conf import settings
import views


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)

class ViewsModules(TestCase):
    def test_make_api_root(self):
        withoutHTTP = 'api.shareabouts.org/api/v2/'
        withHTTP = 'http://api.shareabouts.org/api/v2/'
        withHTTPS = 'https://api.shareabouts.org/api/v2/'
        httpResult = '/'
        settingsResult = 'http://api.shareabouts.org/api/v2'
        self.assertEqual(views.make_api_root(withoutHTTP),httpResult)
        self.assertEqual(views.make_api_root(withHTTP),httpResult)
        self.assertEqual(views.make_api_root(withHTTPS),httpResult)

        settings.SHAREABOUTS['API_ROOT'] = settingsResult
        self.assertEqual(views.make_api_root('asd;lkfj023jf32nf930f2010f'),settingsResult)
