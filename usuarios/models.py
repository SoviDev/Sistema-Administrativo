from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.timezone import now
from django.core.exceptions import ValidationError

class Departamento(models.Model):
    """
    Modelo que representa un departamento en la organización.
    
    Attributes:
        nombre (CharField): Nombre único del departamento.
        tiene_bandeja (BooleanField): Indica si el departamento tiene bandeja de entrada.
        servidor_entrante (CharField): Servidor IMAP para correo entrante.
        puerto_entrante (IntegerField): Puerto del servidor entrante.
        servidor_saliente (CharField): Servidor SMTP para correo saliente.
        puerto_saliente (IntegerField): Puerto del servidor saliente.
        usuario_correo (CharField): Usuario para autenticación en servidores de correo.
        password_correo (CharField): Contraseña para autenticación en servidores de correo.
        usar_tls (BooleanField): Indica si se debe usar TLS para la conexión.
    """
    nombre = models.CharField(max_length=100, unique=True)
    tiene_bandeja = models.BooleanField(default=False, verbose_name="¿Tiene bandeja de entrada?")
    servidor_entrante = models.CharField(max_length=255, blank=True, null=True, verbose_name="Servidor IMAP")
    puerto_entrante = models.IntegerField(blank=True, null=True, verbose_name="Puerto IMAP")
    servidor_saliente = models.CharField(max_length=255, blank=True, null=True, verbose_name="Servidor SMTP")
    puerto_saliente = models.IntegerField(blank=True, null=True, verbose_name="Puerto SMTP")
    usuario_correo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Usuario de correo")
    password_correo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Contraseña de correo")
    usar_tls = models.BooleanField(default=True, verbose_name="Usar TLS")

    def __str__(self):
        return self.nombre

    def clean(self):
        """
        Valida que si tiene_bandeja es True, los campos de configuración de correo sean obligatorios.
        """
        if self.tiene_bandeja:
            campos_requeridos = [
                'servidor_entrante', 'puerto_entrante',
                'servidor_saliente', 'puerto_saliente',
                'usuario_correo', 'password_correo'
            ]
            for campo in campos_requeridos:
                if not getattr(self, campo):
                    raise ValidationError({
                        campo: 'Este campo es requerido cuando el departamento tiene bandeja de entrada.'
                    })

    class Meta:
        verbose_name = "Departamento"
        verbose_name_plural = "Departamentos"


class Privilegio(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class UsuarioPrivilegio(models.Model):
    usuario = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='privilegios')
    privilegio = models.ForeignKey(Privilegio, on_delete=models.CASCADE)
    departamento = models.ForeignKey(
        Departamento, 
        on_delete=models.CASCADE,
        related_name='privilegios_usuarios'
    )

    class Meta:
        unique_together = ['usuario', 'privilegio', 'departamento']
        verbose_name = "Privilegio de Usuario"
        verbose_name_plural = "Privilegios de Usuarios"

    def __str__(self):
        return f"{self.usuario.username} - {self.privilegio.nombre} en {self.departamento.nombre}"

    def clean(self):
        """
        Validar que el departamento esté en departamentos_acceso del usuario
        """
        if not self.usuario.departamentos_acceso.filter(id=self.departamento.id).exists():
            raise ValidationError({
                'departamento': 'El usuario no tiene acceso a este departamento.'
            })


class CustomUser(AbstractUser):
    """
    Modelo personalizado de usuario que extiende el modelo base de Django.
    Agrega campos adicionales para la gestión de usuarios en el sistema.
    """
    telefono = models.CharField(max_length=20, blank=True, null=True)
    es_admin = models.BooleanField(default=False)
    ultimo_ingreso = models.DateTimeField(null=True, blank=True)
    departamentos_acceso = models.ManyToManyField(
        'Departamento',
        related_name='usuarios_con_acceso',
        blank=True
    )
    debe_cambiar_password = models.BooleanField(
        default=False,
        help_text='Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión'
    )

    def __str__(self):
        return self.username

    def actualizar_ultimo_ingreso(self):
        self.ultimo_ingreso = now()
        self.save(update_fields=['ultimo_ingreso'])

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
