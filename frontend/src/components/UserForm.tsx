import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchUser, createUser, updateUser, fetchDepartments } from '../store/slices/userSlice';
import { RootState } from '../store/store';
import { Department, User, UserUpdateData } from '../types/auth';
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
} from '@mui/material';

interface FormData {
  username: string;
  email: string;
  telefono: string | null;
  departamentos_acceso: number[];
  is_active: boolean;
  is_superuser: boolean;
  es_admin: boolean;
  password: string;
}

const initialFormData: FormData = {
  username: '',
  email: '',
  telefono: null,
  departamentos_acceso: [],
  is_active: true,
  is_superuser: false,
  es_admin: false,
  password: ''
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
    is_superuser: currentUser.is_superuser,
    es_admin: currentUser.es_admin,
    password: ''
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
        is_superuser: currentUser.is_superuser,
        es_admin: currentUser.es_admin,
        password: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData: Omit<FormData, 'password'> & { password?: string } = {
        username: formData.username,
        email: formData.email,
        telefono: formData.telefono,
        departamentos_acceso: formData.departamentos_acceso,
        is_active: formData.is_active,
        is_superuser: formData.is_superuser,
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
          {userId ? 'Editar Usuario' : 'Nuevo Usuario'}
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