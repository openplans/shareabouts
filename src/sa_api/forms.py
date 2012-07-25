from django import forms
from dateutil.parser import parse

class IsoDateTimeField (forms.DateTimeField):
    def to_python(self, value):
        try:
            return super(IsoDateTimeField, self).to_python(value)
        except forms.ValidationError, e:
            # Last ditch, use dateutil
            try:
                return parse(value)
            except:
                raise e


class ActivityForm (forms.Form):
    before = IsoDateTimeField(required=False)
    after = IsoDateTimeField(required=False)
    limit = forms.IntegerField(required=False)
