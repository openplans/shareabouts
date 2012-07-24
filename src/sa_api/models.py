from django.contrib.gis.db import models


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
