from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser, Departamento


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    telefono = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-control'}))
    departamento = forms.ModelChoiceField(
        queryset=Departamento.objects.all(), 
        required=False,  # Ahora no es obligatorio
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    es_admin = forms.BooleanField(required=False, widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}))

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2', 'telefono', 'departamento', 'es_admin']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'password1': forms.PasswordInput(attrs={'class': 'form-control'}),
            'password2': forms.PasswordInput(attrs={'class': 'form-control'}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        es_admin = cleaned_data.get("es_admin")
        departamento = cleaned_data.get("departamento")

        if not es_admin and not departamento:
            raise forms.ValidationError("Si el usuario no es administrador, debe asignársele un departamento.")

        return cleaned_data


class DepartamentoForm(forms.ModelForm):
    class Meta:
        model = Departamento
        fields = [
            'nombre', 'tiene_bandeja',
            'servidor_entrante', 'puerto_entrante',
            'servidor_saliente', 'puerto_saliente',
            'usuario_correo', 'password_correo',
            'usar_tls'
        ]
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'tiene_bandeja': forms.CheckboxInput(attrs={'class': 'form-check-input', 'id': 'tiene_bandeja'}),
            'servidor_entrante': forms.TextInput(attrs={'class': 'form-control config-correo'}),
            'puerto_entrante': forms.NumberInput(attrs={'class': 'form-control config-correo'}),
            'servidor_saliente': forms.TextInput(attrs={'class': 'form-control config-correo'}),
            'puerto_saliente': forms.NumberInput(attrs={'class': 'form-control config-correo'}),
            'usuario_correo': forms.TextInput(attrs={'class': 'form-control config-correo'}),
            'password_correo': forms.PasswordInput(attrs={'class': 'form-control config-correo'}),
            'usar_tls': forms.CheckboxInput(attrs={'class': 'form-check-input config-correo'})
        }

    def clean(self):
        cleaned_data = super().clean()
        tiene_bandeja = cleaned_data.get('tiene_bandeja')
        
        if tiene_bandeja:
            campos_requeridos = [
                'servidor_entrante', 'puerto_entrante',
                'servidor_saliente', 'puerto_saliente',
                'usuario_correo', 'password_correo'
            ]
            
            for campo in campos_requeridos:
                valor = cleaned_data.get(campo)
                if not valor:
                    self.add_error(campo, 'Este campo es requerido cuando el departamento tiene bandeja de entrada.')
        
        return cleaned_data

    class Media:
        js = ('js/departamento_form.js',)