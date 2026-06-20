import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Axios instance with automatic JWT refresh interceptor.
 * Handles 401 responses by attempting token refresh, then retrying.
 */
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Send httpOnly cookies
  timeout: 30_000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response Interceptor: handle token refresh ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 TOKEN_EXPIRED responses
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue subsequent requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = data;
        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — log out the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data: { email: string; password: string; preferences?: object }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  me: () => api.get('/auth/me'),
};

// ─── Chat API ─────────────────────────────────────────────────────────────
export const chatApi = {
  createSession: (title?: string) => api.post('/chat/sessions', { title }),
  getSessions: (limit = 10, offset = 0) =>
    api.get('/chat/sessions', { params: { limit, offset } }),
  deleteSession: (sessionId: string) => api.delete(`/chat/sessions/${sessionId}`),
  getMessages: (sessionId: string, limit = 50, offset = 0) =>
    api.get(`/chat/sessions/${sessionId}/messages`, { params: { limit, offset } }),
  sendMessage: (sessionId: string, content: string) =>
    api.post(`/chat/sessions/${sessionId}/messages`, { content }),
};

// ─── AI API ───────────────────────────────────────────────────────────────
export const aiApi = {
  extractTravelData: (sessionId: string, conversationHistory: object[]) =>
    api.post('/ai/extract-travel-data', { sessionId, conversationHistory }),
  generateItinerary: (sessionId: string, moodData: object) =>
    api.post('/ai/generate-itinerary', { sessionId, moodData }),
};

// ─── Itinerary API ────────────────────────────────────────────────────────
export const itineraryApi = {
  getAll: (params?: object) => api.get('/itineraries', { params }),
  getById: (id: string) => api.get(`/itineraries/${id}`),
  update: (id: string, data: object) => api.put(`/itineraries/${id}`, data),
  delete: (id: string) => api.delete(`/itineraries/${id}`),
  export: (id: string, format: 'json' | 'pdf') =>
    api.post(`/itineraries/${id}/export`, null, { params: { format }, responseType: 'blob' }),
};

// ─── Stripe API ───────────────────────────────────────────────────────────
export const stripeApi = {
  createCheckout: (plan: 'monthly' | 'annual') =>
    api.post('/stripe/create-checkout-session', { plan }),
};
