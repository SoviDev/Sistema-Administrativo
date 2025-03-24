import React, { useEffect } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTasks } from '../store/slices/taskSlice';
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

const TaskHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error } = useAppSelector((state) => state.tasks);

  useEffect(() => {
    dispatch(fetchTasks({ historial: true }));
  }, [dispatch]);

  const handleViewTask = (taskId: number) => {
    navigate(`/tareas/${taskId}`);
  };

  if (loading) {
    return <Box display="flex" justifyContent="center"><Typography>Cargando...</Typography></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const completedTasks = tasks.filter((task) => 
    task.estado === 'completada' || task.estado === 'cancelada'
  );

  return (
    <Box>
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
                <TableCell>Fecha de Creación</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.titulo}</TableCell>
                  <TableCell>{task.departamento_nombre}</TableCell>
                  <TableCell>
                    {task.asignado_a?.nombre || 'No asignado'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.estado.charAt(0).toUpperCase() + task.estado.slice(1)}
                      color={getEstadoColor(task.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(task.fecha_creacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewTask(task.id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {completedTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay tareas completadas o canceladas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default TaskHistory; 