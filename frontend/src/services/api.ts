import axios from 'axios';

/**
 * AXIOS INSTANCE CONFIGURATION
 */
const api = axios.create({
    // Make sure your .env has VITE_API_BASE_URL=https://luckyboba-pos-production.up.railway.app
    baseURL: import.meta.env.VITE_API_BASE_URL,
    
    // MANDATORY: Allows the browser to send/receive cookies cross-domain
    withCredentials: true,
    
    // MANDATORY: Tells Axios to look for the XSRF-TOKEN cookie
    withXSRFToken: true,
    
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
});

/**
 * MANUAL CSRF INTERCEPTOR
 * Browsers often block automatic token syncing between Vercel and Railway.
 * This interceptor manually reads the 'XSRF-TOKEN' cookie and adds it to 
 * the 'X-XSRF-TOKEN' header for every POST/PUT/DELETE request.
 */
api.interceptors.request.use((config) => {
    // 1. Get all cookies from the browser
    const cookies = document.cookie.split('; ');
    
    // 2. Find the one named 'XSRF-TOKEN'
    const xsrfCookie = cookies.find(row => row.startsWith('XSRF-TOKEN='));

    if (xsrfCookie) {
        // 3. Extract and decode the token (Laravel URL-encodes it)
        const token = decodeURIComponent(xsrfCookie.split('=')[1]);
        
        // 4. Manually set the header that Laravel expects
        config.headers['X-XSRF-TOKEN'] = token;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

/**
 * RESPONSE INTERCEPTOR (Optional but helpful)
 * If you get a 419 session expired error, this can trigger a page reload
 * or a re-fetch of the CSRF cookie automatically.
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 419) {
            console.error("CSRF Token mismatch. Attempting to refresh token...");
            // You could optionally call api.get('/sanctum/csrf-cookie') here
        }
        return Promise.reject(error);
    }
);

export default api;