from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.timezone import now

class Departamento(models.Model):
    """
    Modelo que representa un departamento en la organización.
    
    Attributes:
        nombre (CharField): Nombre único del departamento.
    """
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser.
    
    Attributes:
        departamento (ForeignKey): Relación con el departamento al que pertenece el usuario.
        telefono (CharField): Número de teléfono del usuario.
        es_admin (BooleanField): Indica si el usuario tiene privilegios administrativos.
        ultimo_ingreso (DateTimeField): Fecha y hora del último ingreso del usuario.
    """
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    es_admin = models.BooleanField(default=False)
    ultimo_ingreso = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username

    def actualizar_ultimo_ingreso(self):
        self.ultimo_ingreso = now()
        self.save(update_fields=['ultimo_ingreso'])

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
