import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Box,
  Typography,
  Toolbar,
} from '@mui/material';
import {
  Home as HomeIcon,
  Task as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Email as EmailIcon,
  History as HistoryIcon,
  AddTask as AddTaskIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { usePrivileges } from '../../hooks/usePrivileges';
import { PRIVILEGES } from '../../types/auth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

const drawerWidth = 240;

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const { hasPrivilege } = usePrivileges();
  const [openSettings, setOpenSettings] = React.useState(false);
  const [openTasks, setOpenTasks] = React.useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleSettingsClick = () => {
    setOpenSettings(!openSettings);
  };

  const handleTasksClick = () => {
    setOpenTasks(!openTasks);
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Mejor rendimiento en móviles
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          ...(variant === 'permanent' && {
            backgroundColor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
          }),
        },
      }}
    >
      {variant === 'permanent' && <Toolbar />} {/* Espaciado para el AppBar cuando es permanente */}
      <Box sx={{ overflow: 'auto' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" noWrap component="div">
            Sistema Admin
          </Typography>
        </Box>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/')}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Inicio" />
            </ListItemButton>
          </ListItem>

          {/* Menú de Tareas */}
          {hasPrivilege(PRIVILEGES.TAREAS_VER) && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={handleTasksClick}>
                  <ListItemIcon>
                    <TaskIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tareas" />
                  {openTasks ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTasks} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigate('/tareas')}
                    >
                      <ListItemIcon>
                        <ListIcon />
                      </ListItemIcon>
                      <ListItemText primary="Lista de Tareas" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigate('/tareas/historial')}
                    >
                      <ListItemIcon>
                        <HistoryIcon />
                      </ListItemIcon>
                      <ListItemText primary="Histórico" />
                    </ListItemButton>
                  </ListItem>
                  {hasPrivilege(PRIVILEGES.TAREAS_CREAR) && (
                    <ListItem disablePadding>
                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => handleNavigate('/tareas/new')}
                      >
                        <ListItemIcon>
                          <AddTaskIcon />
                        </ListItemIcon>
                        <ListItemText primary="Nueva Tarea" />
                      </ListItemButton>
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </>
          )}

          {/* Menú de Configuración */}
          {(hasPrivilege(PRIVILEGES.USUARIOS_ADMIN) || 
            hasPrivilege(PRIVILEGES.DEPARTAMENTOS_ADMIN)) && (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={handleSettingsClick}>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Configuración" />
                  {openSettings ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openSettings} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {hasPrivilege(PRIVILEGES.USUARIOS_ADMIN) && (
                    <ListItem disablePadding>
                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => handleNavigate('/usuarios')}
                      >
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText primary="Usuarios" />
                      </ListItemButton>
                    </ListItem>
                  )}
                  {hasPrivilege(PRIVILEGES.DEPARTAMENTOS_ADMIN) && (
                    <ListItem disablePadding>
                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => handleNavigate('/departamentos')}
                      >
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText primary="Departamentos" />
                      </ListItemButton>
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 