from django.contrib.contenttypes import generic
from django.contrib.gis.db import models
from django.core.cache import cache


class TimeStampedModel (models.Model):
    created_datetime = models.DateTimeField(auto_now_add=True)
    updated_datetime = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SubmittedThing (TimeStampedModel):
    """
    A SubmittedThing generally comes from the end-user.  It may be a place, a
    comment, a vote, etc.

    """
    submitter_name = models.CharField(max_length=256, null=True, blank=True)
    data = models.TextField(default='{}')

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        ret = super(SubmittedThing, self).save(*args, **kwargs)

        # All submitted things generate an action.
        activity = Activity()
        activity.data = self
        activity.save()

        return ret


class Place (SubmittedThing):
    """
    A Place is a submitted thing with some geographic information, to which
    other submissions such as comments or surveys can be attached.

    """
    location = models.PointField()
    visible = models.BooleanField(default=True)

    objects = models.GeoManager()

    def save(self, *args, **kwargs):
        keys = cache.get('place_collection_keys') or set()
        keys.add('place_collection_keys')
        cache.delete_many(keys)

        return super(Place, self).save(*args, **kwargs)


class SubmissionSet (models.Model):
    """
    A submission set is a collection of user submissions attached to a place.
    For example, comments will be a submission set with a submission_type of
    'comment'

    """
    place = models.ForeignKey(Place, related_name='submission_sets')
    submission_type = models.CharField(max_length=128)


class Submission (SubmittedThing):
    parent = models.ForeignKey(SubmissionSet, related_name='children')


class Activity (TimeStampedModel):
    action = models.CharField(max_length=16, default='create')
    data_content_type = models.ForeignKey('contenttypes.ContentType')
    data_object_id = models.PositiveIntegerField()
    data = generic.GenericForeignKey('data_content_type', 'data_object_id')

    def save(self, *args, **kwargs):
        keys = cache.get('activity_keys') or set()
        keys.add('activity_keys')
        cache.delete_many(keys)

        return super(Activity, self).save(*args, **kwargs)

## TODO Consider this: We could have a SubmittedThing from which both Place
##      and Contribution derive.  A SubmittedThing stores arbitrary data
##      however we want to do that (a text blob, a related table, whatever).
##
#class SubmittedThing (models.Model):
#    person = models.CharField(max_length=256)
#    data = models.TextField()
#
#    class Meta:
#        abstract = True
#
#
#class Place (SubmittedThing):
#    location = models.PointField()
#    visible = models.BooleanField(default=True)
#
#    objects = models.GeoManager()
#
#
##      Places could have many ContributionSets named, for example, 'comments'
##      or 'votes'.
##
#class ContributionSet (models.Model):
#    place = models.ForeignKey(Place, related_name='contribution_sets')
#    contribution_type = models.CharField(max_length=128)
#
#
#class Contribution (SubmittedThing):
#    parent = models.ForeignKey(ContributionSet, related_name='children')
#
#
##      Serializing a place would be something like:
##
##        {
##          "contributor": "{{ contributor }}",
##          "location": "{{ location }}",
##          "data": {{ data }},
##
##          {{# contribution_sets }}
##          "{{ contribution_type }}": [
##            {{# contributions }}
##            {
##              "contributor": "{{ contributor }}",
##              "data": {{ data }}
##            },
##            {{/ contributions }}
##          ],
##          {{/ contribution_sets }}
##        }
##
