import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://sepsis-ai-jhj0.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Auto-attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ─────────────────────────────────────────────
export const login = async (username, password) => {
  const form = new FormData();
  form.append('username', username);
  form.append('password', password);
  const res = await axios.post(`${BASE_URL}/login`, form);
  return res.data;
};

// ── Prediction ───────────────────────────────────────
export const predict = async (patientData) => {
  const res = await api.post('/predict', patientData);
  return res.data;
};

// ── X-ray prediction ─────────────────────────────────
export const predictXray = async (file) => {
  const form = new FormData();
  form.append('xray', file);
  const res = await api.post('/predict-xray', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// ── Extract lab report ───────────────────────────────
export const extractReport = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/extract-report', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// ── Doctor override ──────────────────────────────────
export const submitOverride = async (data) => {
  const res = await api.post('/override', data);
  return res.data;
};

// ── Health check ─────────────────────────────────────
export const healthCheck = async () => {
  const res = await api.get('/health');
  return res.data;
};