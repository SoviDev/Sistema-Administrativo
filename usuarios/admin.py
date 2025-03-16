from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Departamento

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'departamento', 'telefono', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('departamento', 'telefono')}),
    )

# ✅ Antes de registrar, verificar si ya está registrado
if not admin.site.is_registered(CustomUser):
    admin.site.register(CustomUser, CustomUserAdmin)

if not admin.site.is_registered(Departamento):
    admin.site.register(Departamento)
