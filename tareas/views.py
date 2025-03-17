from django.contrib.auth import get_user_model, login
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from .forms import CustomUserCreationForm, TareaForm, TareaEditForm, RegistroAdminForm, CustomUser
from .models import HistorialTarea, Departamento, Tarea
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from datetime import timedelta, datetime
from django.utils.timezone import now
from django.db.models import Q
from django.contrib import messages
from django import template
from django.core.exceptions import ValidationError
from django.urls import reverse
from usuarios.models import CustomUser

User = get_user_model()

#Este se tiene que remplazar con un erro:
usuario_por_defecto= User.objects.first()
Tarea.objects.filter(creador__isnull=True).update(creador=usuario_por_defecto)

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
def tareas_nueva(request):
    if request.method == 'POST':
        form = TareaForm(request.POST)
        if form.is_valid():
            nueva_tarea = form.save(commit=False)

            # 🔹 Validación adicional para asegurar que la tarea tenga un creador
            if not request.user or not request.user.is_authenticated:
                messages.error(request, "Error: No puedes crear una tarea sin estar autenticado.")
                return redirect('tareas:tareas_pendientes')

            nueva_tarea.creador = request.user  # ✅ Asigna el usuario autenticado como creador
            
            nueva_tarea.save()

            # Guardar en el historial de la tarea
            HistorialTarea.objects.create(
                tarea=nueva_tarea,
                usuario=request.user,
                accion=f"Tarea creada por {request.user.username}"
            )

            messages.success(request, "Tarea creada exitosamente.")
            return redirect('tareas:tareas_pendientes')
        else:
            messages.error(request, "Hubo un error en la creación de la tarea.")
    else:
        form = TareaForm()

    return render(request, 'tareas/tareas_nueva.html', {'form': form})

@login_required
def tareas_pendientes(request):
    usuario = request.user
    estados_excluidos = ["completada", "cancelada"]
    query = request.GET.get("q", "").strip()

    if usuario.is_superuser:
        departamentos = Departamento.objects.all()

        tareas_por_departamento = {
            depto.nombre: [
                {
                    'tarea': tarea,
                    'puede_editar': tarea.puede_editar(usuario),
                    'asignado': tarea.asignado_a.username if tarea.asignado_a else "No asignado",
                    'creador': tarea.creador.username
                }
                for tarea in Tarea.objects.filter(departamento=depto)
                .exclude(estado__in=estados_excluidos)
                .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query))
                .order_by("fecha_creacion")
            ]
            for depto in departamentos
        }

        tareas_propias_admin = Tarea.objects.filter(
            Q(creador=usuario.id) | Q(departamento__isnull=True, asignado_a__isnull=True)
        ).exclude(estado__in=estados_excluidos) \
         .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query)) \
         .order_by("fecha_creacion")

        tareas_sin_asignar = Tarea.objects.filter(
            departamento__isnull=False, asignado_a__isnull=True
        ).exclude(estado__in=estados_excluidos) \
         .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query)) \
         .order_by("fecha_creacion")

        return render(request, 'tareas/tareas_pendientes.html', {
            'tareas_por_departamento': tareas_por_departamento,
            'tareas_propias_admin': [
                {
                    'tarea': t,
                    'puede_editar': t.puede_editar(usuario),
                    'creador': t.creador.username
                } for t in tareas_propias_admin
            ],
            'tareas_sin_asignar': [
                {
                    'tarea': t,
                    'puede_editar': usuario.is_superuser,
                    'creador': t.creador.username
                } for t in tareas_sin_asignar
            ],
            'es_admin': True,
            'query': query
        })

    else:
        tareas_propias = Tarea.objects.filter(
            creador=usuario
        ).exclude(estado__in=estados_excluidos) \
         .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query)) \
         .order_by("fecha_creacion")

        tareas_sin_asignar = Tarea.objects.filter(
            departamento=usuario.departamento, asignado_a=None
        ).exclude(estado__in=estados_excluidos) \
         .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query)) \
         .order_by("fecha_creacion")

        tareas_asignadas = Tarea.objects.filter(
            asignado_a=usuario
        ).exclude(estado__in=estados_excluidos) \
         .filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query)) \
         .order_by("fecha_creacion")

        return render(request, 'tareas/tareas_pendientes.html', {
            'tareas_propias': [
                {
                    'tarea': t,
                    'puede_editar': t.puede_editar(usuario),
                    'es_creador': True,
                    'creador': t.creador.username
                } for t in tareas_propias
            ],
            'tareas_sin_asignar': [
                {
                    'tarea': t,
                    'puede_editar': t.puede_editar(usuario),
                    'es_creador': False,
                    'creador': t.creador.username
                } for t in tareas_sin_asignar
            ],
            'tareas_asignadas': [
                {
                    'tarea': t,
                    'puede_editar': t.puede_editar(usuario),
                    'es_creador': t.creador == usuario,
                    'creador': t.creador.username
                } for t in tareas_asignadas
            ],
            'es_admin': False,
            'query': query
        })

@login_required
def tarea_editar(request, tarea_id):
    tarea = get_object_or_404(Tarea, id=tarea_id)

    if not tarea.puede_editar(request.user):
        raise PermissionDenied("No tienes permisos para editar esta tarea.")

    if request.method == 'POST':
        form = TareaEditForm(request.POST, instance=tarea)

        if form.is_valid():
            try:
                tarea_actual = Tarea.objects.get(pk=tarea.id)
                if tarea_actual.fecha_actualizacion > tarea.fecha_actualizacion:
                    form.add_error(None, "⚠️ Otro usuario ha modificado esta tarea mientras la editabas. Refresca la página y revisa los cambios.")
                else:
                    tarea_editada = form.save(commit=False)  # 🔹 Guardar sin commit
                    tarea_editada.ultima_modificacion_por = request.user  # Asignar usuario
                    tarea_editada.save()  # 🔹 Guardar la tarea

                    HistorialTarea.objects.create(
                        tarea=tarea_editada,
                        usuario=request.user,
                        accion=f"Tarea editada por {request.user.username}"
                    )
                    return redirect('tareas:tareas_pendientes')

            except ValidationError as e:
                form.add_error(None, e.message)

    else:
        form = TareaEditForm(instance=tarea)

    return render(request, 'tareas/tarea_editar.html', {
        'form': form,
        'tarea': tarea
    })

@login_required
def tareas_historial(request, tarea_id):
    tarea = get_object_or_404(Tarea, id=tarea_id)
    tareas_historial = HistorialTarea.objects.filter(tarea=tarea).order_by('-fecha_hora')

    return_to = request.GET.get("return_to")

    if return_to == "tareas_historico":  # ✅ Si viene de historial, regresar ahí
        return_to_url = reverse("tareas:tareas_historico")
    elif return_to:  # Si es otra vista válida, intentamos resolverla
        try:
            return_to_url = reverse(return_to)
        except:
            return_to_url = reverse("tareas:tareas_pendientes")  # Fallback a pendientes
    else:  # Si no hay return_to, usamos REFERER o pendientes como último recurso
        referer = request.META.get('HTTP_REFERER')
        if referer:
            parsed_url = urlparse(referer)
            return_to_url = parsed_url.path  # Extraemos solo la ruta
        else:
            return_to_url = reverse("tareas:tareas_pendientes")  # Default seguro

    return render(request, 'tareas/tareas_historial.html', {
        'tarea': tarea,
        'tareas_historial': tareas_historial,
        'return_to_url': return_to_url,
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

register = template.Library()

@register.filter
def css_estado(value):
    """ Devuelve la clase CSS según el estado de la tarea. """
    estados_css = {
        "pendiente": "bg-warning text-dark",
        "en_proceso": "bg-info text-white",
        "completada": "bg-success text-white",
        "cancelada": "bg-danger text-white",
    }
    return estados_css.get(value.lower(), "bg-secondary text-white")  # Valor por defecto

@login_required
def tareas_historico(request):
    usuario = request.user
    hoy = now().date()
    query = request.GET.get("q", "").strip()

    filtro = request.GET.get('filtro', '30')
    fecha_inicio = request.GET.get('fecha_inicio', '')
    fecha_fin = request.GET.get('fecha_fin', '')

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
            if rango_inicio == hoy and rango_fin == hoy:
                rango_fin += timedelta(days=1)
        except ValueError:
            rango_inicio, rango_fin = None, None
    else:
        rango_inicio = hoy - timedelta(days=30)

    tareas_completadas = Tarea.objects.filter(estado="completada")

    if rango_inicio:
        tareas_completadas = tareas_completadas.filter(fecha_completada__gte=rango_inicio)

    if filtro == "rango" and fecha_inicio and fecha_fin:
        tareas_completadas = tareas_completadas.filter(fecha_completada__range=[rango_inicio, rango_fin])

    if query:
        tareas_completadas = tareas_completadas.filter(Q(titulo__icontains=query) | Q(descripcion__icontains=query))

    tareas = tareas_completadas.order_by("-fecha_completada") if usuario.is_superuser else tareas_completadas.filter(creador_id=usuario.id).order_by("-fecha_completada")

    return render(request, 'tareas/tareas_historico.html', {
        'tareas': tareas,
        'es_admin': usuario.is_superuser,
        'filtro_seleccionado': filtro,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'query': query,
    })


@login_required
def usuarios_por_departamento(request, depto_id):
    """ Devuelve los usuarios de un departamento específico en formato JSON. """
    usuarios = User.objects.filter(departamento_id=depto_id).values("id", "username")
    return JsonResponse({"usuarios": list(usuarios)})

@login_required
def tarea_completar(request, tarea_id):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    tarea = get_object_or_404(Tarea, id=tarea_id)

    if not tarea.puede_editar(request.user):
        return JsonResponse({'error': 'No tienes permisos para completar esta tarea.'}, status=403)

    tarea.estado = 'completada'
    tarea.progreso = 100
    tarea.fecha_completada = now()
    tarea.save()

    HistorialTarea.objects.create(
        tarea=tarea,
        usuario=request.user,
        accion=f"Tarea '{tarea.titulo}' completada por {request.user.username}"
    )

    return JsonResponse({'success': True, 'tarea_id': tarea.id})

# 🔹 Vista principal de Tareas
def lista_tareas(request):
    tareas = Tarea.objects.all()
    return render(request, "tareas/lista_tareas.html", {"tareas": tareas})

# 🔹 Formulario para editar tarea
def editar_tarea(request, pk):
    tarea = get_object_or_404(Tarea, pk=pk)
    if request.method == "POST":
        form = TareaForm(request.POST, instance=tarea)
        if form.is_valid():
            form.save()
            return redirect("tareas:lista_tareas")
    else:
        form = TareaForm(instance=tarea)
    return render(request, "tareas/form_tarea.html", {"form": form})