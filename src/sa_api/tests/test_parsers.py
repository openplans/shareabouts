from nose.tools import assert_equal
from nose.tools import istest


class TestFormDataWithDataBlobMixin(object):

    @istest
    def parse_unpacks_data_blob(self):
        from ..parsers import FormDataWithDataBlobMixin
        from djangorestframework.parsers import BaseParser

        class SimpleBaseParser(BaseParser):
            def parse(self, stream):
                json = '{"json": "stuff"}'
                return ({'x': 'y', 'data': json}, 'some files')

        class Parser(FormDataWithDataBlobMixin, SimpleBaseParser):
            pass

        parser = Parser('unused view arg')
        (data, files) = parser.parse('unused stream arg')
        assert_equal(files, 'some files')
        assert_equal(data, {'x': 'y', u'json': u'stuff'})

    @istest
    def default_parsers(self):
        from ..parsers import FormParser, MultiPartParser
        from ..parsers import DEFAULT_DATA_BLOB_PARSERS
        assert_equal(DEFAULT_DATA_BLOB_PARSERS[1], FormParser)
        assert_equal(DEFAULT_DATA_BLOB_PARSERS[2], MultiPartParser)
