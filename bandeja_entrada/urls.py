from django.urls import path
from . import views

app_name = 'bandeja_entrada'

urlpatterns = [
    path('', views.bandeja_entrada, name='bandeja_entrada'),
    path('nuevo/', views.nuevo_correo, name='nuevo_correo'),
    path('<int:correo_id>/', views.detalle_correo, name='detalle_correo'),
    path('<int:correo_id>/responder/', views.responder_correo, name='responder_correo'),
    path('<int:correo_id>/asignar/', views.asignar_correo, name='asignar_correo'),
    path('<int:correo_id>/trasladar/', views.trasladar_correo, name='trasladar_correo'),
    path('<int:correo_id>/cambiar_estado/', views.cambiar_estado, name='cambiar_estado'),
    path('archivados/', views.correos_archivados, name='correos_archivados'),
    path('asignados/', views.correos_asignados, name='correos_asignados'),
] 