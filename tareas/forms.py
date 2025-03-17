from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Tarea
from django.contrib.auth import get_user_model
from usuarios.models import CustomUser, Departamento


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

        self.fields['departamento'].queryset = Departamento.objects.all()
        self.fields['asignado_a'].queryset = User.objects.none()

        if self.instance.pk and self.instance.departamento:
            self.fields['asignado_a'].queryset = User.objects.filter(departamento=self.instance.departamento)
        elif 'departamento' in self.data:
            try:
                departamento_id = int(self.data.get('departamento'))
                self.fields['asignado_a'].queryset = User.objects.filter(departamento_id=departamento_id)
            except (ValueError, TypeError):
                pass  

        # ❌ Deshabilitar título y descripción si no es admin o creador
        if usuario and not self.instance.puede_editar_titulo_descripcion(usuario):
            self.fields['titulo'].widget.attrs['readonly'] = True
            self.fields['descripcion'].widget.attrs['readonly'] = True

    def clean(self):
        cleaned_data = super().clean()
        departamento = cleaned_data.get("departamento")
        asignado_a = cleaned_data.get("asignado_a")

        if asignado_a and asignado_a.departamento != departamento:
            self.add_error("asignado_a", "El usuario seleccionado no pertenece al departamento elegido.")

        return cleaned_data

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
            'departamento': forms.Select(attrs={'class': 'form-control', 'id': 'id_departamento'}),
            'asignado_a': forms.Select(attrs={'class': 'form-control', 'id': 'id_asignado_a'}),
            'estado': forms.Select(attrs={'class': 'form-control'}),
            'progreso': forms.NumberInput(attrs={'class': 'form-control', 'min': 0, 'max': 100}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 🔹 Cargar los departamentos
        self.fields['departamento'].queryset = Departamento.objects.all()
        
        # 🔹 Filtrar usuarios solo si hay un departamento seleccionado
        self.fields['asignado_a'].queryset = User.objects.none()

        if self.instance.pk and self.instance.departamento:
            self.fields['asignado_a'].queryset = User.objects.filter(departamento=self.instance.departamento)
        elif 'departamento' in self.data:
            try:
                departamento_id = int(self.data.get('departamento'))
                self.fields['asignado_a'].queryset = User.objects.filter(departamento_id=departamento_id)
            except (ValueError, TypeError):
                pass



class RegistroAdminForm(CustomUserCreationForm):
    class Meta(CustomUserCreationForm.Meta):
        model = CustomUser
        fields = CustomUserCreationForm.Meta.fields + ['departamento', 'telefono']
