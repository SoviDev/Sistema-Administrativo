from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Tarea, Observacion
from django.contrib.auth import get_user_model
from usuarios.models import CustomUser, Departamento


User = get_user_model()

class CustomUserCreationForm(UserCreationForm):
    """
    Formulario personalizado para la creación de usuarios.
    Extiende UserCreationForm para incluir campos adicionales.
    
    Attributes:
        email (EmailField): Campo para el correo electrónico del usuario.
        telefono (CharField): Campo para el número de teléfono del usuario.
        departamento (ModelChoiceField): Campo para seleccionar el departamento del usuario.
    """
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={'class': 'form-control'}))
    telefono = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-control'}))
    departamento = forms.ModelChoiceField(
        queryset=Departamento.objects.all(), 
        required=True, 
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2', 'telefono', 'departamento']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'password1': forms.PasswordInput(attrs={'class': 'form-control'}),
            'password2': forms.PasswordInput(attrs={'class': 'form-control'}),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
        }

class TareaForm(forms.ModelForm):
    """
    Formulario para crear nuevas tareas.
    
    Attributes:
        titulo (CharField): Título de la tarea.
        descripcion (TextField): Descripción detallada de la tarea.
        departamento (ModelChoiceField): Departamento asociado a la tarea.
        asignado_a (ModelChoiceField): Usuario asignado a la tarea.
        estado (ChoiceField): Estado actual de la tarea.
        progreso (IntegerField): Porcentaje de progreso de la tarea.
    """
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
        """
        Inicializa el formulario y configura los campos dinámicamente.
        
        Args:
            *args: Argumentos posicionales.
            **kwargs: Argumentos nombrados, incluyendo 'usuario' para validación de permisos.
        """
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
        """
        Valida que el usuario asignado pertenezca al departamento seleccionado.
        
        Returns:
            dict: Datos limpios del formulario.
            
        Raises:
            ValidationError: Si el usuario asignado no pertenece al departamento.
        """
        cleaned_data = super().clean()
        departamento = cleaned_data.get("departamento")
        asignado_a = cleaned_data.get("asignado_a")

        if asignado_a and asignado_a.departamento != departamento:
            self.add_error("asignado_a", "El usuario seleccionado no pertenece al departamento elegido.")

        return cleaned_data

    def save(self, usuario=None, commit=True):
        """
        Guarda la tarea y registra el usuario que realizó la última modificación.
        
        Args:
            usuario (User, optional): Usuario que está guardando la tarea.
            commit (bool, optional): Si se debe guardar en la base de datos.
            
        Returns:
            Tarea: La tarea guardada.
        """
        tarea = super().save(commit=False)
        if usuario:
            tarea.ultima_modificacion_por = usuario  
        if commit:
            tarea.save()
        return tarea


class TareaEditForm(forms.ModelForm):
    """
    Formulario para editar tareas existentes.
    Similar a TareaForm pero con campos específicos para edición.
    
    Attributes:
        titulo (CharField): Título de la tarea.
        descripcion (TextField): Descripción detallada de la tarea.
        departamento (ModelChoiceField): Departamento asociado a la tarea.
        asignado_a (ModelChoiceField): Usuario asignado a la tarea.
        estado (ChoiceField): Estado actual de la tarea.
        progreso (IntegerField): Porcentaje de progreso de la tarea.
    """
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
        """
        Inicializa el formulario y configura los campos dinámicamente.
        Filtra los usuarios asignables según el departamento seleccionado.
        
        Args:
            *args: Argumentos posicionales.
            **kwargs: Argumentos nombrados.
        """
        super().__init__(*args, **kwargs)

        # 🔹 Cargar los departamentos
        self.fields['departamento'].queryset = Departamento.objects.all()

        # 🔹 Obtener el ID del departamento enviado en el formulario (si existe)
        departamento_id = self.data.get('departamento') or (self.instance.departamento.id if self.instance.departamento else None)

        if departamento_id:
            try:
                departamento_id = int(departamento_id)
                self.fields['asignado_a'].queryset = CustomUser.objects.filter(departamento_id=departamento_id)
            except (ValueError, TypeError):
                self.fields['asignado_a'].queryset = CustomUser.objects.none()
        else:
            self.fields['asignado_a'].queryset = CustomUser.objects.none()


class RegistroAdminForm(CustomUserCreationForm):
    """
    Formulario para el registro de usuarios administradores.
    Extiende CustomUserCreationForm para incluir campos adicionales.
    """
    class Meta(CustomUserCreationForm.Meta):
        model = CustomUser
        fields = CustomUserCreationForm.Meta.fields + ['departamento', 'telefono']

class ObservacionForm(forms.ModelForm):
    """
    Formulario para crear observaciones en una tarea.
    """
    contenido = forms.CharField(
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': '3',
            'placeholder': 'Escribe tu observación aquí...'
        }),
        label='Observación'
    )

    class Meta:
        model = Observacion
        fields = ['contenido']
