from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import CustomUser, Departamento
from .forms import CustomUserCreationForm, DepartamentoForm


@login_required
def lista_usuarios(request):
    usuarios = CustomUser.objects.all()
    return render(request, 'lista_usuarios.html', {'usuarios': usuarios})


@login_required
def lista_departamentos(request):
    departamentos = Departamento.objects.all()
    return render(request, 'lista_departamentos.html', {'departamentos': departamentos})


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
        form = CustomUserCreationForm(request.POST, instance=usuario)
        if form.is_valid():
            form.save()
            return redirect('lista_usuarios')
    else:
        form = CustomUserCreationForm(instance=usuario)
    return render(request, 'editar_usuario.html', {'form': form, 'usuario': usuario})


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
    return render(request, 'editar_departamento.html', {'form': form, 'departamento': departamento})