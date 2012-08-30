from django import forms
from dateutil.parser import parse
from . import models

# class IsoDateTimeField (forms.DateTimeField):
#     def to_python(self, value):
#         try:
#             return super(IsoDateTimeField, self).to_python(value)
#         except forms.ValidationError, e:
#             # Last ditch, use dateutil
#             try:
#                 return parse(value)
#             except:
#                 raise e


class SubmissionForm (forms.ModelForm):
    class Meta:
        model = models.Submission
        # When using the submission form, the parent submission set should be
        # be set by some external mechanism, usually according to the URL path.
        exclude = ['parent', 'dataset']


class DataSetForm (forms.ModelForm):
    class Meta:
        model = models.DataSet
        # When using the dataset form, the owner set should be set by some
        # external mechanism, usually according to the URL path.
        exclude = ['owner']


class PlaceForm (forms.ModelForm):
    class Meta:
        model = models.Place
        # When using the place form, the dataset set should be set by some
        # external mechanism, usually according to the URL path.
        exclude = ['dataset']


class ActivityForm (forms.Form):
    before = forms.IntegerField(required=False)
    after = forms.IntegerField(required=False)
    limit = forms.IntegerField(required=False)
    visible = forms.CharField(required=False)

    format = forms.CharField(required=False)
