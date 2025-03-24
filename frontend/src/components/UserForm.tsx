import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchUser, createUser, updateUser, fetchDepartments } from '../store/slices/userSlice';
import { RootState } from '../store/store';
import { Department, User, UserUpdateData, PRIVILEGES } from '../types/auth';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  TextField,
  Typography,
  Autocomplete,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  FormGroup,
} from '@mui/material';

interface FormData {
  username: string;
  email: string;
  telefono: string | null;
  departamentos_acceso: number[];
  is_active: boolean;
  es_admin: boolean;
  password: string;
  privilegios: {
    [key in keyof typeof PRIVILEGES]: boolean;
  };
}

const initialFormData: FormData = {
  username: '',
  email: '',
  telefono: null,
  departamentos_acceso: [],
  is_active: true,
  es_admin: false,
  password: '',
  privilegios: {
    TAREAS_VER: false,
    TAREAS_CREAR: false,
    TAREAS_EDITAR: false,
    BANDEJA_VER: false,
    BANDEJA_GESTIONAR: false,
    USUARIOS_ADMIN: false,
    DEPARTAMENTOS_ADMIN: false
  }
};

const UserForm: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, currentUser, departments } = useAppSelector((state: RootState) => state.users);

  const [formData, setFormData] = useState<FormData>(currentUser ? {
    username: currentUser.username,
    email: currentUser.email,
    telefono: currentUser.telefono,
    departamentos_acceso: currentUser.departamentos_acceso?.map(d => d.id) || [],
    is_active: currentUser.is_active,
    es_admin: currentUser.es_admin,
    password: '',
    privilegios: {
      TAREAS_VER: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_VER),
      TAREAS_CREAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_CREAR),
      TAREAS_EDITAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_EDITAR),
      BANDEJA_VER: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.BANDEJA_VER),
      BANDEJA_GESTIONAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.BANDEJA_GESTIONAR),
      USUARIOS_ADMIN: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.USUARIOS_ADMIN),
      DEPARTAMENTOS_ADMIN: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.DEPARTAMENTOS_ADMIN)
    }
  } : initialFormData);

  useEffect(() => {
    dispatch(fetchDepartments());
    
    if (userId) {
      dispatch(fetchUser(parseInt(userId)));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        telefono: currentUser.telefono,
        departamentos_acceso: currentUser.departamentos_acceso?.map(d => d.id) || [],
        is_active: currentUser.is_active,
        es_admin: currentUser.es_admin,
        password: '',
        privilegios: {
          TAREAS_VER: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_VER),
          TAREAS_CREAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_CREAR),
          TAREAS_EDITAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.TAREAS_EDITAR),
          BANDEJA_VER: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.BANDEJA_VER),
          BANDEJA_GESTIONAR: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.BANDEJA_GESTIONAR),
          USUARIOS_ADMIN: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.USUARIOS_ADMIN),
          DEPARTAMENTOS_ADMIN: currentUser.privilegios.some(p => p.privilegio.codigo === PRIVILEGES.DEPARTAMENTOS_ADMIN)
        }
      });
    }
  }, [currentUser]);

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartamentosChange = (_event: React.SyntheticEvent, newValue: Department[]) => {
    setFormData(prev => ({
      ...prev,
      departamentos_acceso: newValue.map(dept => dept.id)
    }));
  };

  const handlePrivilegioChange = (privilegio: keyof typeof PRIVILEGES) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      privilegios: {
        ...prev.privilegios,
        [privilegio]: e.target.checked
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: Omit<FormData, 'password' | 'privilegios'> & { password?: string } = {
        username: formData.username,
        email: formData.email,
        telefono: formData.telefono,
        departamentos_acceso: formData.departamentos_acceso,
        is_active: formData.is_active,
        es_admin: formData.es_admin,
        ...(formData.password ? { password: formData.password } : {})
      };

      if (userId) {
        await dispatch(updateUser({ id: parseInt(userId), data: userData })).unwrap();
      } else {
        await dispatch(createUser(userData)).unwrap();
      }
      navigate('/usuarios');
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  };

  const privilegeLabels: { [key in keyof typeof PRIVILEGES]: string } = {
    TAREAS_VER: 'Ver Tareas',
    TAREAS_CREAR: 'Crear Tareas',
    TAREAS_EDITAR: 'Editar Tareas',
    BANDEJA_VER: 'Ver Bandeja',
    BANDEJA_GESTIONAR: 'Gestionar Bandeja',
    USUARIOS_ADMIN: 'Administrar Usuarios',
    DEPARTAMENTOS_ADMIN: 'Administrar Departamentos'
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            {userId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
          {userId && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate(`/usuarios/${userId}/privileges`)}
            >
              Gestionar Privilegios por Departamento
            </Button>
          )}
        </Box>
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
                label="Nombre de Usuario"
                name="username"
                value={formData.username}
                onChange={handleTextFieldChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleTextFieldChange}
                required
              />
            </Grid>
            {!userId && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleTextFieldChange}
                  required={!userId}
                  helperText={!userId ? "La contraseña es requerida para nuevos usuarios" : ""}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleTextFieldChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={departments || []}
                getOptionLabel={(option: Department) => option.nombre}
                value={departments?.filter(dept => formData.departamentos_acceso.includes(dept.id)) || []}
                onChange={handleDepartamentosChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Departamentos"
                    placeholder="Seleccionar departamentos"
                  />
                )}
                renderTags={(value: Department[], getTagProps) =>
                  value.map((option: Department, index: number) => (
                    <Chip
                      variant="outlined"
                      label={option.nombre}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                sx={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Estado y Privilegios Generales
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          is_active: e.target.checked
                        }))}
                        name="is_active"
                      />
                    }
                    label="Usuario Activo"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.es_admin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          es_admin: e.target.checked
                        }))}
                        name="es_admin"
                      />
                    }
                    label="Administrador"
                  />
                </FormGroup>
                <Divider />
                <Typography variant="subtitle1" gutterBottom>
                  Privilegios Básicos
                </Typography>
                <FormGroup>
                  {(Object.keys(PRIVILEGES) as Array<keyof typeof PRIVILEGES>).map((privilegio) => (
                    <FormControlLabel
                      key={privilegio}
                      control={
                        <Switch
                          checked={formData.privilegios[privilegio]}
                          onChange={handlePrivilegioChange(privilegio)}
                          name={privilegio}
                        />
                      }
                      label={privilegeLabels[privilegio]}
                    />
                  ))}
                </FormGroup>
              </Box>
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
                  onClick={() => navigate('/usuarios')}
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

export default UserForm; 