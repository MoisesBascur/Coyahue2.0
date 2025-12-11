import axios from "axios";

// Creamos la instancia de conexión
const api = axios.create({
  // Al dejarlo vacío, usará automáticamente el dominio donde estés.
  // En tu PC usará localhost, en AWS usará la IP de AWS. ¡Magia!
  baseURL: "" 
});

// Interceptor: Agrega el token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    // Busca el token en el almacenamiento local
    // (Asegúrate de que en tu Login lo guardes como 'access_token')
    const token = localStorage.getItem("access_token");
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;