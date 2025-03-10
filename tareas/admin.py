from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Departamento, Tarea, HistorialTarea

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'departamento', 'telefono', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )

class TareaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado', 'creador', 'asignado_a', 'departamento', 'progreso', 'fecha_creacion')
    list_filter = ('estado', 'departamento')
    search_fields = ('titulo', 'descripcion')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """ Filtrar los usuarios según el departamento de la tarea """
        if db_field.name == "asignado_a":
            tarea_id = request.resolver_match.kwargs.get("object_id")
            if tarea_id:
                tarea = Tarea.objects.get(id=tarea_id)
                if tarea.departamento:
                    kwargs["queryset"] = User.objects.filter(departamento=tarea.departamento)
                else:
                    kwargs["queryset"] = User.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(Departamento)
admin.site.register(Tarea, TareaAdmin)
admin.site.register(HistorialTarea)
admin.site.register(CustomUser, CustomUserAdmin)
