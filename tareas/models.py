from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from django.conf import settings
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from usuarios.models import Departamento, CustomUser

User = get_user_model()

class Tarea(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En Progreso'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]

    titulo = models.CharField(max_length=255)
    descripcion = models.TextField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    progreso = models.IntegerField(null=True, blank=True, default=0)
    creador = models.ForeignKey(User, related_name="tareas_creadas", on_delete=models.CASCADE)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    asignado_a = models.ForeignKey(User, related_name="tareas_asignadas", on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_completada = models.DateTimeField(null=True, blank=True)
    ultima_modificacion = models.DateTimeField(auto_now=True)
    ultima_modificacion_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tareas_modificadas"
    )

    def puede_editar(self, usuario):
        return usuario.is_superuser or self.creador == usuario or self.asignado_a == usuario or (
            not self.asignado_a and self.departamento == usuario.departamento
        )

    def save(self, *args, **kwargs):
        usuario = kwargs.pop('usuario', None)
        
        if usuario and not self.puede_editar(usuario):
            raise PermissionDenied("No tienes permisos para editar esta tarea.")
            
        if self.estado == "completada" and not self.fecha_completada:
            self.fecha_completada = timezone.now()
            
        if usuario:
            self.ultima_modificacion_por = usuario
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} - {self.estado}"

class HistorialTarea(models.Model):
    tarea = models.ForeignKey('Tarea', on_delete=models.CASCADE, related_name='historial')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    accion = models.TextField(default="Acción no especificada")
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_hora']
        verbose_name = 'Historial de Tarea'
        verbose_name_plural = 'Historiales de Tareas'

    def __str__(self):
        usuario_nombre = self.usuario.username if self.usuario else "Sistema"
        return f"{self.accion} - por {usuario_nombre} ({self.fecha_hora})"

@receiver(pre_save, sender=Tarea)
def guardar_estado_anterior(sender, instance, **kwargs):
    """Guarda el estado anterior de la tarea antes de que se guarde"""
    if instance.pk:  # Si la tarea ya existe
        try:
            tarea_anterior = Tarea.objects.get(pk=instance.pk)
            instance._estado_anterior = {
                'titulo': tarea_anterior.titulo,
                'descripcion': tarea_anterior.descripcion,
                'estado': tarea_anterior.get_estado_display(),
                'progreso': tarea_anterior.progreso,
                'asignado_a': tarea_anterior.asignado_a,
                'departamento': tarea_anterior.departamento
            }
        except Tarea.DoesNotExist:
            instance._estado_anterior = None
    else:
        instance._estado_anterior = None

@receiver(post_save, sender=Tarea)
def registrar_cambios(sender, instance, created, **kwargs):
    """Registra los cambios en el historial después de guardar la tarea"""
    if created:
        # Si es una tarea nueva
        HistorialTarea.objects.create(
            tarea=instance,
            usuario=instance.ultima_modificacion_por,
            accion=f"Tarea creada por {instance.creador.username if instance.creador else 'Sistema'}"
        )
    elif hasattr(instance, '_estado_anterior') and instance._estado_anterior:
        # Si es una edición y tenemos el estado anterior
        cambios = []
        anterior = instance._estado_anterior

        if instance.titulo != anterior['titulo']:
            cambios.append(f"Título cambiado de '{anterior['titulo']}' a '{instance.titulo}'")

        if instance.descripcion != anterior['descripcion']:
            cambios.append("Descripción modificada")

        if instance.get_estado_display() != anterior['estado']:
            cambios.append(f"Estado cambiado de '{anterior['estado']}' a '{instance.get_estado_display()}'")

        if instance.progreso != anterior['progreso']:
            cambios.append(f"Progreso cambiado de {anterior['progreso']}% a {instance.progreso}%")

        if instance.asignado_a != anterior['asignado_a']:
            anterior_asignado = anterior['asignado_a'].username if anterior['asignado_a'] else "Nadie"
            nuevo_asignado = instance.asignado_a.username if instance.asignado_a else "Nadie"
            cambios.append(f"Asignación cambiada de '{anterior_asignado}' a '{nuevo_asignado}'")

        if instance.departamento != anterior['departamento']:
            anterior_depto = anterior['departamento'].nombre if anterior['departamento'] else "Sin departamento"
            nuevo_depto = instance.departamento.nombre if instance.departamento else "Sin departamento"
            cambios.append(f"Departamento cambiado de '{anterior_depto}' a '{nuevo_depto}'")

        if cambios:
            HistorialTarea.objects.create(
                tarea=instance,
                usuario=instance.ultima_modificacion_por,
                accion="; ".join(cambios)
            )

class Observacion(models.Model):
    """
    Modelo para manejar las observaciones de una tarea.
    """
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name='observaciones')
    usuario = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Observación'
        verbose_name_plural = 'Observaciones'

    def __str__(self):
        return f'Observación de {self.usuario.username} en {self.tarea.titulo}'
