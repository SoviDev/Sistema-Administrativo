import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTask, createTask, updateTask, clearCurrentTask } from '../store/slices/taskSlice';
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
    departamento: '',
    estado: 'pendiente',
    asignado_a: null,
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTask(taskId));
    } else {
      dispatch(clearCurrentTask());
    }
  }, [dispatch, taskId]);

  useEffect(() => {
    if (!taskId) {
      setFormData({
        titulo: '',
        descripcion: '',
        departamento: '',
        estado: 'pendiente',
        asignado_a: null,
      });
    } else if (currentTask) {
      setFormData({
        titulo: currentTask.titulo,
        descripcion: currentTask.descripcion,
        departamento: currentTask.departamento.toString(),
        estado: currentTask.estado,
        asignado_a: currentTask.asignado_a?.id || null,
      });
    }
  }, [currentTask, taskId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null); // Limpiar error al cambiar algún campo
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.titulo.trim()) {
      setFormError('El título es requerido');
      return;
    }
    if (!formData.descripcion.trim()) {
      setFormError('La descripción es requerida');
      return;
    }
    if (!formData.departamento) {
      setFormError('El departamento es requerido');
      return;
    }

    try {
      // Convertir el departamento a número si es string
      const departamentoId = typeof formData.departamento === 'string' 
        ? parseInt(formData.departamento) 
        : formData.departamento;

      // Preparar los datos para enviar al backend
      const taskData: Partial<Task> = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        departamento: departamentoId,
        estado: formData.estado,
        asignado_a: formData.asignado_a ? { id: formData.asignado_a } as User : null,
      };

      if (taskId) {
        await dispatch(updateTask({ id: taskId, data: taskData })).unwrap();
      } else {
        await dispatch(createTask(taskData)).unwrap();
      }
      navigate('/tareas');
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      setFormError('Error al guardar la tarea. Por favor, intente nuevamente.');
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
        {(error || formError) && (
          <Typography color="error" gutterBottom>
            {formError || error}
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
                error={formError?.includes('título')}
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
                error={formError?.includes('descripción')}
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
                error={formError?.includes('departamento')}
              >
                <MenuItem value="">Seleccione un departamento</MenuItem>
                {user?.departamentos_acceso?.map((dept: Department) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
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