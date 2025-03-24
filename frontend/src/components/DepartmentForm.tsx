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
  Alert,
} from '@mui/material';

interface FormData {
  nombre: string;
  tiene_bandeja: boolean;
  servidor_entrante: string | null;
  servidor_saliente: string | null;
  puerto_entrante: number | null;
  puerto_saliente: number | null;
  usuario_correo: string | null;
  password_correo: string | null;
  usar_tls: boolean;
  usar_ssl: boolean;
  is_active: boolean;
}

const DepartmentForm: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentDepartment, loading, error } = useAppSelector((state: RootState) => state.departments);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tiene_bandeja: false,
    servidor_entrante: null,
    servidor_saliente: null,
    puerto_entrante: null,
    puerto_saliente: null,
    usuario_correo: null,
    password_correo: null,
    usar_tls: false,
    usar_ssl: false,
    is_active: true,
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
        is_active: currentDepartment.is_active,
      });
    }
  }, [currentDepartment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : parseInt(value, 10)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos requeridos si tiene bandeja
    if (formData.tiene_bandeja) {
      const camposRequeridos = [
        'servidor_entrante',
        'servidor_saliente',
        'puerto_entrante',
        'puerto_saliente',
        'usuario_correo',
        'password_correo'
      ];

      const camposFaltantes = camposRequeridos.filter(campo => !formData[campo as keyof FormData]);

      if (camposFaltantes.length > 0) {
        alert('Por favor complete todos los campos requeridos para la configuración de la bandeja');
        return;
      }
    }

    try {
      if (departmentId) {
        await dispatch(updateDepartment({ id: parseInt(departmentId), data: formData })).unwrap();
      } else {
        await dispatch(createDepartment(formData)).unwrap();
      }
      navigate('/departamentos');
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
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
            {formData.tiene_bandeja && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Servidor Entrante"
                    name="servidor_entrante"
                    value={formData.servidor_entrante || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Servidor Saliente"
                    name="servidor_saliente"
                    value={formData.servidor_saliente || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Puerto Entrante"
                    name="puerto_entrante"
                    value={formData.puerto_entrante || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Puerto Saliente"
                    name="puerto_saliente"
                    value={formData.puerto_saliente || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Usuario Correo"
                    name="usuario_correo"
                    value={formData.usuario_correo || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Contraseña Correo"
                    name="password_correo"
                    value={formData.password_correo || ''}
                    onChange={handleChange}
                    required={formData.tiene_bandeja}
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
              </>
            )}
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
                  onClick={() => navigate('/departamentos')}
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