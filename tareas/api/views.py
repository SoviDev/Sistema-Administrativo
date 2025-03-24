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
    ordering_fields = ['fecha_creacion', 'fecha_actualizacion', 'estado']
    ordering = ['-fecha_creacion']

    def get_queryset(self):
        user = self.request.user
        departamento_id = self.request.query_params.get('departamento', None)
        base_queryset = Tarea.objects.all()
        
        if not user.is_superuser:
            if departamento_id:
                # Si se especifica un departamento, verificar que el usuario tenga acceso
                if user.departamento_id == int(departamento_id):
                    base_queryset = base_queryset.filter(departamento_id=departamento_id)
                else:
                    # Si el usuario no tiene acceso al departamento solicitado, devolver queryset vacío
                    return Tarea.objects.none()
            else:
                # Si no se especifica departamento, mostrar todas las tareas a las que tiene acceso
                base_queryset = base_queryset.filter(
                    Q(creador=user) | 
                    Q(asignado_a=user) |
                    Q(departamento=user.departamento)
                )

        elif departamento_id:
            # Si es superusuario y se especifica departamento, filtrar por ese departamento
            base_queryset = base_queryset.filter(departamento_id=departamento_id)

        # Por defecto, mostrar solo tareas activas
        if self.action != 'historial':
            return base_queryset.exclude(estado__in=['completada', 'cancelada'])
        
        return base_queryset

    def perform_create(self, serializer):
        serializer.save(creador=self.request.user)

    @action(detail=False, methods=['get'])
    def historial(self, request):
        """
        Endpoint para obtener las tareas completadas y canceladas
        """
        queryset = self.get_queryset().filter(estado__in=['completada', 'cancelada'])
        queryset = self.filter_queryset(queryset)
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