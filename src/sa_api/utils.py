def isiterable(obj):
    try:
        iter(obj)
    except TypeError:
        return False
    else:
        return True

def to_wkt(orig):
    if isiterable(orig) and 'lat' in orig and 'lng' in orig:
        return 'POINT ({lng} {lat})'.format(**orig)
    else:
        # Otherwise, assume it's already WKT
        return orig

def unpack_data_blob(data):
    """
    Extract the data blob from form-submitted data.

    """
    import json
    from djangorestframework.response import ErrorResponse

    # Don't let the CSRF middleware token muck up our data.
    if 'csrfmiddlewaretoken' in data:
        del data['csrfmiddlewaretoken']

    # Handle the JSON data blob submitted through a form.
    if 'data' in data:
        try:
            data_blob = json.loads(data['data'])
        except ValueError:
            raise ErrorResponse(
                status.HTTP_400_BAD_REQUEST,
                {'detail': 'data blob must be a valid JSON object string'})

        if not isinstance(data_blob, dict):
            raise ErrorResponse(
                status.HTTP_400_BAD_REQUEST,
                {'detail': 'data blob must be a valid JSON object string'})

        del data['data']
        data.update(data_blob)
