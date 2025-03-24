import { useAppSelector } from './useAppSelector';
import { Department, User, UserPrivilege } from '../types/auth';
import { RootState } from '../store/store';

export const usePrivileges = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { selectedDepartment } = useAppSelector((state: RootState) => state.departments);

  const hasPrivilege = (privilegeCode: string): boolean => {
    if (!user) return false;
    
    // Si es superusuario o admin, tiene todos los privilegios
    if (user.is_superuser || user.es_admin) return true;

    // Si no hay departamento seleccionado, verificar si tiene el privilegio en cualquier departamento
    if (!selectedDepartment) {
      return user.privilegios.some((up: UserPrivilege) => up.privilegio.codigo === privilegeCode);
    }

    // Verificar si tiene el privilegio en el departamento seleccionado
    return user.privilegios.some(
      (up: UserPrivilege) => up.privilegio.codigo === privilegeCode && 
      up.departamento.id === selectedDepartment.id
    );
  };

  const hasAnyPrivilege = (privilegeCodes: string[]): boolean => {
    return privilegeCodes.some(code => hasPrivilege(code));
  };

  const getDepartmentsWithPrivilege = (privilegeCode: string): Department[] => {
    if (!user) return [];
    
    // Si es superusuario o admin, retorna todos los departamentos accesibles
    if (user.is_superuser || user.es_admin) return user.departamentos_acceso;

    // Filtrar departamentos donde el usuario tiene el privilegio específico
    return user.departamentos_acceso.filter((dept: Department) => 
      user.privilegios.some(
        (up: UserPrivilege) => up.privilegio.codigo === privilegeCode && 
        up.departamento.id === dept.id
      )
    );
  };

  const getAccessibleDepartments = (): Department[] => {
    if (!user) return [];
    return user.departamentos_acceso;
  };

  return {
    hasPrivilege,
    hasAnyPrivilege,
    getDepartmentsWithPrivilege,
    getAccessibleDepartments,
  };
}; 