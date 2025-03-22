# Generated by Django 5.1.7 on 2025-03-22 04:01

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('usuarios', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tarea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=255)),
                ('descripcion', models.TextField()),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('en_progreso', 'En Progreso'), ('completada', 'Completada'), ('cancelada', 'Cancelada')], default='pendiente', max_length=20)),
                ('progreso', models.IntegerField(blank=True, default=0, null=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('fecha_completada', models.DateTimeField(blank=True, null=True)),
                ('ultima_modificacion', models.DateTimeField(auto_now=True)),
                ('asignado_a', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tareas_asignadas', to=settings.AUTH_USER_MODEL)),
                ('creador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tareas_creadas', to=settings.AUTH_USER_MODEL)),
                ('departamento', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='usuarios.departamento')),
            ],
        ),
        migrations.CreateModel(
            name='HistorialTarea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accion', models.TextField()),
                ('fecha_hora', models.DateTimeField(auto_now_add=True)),
                ('usuario', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('tarea', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historial', to='tareas.tarea')),
            ],
        ),
    ]
