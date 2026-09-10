/**
 * Thin fetch wrapper for the Kisaan Setu API. Automatically attaches the
 * stored JWT, JSON-encodes bodies (unless FormData), and throws a normalized
 * ApiError so callers can render `err.message` directly.
 */

const TOKEN_KEY = 'ks_token';
const USER_KEY = 'ks_user';

class ApiError extends Error {
  constructor(message, status, code, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let finalBody = body;
  if (body !== undefined && !isForm) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers: finalHeaders, body: finalBody });
  } catch (networkErr) {
    throw new ApiError('Could not connect to the server. Check your internet connection.', 0, 'NETWORK_ERROR');
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const err = (data && data.error) || {};
    if (res.status === 401) clearSession();
    throw new ApiError(err.message || 'Something went wrong. Please try again.', res.status, err.code, err.fields);
  }

  return data;
}

const api = {
  get: (path) => request(path),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body, opts = {}) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path) => request(path, { method: 'DELETE' })
};

export { api, ApiError, getToken, setSession, clearSession, getCurrentUser };