from rest_framework import permissions

class IsAdminOrSuperUser(permissions.BasePermission):
    """
    Permite acceso solo a usuarios administradores o superusuarios.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.es_admin or request.user.is_superuser)

class IsAdminOrSuperUserOrReadOnly(permissions.BasePermission):
    """
    Permite acceso de lectura a todos los usuarios autenticados,
    pero solo los administradores o superusuarios pueden realizar cambios.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and (request.user.es_admin or request.user.is_superuser) 