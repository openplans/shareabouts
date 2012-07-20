"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from nose.tools import *
from . import utils

class TestToWkt (TestCase):

    @istest
    def converts_from_dict_with_lat_and_lng_to_point(self):
        data = dict(lat=23, lng=140, extra='something that doesn\'t matter')
        wkt = utils.to_wkt(data)

        assert_equal(wkt, 'POINT (140 23)')

    @istest
    def valid_wkt_is_identical(self):
        data = 'POINT (150 70)'
        wkt = utils.to_wkt(data)

        assert_equal(wkt, 'POINT (150 70)')
