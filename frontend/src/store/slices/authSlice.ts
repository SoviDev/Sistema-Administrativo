import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import axios from '../../utils/axios';
import { AuthState, LoginCredentials, LoginResponse, ValidationResponse, User } from '../../types/auth';
import { setSelectedDepartment } from './departmentSlice';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null
};

export const login = createAsyncThunk<{ token: string; user: User }, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const tokenResponse = await axios.post<LoginResponse>('/api/token/', credentials);
      const { access, refresh } = tokenResponse.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh_token', refresh);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      const userResponse = await axios.get<User>('/api/me/');
      const user = userResponse.data;

      if (user.departamentos_acceso.length > 0) {
        dispatch(setSelectedDepartment(user.departamentos_acceso[0]));
      }

      return { token: access, user };
    } catch (error: any) {
      if (!error.response) {
        return rejectWithValue('Error de conexión con el servidor');
      }
      return rejectWithValue(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.response?.data?.non_field_errors?.[0] ||
        'Credenciales inválidas'
      );
    }
  }
);

export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
  }
);

export const validateToken = createAsyncThunk<ValidationResponse, void>(
  'auth/validateToken',
  async (_, { dispatch }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token almacenado');
    }

    try {
      const response = await axios.get<User>('/api/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.departamentos_acceso.length > 0) {
        dispatch(setSelectedDepartment(response.data.departamentos_acceso[0]));
      }

      return { user: response.data };
    } catch (error) {
      localStorage.removeItem('token');
      throw new Error('Token inválido');
    }
  }
);

export const getUser = createAsyncThunk<User, void>(
  'auth/getUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<User>('/api/me/');
      return response.data;
    } catch (error: any) {
      if (!error.response) {
        return rejectWithValue('Error de conexión con el servidor');
      }
      return rejectWithValue(
        error.response?.data?.detail || 
        'Error al obtener datos del usuario'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ userId, oldPassword, newPassword }: { userId: number; oldPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/usuarios/${userId}/change_password/`, {
        old_password: oldPassword,
        new_password: newPassword
      });
      
      if (response.data.status === 'success') {
        return response.data;
      }
      return rejectWithValue(response.data.message || 'Error al cambiar la contraseña');
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.response?.data?.detail || 
        'Error al cambiar la contraseña'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(validateToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(validateToken.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string || 'Error al validar el token';
      })
      .addCase(getUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 