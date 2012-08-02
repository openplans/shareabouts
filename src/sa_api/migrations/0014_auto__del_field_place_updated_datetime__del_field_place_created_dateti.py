# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Place.updated_datetime'
        db.delete_column('sa_api_place', 'updated_datetime')

        # Deleting field 'Place.created_datetime'
        db.delete_column('sa_api_place', 'created_datetime')

        # Deleting field 'Place.submitter_name'
        db.delete_column('sa_api_place', 'submitter_name')

        # Deleting field 'Place.data'
        db.delete_column('sa_api_place', 'data')

        # Deleting field 'Place.id'
        db.delete_column('sa_api_place', 'id')


        # Changing field 'Place.submittedthing_ptr'
        db.alter_column('sa_api_place', 'submittedthing_ptr_id', self.gf('django.db.models.fields.related.OneToOneField')(default=0, to=orm['sa_api.SubmittedThing'], unique=True, primary_key=True))
        # Deleting field 'Submission.updated_datetime'
        db.delete_column('sa_api_submission', 'updated_datetime')

        # Deleting field 'Submission.created_datetime'
        db.delete_column('sa_api_submission', 'created_datetime')

        # Deleting field 'Submission.submitter_name'
        db.delete_column('sa_api_submission', 'submitter_name')

        # Deleting field 'Submission.data'
        db.delete_column('sa_api_submission', 'data')

        # Deleting field 'Submission.id'
        db.delete_column('sa_api_submission', 'id')


        # Changing field 'Submission.submittedthing_ptr'
        db.alter_column('sa_api_submission', 'submittedthing_ptr_id', self.gf('django.db.models.fields.related.OneToOneField')(default=0, to=orm['sa_api.SubmittedThing'], unique=True, primary_key=True))

    def backwards(self, orm):
        # Adding field 'Place.updated_datetime'
        db.add_column('sa_api_place', 'updated_datetime',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now=True, default=datetime.datetime(2012, 8, 2, 0, 0), blank=True),
                      keep_default=False)

        # Adding field 'Place.created_datetime'
        db.add_column('sa_api_place', 'created_datetime',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2012, 8, 2, 0, 0), blank=True),
                      keep_default=False)

        # Adding field 'Place.submitter_name'
        db.add_column('sa_api_place', 'submitter_name',
                      self.gf('django.db.models.fields.CharField')(max_length=256, null=True, blank=True),
                      keep_default=False)

        # Adding field 'Place.data'
        db.add_column('sa_api_place', 'data',
                      self.gf('django.db.models.fields.TextField')(default='{}'),
                      keep_default=False)

        # Adding field 'Place.id'
        db.add_column('sa_api_place', 'id',
                      self.gf('django.db.models.fields.AutoField')(default=0, primary_key=True),
                      keep_default=False)


        # Changing field 'Place.submittedthing_ptr'
        db.alter_column('sa_api_place', 'submittedthing_ptr_id', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['sa_api.SubmittedThing'], unique=True, null=True))
        # Adding field 'Submission.updated_datetime'
        db.add_column('sa_api_submission', 'updated_datetime',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now=True, default=datetime.datetime(2012, 8, 2, 0, 0), blank=True),
                      keep_default=False)

        # Adding field 'Submission.created_datetime'
        db.add_column('sa_api_submission', 'created_datetime',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2012, 8, 2, 0, 0), blank=True),
                      keep_default=False)

        # Adding field 'Submission.submitter_name'
        db.add_column('sa_api_submission', 'submitter_name',
                      self.gf('django.db.models.fields.CharField')(max_length=256, null=True, blank=True),
                      keep_default=False)

        # Adding field 'Submission.data'
        db.add_column('sa_api_submission', 'data',
                      self.gf('django.db.models.fields.TextField')(default='{}'),
                      keep_default=False)

        # Adding field 'Submission.id'
        db.add_column('sa_api_submission', 'id',
                      self.gf('django.db.models.fields.AutoField')(default=0, primary_key=True),
                      keep_default=False)


        # Changing field 'Submission.submittedthing_ptr'
        db.alter_column('sa_api_submission', 'submittedthing_ptr_id', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['sa_api.SubmittedThing'], unique=True, null=True))

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
            'Meta': {'object_name': 'Place', '_ormbases': ['sa_api.SubmittedThing']},
            'location': ('django.contrib.gis.db.models.fields.PointField', [], {}),
            'submittedthing_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sa_api.SubmittedThing']", 'unique': 'True', 'primary_key': 'True'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'sa_api.submission': {
            'Meta': {'object_name': 'Submission', '_ormbases': ['sa_api.SubmittedThing']},
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'children'", 'to': "orm['sa_api.SubmissionSet']"}),
            'submittedthing_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['sa_api.SubmittedThing']", 'unique': 'True', 'primary_key': 'True'})
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