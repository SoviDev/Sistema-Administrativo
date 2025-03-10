from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser, Departamento, Tarea
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    telefono = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-control'}))
    departamento = forms.ModelChoiceField(
        queryset=Departamento.objects.all(), 
        required=True, 
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = CustomUser  # Usa el modelo extendido
        fields = ['username', 'email', 'password1', 'password2', 'telefono', 'departamento']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'password1': forms.PasswordInput(attrs={'class': 'form-control'}),
            'password2': forms.PasswordInput(attrs={'class': 'form-control'}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
        }


class TareaForm(forms.ModelForm):
    class Meta:
        model = Tarea
        fields = ['titulo', 'descripcion', 'departamento', 'asignado_a', 'estado', 'progreso']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'departamento': forms.Select(attrs={'class': 'form-control'}),
            'asignado_a': forms.Select(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-control'}),
            'progreso': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'max': 100}),
        }

    def __init__(self, *args, **kwargs):
        usuario = kwargs.pop('usuario', None)  
        super().__init__(*args, **kwargs)

        if usuario and not usuario.is_superuser:
            if usuario.departamento:
                self.fields['departamento'].queryset = Departamento.objects.filter(id=usuario.departamento.id)
                self.fields['asignado_a'].queryset = User.objects.filter(departamento=usuario.departamento)
            else:
                self.fields['departamento'].queryset = Departamento.objects.none()
                self.fields['asignado_a'].queryset = User.objects.none()

    def save(self, usuario=None, commit=True):
        tarea = super().save(commit=False)  
        
        if usuario:
            tarea.ultima_modificacion_por = usuario  
        
        if commit:
            tarea.save()  
        
        return tarea


class TareaEditForm(forms.ModelForm):
    class Meta:
        model = Tarea
        fields = ['titulo', 'descripcion', 'departamento', 'asignado_a', 'estado', 'progreso']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'departamento': forms.Select(attrs={'class': 'form-control'}),
            'asignado_a': forms.Select(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-control'}),
            'progreso': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'max': 100}),
        }

class RegistroAdminForm(CustomUserCreationForm):
    class Meta(CustomUserCreationForm.Meta):
        model = CustomUser
        fields = CustomUserCreationForm.Meta.fields + ['departamento', 'telefono']
