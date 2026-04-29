import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data) {
            // response.data is the JWT token
            const token = response.data;
            localStorage.setItem('authToken', token);
            localStorage.setItem('userEmail', email);
            return response.data;
        }
    },
    register: async (email, password) => {
        return await api.post('/auth/register', { email, password });
    },
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
    }
};
