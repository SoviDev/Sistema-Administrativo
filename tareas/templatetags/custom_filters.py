from django import template

register = template.Library()

@register.filter(name='css_estado')
def css_estado(estado):
    if not estado:
        return "bg-secondary text-white"  # Valor por defecto

    colores = {
        "pendiente": "bg-warning text-dark",
        "en proceso": "bg-info text-white",
        "completada": "bg-success text-white",
        "cancelada": "bg-danger text-white",
    }
    return colores.get(estado.lower(), "bg-secondary text-white")

