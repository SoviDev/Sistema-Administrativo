import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { RootState } from '../store';
import { Task, TaskFormData, TaskFilters } from '../../types/task';

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type TaskPriority = 'baja' | 'normal' | 'alta' | 'urgente';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  filters: {
    estado: undefined,
    departamento: undefined,
    asignado_a: undefined,
    historial: undefined,
  },
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: TaskFilters = {}, { rejectWithValue }) => {
    try {
      let endpoint = '/tareas/';
      
      const response = await axios.get(endpoint, { 
        params: {
          ...filters,
          ordering: filters.historial ? '-fecha_completada,-fecha_actualizacion' : '-fecha_creacion'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cargar las tareas');
    }
  }
);

export const fetchTask = createAsyncThunk(
  'tasks/fetchTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      console.log('taskSlice - Iniciando fetchTask:', { taskId });
      const response = await axios.get(`/tareas/${taskId}/`);
      
      console.log('taskSlice - Respuesta completa:', response);
      console.log('taskSlice - Datos de la tarea:', {
        id: response.data.id,
        titulo: response.data.titulo,
        historial: response.data.historial,
        historialLength: response.data.historial?.length || 0
      });
      
      return response.data;
    } catch (error: any) {
      console.error('taskSlice - Error en fetchTask:', {
        error,
        response: error.response,
        message: error.message
      });
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data?.detail || 
        'Error al cargar la tarea'
      );
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Partial<Task>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/tareas/', taskData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear la tarea');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }: { id: string; data: Partial<Task> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/tareas/${id}/`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al actualizar la tarea');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: number, { rejectWithValue }) => {
    try {
      await axios.delete(`/tareas/${taskId}/`);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar la tarea');
    }
  }
);

export const changeTaskStatus = createAsyncThunk(
  'tasks/changeTaskStatus',
  async ({ taskId, status }: { taskId: number; status: string }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/tareas/${taskId}/status/`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al cambiar el estado de la tarea');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.tasks = [];
      })
      .addCase(fetchTask.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentTask = null;
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.currentTask = action.payload;
      })
      .addCase(fetchTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.currentTask = null;
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changeTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload;
        }
      })
      .addCase(changeTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearError, clearCurrentTask } = taskSlice.actions;

export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectCurrentTask = (state: RootState) => state.tasks.currentTask;
export const selectTaskLoading = (state: RootState) => state.tasks.loading;
export const selectTaskError = (state: RootState) => state.tasks.error;
export const selectTaskFilters = (state: RootState) => state.tasks.filters;

export default taskSlice.reducer; 