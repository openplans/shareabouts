import json
from django.template import Library
from django.utils.safestring import mark_safe

register = Library()

@register.filter
def as_json(data):
    return mark_safe(json.dumps(data))
