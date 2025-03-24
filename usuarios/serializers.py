from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Departamento, Privilegio, UsuarioPrivilegio

User = get_user_model()

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = ['id', 'nombre', 'tiene_bandeja', 'servidor_entrante', 'servidor_saliente', 
                 'puerto_entrante', 'puerto_saliente', 'usuario_correo', 'password_correo', 
                 'usar_tls', 'is_active']

class PrivilegioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Privilegio
        fields = ['id', 'codigo', 'nombre']

class UserPrivilegioSerializer(serializers.ModelSerializer):
    privilegio = PrivilegioSerializer()
    departamento = DepartamentoSerializer()

    class Meta:
        model = UsuarioPrivilegio
        fields = ['privilegio', 'departamento']

class UserSerializer(serializers.ModelSerializer):
    departamentos_acceso = DepartamentoSerializer(many=True, read_only=True)
    privilegios = UserPrivilegioSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'telefono',
            'es_admin', 'is_active', 'is_superuser', 'ultimo_ingreso',
            'departamentos_acceso', 'privilegios'
        ]
        
    def update(self, instance, validated_data):
        departamentos_ids = self.initial_data.get('departamentos_acceso', [])
        instance = super().update(instance, validated_data)
        
        if departamentos_ids:
            instance.departamentos_acceso.set(departamentos_ids)
            
        return instance 