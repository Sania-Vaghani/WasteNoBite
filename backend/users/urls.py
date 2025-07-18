from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('protected/', views.protected_view, name='protected'),
    path('send-otp', views.send_otp, name='send_otp'),
]
