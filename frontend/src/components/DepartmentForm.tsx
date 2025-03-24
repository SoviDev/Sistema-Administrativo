import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchDepartment, createDepartment, updateDepartment } from '../store/slices/departmentSlice';
import { RootState } from '../store/store';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';

interface FormData {
  nombre: string;
  tiene_bandeja: boolean;
  servidor_entrante: string;
  servidor_saliente: string;
  puerto_entrante: number;
  puerto_saliente: number;
  usuario_correo: string;
  password_correo: string;
  usar_tls: boolean;
  usar_ssl: boolean;
}

const DepartmentForm: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDepartment, loading, error } = useAppSelector((state: RootState) => state.departments);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tiene_bandeja: false,
    servidor_entrante: '',
    servidor_saliente: '',
    puerto_entrante: 0,
    puerto_saliente: 0,
    usuario_correo: '',
    password_correo: '',
    usar_tls: false,
    usar_ssl: false,
  });

  useEffect(() => {
    if (departmentId) {
      dispatch(fetchDepartment(parseInt(departmentId)));
    }
  }, [dispatch, departmentId]);

  useEffect(() => {
    if (currentDepartment) {
      setFormData({
        nombre: currentDepartment.nombre,
        tiene_bandeja: currentDepartment.tiene_bandeja,
        servidor_entrante: currentDepartment.servidor_entrante,
        servidor_saliente: currentDepartment.servidor_saliente,
        puerto_entrante: currentDepartment.puerto_entrante,
        puerto_saliente: currentDepartment.puerto_saliente,
        usuario_correo: currentDepartment.usuario_correo,
        password_correo: currentDepartment.password_correo,
        usar_tls: currentDepartment.usar_tls,
        usar_ssl: currentDepartment.usar_ssl,
      });
    }
  }, [currentDepartment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (departmentId) {
        await dispatch(updateDepartment({ id: parseInt(departmentId), data: formData })).unwrap();
      } else {
        await dispatch(createDepartment(formData)).unwrap();
      }
      navigate('/departments');
    } catch (error) {
      console.error('Error al guardar departamento:', error);
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
          {departmentId ? 'Editar Departamento' : 'Nuevo Departamento'}
        </Typography>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.tiene_bandeja}
                    onChange={handleChange}
                    name="tiene_bandeja"
                  />
                }
                label="Tiene Bandeja"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Servidor Entrante"
                name="servidor_entrante"
                value={formData.servidor_entrante}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Servidor Saliente"
                name="servidor_saliente"
                value={formData.servidor_saliente}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Puerto Entrante"
                name="puerto_entrante"
                value={formData.puerto_entrante}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Puerto Saliente"
                name="puerto_saliente"
                value={formData.puerto_saliente}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Usuario Correo"
                name="usuario_correo"
                value={formData.usuario_correo}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="Contraseña Correo"
                name="password_correo"
                value={formData.password_correo}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.usar_tls}
                    onChange={handleChange}
                    name="usar_tls"
                  />
                }
                label="Usar TLS"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.usar_ssl}
                    onChange={handleChange}
                    name="usar_ssl"
                  />
                }
                label="Usar SSL"
              />
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
                  onClick={() => navigate('/departments')}
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

export default DepartmentForm; 