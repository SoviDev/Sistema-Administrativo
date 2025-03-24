from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = "usuarios"

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('registro/admin/', views.registro_admin, name='registro_admin'),
    path('usuarios/', views.lista_usuarios, name='lista_usuarios'),
    path('usuarios/<int:pk>/editar/', views.EditarUsuarioView.as_view(), name='editar_usuario'),
    path('usuarios/<int:pk>/desactivar/', views.desactivar_usuario, name='desactivar_usuario'),
    path('usuarios/<int:pk>/activar/', views.activar_usuario, name='activar_usuario'),
    path('usuarios/<int:pk>/restablecer-contrasena/', views.restablecer_contrasena, name='restablecer_contrasena'),
    path('departamentos/', views.lista_departamentos, name='lista_departamentos'),
    path('departamentos/crear/', views.CrearDepartamentoView.as_view(), name='crear_departamento'),
    path('departamentos/<int:departamento_id>/editar/', views.EditarDepartamentoView.as_view(), name='editar_departamento'),
    path('cambiar_contrasena/', auth_views.PasswordChangeView.as_view(
        template_name="usuarios/cambiar_contrasena.html",
        success_url="/"
    ), name='cambiar_contrasena'),
]
