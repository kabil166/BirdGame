import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure base URL based on platform
// For development, update this with your local IP address when testing on device
const getBaseURL = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:3000';
    }
    // For mobile devices, use your local IP address
    // Example: return 'http://192.168.1.100:3000';
    return 'http://192.168.1.100:3000';
};

const BASE_URL = getBaseURL();

// Create axios instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear storage
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
        }
        return Promise.reject(error);
    }
);

export { BASE_URL, api };
export default api;
