from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from usuarios.models import CustomUser
from .models import Tarea, HistorialTarea, Departamento  # 🔹 Eliminamos Departamento si ya no está en esta app
from django.contrib.auth import get_user_model


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'departamento', 'telefono', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )


User = get_user_model()  # Asegura que usa el modelo de usuario correcto

@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado_formateado', 'creador', 'asignado_a', 'departamento', 'fecha_creacion', 'fecha_completada')
    list_filter = ('estado', 'departamento', 'fecha_creacion')
    search_fields = ('titulo', 'descripcion', 'creador__username', 'asignado_a__username')
    date_hierarchy = 'fecha_creacion'
    ordering = ('-fecha_creacion',)
    
    def estado_formateado(self, obj):
        estados = {
            'pendiente': ('⏳', 'Pendiente'),
            'en_progreso': ('🔄', 'En Progreso'),
            'completada': ('✅', 'Completada'),
            'cancelada': ('❌', 'Cancelada')
        }
        
        icono, texto = estados.get(obj.estado, ('❓', 'Desconocido'))
        return format_html(
            '<div class="estado estado-{}">{} {}</div>',
            obj.estado,
            icono,
            texto
        )
    
    estado_formateado.short_description = 'Estado'
    estado_formateado.admin_order_field = 'estado'

@admin.register(HistorialTarea)
class HistorialTareaAdmin(admin.ModelAdmin):
    list_display = ('tarea', 'accion', 'usuario', 'fecha_hora')
    list_filter = ('accion', 'fecha_hora')
    search_fields = ('tarea__titulo', 'usuario__username')
    date_hierarchy = 'fecha_hora'
    ordering = ('-fecha_hora',)

#admin.site.register(CustomUser, CustomUserAdmin)  # 🔹 Registro de usuario aquí

