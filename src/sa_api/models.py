from django.contrib.auth import models as auth_models
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
    dataset = models.ForeignKey('DataSet', related_name='submitted_thing_set',
                                blank=True, null=True)

    def save(self, *args, **kwargs):
        is_new = (self.id == None)

        ret = super(SubmittedThing, self).save(*args, **kwargs)

        # All submitted things generate an action.
        activity = Activity()
        activity.action = 'create' if is_new else 'update'
        activity.data = self
        activity.save()

        return ret


class DataSet (models.Model):
    """
    A DataSet is a named collection of data, eg. Places, owned by a user,
    and intended for a coherent purpose, eg. display on a single map.
    """
    owner = models.ForeignKey(auth_models.User)
    display_name = models.CharField(max_length=128)
    short_name = models.SlugField(max_length=128)

    def __unicode__(self):
        return self.short_name

    class Meta:
        unique_together = (('owner', 'short_name'),
                           )


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
    A submission set is a collection of user Submissions attached to a place.
    For example, comments will be a submission set with a submission_type of
    'comment'.

    """
    place = models.ForeignKey(Place, related_name='submission_sets')
    submission_type = models.CharField(max_length=128)

    # TODO: require (place, submission_type) to be unique?


class Submission (SubmittedThing):
    """
    A Submission is the simplest flavor of SubmittedThing.
    It belongs to a SubmissionSet, and thus indirectly to a Place.
    Used for representing eg. comments, votes, ...
    """
    parent = models.ForeignKey(SubmissionSet, related_name='children')


class Activity (TimeStampedModel):
    """
    Metadata about SubmittedThings:
    what happened when.
    """
    action = models.CharField(max_length=16, default='create')
    data = models.ForeignKey(SubmittedThing)

    def save(self, *args, **kwargs):
        keys = cache.get('activity_keys') or set()
        keys.add('activity_keys')
        cache.delete_many(keys)

        return super(Activity, self).save(*args, **kwargs)

    @property
    def submitter_name(self):
        return self.data.submitter_name

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
