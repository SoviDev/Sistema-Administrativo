from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django.db.models import Q
from ..models import Tarea, HistorialTarea
from .serializers import TareaSerializer, HistorialTareaSerializer

class TareaFilterSet(FilterSet):
    class Meta:
        model = Tarea
        fields = ['estado', 'departamento', 'asignado_a', 'creador']

class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TareaFilterSet
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_actualizacion', 'estado', 'fecha_completada']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        user = self.request.user
        departamento_id = self.request.query_params.get('departamento', None)
        historial = self.request.query_params.get('historial', False)
        
        base_queryset = Tarea.objects.select_related(
            'creador',
            'asignado_a',
            'departamento'
        )
        
        # Filtrar por acceso del usuario
        if not user.is_superuser:
            base_queryset = base_queryset.filter(
                Q(creador=user) | 
                Q(asignado_a=user) |
                Q(departamento=user.departamento)
            )

        # Filtrar por departamento si se especifica
        if departamento_id:
            if not user.is_superuser and user.departamento_id != int(departamento_id):
                return Tarea.objects.none()
            base_queryset = base_queryset.filter(departamento_id=departamento_id)

        # Filtrar por historial o tareas activas
        if historial or self.action == 'historial':
            return base_queryset.filter(estado__in=['completada', 'cancelada'])
        else:
            return base_queryset.exclude(estado__in=['completada', 'cancelada'])

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

    @action(detail=False, methods=['get'])
    def historial(self, request):
        """
        Endpoint para obtener las tareas completadas y canceladas
        """
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        
        # Ordenar por fecha de completado o actualización
        queryset = queryset.order_by('-fecha_completada', '-fecha_actualizacion')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class HistorialTareaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = HistorialTareaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HistorialTarea.objects.filter(tarea_id=self.kwargs['tarea_pk']) 