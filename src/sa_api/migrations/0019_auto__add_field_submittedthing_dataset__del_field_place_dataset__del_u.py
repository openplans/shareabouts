# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Removing unique constraint on 'DataSet', fields ['short_name']
        db.delete_unique('sa_api_dataset', ['short_name'])

        # Adding field 'SubmittedThing.dataset'
        db.add_column('sa_api_submittedthing', 'dataset',
                      self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='submitted_thing_set', null=True, to=orm['sa_api.DataSet']),
                      keep_default=False)

        # Deleting field 'Place.dataset'
        db.delete_column('sa_api_place', 'dataset_id')

        # Adding unique constraint on 'DataSet', fields ['owner', 'short_name']
        db.create_unique('sa_api_dataset', ['owner_id', 'short_name'])


    def backwards(self, orm):
        # Removing unique constraint on 'DataSet', fields ['owner', 'short_name']
        db.delete_unique('sa_api_dataset', ['owner_id', 'short_name'])

        # Deleting field 'SubmittedThing.dataset'
        db.delete_column('sa_api_submittedthing', 'dataset_id')

        # Adding field 'Place.dataset'
        db.add_column('sa_api_place', 'dataset',
                      self.gf('django.db.models.fields.related.ForeignKey')(related_name='place_set', null=True, to=orm['sa_api.DataSet'], blank=True),
                      keep_default=False)

        # Adding unique constraint on 'DataSet', fields ['short_name']
        db.create_unique('sa_api_dataset', ['short_name'])


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
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
            'data': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['sa_api.SubmittedThing']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        },
        'sa_api.dataset': {
            'Meta': {'unique_together': "(('owner', 'short_name'),)", 'object_name': 'DataSet'},
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'short_name': ('django.db.models.fields.SlugField', [], {'max_length': '128'})
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
            'dataset': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'submitted_thing_set'", 'null': 'True', 'to': "orm['sa_api.DataSet']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'submitter_name': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True', 'blank': 'True'}),
            'updated_datetime': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['sa_api']