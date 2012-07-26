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
    before = forms.IntegerField(required=False)
    after = forms.IntegerField(required=False)
    limit = forms.IntegerField(required=False)

    format = forms.CharField(required=False)
