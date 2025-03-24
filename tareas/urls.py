from django.urls import path
from . import views

app_name = "tareas"

urlpatterns = [
    path('', views.home, name='home'),  # Página de inicio
    path('pendientes/', views.tareas_pendientes, name='pendientes'),
    path('historico/', views.tareas_historico, name='historico'),
    path('historial/<int:tarea_id>/', views.historial_tarea, name='historial'),
    path('nueva/', views.tareas_nueva, name='nueva'),
    path('editar/<int:tarea_id>/', views.tarea_editar, name='editar'),
    path('completar/<int:tarea_id>/', views.tarea_completar, name='completar'),
    path('api/usuarios-departamento/<int:depto_id>/', views.usuarios_por_departamento, name='usuarios_departamento'),
    path('tarea/<int:tarea_id>/observacion/', views.agregar_observacion, name='agregar_observacion'),
]
