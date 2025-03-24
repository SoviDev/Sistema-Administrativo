import React from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setSelectedDepartment } from '../store/slices/departmentSlice';
import { Department } from '../types/auth';
import { RootState } from '../store/store';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
} from '@mui/material';

const DepartmentSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { selectedDepartment } = useAppSelector((state: RootState) => state.departments);

  const handleChange = (event: SelectChangeEvent<number>) => {
    const selectedId = event.target.value as number;
    const selectedDept = user?.departamentos_acceso.find(
      (dept: Department) => dept.id === selectedId
    );
    if (selectedDept) {
      dispatch(setSelectedDepartment(selectedDept));
    }
  };

  if (!user || user.departamentos_acceso.length === 0) {
    return null;
  }

  // Si solo tiene un departamento, mostrar solo el nombre
  if (user.departamentos_acceso.length === 1) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        <Typography variant="body2" color="inherit">
          {user.departamentos_acceso[0].nombre}
        </Typography>
      </Box>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 200, ml: 2 }}>
      <Select
        value={selectedDepartment?.id || ''}
        onChange={handleChange}
        displayEmpty
        sx={{ color: 'inherit' }}
      >
        <MenuItem value="" disabled>
          Seleccionar Departamento
        </MenuItem>
        {user.departamentos_acceso.map((dept: Department) => (
          <MenuItem key={dept.id} value={dept.id}>
            {dept.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DepartmentSelector; 