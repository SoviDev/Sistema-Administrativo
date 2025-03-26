import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTasks } from '../store/slices/taskSlice';
import TaskDetail from './TaskDetail';

const getEstadoColor = (estado: string) => {
  switch (estado.toLowerCase()) {
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

const TaskHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector((state) => state.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  useEffect(() => {
    // Llamar al endpoint específico para el historial
    dispatch(fetchTasks({ historial: true }));
  }, [dispatch]);

  const handleViewTask = (taskId: number) => {
    setSelectedTaskId(taskId);
  };

  const handleCloseDetail = () => {
    setSelectedTaskId(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!tasks.length) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Historial de Tareas
          </Typography>
          <Typography color="textSecondary" align="center">
            No hay tareas completadas o canceladas
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Historial de Tareas
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Asignado a</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha de Completado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id}
                  onClick={() => handleViewTask(task.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <TableCell>{task.titulo}</TableCell>
                  <TableCell>{task.departamento_nombre}</TableCell>
                  <TableCell>
                    {task.asignado_a?.username || 'No asignado'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.estado_display || task.estado.charAt(0).toUpperCase() + task.estado.slice(1)}
                      color={getEstadoColor(task.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.fecha_completada 
                      ? new Date(task.fecha_completada).toLocaleDateString()
                      : new Date(task.fecha_actualizacion).toLocaleDateString()
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TaskDetail
        taskId={selectedTaskId}
        open={selectedTaskId !== null}
        onClose={handleCloseDetail}
      />
    </Box>
  );
};

export default TaskHistory; 