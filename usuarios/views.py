from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import CustomUser, Departamento
from .forms import CustomUserCreationForm, DepartamentoForm
from django.contrib import messages
from django.contrib.auth.hashers import make_password

@login_required
def lista_usuarios(request):
    usuarios = CustomUser.objects.all()
    return render(request, 'usuarios/lista_usuarios.html', {'usuarios': usuarios})


@login_required
def lista_departamentos(request):
    departamentos = Departamento.objects.all()
    return render(request, 'usuarios/lista_departamentos.html', {'departamentos': departamentos})


@login_required
def registro_admin(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('usuarios:lista_usuarios')  # Redirige a la lista de usuarios
    else:
        form = CustomUserCreationForm()
    return render(request, 'usuarios/registro_admin.html', {'form': form})

@login_required
def editar_usuario(request, usuario_id):
    usuario = get_object_or_404(CustomUser, id=usuario_id)

    if request.method == "POST":
        for campo, valor in request.POST.items():
            if campo in ["username", "email", "telefono", "departamento"]:
                if campo == "departamento" and valor:
                    try:
                        departamento = Departamento.objects.get(id=valor)
                        usuario.departamento = departamento
                    except Departamento.DoesNotExist:
                        messages.error(request, "⚠️ El departamento seleccionado no existe.")
                        return render(request, "usuarios/editar_usuario.html", {"usuario": usuario})

                else:
                    setattr(usuario, campo, valor)

        # 🔹 Solo un superusuario puede cambiar `is_superuser`
        if request.user.is_superuser:
            usuario.is_superuser = "es_admin" in request.POST  # Convierte en superusuario si está marcado

        usuario.save()
        messages.success(request, "✅ Usuario actualizado correctamente.")
        return redirect("usuarios:lista_usuarios")

    departamentos = Departamento.objects.all()

    return render(request, "usuarios/editar_usuario.html", {
        "usuario": usuario,
        "departamentos": departamentos,
    })

@login_required
def editar_departamento(request, departamento_id):
    departamento = get_object_or_404(Departamento, id=departamento_id)
    if request.method == "POST":
        form = DepartamentoForm(request.POST, instance=departamento)
        if form.is_valid():
            form.save()
            return redirect('usuarios:lista_departamentos')
    else:
        form = DepartamentoForm(instance=departamento)
    return render(request, 'usuarios/editar_departamento.html', {'form': form, 'departamento': departamento})

@login_required    
def crear_departamento(request):
    if request.method == 'POST':
        form = DepartamentoForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('usuarios:lista_departamentos')
    else:
        form = DepartamentoForm()

    return render(request, 'usuarios/crear_departamento.html', {'form': form})
    departamento = get_object_or_404(Departamento, id=departamento_id)
    if request.method == "POST":
        form = DepartamentoForm(request.POST, instance=departamento)
        if form.is_valid():
            form.save()
            return redirect('usuarios:lista_departamentos')
    else:
        form = DepartamentoForm(instance=departamento)
    return render(request, 'editar_departamento.html', {'form': form, 'departamento': departamento})

@login_required
def restablecer_contrasena(request, usuario_id):
    # Solo los superusuarios pueden cambiar contraseñas de otros usuarios
    if not request.user.is_superuser:
        messages.error(request, "❌ No tienes permiso para realizar esta acción.")
        return redirect("usuarios:lista_usuarios")

    usuario = get_object_or_404(CustomUser, id=usuario_id)

    if request.method == "POST":
        nueva_contrasena = request.POST.get("nueva_contrasena")
        confirmar_contrasena = request.POST.get("confirmar_contrasena")

        if nueva_contrasena and nueva_contrasena == confirmar_contrasena:
            usuario.password = make_password(nueva_contrasena)  # Encriptar contraseña
            usuario.save()
            messages.success(request, f"✅ La contraseña de {usuario.username} se ha restablecido.")
            return redirect("usuarios:lista_usuarios")
        else:
            messages.error(request, "⚠️ Las contraseñas no coinciden. Inténtalo de nuevo.")

    return render(request, "usuarios/restablecer_contrasena.html", {"usuario": usuario})