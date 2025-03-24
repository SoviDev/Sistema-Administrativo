from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, DepartamentoViewSet, PrivilegioViewSet,
    me, login
)

# Crear el router para las rutas automáticas
router = DefaultRouter()
router.register('usuarios', UserViewSet, basename='usuario')
router.register('departamentos', DepartamentoViewSet, basename='departamento')
router.register('privilegios', PrivilegioViewSet, basename='privilegio')

# URLs adicionales que no son manejadas por el router
urlpatterns = [
    path('me/', me, name='me'),  # Endpoint para obtener el usuario actual
    path('login/', login, name='login'),  # Endpoint personalizado para login
    path('', include(router.urls)),  # Incluir las URLs generadas por el router
] 