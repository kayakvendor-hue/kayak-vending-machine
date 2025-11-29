import axios from 'axios';
import API_BASE_URL from '../config/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL
});

// Add token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
