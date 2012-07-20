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
