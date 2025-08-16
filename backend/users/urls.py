from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('protected/', views.protected_view, name='protected'),
    path('send-otp', views.send_otp, name='send_otp'),
    path('reset_password', views.reset_password, name='reset_password'),
    path('verify_otp', views.verify_otp, name='verify_otp'),
    path('predict-category-sales/', views.predict_category_sales, name='predict_category_sales'),
    path('upcoming-expirations/', views.upcoming_expirations_view, name='upcoming_expirations'),
    path('inventory-levels/', views.get_inventory_levels, name='get_inventory_levels'),
    path('inventory-items/', views.get_inventory_items, name='get_inventory_items'),
    path('inventory-items/usage/', views.add_inventory_usage, name='add_inventory_usage'),
]
