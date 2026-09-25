const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'ascend_access_token';

let accessToken = localStorage.getItem(TOKEN_KEY);

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    if (response.ok) {
      throw new Error('The server returned an invalid response. Please contact the site administrator.');
    }
    data = {};
  }

  if (!response.ok) {
    const firstValidationError = data.errors ? Object.values(data.errors).flat()[0] : null;
    const error = new Error(firstValidationError || data.message || data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function setToken(token) {
  accessToken = token || null;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function listInnovations({ sort = '-created_at', limit = 200, ...filters } = {}) {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  Object.entries(filters).forEach(([key, value]) => params.set(key, String(value)));
  return request(`/innovations?${params}`);
}

function listEvaluations({ limit = 200, ...filters } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  Object.entries(filters).forEach(([key, value]) => params.set(key, String(value)));
  return request(`/evaluations?${params}`);
}

export const api = {
  auth: {
    async login(email, password) {
      const result = await request('/auth/login', { method: 'POST', body: { email, password } });
      setToken(result.access_token);
      return result;
    },
    async register(payload) {
      return request('/auth/register', { method: 'POST', body: payload });
    },
    me: () => request('/auth/me'),
    changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
    async logout() {
      try {
        if (accessToken) await request('/auth/logout', { method: 'POST' });
      } finally {
        setToken(null);
      }
    },
    requestPasswordReset: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: ({ resetToken, newPassword }) => request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: newPassword },
    }),
    setToken,
    getToken: () => accessToken,
  },
  adminUsers: {
    list: () => request('/admin/users'),
    create: (payload) => request('/admin/users', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/admin/users/${id}`, { method: 'PUT', body: payload }),
    resetPassword: (id) => request(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  },
  innovations: {
    list: listInnovations,
    get: (id) => request(`/innovations/${id}`),
    remove: (id) => request(`/innovations/${id}`, { method: 'DELETE' }),
  },
  keywords: {
    list: () => request('/keywords'),
    create: (payload) => request('/keywords', { method: 'POST', body: payload }),
  },
  evaluations: {
    list: listEvaluations,
    candidates: () => request('/evaluations/candidates'),
    get: (id) => request(`/evaluations/${id}`),
    create: (payload) => request('/evaluations', { method: 'POST', body: payload }),
    review: (id, payload) => request(`/evaluations/${id}`, { method: 'PUT', body: { ...payload, from_candidate: true } }),
    update: (id, payload) => request(`/evaluations/${id}`, { method: 'PUT', body: payload }),
    remove: (id) => request(`/evaluations/${id}`, { method: 'DELETE' }),
  },
  framework: {
    get: () => request('/scalability-framework'),
  },
  uploads: {
    create(file) {
      const form = new FormData();
      form.append('file', file);
      return request('/uploads', { method: 'POST', body: form });
    },
  },
  submitManuscript: (payload) => request('/manuscripts/submit', { method: 'POST', body: payload }),
  reviseManuscript: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/manuscripts/${id}/revise`, { method: 'POST', body: form });
  },
};
