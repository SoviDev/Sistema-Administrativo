from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Correo, RespuestaCorreo, HistorialCorreo
from usuarios.models import Departamento

@login_required
def bandeja_entrada(request):
    """
    Vista principal que muestra los correos nuevos y en proceso del departamento del usuario.
    """
    departamento = request.user.departamento
    correos = Correo.objects.filter(
        departamento_destino=departamento,
        estado__in=['nuevo', 'en_proceso']
    ).order_by('-fecha_recepcion')

    context = {
        'correos': correos,
        'departamento': departamento
    }
    return render(request, 'bandeja_entrada/bandeja_entrada.html', context)

@login_required
def nuevo_correo(request):
    """
    Vista para crear un nuevo correo.
    """
    if request.method == 'POST':
        # TODO: Implementar la creación de correo
        pass
    return render(request, 'bandeja_entrada/nuevo_correo.html')

@login_required
def detalle_correo(request, correo_id):
    """
    Vista para ver los detalles de un correo específico.
    """
    correo = get_object_or_404(Correo, id=correo_id)
    respuestas = correo.respuestas.all().order_by('fecha_creacion')
    historial = correo.historial.all().order_by('-fecha_cambio')

    context = {
        'correo': correo,
        'respuestas': respuestas,
        'historial': historial
    }
    return render(request, 'bandeja_entrada/detalle_correo.html', context)

@login_required
def responder_correo(request, correo_id):
    """
    Vista para responder a un correo.
    """
    if request.method == 'POST':
        # TODO: Implementar la respuesta al correo
        pass
    return redirect('bandeja_entrada:detalle_correo', correo_id=correo_id)

@login_required
def asignar_correo(request, correo_id):
    """
    Vista para asignar un correo a un usuario.
    """
    if request.method == 'POST':
        # TODO: Implementar la asignación de correo
        pass
    return redirect('bandeja_entrada:detalle_correo', correo_id=correo_id)

@login_required
def trasladar_correo(request, correo_id):
    """
    Vista para trasladar un correo a otro departamento.
    """
    if request.method == 'POST':
        # TODO: Implementar el traslado de correo
        pass
    return redirect('bandeja_entrada:detalle_correo', correo_id=correo_id)

@login_required
def cambiar_estado(request, correo_id):
    """
    Vista para cambiar el estado de un correo.
    """
    if request.method == 'POST':
        # TODO: Implementar el cambio de estado
        pass
    return redirect('bandeja_entrada:detalle_correo', correo_id=correo_id)

@login_required
def correos_archivados(request):
    """
    Vista para ver los correos archivados.
    """
    departamento = request.user.departamento
    correos = Correo.objects.filter(
        departamento_destino=departamento,
        estado='archivado'
    ).order_by('-fecha_recepcion')

    context = {
        'correos': correos,
        'departamento': departamento
    }
    return render(request, 'bandeja_entrada/correos_archivados.html', context)

@login_required
def correos_asignados(request):
    """
    Vista para ver los correos asignados al usuario.
    """
    correos = Correo.objects.filter(
        asignado_a=request.user,
        estado__in=['nuevo', 'en_proceso']
    ).order_by('-fecha_recepcion')

    context = {
        'correos': correos
    }
    return render(request, 'bandeja_entrada/correos_asignados.html', context)
