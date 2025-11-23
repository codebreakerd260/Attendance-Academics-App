import axios from 'axios';
import AuthService from './auth';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = AuthService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthService.logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getRoles: () => api.get('/roles'),
};

export const studentAPI = {
  getAll: () => api.get('/students'),
  getOne: (id) => api.get(`/students/${id}`),
  create: (studentData) => api.post('/students', studentData),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`),
};

export const attendanceAPI = {
  mark: (attendanceData) => api.post('/attendance', attendanceData),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
};

export const gradesAPI = {
  add: (gradeData) => api.post('/grades', gradeData),
  getByStudent: (studentId) => api.get(`/grades/student/${studentId}`),
};

export const analyticsAPI = {
  attendanceSummary: () => api.get('/analytics/attendance-summary'),
  gradesSummary: () => api.get('/analytics/grades-summary'),
};
