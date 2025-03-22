from django.contrib.auth import get_user_model, login
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from .forms import CustomUserCreationForm, TareaForm, TareaEditForm, RegistroAdminForm, CustomUser
from .models import HistorialTarea, Departamento, Tarea
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from datetime import timedelta, datetime
from django.utils.timezone import now
from django.db.models import Q
from django.contrib import messages
from django import template
from django.core.exceptions import ValidationError
from django.urls import reverse
from usuarios.models import CustomUser
import unicodedata

User = get_user_model()

#Este se tiene que remplazar con un erro:
#usuario_por_defecto= User.objects.first()
#Tarea.objects.filter(creador__isnull=True).update(creador=usuario_por_defecto)

usuario = get_user_model()  # 🔹 Obtener el modelo de usuario extendido
def es_superusuario(user):
    """
    Verifica si un usuario es superusuario.
    
    Args:
        user (User): Usuario a verificar.
        
    Returns:
        bool: True si el usuario es superusuario, False en caso contrario.
    """
    return user.is_superuser

def register(request): 
    """
    Vista para el registro de nuevos usuarios.
    
    Args:
        request (HttpRequest): Objeto de solicitud HTTP.
        
    Returns:
        HttpResponse: Renderiza el formulario de registro o redirige al home si el registro es exitoso.
    """
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
    """
    Vista principal de la aplicación.
    
    Args:
        request (HttpRequest): Objeto de solicitud HTTP.
        
    Returns:
        HttpResponse: Renderiza la página principal.
    """
    return render(request, 'tareas/home.html')

@login_required
def configuracion(request):
    """
    Vista para la configuración del usuario.
    
    Args:
        request (HttpRequest): Objeto de solicitud HTTP.
        
    Returns:
        HttpResponse: Renderiza la página de configuración.
    """
    return render(request, 'tareas/configuracion.html')

def normalizar_texto(texto):
    """
    Normaliza un texto eliminando acentos y convirtiéndolo a minúsculas.
    """
    if not texto:
        return ""
    texto_normalizado = unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')
    return texto_normalizado.lower()

@login_required
def tareas_pendientes(request):
    """
    Vista que muestra las tareas pendientes del usuario.
    Para superusuarios, muestra todas las tareas pendientes organizadas por departamento.
    Para usuarios normales, muestra sus tareas propias, sin asignar y asignadas.
    """
    usuario = request.user
    estados_excluidos = ["completada", "cancelada"]
    query = normalizar_texto(request.GET.get("q", "").strip())
    departamento_filtro = request.GET.get("departamento", "").strip()
    usuario_filtro = request.GET.get("usuario", "").strip()

    # Crear el filtro de búsqueda
    def crear_filtro_busqueda(query):
        if not query:
            return Q()
        query_normalizado = normalizar_texto(query)
        return (
            Q(titulo__icontains=query_normalizado) |
            Q(descripcion__icontains=query_normalizado)
        )

    filtro_busqueda = crear_filtro_busqueda(query)

    if usuario.is_superuser:
        departamentos = Departamento.objects.all()
        usuarios = CustomUser.objects.all().order_by('username')

        # Filtrar tareas por departamento y/o usuario si se especifica
        tareas_por_departamento = {}
        for depto in departamentos:
            if departamento_filtro and str(depto.id) != departamento_filtro:
                continue
                
            tareas = Tarea.objects.filter(departamento=depto)\
                .exclude(estado__in=estados_excluidos)\
                .filter(filtro_busqueda)
                
            # Aplicar filtro de usuario si existe
            if usuario_filtro:
                tareas = tareas.filter(
                    Q(creador_id=usuario_filtro) |
                    Q(asignado_a_id=usuario_filtro)
                )
                
            tareas = tareas.order_by("fecha_creacion")
                
            if tareas.exists():
                tareas_por_departamento[depto.nombre] = [
                    {
                        'tarea': tarea,
                        'puede_editar': tarea.puede_editar(usuario),
                        'asignado': tarea.asignado_a.username if tarea.asignado_a else "No asignado",
                        'creador': tarea.creador.username
                    }
                    for tarea in tareas
                ]

        # Filtrar tareas propias del admin
        tareas_propias_admin = Tarea.objects.filter(
            Q(creador=usuario.id) | Q(departamento__isnull=True, asignado_a__isnull=True)
        ).exclude(estado__in=estados_excluidos) \
         .filter(filtro_busqueda)

        # Filtrar tareas sin asignar
        tareas_sin_asignar = Tarea.objects.filter(
            departamento__isnull=False, asignado_a__isnull=True
        ).exclude(estado__in=estados_excluidos) \
         .filter(filtro_busqueda)

        # Si hay un filtro de departamento, filtrar también las tareas propias y sin asignar
        if departamento_filtro:
            tareas_propias_admin = tareas_propias_admin.filter(departamento_id=departamento_filtro)
            tareas_sin_asignar = tareas_sin_asignar.filter(departamento_id=departamento_filtro)

        # Si hay un filtro de usuario, aplicarlo a las tareas propias y sin asignar
        if usuario_filtro:
            tareas_propias_admin = tareas_propias_admin.filter(
                Q(creador_id=usuario_filtro) |
                Q(asignado_a_id=usuario_filtro)
            )
            tareas_sin_asignar = tareas_sin_asignar.filter(
                Q(creador_id=usuario_filtro) |
                Q(asignado_a_id=usuario_filtro)
            )

        tareas_propias_admin = tareas_propias_admin.order_by("fecha_creacion")
        tareas_sin_asignar = tareas_sin_asignar.order_by("fecha_creacion")

        return render(request, 'tareas/tareas_pendientes.html', {
            'tareas_por_departamento': tareas_por_departamento,
            'tareas_propias_admin': [
                {
                    'tarea': t,
                    'puede_editar': t.puede_editar(usuario),
                    'creador': t.creador.username,
                    'asignado': t.asignado_a.username if t.asignado_a else "No asignado"
                } for t in tareas_propias_admin
            ],
            'tareas_sin_asignar': [
                {
                    'tarea': t,
                    'puede_editar': usuario.is_superuser,
                    'creador': t.creador.username,
                    'asignado': t.asignado_a.username if t.asignado_a else "No asignado"
                } for t in tareas_sin_asignar
            ],
            'es_admin': True,
            'query': query,
            'departamentos': departamentos,
            'usuarios': usuarios,
            'departamento_filtro': departamento_filtro,
            'usuario_filtro': usuario_filtro
        })

    else:
        tareas_propias = Tarea.objects.filter(
            creador=usuario
        ).exclude(estado__in=estados_excluidos) \
         .filter(filtro_busqueda) \
         .order_by("fecha_creacion")

        tareas_sin_asignar = Tarea.objects.filter(
            departamento=usuario.departamento, asignado_a=None
        ).exclude(estado__in=estados_excluidos) \
         .filter(filtro_busqueda) \
         .order_by("fecha_creacion")

        tareas_asignadas = Tarea.objects.filter(
            asignado_a=usuario
        ).exclude(estado__in=estados_excluidos) \
         .filter(filtro_busqueda) \
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
def tareas_nueva(request):
    """
    Vista para crear una nueva tarea.
    """
    if request.method == 'POST':
        form = TareaForm(request.POST)
        if form.is_valid():
            try:
                nueva_tarea = form.save(commit=False)
                nueva_tarea.creador = request.user
                nueva_tarea.ultima_modificacion_por = request.user
                nueva_tarea.save(usuario=request.user)  # Pasamos el usuario para que se registre el historial

                messages.success(request, "Tarea creada exitosamente.")
                return redirect('tareas:pendientes')
            except Exception as e:
                messages.error(request, f"Error al crear la tarea: {str(e)}")
        else:
            messages.error(request, "Por favor, corrige los errores en el formulario.")
    else:
        form = TareaForm()

    return render(request, 'tareas/tareas_nueva.html', {'form': form})

@login_required
def tarea_editar(request, tarea_id):
    """
    Vista para editar una tarea existente.
    
    Args:
        request (HttpRequest): Objeto de solicitud HTTP.
        tarea_id (int): ID de la tarea a editar.
        
    Returns:
        HttpResponse: Renderiza el formulario de edición o redirige a tareas pendientes si la edición es exitosa.
        
    Raises:
        PermissionDenied: Si el usuario no tiene permisos para editar la tarea.
    """
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
                    tarea_editada = form.save(commit=False)
                    tarea_editada.ultima_modificacion_por = request.user
                    tarea_editada.save(usuario=request.user)

                    return redirect('tareas:pendientes')

            except ValidationError as e:
                form.add_error(None, e.message)

        else:
            messages.error(request, "Por favor, corrige los errores en el formulario.")

    else:
        form = TareaEditForm(instance=tarea)

    return render(request, 'tareas/tarea_editar.html', {
        'form': form,
        'tarea': tarea
    })

@login_required
def tareas_historial(request, tarea_id):
    """
    Vista que muestra el historial de cambios de una tarea.
    """
    tarea = get_object_or_404(Tarea, id=tarea_id)
    query = request.GET.get('q', '').strip()

    # Obtenemos el historial con todos los campos relacionados
    historial = HistorialTarea.objects.filter(tarea=tarea).select_related(
        'usuario', 'tarea'
    ).order_by('-fecha_hora')

    # Agregamos información de depuración al contexto
    debug_info = []
    for registro in historial:
        debug_info.append({
            'id': registro.id,
            'accion': registro.accion,
            'usuario': registro.usuario.username if registro.usuario else 'Sistema',
            'fecha': registro.fecha_hora,
            'tarea_titulo': registro.tarea.titulo,
            'tarea_estado': registro.tarea.get_estado_display(),
        })

    return_to = request.GET.get("return_to")
    if return_to == "historico":
        return_to_url = reverse("tareas:historico")
    elif return_to:
        return_to_url = reverse("tareas:" + return_to)
    else:
        return_to_url = reverse("tareas:pendientes")

    return render(request, 'tareas/tareas_historial.html', {
        'tarea': tarea,
        'historial': historial,
        'debug_info': debug_info,
        'return_to_url': return_to_url,
        'query': query
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

@login_required
def obtener_usuarios_por_departamento(request):
    departamento_id = request.GET.get("departamento_id")

    if not departamento_id:
        return JsonResponse({"error": "No se proporcionó un departamento"}, status=400)

    usuarios = list(CustomUser.objects.filter(departamento_id=departamento_id).values("id", "username"))

    if not usuarios:
        return JsonResponse({"mensaje": "No hay usuarios registrados en este departamento"}, status=200)

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
    """
    Vista que muestra el historial de tareas completadas y canceladas.
    """
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

    # Incluir tanto tareas completadas como canceladas
    tareas_historicas = Tarea.objects.filter(
        estado__in=["completada", "cancelada"]
    )

    if rango_inicio:
        tareas_historicas = tareas_historicas.filter(
            Q(fecha_completada__gte=rango_inicio) |
            Q(fecha_actualizacion__gte=rango_inicio)
        )

    if filtro == "rango" and fecha_inicio and fecha_fin:
        tareas_historicas = tareas_historicas.filter(
            Q(fecha_completada__range=[rango_inicio, rango_fin]) |
            Q(fecha_actualizacion__range=[rango_inicio, rango_fin])
        )

    if query:
        tareas_historicas = tareas_historicas.filter(
            Q(titulo__icontains=query) |
            Q(descripcion__icontains=query)
        )

    # Filtrar por usuario si no es superusuario
    if not usuario.is_superuser:
        tareas_historicas = tareas_historicas.filter(creador_id=usuario.id)

    # Ordenar por la fecha más reciente (ya sea completada o actualizada)
    tareas_historicas = tareas_historicas.order_by("-fecha_completada", "-fecha_actualizacion")

    return render(request, 'tareas/tareas_historico.html', {
        'tareas': tareas_historicas,
        'es_admin': usuario.is_superuser,
        'filtro_seleccionado': filtro,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'query': query,
    })

@login_required
def usuarios_por_departamento(request, depto_id):
    """
    Vista que retorna los usuarios de un departamento específico.
    """
    try:
        usuarios = CustomUser.objects.filter(departamento_id=depto_id).values('id', 'username')
        return JsonResponse(list(usuarios), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def tarea_completar(request, tarea_id):
    """
    Vista para marcar una tarea como completada.
    
    Args:
        request (HttpRequest): Objeto de solicitud HTTP.
        tarea_id (int): ID de la tarea a completar.
        
    Returns:
        JsonResponse: Respuesta JSON indicando el éxito o error de la operación.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    tarea = get_object_or_404(Tarea, id=tarea_id)

    if not tarea.puede_editar(request.user):
        return JsonResponse({'error': 'No tienes permisos para completar esta tarea.'}, status=403)

    tarea.estado = 'completada'
    tarea.progreso = 100
    tarea.fecha_completada = now()
    tarea.ultima_modificacion_por = request.user
    tarea.save(usuario=request.user)  # Pasamos el usuario para que se registre el historial

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