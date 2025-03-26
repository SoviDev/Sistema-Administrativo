import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import axios from '../../api/axios';
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
  async (credentials, { rejectWithValue }) => {
    try {
      const tokenResponse = await axios.post<LoginResponse>('/token/', credentials);
      const { access, refresh } = tokenResponse.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh_token', refresh);

      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      const userResponse = await axios.get<User>('/me/');
      const user = userResponse.data;

      return { token: access, user };
    } catch (error: any) {
      if (!error.response) {
        return rejectWithValue('Error de conexión con el servidor');
      }

      if (error.response.status === 401) {
        return rejectWithValue('Usuario o contraseña incorrectos');
      }

      return rejectWithValue(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Error al iniciar sesión. Por favor, intente nuevamente'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }
);

export const validateToken = createAsyncThunk<ValidationResponse, void>(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue(null);
    }

    try {
      const response = await axios.get<User>('/me/');
      return { user: response.data };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      return rejectWithValue('La sesión ha expirado. Por favor, inicie sesión nuevamente');
    }
  }
);

export const getUser = createAsyncThunk<User, void>(
  'auth/getUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<User>('/me/');
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
      const response = await axios.post(`/usuarios/${userId}/change_password/`, {
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
        state.error = action.payload ? (action.payload as string) : null;
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