from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, Departamento

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'estado_bandeja', 'estado_configuracion')
    list_filter = ('tiene_bandeja',)
    search_fields = ('nombre',)
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'tiene_bandeja'),
        }),
        ('Configuración de Correo', {
            'classes': ('collapse',),
            'fields': (
                'servidor_entrante', 'puerto_entrante',
                'servidor_saliente', 'puerto_saliente',
                'usuario_correo', 'password_correo',
                'usar_tls'
            ),
        }),
    )

    def estado_bandeja(self, obj):
        if obj.tiene_bandeja:
            return format_html('<span style="color: green;">✓ Activada</span>')
        return format_html('<span style="color: gray;">✗ Desactivada</span>')
    estado_bandeja.short_description = 'Bandeja de Entrada'

    def estado_configuracion(self, obj):
        if not obj.tiene_bandeja:
            return format_html('<span style="color: gray;">No requerida</span>')
        if obj.servidor_entrante and obj.servidor_saliente:
            return format_html('<span style="color: green;">✓ Configurada</span>')
        return format_html('<span style="color: orange;">⚠ Pendiente</span>')
    estado_configuracion.short_description = 'Estado Configuración'

    class Media:
        css = {
            'all': ('css/admin_custom.css',)
        }

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'telefono', 'estado_usuario', 'ultimo_ingreso')
    list_filter = ('is_active', 'is_staff', 'groups')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'email', 'telefono')}),
        ('Departamentos', {'fields': ('departamentos_acceso', 'es_admin')}),
        ('Permisos', {
            'classes': ('collapse',),
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined', 'ultimo_ingreso')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'email', 'telefono'),
        }),
        ('Departamentos', {
            'fields': ('departamentos_acceso', 'es_admin'),
        }),
    )

    def estado_usuario(self, obj):
        if not obj.is_active:
            return format_html('<span style="color: red;">Inactivo</span>')
        if obj.is_superuser:
            return format_html('<span style="color: purple;">Superusuario</span>')
        if obj.is_staff:
            return format_html('<span style="color: blue;">Staff</span>')
        if obj.es_admin:
            return format_html('<span style="color: green;">Admin</span>')
        return format_html('<span style="color: gray;">Usuario</span>')
    estado_usuario.short_description = 'Estado'

    class Media:
        css = {
            'all': ('css/admin_custom.css',)
        }
