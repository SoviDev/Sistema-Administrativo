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
        fields = ['nombre']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
        }

class DepartamentoForm(forms.ModelForm):
    class Meta:
        model = Departamento
        fields = ['nombre']