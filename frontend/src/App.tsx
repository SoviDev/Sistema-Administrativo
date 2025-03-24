import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
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
import UserPrivilegesManager from './components/UserPrivilegesManager';

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

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const UserPrivilegesRoute: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return (
    <AdminRoute>
      <UserPrivilegesManager 
        userId={id ? parseInt(id) : 0} 
        onClose={() => navigate('/usuarios')} 
      />
    </AdminRoute>
  );
};

function App() {
  const dispatch = useAppDispatch();
  const { loading, isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(validateToken());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
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
            path="/tareas/nueva"
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
            path="/tareas/:taskId/editar"
            element={
              <PrivateRoute>
                <TaskForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute>
                <UserList />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/nuevo"
            element={
              <PrivateRoute>
                <UserForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/editar/:userId"
            element={
              <PrivateRoute>
                <UserForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/departamentos"
            element={
              <PrivateRoute>
                <DepartmentList />
              </PrivateRoute>
            }
          />
          <Route
            path="/departamentos/nuevo"
            element={
              <PrivateRoute>
                <DepartmentForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/departamentos/editar/:departmentId"
            element={
              <PrivateRoute>
                <DepartmentForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios/:id/privileges"
            element={<UserPrivilegesRoute />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
