import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const getAdminToken = () => localStorage.getItem('geifem_admin_token');

export const adminAxios = axios.create({ baseURL: API });

adminAxios.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers['X-Admin-Token'] = token;
  return config;
});

adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('geifem_admin_token');
      localStorage.removeItem('geifem_admin_expires');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminLogout = async () => {
  try {
    await adminAxios.post('/admin/logout');
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('geifem_admin_token');
  localStorage.removeItem('geifem_admin_expires');
  window.location.href = '/admin/login';
};
