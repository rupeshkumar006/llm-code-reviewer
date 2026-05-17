import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Axios instance with JWT interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared helper — wipe auth state
const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // We don't force redirect here anymore to support Guest Mode.
  // Components/ProtectedRoute will handle redirection if needed.
};

// Response interceptor — auto-refresh on 401, force re-login on 403
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401: attempt token refresh, then re-login
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
      clearAuthAndRedirect();
    }

    // 403: stale / invalid token (e.g. JWT secret rotated) — force re-login
    if (status === 403 && !originalRequest._retry) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  }
);

// ===================== AUTH API =====================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  googleAuth: (data) => api.post('/auth/google', data),
};

// ===================== REVIEW API =====================

export const reviewAPI = {
  submit: (data) => api.post('/review', data),
  getById: (id) => api.get(`/review/${id}`),
  getHistory: (params) => api.get('/review/history', { params }),
  delete: (id) => api.delete(`/review/${id}`),
  update: (id, data) => api.patch(`/review/${id}`, data),
  getRemaining: () => api.get('/review/remaining'),
  export: (id, format = 'pdf') =>
    api.post(`/review/${id}/export?format=${format}`, null, {
      responseType: 'blob',
    }),
  share: (id, expiryDays = null) =>
    api.post(`/review/${id}/share`, expiryDays ? { expiryDays } : {}),
};

// ===================== SSE STREAMING =====================

export const streamReview = (data, callbacks) => {
  const token = localStorage.getItem('accessToken');

  // Use fetch for SSE POST requests (EventSource only supports GET)
  fetch(`${API_BASE_URL}/review/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      callbacks.onError?.(errorData.error || 'Failed to start review');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventType = line.substring(6).trim();
          callbacks._currentEvent = eventType;
        } else if (line.startsWith('data:')) {
          const data = line.substring(5).trim();
          try {
            const parsed = JSON.parse(data);
            const eventType = callbacks._currentEvent || 'chunk';

            if (eventType === 'status') {
              callbacks.onStatus?.(parsed);
            } else if (eventType === 'chunk') {
              callbacks.onChunk?.(parsed);
            } else if (eventType === 'result') {
              callbacks.onResult?.(parsed);
            } else if (eventType === 'error') {
              callbacks.onError?.(parsed.error);
            }
          } catch (e) {
            // Ignore non-JSON lines
          }
        }
      }
    }

    callbacks.onComplete?.();
  }).catch((error) => {
    callbacks.onError?.(error.message || 'Connection failed');
  });
};

// ===================== SHARE API =====================

export const shareAPI = {
  getShared: (token) => axios.get(`${API_BASE_URL}/share/${token}`),
};

// ===================== ANALYTICS API =====================

export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
};

// ===================== USER API =====================

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
};

export default api;
