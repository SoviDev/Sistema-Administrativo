import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import {
  Task as TaskIcon,
  Email as EmailIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { usePrivileges } from '../hooks/usePrivileges';
import { PRIVILEGES } from '../types/auth';
import { Department } from '../types/auth';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { 
    hasPrivilege, 
    hasAnyPrivilege, 
    getDepartmentsWithPrivilege 
  } = usePrivileges();

  const renderAuthenticatedContent = () => {
    const cards: React.ReactElement[] = [];

    // Tarjeta de Tareas - Si tiene privilegios y departamentos con tareas
    const departamentosConTareas = getDepartmentsWithPrivilege(PRIVILEGES.TAREAS_VER);

    if (departamentosConTareas.length > 0) {
      cards.push(
        <Grid item xs={12} sm={6} md={4} key="tareas">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TaskIcon color="primary" />
                <Typography variant="h6" component="div">
                  Tareas
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gestiona las tareas de tus departamentos
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                {departamentosConTareas.map((depto: Department) => (
                  <Chip
                    key={depto.id}
                    label={depto.nombre}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/tareas')}
                >
                  Ver Tareas
                </Button>
                {hasPrivilege(PRIVILEGES.TAREAS_CREAR) && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/tareas/nuevo')}
                  >
                    Nueva
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    }

    // Tarjeta de Bandeja de Entrada - Si tiene privilegios y departamentos con bandeja
    const departamentosConBandeja = getDepartmentsWithPrivilege(PRIVILEGES.BANDEJA_VER)
      .filter((d: Department) => d.tiene_bandeja);

    if (departamentosConBandeja.length > 0) {
      cards.push(
        <Grid item xs={12} sm={6} md={4} key="bandeja">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <EmailIcon color="primary" />
                <Typography variant="h6" component="div">
                  Bandeja de Entrada
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gestiona los documentos entrantes
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                {departamentosConBandeja.map((depto: Department) => (
                  <Chip
                    key={depto.id}
                    label={depto.nombre}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              <Box display="flex" gap={1} mt={2}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/bandeja')}
                >
                  Ver Bandeja
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      );
    }

    return (
      <Grid container spacing={3}>
        {cards}
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bienvenido al Sistema Administrativo
      </Typography>
      {renderAuthenticatedContent()}
    </Box>
  );
};

export default Home; 