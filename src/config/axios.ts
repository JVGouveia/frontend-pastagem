import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const username = localStorage.getItem('username');

        if (refreshToken && username) {
          const response = await axios.post('http://localhost:8080/auth/refresh', {
            refreshToken,
            username,
          });

          const { idToken, accessToken } = response.data;
          localStorage.setItem('token', idToken);
          localStorage.setItem('accessToken', accessToken);

          // Atualiza o token no header e tenta a requisição novamente
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se falhar o refresh, limpa os tokens e redireciona para login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api; 