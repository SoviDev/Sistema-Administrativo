import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { RootState } from '../store/store';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const NotificationSystem: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Monitorear errores de autenticación
  const authError = useAppSelector((state: RootState) => state.auth.error);

  // Efecto para mostrar el diálogo cuando hay un error
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
      setOpen(true);
    }
  }, [authError]);

  const handleClose = () => {
    setOpen(false);
    setErrorMessage(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
    >
      <DialogTitle id="error-dialog-title">Error de Autenticación</DialogTitle>
      <DialogContent>
        <DialogContentText id="error-dialog-description">
          {errorMessage}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSystem; 