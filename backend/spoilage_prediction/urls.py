from django.urls import path
from . import views 

urlpatterns = [
    path('predict/', views.predict_spoilage, name='predict_spoilage'),
    path('expiring-items/', views.expiring_items, name='expiring_items'),
]
