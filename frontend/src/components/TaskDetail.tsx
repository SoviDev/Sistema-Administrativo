import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchTask, clearCurrentTask } from '../store/slices/taskSlice';
import { RootState } from '../store/store';
import axios from '../api/axios';
import { HistorialTarea } from '../types/task';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface TaskDetailProps {
  taskId: number | null;
  open: boolean;
  onClose: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, open, onClose }) => {
  const dispatch = useAppDispatch();
  const { currentTask, loading, error } = useAppSelector((state: RootState) => state.tasks);
  const [historial, setHistorial] = useState<HistorialTarea[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  useEffect(() => {
    if (open && taskId !== null && (!currentTask || currentTask.id !== taskId)) {
      console.log('TaskDetail - Cargando tarea:', taskId);
      dispatch(fetchTask(taskId.toString()));
    }
  }, [dispatch, taskId, open, currentTask?.id]);

  useEffect(() => {
    const cargarHistorial = async () => {
      if (!taskId || !open) return;
      
      try {
        setLoadingHistorial(true);
        setErrorHistorial(null);
        console.log('TaskDetail - Cargando historial para tarea:', taskId);
        
        // Intentar primero con la ruta base
        try {
          const response = await axios.get(`/api/tareas/${taskId}/historial/`);
          console.log('TaskDetail - Historial recibido:', response.data);
          setHistorial(response.data);
        } catch (error) {
          // Si falla, intentar con la ruta alternativa
          console.log('TaskDetail - Intentando ruta alternativa para historial');
          const altResponse = await axios.get(`/tareas/${taskId}/historial/`);
          console.log('TaskDetail - Historial recibido (ruta alternativa):', altResponse.data);
          setHistorial(altResponse.data);
        }
      } catch (error) {
        console.error('Error al cargar el historial:', error);
        setErrorHistorial('No se pudo cargar el historial');
      } finally {
        setLoadingHistorial(false);
      }
    };

    if (currentTask?.id) {
      cargarHistorial();
    }
  }, [currentTask?.id, taskId, open]);

  useEffect(() => {
    return () => {
      if (!open) {
        dispatch(clearCurrentTask());
        setHistorial([]);
      }
    };
  }, [dispatch, open]);

  if (!taskId) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Detalles de la Tarea</Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box p={3}>
            <Typography color="error">
              {error || 'No se pudo cargar la tarea'}
            </Typography>
          </Box>
        ) : currentTask ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                {currentTask.titulo}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Estado
              </Typography>
              <Typography variant="body1">
                {currentTask.estado_display || currentTask.estado}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Departamento
              </Typography>
              <Typography variant="body1">
                {currentTask.departamento_nombre}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Descripción
              </Typography>
              <Typography variant="body1" paragraph>
                {currentTask.descripcion}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Asignado a
              </Typography>
              <Typography variant="body1">
                {currentTask.asignado_a?.username || 'No asignado'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">
                Fecha de Creación
              </Typography>
              <Typography variant="body1">
                {new Date(currentTask.fecha_creacion).toLocaleDateString()}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Historial de Cambios
              </Typography>
              {loadingHistorial ? (
                <Box display="flex" justifyContent="center" alignItems="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : errorHistorial ? (
                <Box p={2}>
                  <Typography color="error">
                    {errorHistorial}
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Acción</TableCell>
                        <TableCell>Usuario</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historial.length > 0 ? (
                        historial.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.fecha_hora).toLocaleString()}
                            </TableCell>
                            <TableCell>{item.accion}</TableCell>
                            <TableCell>{item.usuario_nombre || 'Sistema'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography color="textSecondary">
                              No hay registros en el historial de esta tarea.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetail; 