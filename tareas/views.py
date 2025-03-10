from django.contrib.auth import get_user_model, login
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from .forms import CustomUserCreationForm, TareaForm, TareaEditForm, RegistroAdminForm, CustomUser
from .models import HistorialTarea, Departamento, Tarea
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect
import json
from datetime import timedelta, datetime
from django.utils.timezone import now
from django.db.models import Q
from django.contrib import messages


usuario = get_user_model()  # 🔹 Obtener el modelo de usuario extendido
def es_superusuario(user):
    return user.is_superuser

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'tareas/register.html', {'form': form})

def home(request):
    return render(request, 'tareas/home.html')

@login_required
def configuracion(request):
    return render(request, 'tareas/configuracion.html')

@login_required
def tareas_pendientes(request):
    return render(request, 'tareas/tareas_pendientes.html')

@login_required
def tareas_historico(request):
    return render(request, 'tareas/tareas_historico.html')

@login_required
def tareas_nueva(request):
    return render(request, 'tareas/tareas_nueva.html')

@login_required
def tareas_nueva(request):
    if request.method == 'POST':
        form = TareaForm(request.POST, usuario=request.user)
        if form.is_valid():
            nueva_tarea = form.save(commit=False)
            nueva_tarea.creador = request.user  # Registrar quién la creó
            if not nueva_tarea.departamento:
                nueva_tarea.asignado_a = request.user  # Si no hay departamento, es tarea propia
            nueva_tarea.save()

            # Guardar en el historial
            HistorialTarea.objects.create(
                tarea=nueva_tarea,
                usuario=request.user,
                accion=f"Tarea creada por {request.user.username}"
            )

            return redirect('tareas_pendientes')  # Redirigir a la lista de tareas pendientes
    else:
        form = TareaForm(usuario=request.user)

    return render(request, 'tareas/tareas_nueva.html', {'form': form})

@login_required
def tareas_pendientes(request):
    usuario = request.user
    if usuario.is_superuser:
        departamentos = Departamento.objects.all()
        tareas_por_departamento = {
            depto.nombre: [
                {'tarea': tarea, 'puede_editar': tarea.puede_editar(usuario)}
                for tarea in Tarea.objects.filter(departamento=depto, estado="pendiente").order_by("fecha_creacion")
            ]
            for depto in departamentos
        }

        tareas_propias_admin = Tarea.objects.filter(
            creador_id=usuario.id, departamento__isnull=True, estado="pendiente"
        ).order_by("fecha_creacion")
        tareas_propias_admin = [{'tarea': t, 'puede_editar': t.puede_editar(usuario)} for t in tareas_propias_admin]

        return render(request, 'tareas/tareas_pendientes.html', {
            'tareas_por_departamento': tareas_por_departamento,
            'tareas_propias_admin': tareas_propias_admin,
            'es_admin': True
        })

    else:
        if not hasattr(usuario, 'departamento') or usuario.departamento is None:
            raise PermissionDenied("No tienes un departamento asignado.")

        tareas_propias = Tarea.objects.filter(
            creador_id=usuario.id, departamento__isnull=True, estado="pendiente"
        ).order_by("fecha_creacion")

        tareas_asignadas = Tarea.objects.filter(asignado_a_id=usuario.id, estado="pendiente").order_by("fecha_creacion")

        tareas_sin_asignar = Tarea.objects.filter(
            departamento_id=usuario.departamento.id, asignado_a__isnull=True, estado="pendiente"
        ).order_by("fecha_creacion")

        tareas_propias = [{'tarea': t, 'puede_editar': t.puede_editar(usuario)} for t in tareas_propias]
        tareas_asignadas = [{'tarea': t, 'puede_editar': t.puede_editar(usuario)} for t in tareas_asignadas]
        tareas_sin_asignar = [{'tarea': t, 'puede_editar': t.puede_editar(usuario)} for t in tareas_sin_asignar]

        return render(request, 'tareas/tareas_pendientes.html', {
            'tareas_propias': tareas_propias,
            'tareas_asignadas': tareas_asignadas,
            'tareas_sin_asignar': tareas_sin_asignar,
            'es_admin': False
        })

@login_required
def tarea_editar(request, tarea_id):
    tarea = get_object_or_404(Tarea, id=tarea_id)

    # Verificar permisos usando el método del modelo
    if not tarea.puede_editar(request.user):
        raise PermissionDenied("No tienes permisos para editar esta tarea.")

    if request.method == 'POST':
        form = TareaForm(request.POST, instance=tarea, usuario=request.user)  # 🔹 Pasar usuario
        if form.is_valid():
            tarea_editada = form.save(usuario=request.user)  # 🔹 Pasar usuario al guardar

            # Guardar en el historial de la tarea
            HistorialTarea.objects.create(
                tarea=tarea_editada,
                usuario=request.user,
                accion=f"Tarea editada por {request.user.username}"
            )

            return redirect('tareas_pendientes')  # Redirigir a la lista de tareas pendientes
    else:
        form = TareaForm(instance=tarea, usuario=request.user)  # 🔹 Pasar usuario en GET

    return render(request, 'tareas/tarea_editar.html', {'form': form, 'tarea': tarea})


@login_required
@csrf_protect  # 🔹 Protege la vista contra ataques CSRF
def completar_tarea(request, tarea_id):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    tarea = get_object_or_404(Tarea, id=tarea_id)

    # 🔹 Verificar permisos: Solo el creador, el asignado o un administrador pueden completar la tarea
    if not tarea.puede_editar(request.user):
        return JsonResponse({'error': 'No tienes permisos para completar esta tarea.'}, status=403)

    # 🔹 Marcar la tarea como completada
    tarea.estado = 'completada'
    tarea.progreso = 100
    tarea.fecha_completada = now()  # 🔹 Guardar la fecha de completado
    tarea.save()  # ✅ Guardar sin pasar `usuario`

    # 🔹 Guardar en el historial de la tarea
    HistorialTarea.objects.create(
        tarea=tarea,
        usuario=request.user,
        accion=f"Tarea '{tarea.titulo}' completada por {request.user.username}"
    )

    return JsonResponse({'success': True, 'tarea_id': tarea.id})


@login_required
def tareas_historico(request):
    usuario = request.user
    hoy = now().date()

    # 🔹 Obtener filtro seleccionado por el usuario
    filtro = request.GET.get('filtro', '30')  # Por defecto, 30 días
    fecha_inicio = request.GET.get('fecha_inicio', '')
    fecha_fin = request.GET.get('fecha_fin', '')

    # 🔹 Determinar el rango de fechas basado en el filtro seleccionado
    if filtro == "8":
        rango_inicio = hoy - timedelta(days=8)
    elif filtro == "15":
        rango_inicio = hoy - timedelta(days=15)
    elif filtro == "30":
        rango_inicio = hoy - timedelta(days=30)
    elif filtro == "todas":
        rango_inicio = None
    elif filtro == "rango" and fecha_inicio and fecha_fin:
        try:
            rango_inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            rango_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
        except ValueError:
            rango_inicio, rango_fin = None, None
    else:
        rango_inicio = hoy - timedelta(days=30)  # Default 30 días

    # 🔹 Filtrar tareas completadas
    tareas_completadas = Tarea.objects.filter(estado="completada")

    if rango_inicio:
        tareas_completadas = tareas_completadas.filter(fecha_completada__gte=rango_inicio)

    if filtro == "rango" and fecha_inicio and fecha_fin:
        tareas_completadas = tareas_completadas.filter(fecha_completada__range=[rango_inicio, rango_fin])

    if usuario.is_superuser:
        tareas = tareas_completadas.order_by("-fecha_completada")
    else:
        tareas = tareas_completadas.filter(creador_id=usuario.id).order_by("-fecha_completada")

    return render(request, 'tareas/tareas_historico.html', {
        'tareas': tareas,
        'es_admin': usuario.is_superuser,
        'filtro_seleccionado': filtro,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin
    })

@user_passes_test(lambda u: u.is_superuser)
@login_required
def registro_admin(request):
    if request.method == 'POST':
        form = RegistroAdminForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '✅ Usuario registrado exitosamente.')
            return redirect('configuracion')  # Asegura que 'configuracion' esté en urls.py
        else:
            messages.error(request, '⚠️ Hubo un error en el formulario. Verifica los datos ingresados.')

    else:
        form = RegistroAdminForm()

    return render(request, 'tareas/registro_admin.html', {'form': form})

def obtener_usuarios_por_departamento(request):
    departamento_id = request.GET.get('departamento_id')

    if not departamento_id:
        return JsonResponse({'error': 'No se proporcionó un departamento'}, status=400)

    usuarios = list(CustomUser.objects.filter(departamento_id=departamento_id).values('id', 'username'))

    if not usuarios:
        return JsonResponse({'mensaje': 'No hay usuarios registrados en este departamento'}, status=200)

    return JsonResponse(usuarios, safe=False)
