from django.contrib.gis.db import models

class Place (models.Model):
    name = models.CharField(max_length=256, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    location = models.PointField()
    visible = models.BooleanField(default=True)
    location_type = models.CharField(max_length=100)

    # TODO: Add submitter information
    # TODO: Add reference to Votes
    # TODO: Add reference to comments

    objects = models.GeoManager()
