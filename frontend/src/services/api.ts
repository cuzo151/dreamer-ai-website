import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatAPI = {
  sendMessage: async (message: string, conversationId?: string) => {
    const response = await api.post('/chat/message', { message, conversationId });
    return response.data;
  },
  
  getHistory: async (conversationId: string) => {
    const response = await api.get(`/chat/history/${conversationId}`);
    return response.data;
  },
};

export const showcaseAPI = {
  analyzeDocument: async (text: string, type: string = 'general') => {
    const response = await api.post('/showcase/analyze-document', { text, type });
    return response.data;
  },
  
  transcribeAudio: async (audioUrl: string) => {
    const response = await api.post('/showcase/transcribe', { audioUrl });
    return response.data;
  },
  
  analyzeData: async (data: any, analysisType: string = 'general') => {
    const response = await api.post('/showcase/analyze-data', { data, analysisType });
    return response.data;
  },
};

export const contactAPI = {
  submit: async (formData: any) => {
    const response = await api.post('/contact/submit', formData);
    return response.data;
  },
  
  subscribe: async (email: string) => {
    const response = await api.post('/contact/subscribe', { email });
    return response.data;
  },
};

export default api;