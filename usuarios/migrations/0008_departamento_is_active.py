# Generated by Django 4.2.7 on 2025-03-24 04:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_alter_customuser_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='departamento',
            name='is_active',
            field=models.BooleanField(default=True, verbose_name='¿Está activo?'),
        ),
    ]
