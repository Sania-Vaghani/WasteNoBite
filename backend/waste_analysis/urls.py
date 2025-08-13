from django.urls import path
from . import views

app_name = 'waste_analysis'

urlpatterns = [
    path('distribution/', views.waste_distribution, name='waste_distribution'),
    path('trends/', views.waste_trends, name='waste_trends'),
    path('item-analysis/', views.item_analysis, name='item_analysis'),
    path('recommendations/', views.waste_recommendations, name='waste_recommendations'),
    path('cost-analysis/', views.cost_analysis, name='cost_analysis'),
    path('summary/', views.waste_summary, name='waste_summary'),
    path('generate-report/', views.generate_report, name='generate_report'),
]
