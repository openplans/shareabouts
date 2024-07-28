from django.urls import path, re_path

from . import views
from sa_login import views as login_views

urlpatterns = [
    path('api/<path>', views.api, name='api_proxy'),
    path('users/<path>', views.users, name='auth_proxy'),
    path('download/<path>.csv', views.csv_download, name='csv_proxy'),
    path('place/<place_id>', views.index, name='place'),
    path('login/', login_views.login, name='login'),
    re_path(r'^', views.index, name='index'),
]
