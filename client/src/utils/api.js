import axios from 'axios';

/**
 * PRODUCTION-READY API UTILITY
 * Optimized for: Render Cold Starts, Database Latency, and Network Resilience
 */

const PRODUCTION_URL = 'https://invoice-billing-s4u1.onrender.com';
// Force local backend for testing unless explicitly in production build
const baseURL = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:5000';

const api = axios.create({
    baseURL,
    timeout: 25000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const MAX_RETRIES = 5; 

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response, code } = error;

        // Specialized Timeout Logging
        if (code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.warn(`[API TIMEOUT] ${config.url} timed out after ${config.timeout}ms`);
        }

        // Skip retry for critical logic errors (401, 403, 404, 400)
        if (response && [400, 401, 403, 404].includes(response.status)) {
            return Promise.reject(error);
        }

        // Initialize retry count
        config._retryCount = config._retryCount || 0;

        // Check if we should retry
        if (config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            
            // Exponential Backoff: 1s, 2s, 4s, 8s, 16s...
            const delay = Math.pow(2, config._retryCount - 1) * 1000;
            
            console.warn(`[API RETRY ${config._retryCount}/${MAX_RETRIES}] URL: ${config.url} | Error: ${error.message} | Next retry in ${delay}ms`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return api(config);
        }

        console.error(`[API FAILED] All ${MAX_RETRIES} retries exhausted for: ${config.url}. Error: ${error.message}`);
        if (error.response) {
            console.error(`[API ERROR DATA]:`, error.response.data);
        }
        return Promise.reject(error);
    }
);

export default api;
