# Generated by Django 5.1.7 on 2025-03-23 01:13

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('usuarios', '0002_alter_customuser_options_customuser_ultimo_ingreso'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Correo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('remitente', models.EmailField(max_length=254)),
                ('asunto', models.CharField(max_length=200)),
                ('contenido', models.TextField()),
                ('fecha_recepcion', models.DateTimeField(auto_now_add=True)),
                ('estado', models.CharField(choices=[('nuevo', 'Nuevo'), ('en_proceso', 'En Proceso'), ('respondido', 'Respondido'), ('archivado', 'Archivado')], default='nuevo', max_length=20)),
                ('prioridad', models.CharField(choices=[('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta'), ('urgente', 'Urgente')], default='media', max_length=20)),
                ('adjuntos', models.FileField(blank=True, null=True, upload_to='correos/adjuntos/')),
                ('asignado_a', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('creado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='correos_creados', to=settings.AUTH_USER_MODEL)),
                ('departamento_destino', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='usuarios.departamento')),
            ],
            options={
                'verbose_name': 'Correo',
                'verbose_name_plural': 'Correos',
                'ordering': ['-fecha_recepcion'],
            },
        ),
        migrations.CreateModel(
            name='HistorialCorreo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_cambio', models.CharField(choices=[('creacion', 'Creación'), ('asignacion', 'Asignación'), ('traslado', 'Traslado'), ('estado', 'Cambio de Estado'), ('respuesta', 'Respuesta')], max_length=20)),
                ('descripcion', models.TextField()),
                ('fecha_cambio', models.DateTimeField(auto_now_add=True)),
                ('correo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historial', to='bandeja_entrada.correo')),
                ('usuario', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Historial',
                'verbose_name_plural': 'Historiales',
                'ordering': ['-fecha_cambio'],
            },
        ),
        migrations.CreateModel(
            name='RespuestaCorreo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contenido', models.TextField()),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('adjuntos', models.FileField(blank=True, null=True, upload_to='correos/respuestas/')),
                ('correo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='respuestas', to='bandeja_entrada.correo')),
                ('creado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Respuesta',
                'verbose_name_plural': 'Respuestas',
                'ordering': ['fecha_creacion'],
            },
        ),
    ]
