from django.urls import path
from .views import lista_usuarios, lista_departamentos, registro_admin, editar_usuario, editar_departamento, crear_departamento,restablecer_contrasena
from django.contrib.auth import views as auth_views

app_name = "usuarios"

urlpatterns = [
    path('usuarios/', lista_usuarios, name='lista_usuarios'),
    path('restablecer_contrasena/<int:usuario_id>/', restablecer_contrasena, name='restablecer_contrasena'),
    path('departamentos/', lista_departamentos, name='lista_departamentos'),
    path('departamentos/crear/', crear_departamento, name='crear_departamento'),
    path('registro/', registro_admin, name='registro_admin'),
    path('editar/<int:usuario_id>/', editar_usuario, name='editar_usuario'),
    path('departamentos/editar/<int:departamento_id>/', editar_departamento, name='editar_departamento'),
    path('cambiar_contrasena/', auth_views.PasswordChangeView.as_view(
        template_name="usuarios/cambiar_contrasena.html",  # 🔹 Sin prefijo "usuarios/"
        success_url="/"
    ), name='cambiar_contrasena'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),  # ✅ Agregar logout
    path('login/', auth_views.LoginView.as_view(template_name='usuarios/login.html'), name='login'),
]
