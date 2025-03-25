import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { changePassword } from '../store/slices/authSlice';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setValidationError('');
    setSuccess(false);

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (newPassword.length < 8) {
      setValidationError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      if (user) {
        const result = await dispatch(changePassword({
          userId: user.id,
          oldPassword,
          newPassword
        })).unwrap();
        
        if (result.status === 'success') {
          setSuccess(true);
          // Limpiar campos después de 2 segundos y cerrar el diálogo
          setTimeout(() => {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setValidationError('');
            setSuccess(false);
            onClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cambiar Contraseña</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Por favor, ingrese su contraseña actual y la nueva contraseña.
          </Typography>
          
          {(error || validationError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || validationError}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Contraseña actualizada correctamente
            </Alert>
          )}

          <TextField
            fullWidth
            type="password"
            label="Contraseña Actual"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            type="password"
            label="Nueva Contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            helperText="La contraseña debe tener al menos 8 caracteres"
          />

          <TextField
            fullWidth
            type="password"
            label="Confirmar Nueva Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          disabled={loading || !oldPassword || !newPassword || !confirmPassword}
        >
          Cambiar Contraseña
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog; 