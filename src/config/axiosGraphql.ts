import axios from 'axios';

const apiGraphql = axios.create({
  baseURL: 'http://192.168.2.198:3000/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

export default apiGraphql; 