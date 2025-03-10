from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import models



class Departamento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre

class CustomUser(AbstractUser):
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    es_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username


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
    progreso = models.IntegerField(default=0)  # 0 - 100%
    creador = models.ForeignKey(User, related_name="tareas_creadas", on_delete=models.CASCADE)
    departamento = models.ForeignKey('Departamento', on_delete=models.SET_NULL, null=True, blank=True)
    asignado_a = models.ForeignKey(User, related_name="tareas_asignadas", on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_completada = models.DateTimeField(null=True, blank=True)

    def puede_editar(self, usuario):
        """ Verifica si un usuario tiene permisos para editar la tarea """
        if usuario.is_superuser:
            return True  # Admins pueden editar cualquier tarea
        if self.creador == usuario:
            return True  # El creador de la tarea puede editarla
        if self.asignado_a == usuario:
            return True  # Si está asignado a la tarea, puede editarla
        if not self.asignado_a and self.departamento == usuario.departamento:
            return True  # Si no tiene asignado a nadie, pero pertenece a su departamento, puede editarla
        return False  # Si no cumple ninguna condición, no tiene permiso

    def save(self, *args, **kwargs):
        """ Validar permisos antes de guardar la tarea """
        usuario = kwargs.pop('usuario', None)  # Obtener el usuario si se pasa como parámetro
        if usuario and not self.puede_editar(usuario):
            raise PermissionDenied("No tienes permisos para editar esta tarea.")
        super().save(*args, **kwargs)
        
    def completar(self):
        """Marca la tarea como completada y guarda la fecha de completado."""
        self.estado = "completada"
        self.fecha_completada = models.DateTimeField(auto_now=True)
        self.save()

    def __str__(self):
        return f"{self.titulo} - {self.estado}"
    
    
class HistorialTarea(models.Model):
    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    accion = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tarea.titulo} - {self.accion} ({self.fecha_hora})"

