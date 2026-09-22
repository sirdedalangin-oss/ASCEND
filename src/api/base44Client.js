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
  const data = await response.json().catch(() => ({}));

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

function innovationQuery(filters = {}, sort = '-created_at', limit = 200) {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  Object.entries(filters).forEach(([key, value]) => params.set(key, String(value)));
  return request(`/innovations?${params}`);
}

export const base44 = {
  auth: {
    async loginViaEmailPassword(email, password) {
      const result = await request('/auth/login', { method: 'POST', body: { email, password } });
      setToken(result.access_token);
      return result;
    },
    async register(payload) {
      const result = await request('/auth/register', { method: 'POST', body: payload });
      setToken(result.access_token);
      return result;
    },
    me: () => request('/auth/me'),
    async logout() {
      try {
        if (accessToken) await request('/auth/logout', { method: 'POST' });
      } finally {
        setToken(null);
      }
    },
    resetPasswordRequest: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: ({ resetToken, newPassword }) => request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: newPassword },
    }),
    setToken,
    getToken: () => accessToken,
  },
  entities: {
    Innovation: {
      list: (sort = '-created_at', limit = 200) => innovationQuery({}, sort.replace('created_date', 'created_at'), limit),
      filter: (filters, sort = '-created_at', limit = 200) => innovationQuery(filters, sort.replace('created_date', 'created_at'), limit),
      get: (id) => request(`/innovations/${id}`),
      create: (payload) => request('/innovations', { method: 'POST', body: payload }),
      delete: (id) => request(`/innovations/${id}`, { method: 'DELETE' }),
    },
    Evaluation: {
      list: () => request('/evaluations'),
      get: (id) => request(`/evaluations/${id}`),
      create: (payload) => request('/evaluations', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/evaluations/${id}`, { method: 'PUT', body: payload }),
      delete: (id) => request(`/evaluations/${id}`, { method: 'DELETE' }),
    },
    EvaluationCriteria: {
      list: () => request('/evaluation-criteria'),
      update: (criteria) => request('/evaluation-criteria', { method: 'PUT', body: { criteria } }),
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        return request('/uploads', { method: 'POST', body: form });
      },
    },
  },
  functions: {
    async invoke(name, payload) {
      if (name !== 'evaluateInnovation') throw new Error(`Unknown local function: ${name}`);
      return { data: await request('/evaluate-innovation', { method: 'POST', body: payload }) };
    },
  },
};
