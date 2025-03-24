from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.views.generic import UpdateView, ListView, CreateView
from django.views.generic.edit import FormView
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.http import HttpResponseNotAllowed
from .models import CustomUser, Departamento, Privilegio, UsuarioPrivilegio
from django.contrib.auth import login, logout, authenticate, get_user_model
import random
import string
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    UserSerializer, DepartamentoSerializer, PrivilegioSerializer,
    UserPrivilegioSerializer
)
from rest_framework import viewsets, status

User = get_user_model()

def index(request):
    if request.user.is_authenticated:
        if request.user.is_superuser:
            return redirect('admin:index')
        elif request.user.es_admin:
            return redirect('tareas:pendientes')
        else:
            return redirect('tareas:pendientes')
    return redirect('usuarios:login')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('/')
        else:
            messages.error(request, '⚠️ Usuario o contraseña incorrectos')
    return render(request, 'usuarios/login.html')

def logout_view(request):
    logout(request)
    return redirect('usuarios:login')

@login_required
def lista_usuarios(request):
    usuarios = CustomUser.objects.select_related('departamento').all()
    return render(request, 'usuarios/admin_usuarios.html', {'usuarios': usuarios})

class EditarUsuarioView(LoginRequiredMixin, UpdateView):
    model = CustomUser
    template_name = 'usuarios/editar_usuario.html'
    fields = ['username', 'email', 'telefono', 'departamento']
    success_url = reverse_lazy('usuarios:lista_usuarios')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['departamentos'] = Departamento.objects.all()
        return context

    def form_valid(self, form):
        if self.request.user.is_superuser:
            form.instance.is_superuser = 'es_admin' in self.request.POST
        messages.success(self.request, "✅ Usuario actualizado correctamente.")
        return super().form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, "⚠️ Error al actualizar el usuario.")
        return super().form_invalid(form)

@login_required
def desactivar_usuario(request, pk):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    usuario = get_object_or_404(CustomUser, pk=pk)
    usuario.is_active = False
    usuario.save()
    messages.success(request, f'Usuario {usuario.username} desactivado correctamente')
    return redirect('usuarios:lista_usuarios')

@login_required
def activar_usuario(request, pk):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    usuario = get_object_or_404(CustomUser, pk=pk)
    usuario.is_active = True
    usuario.save()
    messages.success(request, f'Usuario {usuario.username} activado correctamente')
    return redirect('usuarios:lista_usuarios')

@login_required
def restablecer_contrasena(request, pk):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    
    usuario = get_object_or_404(CustomUser, pk=pk)
    nueva_contrasena = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    usuario.set_password(nueva_contrasena)
    usuario.save()
    
    messages.success(
        request, 
        f'Contraseña restablecida para {usuario.username}. Nueva contraseña: {nueva_contrasena}'
    )
    return redirect('usuarios:lista_usuarios')

@login_required
def registro_admin(request):
    if not request.user.is_superuser:
        messages.error(request, '⚠️ No tienes permisos para registrar usuarios')
        return redirect('/')
        
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        departamento_id = request.POST.get('departamento')
        es_admin = request.POST.get('es_admin') == 'on'
        
        try:
            departamento = None
            if departamento_id:
                departamento = Departamento.objects.get(id=departamento_id)
                
            usuario = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                departamento=departamento,
                is_superuser=es_admin,
                is_staff=es_admin
            )
            
            messages.success(request, '✅ Usuario creado correctamente')
            return redirect('usuarios:lista_usuarios')
        except Exception as e:
            messages.error(request, f'⚠️ Error al crear el usuario: {str(e)}')
    
    departamentos = Departamento.objects.all()
    return render(request, 'usuarios/registro_admin.html', {'departamentos': departamentos})

@login_required
def lista_departamentos(request):
    departamentos = Departamento.objects.all()
    return render(request, 'usuarios/lista_departamentos.html', {'departamentos': departamentos})

@login_required
def crear_departamento(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        try:
            Departamento.objects.create(nombre=nombre)
            messages.success(request, '✅ Departamento creado correctamente')
            return redirect('usuarios:lista_departamentos')
        except Exception as e:
            messages.error(request, f'⚠️ Error al crear el departamento: {str(e)}')
    
    return render(request, 'usuarios/crear_departamento.html')

@login_required
def editar_departamento(request, departamento_id):
    departamento = get_object_or_404(Departamento, pk=departamento_id)
    
    if request.method == 'POST':
        nombre = request.POST.get('nombre')
        try:
            departamento.nombre = nombre
            departamento.save()
            messages.success(request, '✅ Departamento actualizado correctamente')
            return redirect('usuarios:lista_departamentos')
        except Exception as e:
            messages.error(request, f'⚠️ Error al actualizar el departamento: {str(e)}')
    
    return render(request, 'usuarios/editar_departamento.html', {'departamento': departamento})

class EditarDepartamentoView(LoginRequiredMixin, UpdateView):
    model = Departamento
    template_name = 'usuarios/editar_departamento.html'
    fields = ['nombre']
    success_url = reverse_lazy('usuarios:lista_departamentos')
    pk_url_kwarg = 'departamento_id'

    def form_valid(self, form):
        messages.success(self.request, "✅ Departamento actualizado correctamente.")
        return super().form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, "⚠️ Error al actualizar el departamento.")
        return super().form_invalid(form)

class CrearDepartamentoView(LoginRequiredMixin, CreateView):
    model = Departamento
    template_name = 'usuarios/crear_departamento.html'
    fields = ['nombre']
    success_url = reverse_lazy('usuarios:lista_departamentos')

    def form_valid(self, form):
        messages.success(self.request, "✅ Departamento creado correctamente.")
        return super().form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, "⚠️ Error al crear el departamento.")
        return super().form_invalid(form)

class PrivilegioViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar privilegios disponibles
    """
    queryset = Privilegio.objects.all()
    serializer_class = PrivilegioSerializer
    permission_classes = [IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar usuarios
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtrar usuarios según los privilegios del usuario actual
        """
        user = self.request.user
        if user.es_admin or user.is_superuser:
            return CustomUser.objects.all()
        return CustomUser.objects.none()

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """
        Activar/desactivar usuario
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Restablecer contraseña
        """
        user = self.get_object()
        temp_password = 'temporal123'  # En producción, usar algo más seguro
        user.set_password(temp_password)
        user.save()
        return Response({
            'status': 'success',
            'temp_password': temp_password
        })

    @action(detail=True, methods=['post'])
    def toggle_privilege(self, request, pk=None):
        """
        Activar/desactivar un privilegio para un usuario en un departamento específico
        """
        user = self.get_object()
        privilegio_id = request.data.get('privilegio_id')
        departamento_id = request.data.get('departamento_id')

        try:
            privilegio = Privilegio.objects.get(id=privilegio_id)
            departamento = Departamento.objects.get(id=departamento_id)
        except (Privilegio.DoesNotExist, Departamento.DoesNotExist):
            return Response(
                {'error': 'Privilegio o departamento no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Intentar obtener el privilegio existente
        user_privilege = UsuarioPrivilegio.objects.filter(
            usuario=user,
            privilegio=privilegio,
            departamento=departamento
        ).first()

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
        return Response(serializer.data)

class DepartamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar departamentos
    """
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filtrar departamentos según los privilegios del usuario actual
        """
        user = self.request.user
        if user.es_admin or user.is_superuser:
            return Departamento.objects.all()
        return user.departamentos_acceso.all()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Vista para obtener los datos del usuario autenticado
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)