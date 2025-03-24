from rest_framework import serializers
from ..models import Tarea, HistorialTarea

class TareaSerializer(serializers.ModelSerializer):
    creador_nombre = serializers.CharField(source='creador.username', read_only=True)
    asignado_nombre = serializers.CharField(source='asignado_a.username', read_only=True, allow_null=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Tarea
        fields = [
            'id', 'titulo', 'descripcion', 'estado', 'estado_display',
            'progreso', 'creador', 'creador_nombre', 'departamento',
            'departamento_nombre', 'asignado_a', 'asignado_nombre',
            'fecha_creacion', 'fecha_actualizacion', 'fecha_completada'
        ]
        read_only_fields = ['creador', 'fecha_creacion', 'fecha_actualizacion', 'fecha_completada']

class HistorialTareaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)

    class Meta:
        model = HistorialTarea
        fields = ['id', 'tarea', 'usuario', 'usuario_nombre', 'accion', 'fecha_hora']
        read_only_fields = ['tarea', 'usuario', 'fecha_hora'] 