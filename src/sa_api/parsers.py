from .utils import unpack_data_blob
from djangorestframework import parsers


class FormDataWithDataBlobMixin (object):
    """
    After initial decoding, look for an item named 'data', decode it as JSON,
    and merge the decoded JSON with the other results;
    see unpack_data_blob().

    Used as a mixin with other parsers which do the initial decoding from
    some content-type (eg. FormParser for form data).
    """
    def parse(self, stream):
        (data, files) = super(FormDataWithDataBlobMixin, self).parse(stream)

        unpack_data_blob(data)
        return (data, files)


class FormParser (FormDataWithDataBlobMixin, parsers.FormParser):
    """
    Handle 'application/x-www-form-urlencoded' data and then
    do the DataBlob JSON decoding.
    """
    pass


class MultiPartParser (FormDataWithDataBlobMixin, parsers.MultiPartParser):
    """
    Handle 'form/mulitpart' data and then do the DataBlob JSON decoding.
    """
    pass


# Use the same default parsers (in the same order) as DRF, but replace the form
# parsers with the ones above.
DEFAULT_DATA_BLOB_PARSERS = list(parsers.DEFAULT_PARSERS)
DEFAULT_DATA_BLOB_PARSERS[1:3] = [FormParser, MultiPartParser]
DEFAULT_DATA_BLOB_PARSERS = tuple(DEFAULT_DATA_BLOB_PARSERS)
