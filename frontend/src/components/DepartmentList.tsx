import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchDepartments } from '../store/slices/departmentSlice';
import { RootState } from '../store/store';
import { Department } from '../types/auth';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { departments, loading, error } = useAppSelector((state: RootState) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleEdit = (id: number) => {
    navigate(`/departments/${id}/edit`);
  };

  const handleCreate = () => {
    navigate('/departments/new');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Departamentos</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreate}
        >
          Nuevo Departamento
        </Button>
      </Box>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Bandeja</TableCell>
              <TableCell>Servidor Entrante</TableCell>
              <TableCell>Servidor Saliente</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay departamentos registrados
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department: Department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.nombre}</TableCell>
                  <TableCell>{department.tiene_bandeja ? 'Sí' : 'No'}</TableCell>
                  <TableCell>{department.servidor_entrante}</TableCell>
                  <TableCell>{department.servidor_saliente}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEdit(department.id)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DepartmentList; 