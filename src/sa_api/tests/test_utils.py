"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from nose.tools import istest
from nose.tools import assert_equal, assert_false, assert_true, assert_raises
from .. import utils


class TestToWkt (object):

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

    @istest
    def invalid_text_returned_unchanged(self):
        data = 'lat lng ... this is not wkt'
        assert_equal(utils.to_wkt(data), data)

    @istest
    def invalid_type_raises_error(self):
        assert_raises(TypeError, utils.to_wkt, None)
        assert_raises(TypeError, utils.to_wkt, ['lat', 'lng'])
        assert_raises(TypeError, utils.to_wkt, 99)



class TestIsIterable(object):

    @istest
    def some_builtins_not_iterable(self):
        assert_false(utils.isiterable(None))
        assert_false(utils.isiterable(1))

    @istest
    def some_builtins_iterable(self):
        assert_true(utils.isiterable(''))
        assert_true(utils.isiterable({}))
        assert_true(utils.isiterable([]))
        assert_true(utils.isiterable(()))

    @istest
    def generator_is_iterable(self):
        def ints_forever():
            n = 0
            while True:
                yield n
                n += 1

        assert_true(utils.isiterable(ints_forever()))


class TestUnpackDataBlob(object):

    @istest
    def removes_csrfmiddlewaretoken_and_data_and_not_others(self):
        data = {'csrfmiddlewaretoken': 'xyz', 'a key': 'a value', 'data': '{}'}
        result = utils.unpack_data_blob(data)
        assert_equal(None, result)
        assert_false('csrfmiddlewaretoken' in data)
        assert_false('data' in data)
        assert_true('a key' in data)

    @istest
    def invalid_json_data(self):
        data = {'data': 'this is not json'}
        from djangorestframework.response import ErrorResponse
        assert_raises(ErrorResponse, utils.unpack_data_blob, data)

        data = {'data': '["this is json but not a dict"]'}
        from djangorestframework.response import ErrorResponse
        assert_raises(ErrorResponse, utils.unpack_data_blob, data)

    @istest
    def json_merged_with_data(self):
        data = {'x': 'y', 'data': '{"inner": "peace", "outer": "turmoil"}'}
        utils.unpack_data_blob(data)
        assert_equal(data,
                     {'x': 'y', 'inner': 'peace', 'outer': 'turmoil'})


class TestCachedProperty (object):

    @istest
    def cached_property_is_cached(self):

        class Foo(object):
            call_count = 0

            def do_something(self):
                self.call_count += 1
                return 'hello %d' % self.call_count

            do_something_cached = utils.cached_property(do_something)

        # Uncached, the count is incremented
        foo = Foo()
        assert_equal(foo.do_something(), 'hello 1')
        assert_equal(foo.do_something(), 'hello 2')
        assert_equal(foo.do_something(), 'hello 3')

        # Cached, it's only incremented once.
        assert_equal(foo.do_something_cached, 'hello 4')
        for i in range(10):
            assert_equal(foo.do_something_cached, 'hello 4')

    @istest
    def cached_multiple_properties(self):

        class Foo(object):

            hellocount = 0
            goodbyecount = 100

            @utils.cached_property
            def greeting(self):
                self.hellocount += 1
                return 'hello %d' % self.hellocount

            @utils.cached_property
            def parting(self):
                self.goodbyecount += 1
                return 'goodbye %d' % self.goodbyecount

        foo = Foo()
        assert_equal(foo.greeting, 'hello 1')
        assert_equal(foo.parting, 'goodbye 101')
        assert_equal(foo.greeting, 'hello 1')
        assert_equal(foo.parting, 'goodbye 101')
