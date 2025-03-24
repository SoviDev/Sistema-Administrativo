import { Task, TaskFilters } from './task';

export interface Department {
  id: number;
  nombre: string;
  tiene_bandeja: boolean;
  servidor_entrante: string | null;
  servidor_saliente: string | null;
  puerto_entrante: number | null;
  puerto_saliente: number | null;
  usuario_correo: string | null;
  password_correo: string | null;
  usar_tls: boolean;
  usar_ssl: boolean;
  is_active: boolean;
}

export enum PRIVILEGES {
  TAREAS_VER = 'TAREAS_VER',
  TAREAS_CREAR = 'TAREAS_CREAR',
  TAREAS_EDITAR = 'TAREAS_EDITAR',
  BANDEJA_VER = 'BANDEJA_VER',
  BANDEJA_GESTIONAR = 'BANDEJA_GESTIONAR',
  USUARIOS_ADMIN = 'USUARIOS_ADMIN',
  DEPARTAMENTOS_ADMIN = 'DEPARTAMENTOS_ADMIN'
}

export type PrivilegeCode = keyof typeof PRIVILEGES;

export interface Privilege {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface UserPrivilege {
  id: number;
  privilegio: Privilege;
  departamento: Department;
}

export interface User {
  id: number;
  username: string;
  email: string;
  telefono: string | null;
  es_admin: boolean;
  is_active: boolean;
  is_superuser: boolean;
  privilegios: UserPrivilege[];
  departamentos_acceso: Department[];
  debe_cambiar_password: boolean;
  ultimo_ingreso?: string;
}

export interface UserUpdateData extends Omit<Partial<User>, 'departamentos_acceso'> {
  departamentos_acceso?: number[];
  telefono: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ValidationResponse {
  user: User;
}

export interface RootState {
  auth: AuthState;
  departments: {
    departments: Department[];
    currentDepartment: Department | null;
    selectedDepartment: Department | null;
    loading: boolean;
    error: string | null;
  };
  users: {
    users: User[];
    currentUser: User | null;
    departments: Department[];
    loading: boolean;
    error: string | null;
  };
  tasks: {
    tasks: Task[];
    currentTask: Task | null;
    loading: boolean;
    error: string | null;
    filters: TaskFilters;
  };
} 