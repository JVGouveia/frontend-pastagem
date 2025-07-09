import axios from 'axios';
import { config } from './environment';

const apiGraphql = axios.create({
  baseURL: '/graphql', // Sempre usa proxy (Vite dev ou Nginx prod)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

export default apiGraphql; 