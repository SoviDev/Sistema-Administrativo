import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTasks, deleteTask } from '../store/slices/taskSlice';
import { RootState } from '../store/store';
import { Department } from '../types/auth';
import { usePrivileges } from '../hooks/usePrivileges';
import { Task, TaskFilters } from '../types/task';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  MenuItem,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector((state: RootState) => state.tasks);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { hasPrivilege } = usePrivileges();

  const [filters, setFilters] = useState<TaskFilters>({
    estado: undefined,
    departamento: undefined,
    asignado_a: undefined,
  });

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  const handleDelete = async (taskId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
      } catch (error) {
        console.error('Error al eliminar tarea:', error);
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
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
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Lista de Tareas</Typography>
        {hasPrivilege('task_create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/new')}
          >
            Nueva Tarea
          </Button>
        )}
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Estado"
              name="estado"
              value={filters.estado || ''}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="en_progreso">En Progreso</MenuItem>
              <MenuItem value="completada">Completada</MenuItem>
              <MenuItem value="cancelada">Cancelada</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Departamento"
              name="departamento"
              value={filters.departamento || ''}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {user?.departamentos_acceso?.map((dept: Department) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Asignado a</TableCell>
              <TableCell>Fecha de Creación</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.titulo}</TableCell>
                <TableCell>{task.departamento_nombre}</TableCell>
                <TableCell>{task.estado}</TableCell>
                <TableCell>{task.asignado_a?.nombre || 'No asignado'}</TableCell>
                <TableCell>{new Date(task.fecha_creacion).toLocaleDateString()}</TableCell>
                <TableCell>
                  {hasPrivilege('task_update') && (
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/tasks/${task.id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {hasPrivilege('task_delete') && (
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(task.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TaskList; 