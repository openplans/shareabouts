from djangorestframework import parsers
from .utils import unpack_data_blob

class FormDataWithDataBlobMixin (object):
    def parse(self, stream):
        (data, files) = super(FormDataWithDataBlobMixin, self).parse(stream)

        unpack_data_blob(data)
        return (data, files)


class FormParser (FormDataWithDataBlobMixin, parsers.FormParser):
    pass


class MultiPartParser (FormDataWithDataBlobMixin, parsers.MultiPartParser):
    pass


# Use the same default parsers (in the same order) as DRF, but replace the form
# parsers with the ones above.
DEFAULT_DATA_BLOB_PARSERS = list(parsers.DEFAULT_PARSERS)
DEFAULT_DATA_BLOB_PARSERS[1:3] = [FormParser, MultiPartParser]
DEFAULT_DATA_BLOB_PARSERS = tuple(DEFAULT_DATA_BLOB_PARSERS)
