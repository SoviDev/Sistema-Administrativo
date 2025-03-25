import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { RootState } from './store/store';
import { validateToken } from './store/slices/authSlice';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import Login from './components/Login';
import TaskList from './components/TaskList';
import Home from './components/Home';
import Layout from './components/Layout/Layout';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import DepartmentList from './components/DepartmentList';
import DepartmentForm from './components/DepartmentForm';
import NotFound from './components/NotFound';
import TaskHistory from './components/TaskHistory';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const LoadingScreen = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.es_admin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Solo validar el token si existe uno almacenado
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(validateToken());
    }
  }, [dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/tareas"
            element={
              <PrivateRoute>
                <TaskList />
              </PrivateRoute>
            }
          />
          <Route
            path="/tareas/historial"
            element={
              <PrivateRoute>
                <TaskHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/tareas/nuevo"
            element={
              <PrivateRoute>
                <TaskForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/tareas/:taskId"
            element={
              <PrivateRoute>
                <TaskDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <AdminRoute>
                <UserList />
              </AdminRoute>
            }
          />
          <Route
            path="/usuarios/nuevo"
            element={
              <AdminRoute>
                <UserForm />
              </AdminRoute>
            }
          />
          <Route
            path="/usuarios/editar/:userId"
            element={
              <AdminRoute>
                <UserForm />
              </AdminRoute>
            }
          />
          <Route
            path="/departamentos"
            element={
              <AdminRoute>
                <DepartmentList />
              </AdminRoute>
            }
          />
          <Route
            path="/departamentos/nuevo"
            element={
              <AdminRoute>
                <DepartmentForm />
              </AdminRoute>
            }
          />
          <Route
            path="/departamentos/editar/:departmentId"
            element={
              <AdminRoute>
                <DepartmentForm />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
