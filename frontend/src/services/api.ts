// src/services/api.ts
import axios from 'axios';

const api = axios.create({
    // Points to your Railway URL
    baseURL: import.meta.env.VITE_API_BASE_URL, 
    withCredentials: true, 
    withXSRFToken: true, 
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

/**
 * MANUAL CSRF INTERCEPTOR
 * This manually reads the XSRF-TOKEN cookie and adds it to the headers.
 * This is necessary when Axios fails to automatically sync cookies 
 * across different domains (Vercel -> Railway).
 */
api.interceptors.request.use((config) => {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    if (token) {
        // We decode it because Laravel often URL-encodes the cookie value
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;