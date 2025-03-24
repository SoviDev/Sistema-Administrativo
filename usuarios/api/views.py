from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
import string
import random
from ..models import Departamento, Privilegio, UsuarioPrivilegio
from ..serializers import (
    UserSerializer, DepartamentoSerializer, PrivilegioSerializer,
    UserPrivilegioSerializer
)
from .permissions import IsAdminOrSuperUser, IsAdminOrSuperUserOrReadOnly

User = get_user_model()

def generate_temp_password(length=12):
    """
    Genera una contraseña temporal segura
    """
    characters = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = ''.join(random.choice(characters) for i in range(length))
        # Verificar que la contraseña cumple con los requisitos mínimos
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in string.punctuation for c in password)):
            return password

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Obtener datos del usuario actual
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint personalizado para login que verifica si el usuario debe cambiar su contraseña
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'status': 'error',
            'message': 'Se requieren usuario y contraseña'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({
            'status': 'error',
            'message': 'Credenciales inválidas'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'status': 'error',
            'message': 'Usuario inactivo'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generar tokens
    refresh = RefreshToken.for_user(user)
    
    # Serializar datos del usuario
    user_data = UserSerializer(user).data
    
    response_data = {
        'status': 'success',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'debe_cambiar_password': user.debe_cambiar_password,
        'user': user_data
    }
    
    return Response(response_data)

class PrivilegioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar privilegios.
    Permite consultar y modificar privilegios de usuarios.
    """
    queryset = Privilegio.objects.all().order_by('id')
    serializer_class = PrivilegioSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperUser]

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def asignar_privilegios(self, request):
        """
        Asignar privilegios a un usuario.
        
        Params:
            user_id: ID del usuario
            privilegios: Lista de IDs de privilegios a asignar
        """
        try:
            user_id = request.data.get('user_id')
            privilegios_ids = request.data.get('privilegios', [])
            
            if not user_id:
                return Response(
                    {'error': 'Se requiere user_id'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            user = User.objects.get(id=user_id)
            
            # Eliminar privilegios existentes
            UsuarioPrivilegio.objects.filter(usuario=user).delete()
            
            # Asignar nuevos privilegios
            privilegios_asignados = []
            for priv_id in privilegios_ids:
                privilegio = Privilegio.objects.get(id=priv_id)
                usuario_privilegio = UsuarioPrivilegio.objects.create(
                    usuario=user,
                    privilegio=privilegio
                )
                privilegios_asignados.append(usuario_privilegio)
            
            # Serializar y devolver resultado
            serializer = UserPrivilegioSerializer(privilegios_asignados, many=True)
            return Response(
                {
                    'status': 'success',
                    'message': 'Privilegios asignados correctamente',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Privilegio.DoesNotExist:
            return Response(
                {'error': 'Uno o más privilegios no encontrados'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar usuarios
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperUser]

    def get_queryset(self):
        """
        Filtrar usuarios según los privilegios del usuario actual
        """
        user = self.request.user
        if user.es_admin or user.is_superuser:
            return User.objects.all().order_by('username')
        return User.objects.none()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Activar/desactivar usuario
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Restablecer contraseña
        """
        try:
            user = self.get_object()
            # Generar contraseña temporal
            temp_password = ''.join(
                random.choice(string.ascii_letters + string.digits + string.punctuation)
                for _ in range(12)
            )
            
            # Asegurar que cumple con los requisitos mínimos
            if not (any(c.islower() for c in temp_password) and
                   any(c.isupper() for c in temp_password) and
                   any(c.isdigit() for c in temp_password) and
                   any(c in string.punctuation for c in temp_password)):
                # Si no cumple, agregar caracteres faltantes
                temp_password = (
                    random.choice(string.ascii_lowercase) +
                    random.choice(string.ascii_uppercase) +
                    random.choice(string.digits) +
                    random.choice(string.punctuation) +
                    temp_password[:8]  # Mantener solo los primeros 8 caracteres
                )
            
            print(f"Generated temp password: {temp_password}")
            
            # Actualizar la contraseña y marcar que debe cambiarla
            user.password = make_password(temp_password)
            user.debe_cambiar_password = True
            user.save(update_fields=['password', 'debe_cambiar_password'])
            
            response_data = {
                'status': 'success',
                'message': 'Contraseña restablecida correctamente',
                'temp_password': temp_password
            }
            print(f"Response data: {response_data}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in reset_password: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Error al restablecer la contraseña: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def toggle_privilege(self, request, pk=None):
        """
        Activar/desactivar un privilegio para un usuario en un departamento específico
        """
        user = self.get_object()
        privilegio_id = request.data.get('privilegio_id')
        departamento_id = request.data.get('departamento_id')

        if not privilegio_id or not departamento_id:
            return Response(
                {
                    'error': 'Se requieren privilegio_id y departamento_id',
                    'message': 'Por favor, proporcione todos los campos requeridos'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            privilegio = Privilegio.objects.get(id=privilegio_id)
            departamento = Departamento.objects.get(id=departamento_id)
        except (Privilegio.DoesNotExist, Departamento.DoesNotExist) as e:
            return Response(
                {
                    'error': 'Privilegio o departamento no encontrado',
                    'message': str(e),
                    'details': {
                        'privilegio_id': privilegio_id,
                        'departamento_id': departamento_id
                    }
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Intentar obtener el privilegio existente
            user_privilege = UsuarioPrivilegio.objects.filter(
                usuario=user,
                privilegio=privilegio,
                departamento=departamento
            ).first()

            action_taken = 'removido' if user_privilege else 'agregado'

            if user_privilege:
                # Si existe, eliminarlo
                user_privilege.delete()
            else:
                # Si no existe, crearlo
                UsuarioPrivilegio.objects.create(
                    usuario=user,
                    privilegio=privilegio,
                    departamento=departamento
                )

            # Refrescar el usuario para obtener los privilegios actualizados
            user.refresh_from_db()
            serializer = self.get_serializer(user)
            
            return Response({
                'status': 'success',
                'message': f'Privilegio {action_taken} correctamente',
                'action': action_taken,
                'details': {
                    'privilegio': privilegio.nombre,
                    'departamento': departamento.nombre,
                    'usuario': user.username
                },
                **serializer.data
            })

        except Exception as e:
            return Response(
                {
                    'error': 'Error al procesar la solicitud',
                    'message': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """
        Cambiar contraseña del usuario
        """
        try:
            user = self.get_object()
            old_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            
            # Validar que se proporcionaron las contraseñas
            if not old_password or not new_password:
                return Response({
                    'status': 'error',
                    'message': 'Se requieren la contraseña actual y la nueva'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar la contraseña actual
            if not user.check_password(old_password):
                return Response({
                    'status': 'error',
                    'message': 'La contraseña actual es incorrecta'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Actualizar la contraseña
            user.set_password(new_password)
            user.debe_cambiar_password = False
            user.save(update_fields=['password', 'debe_cambiar_password'])
            
            return Response({
                'status': 'success',
                'message': 'Contraseña actualizada correctamente'
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Error al cambiar la contraseña: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DepartamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar departamentos
    """
    queryset = Departamento.objects.all().order_by('nombre')
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSuperUserOrReadOnly]

    def get_queryset(self):
        """
        Filtrar departamentos según los privilegios del usuario actual
        """
        user = self.request.user
        if user.es_admin or user.is_superuser:
            return Departamento.objects.all().order_by('nombre')
        return user.departamentos_acceso.all().order_by('nombre')

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Activar/desactivar departamento
        """
        departamento = self.get_object()
        departamento.is_active = not departamento.is_active
        departamento.save()
        serializer = self.get_serializer(departamento)
        return Response({
            'status': 'success',
            'message': f'Departamento {"activado" if departamento.is_active else "desactivado"} correctamente',
            'data': serializer.data
        }) 