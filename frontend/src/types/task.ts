export interface User {
  id: number;
  nombre: string;
  email: string;
}

export interface Department {
  id: number;
  nombre: string;
}

export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  departamento: number;
  departamento_nombre: string;
  asignado_a: User | null;
  creador: User;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_completada?: string;
}

export interface TaskFormData {
  titulo: string;
  descripcion: string;
  estado: Task['estado'];
  departamento: number;
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