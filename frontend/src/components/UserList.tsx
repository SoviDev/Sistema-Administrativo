import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchUsers, resetUserPassword, toggleUserStatus } from '../store/slices/userSlice';
import { RootState, User } from '../types/auth';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  DialogContentText,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface ResetPasswordResponse {
  status: string;
  message: string;
  temp_password: string;
}

interface SelectedUser {
  id: number;
  username: string;
  action: 'activate' | 'deactivate' | 'reset';
}

const UserList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { users, loading, error } = useAppSelector((state: RootState) => state.users);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleEdit = (id: number) => {
    navigate(`/usuarios/editar/${id}`);
  };

  const handleCreate = () => {
    navigate('/usuarios/nuevo');
  };

  const handleAction = async () => {
    if (!selectedUser) return;

    try {
      switch (selectedUser.action) {
        case 'activate':
        case 'deactivate':
          await dispatch(toggleUserStatus(selectedUser.id)).unwrap();
          setSelectedUser(null);
          break;
        case 'reset':
          const result = await dispatch(resetUserPassword(selectedUser.id)).unwrap() as ResetPasswordResponse;
          console.log('Reset password response:', result);
          console.log('Response type:', typeof result);
          console.log('Response keys:', Object.keys(result));
          console.log('Temp password value:', result.temp_password);
          if (result.status === 'success') {
            setTempPassword(result.temp_password);
          }
          break;
      }
    } catch (error) {
      console.error('Error al realizar la acción:', error);
      setSelectedUser(null);
    }
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setTempPassword(null);
  };

  const getDialogTitle = () => {
    if (!selectedUser) return '';
    switch (selectedUser.action) {
      case 'activate':
        return 'Activar Usuario';
      case 'deactivate':
        return 'Desactivar Usuario';
      case 'reset':
        return tempPassword ? 'Contraseña Temporal' : 'Resetear Contraseña';
      default:
        return '';
    }
  };

  const getDialogContent = () => {
    if (!selectedUser) return '';
    switch (selectedUser.action) {
      case 'activate':
        return `¿Está seguro que desea activar al usuario ${selectedUser.username}?`;
      case 'deactivate':
        return `¿Está seguro que desea desactivar al usuario ${selectedUser.username}?`;
      case 'reset':
        return `¿Está seguro que desea resetear la contraseña del usuario ${selectedUser.username}?`;
      default:
        return '';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Usuarios</Typography>
        <Tooltip title="Nuevo Usuario">
          <IconButton 
            color="primary" 
            onClick={handleCreate}
            sx={{ 
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.telefono || '-'}</TableCell>
                  <TableCell>
                    {user.departamentos_acceso?.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.departamentos_acceso.map((dept) => (
                          <Chip
                            key={dept.id}
                            label={dept.nombre}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Activo' : 'Inactivo'}
                      color={user.is_active ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.es_admin ? 'Admin' : 'Usuario'}
                      color={user.es_admin ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(user.id)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton
                          size="small"
                          color={user.is_active ? 'error' : 'success'}
                          onClick={() => setSelectedUser({ 
                            id: user.id, 
                            username: user.username, 
                            action: user.is_active ? 'deactivate' : 'activate' 
                          })}
                        >
                          {user.is_active ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Resetear Contraseña">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => setSelectedUser({ 
                            id: user.id, 
                            username: user.username, 
                            action: 'reset' 
                          })}
                        >
                          <RestartIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={!!selectedUser}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {tempPassword && selectedUser?.action === 'reset' ? (
            <Box>
              <Typography gutterBottom>
                La contraseña temporal para el usuario {selectedUser.username} es:
              </Typography>
              <Typography 
                variant="h6" 
                color="primary" 
                gutterBottom 
                sx={{ 
                  backgroundColor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {tempPassword}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Por favor, asegúrese de comunicar esta contraseña al usuario de manera segura.
                El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.
              </Typography>
            </Box>
          ) : (
            <DialogContentText>
              {getDialogContent()}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {tempPassword ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!tempPassword && (
            <Button onClick={handleAction} color="primary" autoFocus>
              Confirmar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList; 