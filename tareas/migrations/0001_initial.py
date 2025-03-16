# Generated by Django 5.1.7 on 2025-03-16 00:42

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='HistorialTarea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accion', models.TextField()),
                ('fecha_hora', models.DateTimeField(auto_now_add=True)),
            ],
        ),
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
            ],
        ),
    ]
