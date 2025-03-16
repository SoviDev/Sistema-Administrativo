from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
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

class TareaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "estado", "creador", "asignado_a", "departamento", "fecha_creacion", "fecha_completada")
    search_fields = ("titulo", "descripcion", "creador__username", "asignado_a__username")
    list_filter = ("estado", "departamento", "fecha_creacion")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "asignado_a":
            kwargs["queryset"] = User.objects.all()  # Aquí usa la variable correctamente definida
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


admin.site.register(Tarea, TareaAdmin)
admin.site.register(HistorialTarea)
#admin.site.register(CustomUser, CustomUserAdmin)  # 🔹 Registro de usuario aquí

