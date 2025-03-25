import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, Key as KeyIcon } from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../store/slices/authSlice';
import { clearSelectedDepartment } from '../../store/slices/departmentSlice';
import { RootState } from '../../store/store';
import DepartmentSelector from '../DepartmentSelector';
import Sidebar from './Sidebar';
import ChangePasswordDialog from '../ChangePasswordDialog';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(clearSelectedDepartment());
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              aria-label="abrir menú"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema Administrativo
          </Typography>
          <DepartmentSelector />
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <Button
              color="inherit"
              startIcon={<KeyIcon />}
              onClick={() => setChangePasswordOpen(true)}
              sx={{ mr: 2 }}
            >
              Cambiar Contraseña
            </Button>
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              aria-label="cerrar sesión"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Sidebar 
        open={isDesktop || mobileOpen} 
        onClose={handleDrawerToggle}
        variant={isDesktop ? 'permanent' : 'temporary'}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          marginTop: '64px',
        }}
      >
        <Container maxWidth="xl">
          {children}
        </Container>
      </Box>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Box>
  );
};

export default Layout; 