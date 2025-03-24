import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchDepartments, toggleDepartmentActive } from '../store/slices/departmentSlice';
import { RootState } from '../store/store';
import { Department } from '../types/auth';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { departments, loading, error } = useAppSelector((state: RootState) => state.departments);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [departmentToToggle, setDepartmentToToggle] = useState<Department | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleEdit = (id: number) => {
    navigate(`/departamentos/editar/${id}`);
  };

  const handleCreate = () => {
    navigate('/departamentos/nuevo');
  };

  const handleToggleClick = (department: Department) => {
    setDepartmentToToggle(department);
    setToggleDialogOpen(true);
  };

  const handleToggleConfirm = async () => {
    if (departmentToToggle) {
      try {
        await dispatch(toggleDepartmentActive(departmentToToggle.id)).unwrap();
        setSnackbarMessage(`Departamento ${departmentToToggle.is_active ? 'desactivado' : 'activado'} correctamente`);
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Error al cambiar el estado del departamento');
        setSnackbarOpen(true);
      }
    }
    setToggleDialogOpen(false);
    setDepartmentToToggle(null);
  };

  const handleToggleCancel = () => {
    setToggleDialogOpen(false);
    setDepartmentToToggle(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Departamentos</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
        >
          Nuevo Departamento
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Bandeja</TableCell>
              <TableCell>Servidor Entrante</TableCell>
              <TableCell>Servidor Saliente</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay departamentos registrados
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department: Department) => (
                <TableRow 
                  key={department.id}
                  sx={{ 
                    opacity: department.is_active ? 1 : 0.6,
                    bgcolor: department.is_active ? 'inherit' : 'action.hover'
                  }}
                >
                  <TableCell>{department.nombre}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={department.is_active ? 'Activo' : 'Inactivo'}
                      color={department.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {department.tiene_bandeja ? (
                      <Tooltip title="Tiene bandeja configurada">
                        <CheckCircleIcon color="success" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Sin bandeja configurada">
                        <CancelIcon color="error" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {department.tiene_bandeja ? department.servidor_entrante : '-'}
                  </TableCell>
                  <TableCell>
                    {department.tiene_bandeja ? department.servidor_saliente : '-'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Editar departamento">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(department.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={department.is_active ? 'Desactivar departamento' : 'Activar departamento'}>
                        <IconButton
                          size="small"
                          color={department.is_active ? 'error' : 'success'}
                          onClick={() => handleToggleClick(department)}
                        >
                          {department.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={toggleDialogOpen}
        onClose={handleToggleCancel}
      >
        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea {departmentToToggle?.is_active ? 'desactivar' : 'activar'} el departamento "{departmentToToggle?.nombre}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleToggleCancel}>Cancelar</Button>
          <Button 
            onClick={handleToggleConfirm} 
            color={departmentToToggle?.is_active ? 'error' : 'success'} 
            variant="contained"
          >
            {departmentToToggle?.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default DepartmentList; 