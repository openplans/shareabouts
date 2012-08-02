# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import DataMigration
from django.db import models

class Migration(DataMigration):

    def forwards(self, orm):
        "Write your forwards methods here."

        SubmittedThing = orm['sa_api.SubmittedThing']
        Place = orm['sa_api.Place']
        Submission = orm['sa_api.Submission']

        for place in Place.objects.all():
            submittedthing = SubmittedThing()
            submittedthing.created_datetime = place.created_datetime
            submittedthing.updated_datetime = place.updated_datetime
            submittedthing.submitter_name = place.submitter_name
            submittedthing.data = place.data
            submittedthing.save()

            place.submittedthing_ptr = submittedthing
            place.save()

        for submission in Submission.objects.all():
            submittedthing = SubmittedThing()
            submittedthing.created_datetime = submission.created_datetime
            submittedthing.updated_datetime = submission.updated_datetime
            submittedthing.submitter_name = submission.submitter_name
            submittedthing.data = submission.data
            submittedthing.save()

            submission.submittedthing_ptr = submittedthing
            submission.save()

    def backwards(self, orm):
        "Write your backwards methods here."

        SubmittedThing = orm['sa_api.SubmittedThing']
        Place = orm['sa_api.Place']
        Submission = orm['sa_api.Submission']

        for place in Place.objects.all():
            place.created_datetime = place.submittedthing_ptr.created_datetime
            place.updated_datetime = place.submittedthing_ptr.updated_datetime
            place.submitter_name = place.submittedthing_ptr.submitter_name
            place.data = place.submittedthing_ptr.data
            place.save()

        for submission in Submission.objects.all():
            submission.created_datetime = submission.submittedthing_ptr.created_datetime
            submission.updated_datetime = submission.submittedthing_ptr.updated_datetime
            submission.submitter_name = submission.submittedthing_ptr.submitter_name
            submission.data = submission.submittedthing_ptr.data
            submission.save()

    models = {
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'sa_api.activity': {
            'Meta': {'object_name': 'Activity'},
            'action': ('django.db.models.fields.CharField', [], {'default': "'create'", 'max_length': '16'}),
            'created_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data_content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'data_object_id': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'sa_api.place': {
            'Meta': {'object_name': 'Place'},
            'created_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.TextField', [], {'default': "'{}'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.contrib.gis.db.models.fields.PointField', [], {}),
            'submittedthing_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sa_api.SubmittedThing']", 'unique': 'True', 'null': 'True'}),
            'submitter_name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True', 'blank': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'sa_api.submission': {
            'Meta': {'object_name': 'Submission'},
            'created_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.TextField', [], {'default': "'{}'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'children'", 'to': "orm['sa_api.SubmissionSet']"}),
            'submittedthing_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sa_api.SubmittedThing']", 'unique': 'True', 'null': 'True'}),
            'submitter_name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True', 'blank': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'sa_api.submissionset': {
            'Meta': {'object_name': 'SubmissionSet'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'place': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'submission_sets'", 'to': "orm['sa_api.Place']"}),
            'submission_type': ('django.db.models.fields.CharField', [], {'max_length': '128'})
        },
        'sa_api.submittedthing': {
            'Meta': {'object_name': 'SubmittedThing'},
            'created_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.TextField', [], {'default': "'{}'"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'submitter_name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True', 'blank': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['sa_api']
    symmetrical = True
