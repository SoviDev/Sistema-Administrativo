import axios from 'axios';

interface CustomError extends Error {
  response?: any;
}

// Crear una instancia de axios con la configuración base
const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? ''  // Para producción
    : 'http://localhost:8000',  // Para desarrollo
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar el token y trailing slash a las URLs
axiosInstance.interceptors.request.use(
  config => {
    // Asegurarse de que la URL termine en slash si no es una URL con parámetros
    if (config.url && 
        !config.url.includes('?') && 
        !config.url.endsWith('/') && 
        !config.url.includes('/toggle_active/') &&
        !config.url.includes('/reset_password/') &&
        !config.url.includes('/toggle_privilege/')) {
      config.url = `${config.url}/`;
    }

    // Agregar el token solo si existe y no es una petición de login
    const token = localStorage.getItem('token');
    if (token && !config.url?.includes('login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    let errorMessage = 'Error en la petición';

    if (error.response) {
      // Solo redirigir al login si es un 401 y NO es una petición de token o login
      if (error.response.status === 401 && 
          !error.config.url?.includes('token') && 
          !error.config.url?.includes('login')) {
        // Limpiar el token
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        // Redirigir al login
        window.location.href = '/login';
        errorMessage = 'La sesión ha expirado. Por favor, inicie sesión nuevamente.';
      } else {
        // Manejar diferentes tipos de errores
        switch (error.response.status) {
          case 400:
            errorMessage = error.response.data?.detail || 
                         error.response.data?.message || 
                         error.response.data?.non_field_errors?.[0] ||
                         'Datos inválidos. Por favor, verifique la información.';
            break;
          case 401:
            errorMessage = 'Usuario o contraseña incorrectos';
            break;
          case 403:
            errorMessage = 'No tiene permisos para realizar esta acción';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no existe';
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Por favor, intente más tarde';
            break;
          default:
            errorMessage = error.response.data?.detail || 
                         error.response.data?.message || 
                         error.response.data?.non_field_errors?.[0] ||
                         'Error en la petición. Por favor, intente nuevamente';
        }
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor. Por favor, verifique su conexión.';
    } else {
      errorMessage = error.message || 'Error al realizar la petición';
    }

    const customError = new Error(errorMessage) as CustomError;
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export default axiosInstance; 