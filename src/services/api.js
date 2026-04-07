import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bias_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.detail || err.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const uploadMedia = (file, onProgress) =>
  api.post('/upload', { file }, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });

export const analyzeMedia = (payload) => api.post('/analyze', payload);
export const getReport = (id) => api.get(`/report/${id}`);
export const getHistory = () => api.get('/history');
export const deleteReport = (id) => api.delete(`/report/${id}`);

export default api;
