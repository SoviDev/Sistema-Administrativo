from django.core.management.base import BaseCommand
from usuarios.models import CustomUser, Privilegio, Departamento, UsuarioPrivilegio

class Command(BaseCommand):
    help = 'Asigna todos los privilegios a un usuario específico'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username del usuario')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            # Obtener el usuario
            usuario = CustomUser.objects.get(username=username)
            
            # Obtener todos los privilegios y departamentos
            privilegios = Privilegio.objects.all()
            departamentos = Departamento.objects.all()
            
            # Asignar todos los privilegios para cada departamento
            for privilegio in privilegios:
                for departamento in departamentos:
                    UsuarioPrivilegio.objects.get_or_create(
                        usuario=usuario,
                        privilegio=privilegio,
                        departamento=departamento
                    )
            
            # Dar acceso a todos los departamentos
            usuario.departamentos_acceso.add(*departamentos)
            
            # Marcar como admin
            usuario.es_admin = True
            usuario.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Se han asignado todos los privilegios al usuario {username}')
            )
            
        except CustomUser.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'El usuario {username} no existe')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al asignar privilegios: {str(e)}')
            ) 