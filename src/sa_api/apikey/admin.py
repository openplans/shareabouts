from django.contrib.admin import ModelAdmin
from django.contrib.gis import admin
from .models import ApiKey

from .forms import ApiKeyForm

class ApiKeyAdmin(ModelAdmin):
    form = ApiKeyForm
    list_display = ('key', 'user', 'logged_ip', 'last_used')

admin.site.register(ApiKey, ApiKeyAdmin)
