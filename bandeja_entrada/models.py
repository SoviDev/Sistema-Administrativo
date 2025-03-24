from django.db import models
from django.conf import settings
from usuarios.models import Departamento

class Correo(models.Model):
    ESTADO_CHOICES = [
        ('nuevo', 'Nuevo'),
        ('en_proceso', 'En Proceso'),
        ('respondido', 'Respondido'),
        ('archivado', 'Archivado'),
    ]

    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]

    remitente = models.EmailField()
    asunto = models.CharField(max_length=200)
    contenido = models.TextField()
    fecha_recepcion = models.DateTimeField(auto_now_add=True)
    departamento_destino = models.ForeignKey(Departamento, on_delete=models.CASCADE)
    asignado_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='nuevo')
    prioridad = models.CharField(max_length=20, choices=PRIORIDAD_CHOICES, default='media')
    adjuntos = models.FileField(upload_to='correos/adjuntos/', blank=True, null=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='correos_creados')

    class Meta:
        ordering = ['-fecha_recepcion']
        verbose_name = 'Correo'
        verbose_name_plural = 'Correos'

    def __str__(self):
        return f"{self.asunto} - {self.remitente}"

class RespuestaCorreo(models.Model):
    correo = models.ForeignKey(Correo, on_delete=models.CASCADE, related_name='respuestas')
    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    adjuntos = models.FileField(upload_to='correos/respuestas/', blank=True, null=True)

    class Meta:
        ordering = ['fecha_creacion']
        verbose_name = 'Respuesta'
        verbose_name_plural = 'Respuestas'

    def __str__(self):
        return f"Respuesta a {self.correo.asunto}"

class HistorialCorreo(models.Model):
    TIPO_CAMBIO_CHOICES = [
        ('creacion', 'Creación'),
        ('asignacion', 'Asignación'),
        ('traslado', 'Traslado'),
        ('estado', 'Cambio de Estado'),
        ('respuesta', 'Respuesta'),
    ]

    correo = models.ForeignKey(Correo, on_delete=models.CASCADE, related_name='historial')
    tipo_cambio = models.CharField(max_length=20, choices=TIPO_CAMBIO_CHOICES)
    descripcion = models.TextField()
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-fecha_cambio']
        verbose_name = 'Historial'
        verbose_name_plural = 'Historiales'

    def __str__(self):
        return f"{self.tipo_cambio} - {self.correo.asunto}"
