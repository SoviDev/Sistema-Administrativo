from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import TareaViewSet, HistorialTareaViewSet

# Crear el router principal
router = DefaultRouter()
router.register(r'', TareaViewSet, basename='tarea')

# Crear router anidado para el historial
tareas_router = routers.NestedDefaultRouter(router, r'', lookup='tarea')
tareas_router.register(r'historial', HistorialTareaViewSet, basename='tarea-historial')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tareas_router.urls)),
] 