import axios from 'axios';

// Crear una instancia de axios con la configuración base
const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? ''  // Para producción
    : 'http://localhost:8000',  // Para desarrollo
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Cambiado a false para evitar problemas de CORS
});

// Interceptor para agregar el token y trailing slash a las URLs
axiosInstance.interceptors.request.use(
  config => {
    // Asegurarse de que la URL termine en slash si no es una URL con parámetros
    if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
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
      if (error.response.status === 401 && !error.config.url?.includes('login')) {
        // Limpiar el token
        localStorage.removeItem('token');
        // Redirigir al login
        window.location.href = '/login';
        errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      } else {
        errorMessage = error.response.data?.detail || 
                      error.response.data?.message || 
                      error.response.data?.non_field_errors?.[0] ||
                      error.response.data?.error ||
                      `Error ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
    } else {
      errorMessage = error.message || 'Error al realizar la petición';
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosInstance; 