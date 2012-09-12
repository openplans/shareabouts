"""
The process_new_attr function...
  - Should return the corresponding key and value for the given new attr num

"""

from django.test import TestCase
from nose.tools import istest, assert_equal
from .views import BaseDataBlobFormMixin


class TestProcessNewAttrFunction(TestCase):
    def setUp(self):
        self.view = BaseDataBlobFormMixin()

    @istest
    def should_return_empty_key_and_value_for_empty_dict(self):
        data = self.view.data_blob = {}
        num = 1
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('', ''))
        assert_equal(data, {})

    @istest
    def should_return_empty_key_and_value_for_unused_new_attr_num(self):
        data = self.view.data_blob = {'_new_key2': 'attr', '_new_val2': 'value'}
        num = 1
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('', ''))
        assert_equal(data, {'_new_key2': 'attr', '_new_val2': 'value'})

    @istest
    def should_return_the_key_and_value_for_the_new_attr_num(self):
        data = self.view.data_blob = {'_new_key2': 'attr', '_new_val2': 'value'}
        num = 2
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('attr', 'value'))
        assert_equal(data, {'attr': 'value'})

    @istest
    def should_return_the_key_and_empty_value_for_the_new_attr_num(self):
        data = self.view.data_blob = {'_new_val2': 'value'}
        num = 2
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('', 'value'))
        assert_equal(data, {})

    @istest
    def should_return_empty_key_and_the_value_for_the_new_attr_num(self):
        data = self.view.data_blob = {'_new_key2': 'attr'}
        num = 2
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('attr', ''))
        assert_equal(data, {})

    @istest
    def should_return_empty_for_a_whitespace_key(self):
        data = self.view.data_blob = {'_new_key2': ' \t\n', '_new_val2': 'value'}
        num = 2
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('', 'value'))
        assert_equal(data, {})

    @istest
    def should_trim_key(self):
        data = self.view.data_blob = {'_new_key2': ' attr\n', '_new_val2': 'value'}
        num = 2
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('attr', 'value'))
        assert_equal(data, {'attr': 'value'})

    @istest
    def should_return_the_key_and_value_for_a_string_new_attr_num(self):
        data = self.view.data_blob = {'_new_key2': 'attr', '_new_val2': 'value'}
        num = '2'
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('attr', 'value'))
        assert_equal(data, {'attr': 'value'})

    @istest
    def should_remove_the_key_and_value_from_the_dict(self):
        data = self.view.data_blob = {'_new_key2': 'attr', '_new_val2': 'value', 'otherattr': 5}
        num = '2'
        key, val = self.view.process_new_attr(num)
        assert_equal((key, val), ('attr', 'value'))
        assert_equal(data, {'attr': 'value', 'otherattr': 5})
