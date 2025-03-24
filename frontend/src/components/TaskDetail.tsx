import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTask } from '../store/slices/taskSlice';
import { usePrivileges } from '../hooks/usePrivileges';
import { Task } from '../types/task';

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'completada':
      return 'success';
    case 'cancelada':
      return 'error';
    case 'en_progreso':
      return 'warning';
    default:
      return 'default';
  }
};

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTask, loading, error } = useAppSelector((state) => state.tasks);
  const { hasPrivilege } = usePrivileges();

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTask(taskId));
    }
  }, [dispatch, taskId]);

  if (loading) {
    return <Box display="flex" justifyContent="center"><Typography>Cargando...</Typography></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentTask) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">No se encontró la tarea</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/tareas')}
            >
              Volver
            </Button>
            <Typography variant="h5" component="h2">
              {currentTask.titulo}
            </Typography>
          </Box>
          {hasPrivilege('TAREAS_EDITAR') && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/tareas/${taskId}/editar`)}
            >
              Editar
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">Estado</Typography>
            <Chip
              label={currentTask.estado.charAt(0).toUpperCase() + currentTask.estado.slice(1)}
              color={getEstadoColor(currentTask.estado) as any}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">Descripción</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {currentTask.descripcion}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Departamento</Typography>
            <Typography variant="body1">{currentTask.departamento_nombre}</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Asignado a</Typography>
            <Typography variant="body1">
              {currentTask.asignado_a?.nombre || 'No asignado'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Creado por</Typography>
            <Typography variant="body1">{currentTask.creador.nombre}</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Fecha de Creación</Typography>
            <Typography variant="body1">
              {new Date(currentTask.fecha_creacion).toLocaleDateString()}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight="bold">Última Actualización</Typography>
            <Typography variant="body1">
              {new Date(currentTask.fecha_actualizacion).toLocaleDateString()}
            </Typography>
          </Grid>

          {currentTask.fecha_completada && (
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" fontWeight="bold">Fecha de Completado</Typography>
              <Typography variant="body1">
                {new Date(currentTask.fecha_completada).toLocaleDateString()}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default TaskDetail; 