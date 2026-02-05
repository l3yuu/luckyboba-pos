import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true, 
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the internet is down (no response at all)
        if (!error.response) {
            console.error("Network Error: Is the Laravel server running?");
        }

        if (error.response?.status === 401) {
            // Only redirect if we aren't already on the login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;