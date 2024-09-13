from django.urls import path
from . import views


urlpatterns = [
    path('', views.admin_home, name='admin_home'),
    path('detail/<int:place_id>/', views.place_detail, name='admin_detail'),
]
