import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTask, createTask, updateTask } from '../store/slices/taskSlice';
import { RootState } from '../store/store';
import { Department, User } from '../types/auth';
import { usePrivileges } from '../hooks/usePrivileges';
import { Task, TaskFormData } from '../types/task';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';

const TaskForm: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, currentTask } = useAppSelector((state: RootState) => state.tasks);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { hasPrivilege } = usePrivileges();

  const [formData, setFormData] = useState<TaskFormData>({
    titulo: '',
    descripcion: '',
    departamento: 0,
    estado: 'pendiente',
    asignado_a: null,
  });

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTask(taskId));
    }
  }, [dispatch, taskId]);

  useEffect(() => {
    if (currentTask) {
      setFormData({
        titulo: currentTask.titulo,
        descripcion: currentTask.descripcion,
        departamento: currentTask.departamento,
        estado: currentTask.estado,
        asignado_a: currentTask.asignado_a?.id || null,
      });
    }
  }, [currentTask]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Usar aserción de tipos directamente al tipo esperado por Task
      const taskData: Partial<Task> = {
        ...formData,
        // Aserción directa al tipo esperado por Task
        asignado_a: formData.asignado_a 
          ? { 
              id: formData.asignado_a,
              nombre: '',     // Campos requeridos por User en Task
              email: '',
            } as any       // Usar 'any' para evitar incompatibilidades
          : null,
      };

      if (taskId) {
        await dispatch(updateTask({ id: taskId, data: taskData })).unwrap();
      } else {
        await dispatch(createTask(taskData)).unwrap();
      }
      navigate('/tareas');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {taskId ? 'Editar Tarea' : 'Nueva Tarea'}
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                required
              >
                {user?.departamentos_acceso?.map((dept: Department) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completada">Completada</MenuItem>
                <MenuItem value="cancelada">Cancelada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Guardar'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tareas')}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TaskForm; 