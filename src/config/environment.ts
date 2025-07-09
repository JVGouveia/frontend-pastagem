// Configuração de ambiente
export const config = {
  // Detecta se está rodando no Docker ou localmente
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // URLs da API
  apiBaseURL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.56.103:3001',
  graphqlURL: import.meta.env.VITE_GRAPHQL_URL || 'http://192.168.56.103:3000',
  
  // Para desenvolvimento local, usa proxy; em produção, usa proxy do Nginx
  useProxy: import.meta.env.DEV && !import.meta.env.VITE_USE_DIRECT_API,
  
  // URL final para o axios
  getApiURL: () => {
    if (config.useProxy || config.isProduction) {
      return '/api'; // Usa o proxy do Vite (dev) ou Nginx (prod)
    }
    return config.apiBaseURL; // Usa URL direta apenas se especificamente configurado
  }
};

console.log('Environment config:', config); 