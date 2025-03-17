from django.core.exceptions import PermissionDenied
from django.utils.timezone import now
from django.conf import settings  # ✅ Para usar AUTH_USER_MODEL
from django.db import models
from usuarios.models import Departamento  # 🔹 Importamos correctamente desde usuarios

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
    creador = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="tareas_creadas", on_delete=models.CASCADE, null=False, blank=False)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    asignado_a = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="tareas_asignadas", on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_completada = models.DateTimeField(null=True, blank=True)
    ultima_modificacion = models.DateTimeField(auto_now=True)

    def puede_editar(self, usuario):
        return usuario.is_superuser or self.creador == usuario or self.asignado_a == usuario or (
            not self.asignado_a and self.departamento == usuario.departamento
        )

    def puede_editar_titulo_descripcion(self, usuario):
        """ Permite editar solo el título y la descripción si es el creador o un superusuario """
        return usuario.is_superuser or self.creador == usuario

    def save(self, *args, **kwargs):
        if self.estado == "completada" and not self.fecha_completada:
            self.fecha_completada = now()

        usuario = kwargs.pop('usuario', None)
        if usuario and not self.puede_editar(usuario):
            raise PermissionDenied("No tienes permisos para editar esta tarea.")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.titulo} - {self.estado}"

class HistorialTarea(models.Model):
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name="historial")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    accion = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tarea.titulo} - {self.accion} ({self.fecha_hora})"
