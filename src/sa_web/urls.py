from django.urls import path, re_path

from . import views
from sa_login import views as login_views

urlpatterns = [
    re_path(r'^api/(.*)$', views.api, name='api_proxy'),
    re_path(r'^users/(.*)$', views.users, name='auth_proxy'),
    re_path('^download/(.*)$.csv', views.csv_download, name='csv_proxy'),
    path('place/<place_id>', views.index, name='place'),
    path('login/', login_views.login, name='login'),
    re_path(r'^', views.index, name='index'),
]
