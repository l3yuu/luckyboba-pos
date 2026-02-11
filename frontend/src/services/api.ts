import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, 
    withCredentials: true,             
    withXSRFToken: true,               
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

export default api;