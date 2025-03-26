from rest_framework import serializers
from .models import Tarea, HistorialTarea
from usuarios.models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'departamento']

class HistorialTareaSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True, allow_null=True)
    
    class Meta:
        model = HistorialTarea
        fields = [
            'id', 'tarea', 'usuario', 'usuario_nombre',
            'accion', 'fecha_hora'
        ]
        read_only_fields = ['tarea', 'usuario', 'fecha_hora']

class TareaSerializer(serializers.ModelSerializer):
    creador = UserSerializer(read_only=True)
    asignado_a = UserSerializer(read_only=True)
    asignado_a_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        source='asignado_a',
        write_only=True,
        required=False,
        allow_null=True
    )
    creador_nombre = serializers.CharField(source='creador.username', read_only=True)
    asignado_nombre = serializers.CharField(source='asignado_a.username', read_only=True, allow_null=True)
    departamento_nombre = serializers.CharField(source='departamento.nombre', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    historial = HistorialTareaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Tarea
        fields = [
            'id', 'titulo', 'descripcion', 'estado', 'estado_display',
            'progreso', 'creador', 'creador_nombre', 'departamento',
            'departamento_nombre', 'asignado_a', 'asignado_a_id', 'asignado_nombre',
            'fecha_creacion', 'fecha_actualizacion', 'fecha_completada',
            'historial'
        ]
        read_only_fields = ['creador', 'fecha_creacion', 'fecha_actualizacion', 'fecha_completada']

    def create(self, validated_data):
        validated_data['creador'] = self.context['request'].user
        return super().create(validated_data) 