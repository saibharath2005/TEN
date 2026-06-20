import { useEffect, useState } from 'react';

export const AUTH_KEY = 'epochNovaAuth';
export const AUTH_EVENT = 'epochNovaAuthChange';

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch (_error) {
    return null;
  }
}

export function setStoredAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useAuth() {
  const [auth, setAuth] = useState(getStoredAuth);

  useEffect(() => {
    const sync = () => setAuth(getStoredAuth());
    window.addEventListener('storage', sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(AUTH_EVENT, sync);
    };
  }, []);

  return auth;
}
