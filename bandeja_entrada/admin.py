from django.contrib import admin
from .models import Correo, RespuestaCorreo, HistorialCorreo

@admin.register(Correo)
class CorreoAdmin(admin.ModelAdmin):
    list_display = ('asunto', 'remitente', 'departamento_destino', 'estado', 'prioridad', 'fecha_recepcion')
    list_filter = ('estado', 'prioridad', 'departamento_destino', 'fecha_recepcion')
    search_fields = ('asunto', 'remitente', 'contenido')
    readonly_fields = ('fecha_recepcion',)
    ordering = ('-fecha_recepcion',)

@admin.register(RespuestaCorreo)
class RespuestaCorreoAdmin(admin.ModelAdmin):
    list_display = ('correo', 'creado_por', 'fecha_creacion')
    list_filter = ('fecha_creacion', 'creado_por')
    search_fields = ('contenido', 'correo__asunto')
    readonly_fields = ('fecha_creacion',)
    ordering = ('-fecha_creacion',)

@admin.register(HistorialCorreo)
class HistorialCorreoAdmin(admin.ModelAdmin):
    list_display = ('correo', 'tipo_cambio', 'usuario', 'fecha_cambio')
    list_filter = ('tipo_cambio', 'fecha_cambio', 'usuario')
    search_fields = ('descripcion', 'correo__asunto')
    readonly_fields = ('fecha_cambio',)
    ordering = ('-fecha_cambio',)
