import React, { useState, useEffect, useCallback } from 'react';
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
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  AlertColor
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { PRIVILEGES } from '../types/auth';
import axiosInstance from '../api/axios';

interface Props {
  userId: number;
  onClose: () => void;
}

interface Privilege {
  id: number;
  codigo: keyof typeof PRIVILEGES;
  nombre: string;
}

interface Department {
  id: number;
  nombre: string;
}

interface UserPrivilege {
  privilegio: Privilege;
  departamento: Department;
}

export const UserPrivilegesManager: React.FC<Props> = ({ userId, onClose }): React.ReactElement => {
  const [privileges, setPrivileges] = useState<Privilege[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userPrivileges, setUserPrivileges] = useState<UserPrivilege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: AlertColor }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('No hay sesión activa');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [privilegesResponse, departmentsResponse, userResponse] = await Promise.all([
        axiosInstance.get('/api/privilegios/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/api/departamentos/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get(`/api/usuarios/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!Array.isArray(privilegesResponse.data)) {
        throw new Error('Error al obtener privilegios: formato de respuesta inválido');
      }
      if (!Array.isArray(departmentsResponse.data)) {
        throw new Error('Error al obtener departamentos: formato de respuesta inválido');
      }
      if (!userResponse.data || !Array.isArray(userResponse.data.privilegios)) {
        throw new Error('Error al obtener datos del usuario: formato de respuesta inválido');
      }

      setPrivileges(privilegesResponse.data);
      setDepartments(departmentsResponse.data);
      setUserPrivileges(userResponse.data.privilegios);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Error al cargar los datos. Por favor, intente nuevamente.';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrivilegeToggle = async (privilegeId: number, departmentId: number) => {
    if (saving || !token) return;

    try {
      setSaving(true);
      setError(null);
      
      const response = await axiosInstance.post(
        `/api/usuarios/${userId}/toggle_privilege/`,
        {
          privilegio_id: privilegeId,
          departamento_id: departmentId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.data || !Array.isArray(response.data.privilegios)) {
        throw new Error('Respuesta inválida del servidor');
      }

      setUserPrivileges(response.data.privilegios);
      setSnackbar({
        open: true,
        message: response.data.message || 'Privilegios actualizados correctamente',
        severity: 'success'
      });

      await fetchData();
    } catch (err: any) {
      console.error('Error al actualizar privilegios:', err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'Error al actualizar privilegios. Por favor, intente nuevamente.';
      
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!token) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No hay sesión activa. Por favor, inicie sesión nuevamente.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Administración de Privilegios
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Privilegio</TableCell>
              {departments.map((dept) => (
                <TableCell key={dept.id} align="center">{dept.nombre}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {privileges.map((priv) => (
              <TableRow key={priv.id}>
                <TableCell component="th" scope="row">
                  {priv.nombre}
                </TableCell>
                {departments.map((dept) => (
                  <TableCell key={dept.id} align="center">
                    <Checkbox
                      checked={userPrivileges.some(
                        up => up.privilegio.id === priv.id && up.departamento.id === dept.id
                      )}
                      onChange={() => handlePrivilegeToggle(priv.id, dept.id)}
                      disabled={saving}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button variant="contained" color="primary" onClick={onClose}>
        Cerrar
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPrivilegesManager; 