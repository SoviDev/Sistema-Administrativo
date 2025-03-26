import { User } from './auth';

export interface Department {
  id: number;
  nombre: string;
}

export interface HistorialTarea {
  id: number;
  tarea: number;
  usuario: User | null;
  usuario_nombre: string | null;
  accion: string;
  fecha_hora: string;
}

export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  estado_display: string;
  departamento: number;
  departamento_nombre: string;
  asignado_a: User | null;
  creador: User;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_completada?: string;
  historial: HistorialTarea[];
}

export interface TaskFormData {
  titulo: string;
  descripcion: string;
  departamento: string | number;
  estado: string;
  asignado_a: number | null;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

export interface TaskFilters {
  estado?: string;
  departamento?: number;
  asignado_a?: number;
  historial?: boolean;
}

export interface UpdateTaskPayload {
  id: string;
  data: TaskFormData;
}

export interface ChangeTaskStatusPayload {
  taskId: number;
  estado: Task['estado'];
} 