from django import forms

ISO8601_FORMAT = ['%Y-%m-%dT%H:%M:%SZ',
                  '%Y-%m-%dT%H:%M:%S']
class ActivityForm (forms.Form):
    before = forms.DateTimeField(required=False, input_formats=ISO8601_FORMAT)
    after = forms.DateTimeField(required=False, input_formats=ISO8601_FORMAT)
    limit = forms.IntegerField(required=False)
