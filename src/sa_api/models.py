from django.contrib.contenttypes import generic
from django.contrib.gis.db import models
from django.core.cache import cache

class TimeStampedModel (models.Model):
    created_datetime = models.DateTimeField(auto_now_add=True)
    updated_datetime = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Place (TimeStampedModel):
    name = models.CharField(max_length=256, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    location = models.PointField()
    visible = models.BooleanField(default=True)
    location_type = models.CharField(max_length=100)

    submitter_name = models.CharField(max_length=256, null=True, blank=True)

    # TODO: Add reference to Votes
    # TODO: Add reference to comments

    objects = models.GeoManager()

    def save(self, *args, **kwargs):
        keys = cache.get('place_collection_keys') or set()
        keys.add('place_collection_keys')
        cache.delete_many(keys)

        r = super(Place, self).save(*args, **kwargs)

        activity = Activity()
        activity.data = self
        activity.save()

        return r

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
