import axios from 'axios';
import { config } from './environment';

const apiGraphql = axios.create({
  baseURL: config.isDevelopment ? '/graphql' : 'http://192.168.56.103:3000/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

export default apiGraphql; 