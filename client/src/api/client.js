import axios from 'axios';

// Base URL falls back to the Vite proxy path in dev.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach the JWT (also stored in localStorage) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dineease_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages so UI can show a consistent string.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const fieldErrors = error.response?.data?.errors || [];
    return Promise.reject({ message, fieldErrors, status: error.response?.status });
  }
);

// Unwrap the { success, message, data, meta } envelope for convenience.
export const unwrap = (promise) => promise.then((res) => res.data);
