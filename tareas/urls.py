from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # Página de inicio
    path('login/', auth_views.LoginView.as_view(template_name='tareas/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('configuracion/', views.configuracion, name='configuracion'),
    path('registro/', views.registro_admin, name='registro_admin'),
    path('cambiar_contrasena/', auth_views.PasswordChangeView.as_view(template_name='tareas/cambiar_contrasena.html', success_url='/'), name='cambiar_contrasena'),
    path('obtener-usuarios/', views.obtener_usuarios_por_departamento, name='obtener_usuarios'),
    
    # Tareas
    path('tareas/pendientes/', views.tareas_pendientes, name='tareas_pendientes'),
    path('tareas/historico/', views.tareas_historico, name='tareas_historico'),
    path('tareas/nueva/', views.tareas_nueva, name='tareas_nueva'),
    path('tareas/editar/<int:tarea_id>/', views.tarea_editar, name='tarea_editar'),
    path('tareas/completar/<int:tarea_id>/', views.completar_tarea, name='completar_tarea'),
]



