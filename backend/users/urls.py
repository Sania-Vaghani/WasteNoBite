from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('protected/', views.protected_view, name='protected'),
    path('send-otp', views.send_otp, name='send_otp'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('verify_otp', views.verify_otp, name='verify_otp'),
]
