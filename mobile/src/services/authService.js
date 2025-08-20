import { http, setAuthToken, clearAuthToken, getAuthToken } from './http';

export async function login(email, password) {
  try {
    const res = await http.post('/auth/login', { email, password });
    const token = res.data?.token;
    if (token) setAuthToken(token);
    return { ok: true, token, user: res.data?.user };
  } catch (e) {
    return { ok: false, error: e?.response?.data?.message || 'Erro ao entrar' };
  }
}

export async function registerUser({ email, password, firstName, lastName }) {
  try {
    const res = await http.post('/auth/register', { email, password, firstName, lastName });
    const token = res.data?.token;
    if (token) setAuthToken(token);
    return { ok: true, token, user: res.data?.user };
  } catch (e) {
    const data = e?.response?.data;
    console.log('Register error payload:', data);
    const status = e?.response?.status;
    const msg = data?.message || data?.error || data?.errors?.join?.(', ') || 'Erro ao registrar';
    return { ok: false, error: (status ? status + ' - ' : '') + msg };
  }
}

export function logout() {
  clearAuthToken();
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function requestEmailVerification() {
  try {
    const r = await http.post('/auth/verify-email/request');
    return { ok: true, message: r.data?.message };
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || 'Erro' };
  }
}

export async function verifyEmailToken(token) {
  try {
    const r = await http.get('/auth/verify-email', { params: { token } });
    return { ok: true, message: r.data?.message };
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || 'Erro' };
  }
}

export async function forgotPassword(email) {
  try {
    const r = await http.post('/auth/password/forgot', { email });
    return { ok: true, message: r.data?.message };
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || 'Erro' };
  }
}

export async function resetPassword(token, password) {
  try {
    const r = await http.post('/auth/password/reset', { token, password });
    return { ok: true, message: r.data?.message };
  } catch (e) {
    return { ok: false, error: e?.response?.data?.error || 'Erro' };
  }
}
