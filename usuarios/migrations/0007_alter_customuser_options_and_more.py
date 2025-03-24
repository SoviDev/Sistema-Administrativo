# Generated by Django 4.2.7 on 2025-03-24 04:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0006_alter_usuarioprivilegio_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='customuser',
            options={'ordering': ['username'], 'verbose_name': 'Usuario', 'verbose_name_plural': 'Usuarios'},
        ),
        migrations.AddField(
            model_name='customuser',
            name='debe_cambiar_password',
            field=models.BooleanField(default=False, help_text='Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión'),
        ),
    ]
