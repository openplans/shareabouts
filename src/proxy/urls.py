from django.conf.urls import patterns, include, url
from .views import proxy_view

urlpatterns = patterns('',
    url(r'^(?P<url>.*)$', proxy_view, name='proxy'),
)
