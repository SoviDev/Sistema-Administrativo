# Generated by Django 5.1.7 on 2025-03-22 18:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tareas', '0003_remove_historialtarea_campo_modificado_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tarea',
            name='ultima_modificacion',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='historialtarea',
            name='accion',
            field=models.TextField(default='Acción no especificada'),
        ),
    ]
