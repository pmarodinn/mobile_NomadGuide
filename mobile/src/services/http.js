import axios from 'axios';
import { API_BASE } from './config';

let authToken = null; // armazenado em memória (trocar depois por secure storage)
export function setAuthToken(token) { authToken = token; }
export function clearAuthToken() { authToken = null; }
export function getAuthToken() { return authToken; }

export const http = axios.create({
  baseURL: API_BASE.replace(/\/$/, '') + '/api/v1',
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    console.warn('API error', err?.response?.status, err?.message);
    return Promise.reject(err);
  }
);
