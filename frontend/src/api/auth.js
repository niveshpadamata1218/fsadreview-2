import api from './axiosInstance';

export const registerUser = (payload) => api.post('/auth/register', payload);
export const verifyOtp = (payload) => api.post('/auth/verify-otp', payload);
export const resendOtp = (payload) => api.post('/auth/resend-otp', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
