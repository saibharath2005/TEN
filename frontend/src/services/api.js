export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'API request failed';
    try {
      const error = await response.json();
      message = error?.message || message;
    } catch (_error) {
      // ignore parsing issues and use the default message
    }
    throw new Error(message);
  }

  return response.json();
}

export function apiGet(path, token) {
  return request(path, { method: 'GET', token });
}

export function apiPost(path, payload, token) {
  return request(path, { method: 'POST', token, body: JSON.stringify(payload) });
}

export function apiPatch(path, payload, token) {
  return request(path, { method: 'PATCH', token, body: JSON.stringify(payload) });
}

export function apiPut(path, payload, token) {
  return request(path, { method: 'PUT', token, body: JSON.stringify(payload) });
}

export function apiDelete(path, token) {
  return request(path, { method: 'DELETE', token });
}
