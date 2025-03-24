from django import forms
from .models import Correo, RespuestaCorreo
from usuarios.models import Departamento

class CorreoForm(forms.ModelForm):
    class Meta:
        model = Correo
        fields = ['remitente', 'asunto', 'contenido', 'departamento_destino', 'prioridad', 'adjuntos']
        widgets = {
            'contenido': forms.Textarea(attrs={'rows': 5}),
        }

class RespuestaCorreoForm(forms.ModelForm):
    class Meta:
        model = RespuestaCorreo
        fields = ['contenido', 'adjuntos']
        widgets = {
            'contenido': forms.Textarea(attrs={'rows': 5}),
        }

class AsignarCorreoForm(forms.ModelForm):
    class Meta:
        model = Correo
        fields = ['asignado_a']

class TrasladarCorreoForm(forms.ModelForm):
    class Meta:
        model = Correo
        fields = ['departamento_destino']

class CambiarEstadoForm(forms.ModelForm):
    class Meta:
        model = Correo
        fields = ['estado'] 