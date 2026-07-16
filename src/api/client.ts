import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://amplocate-api.onrender.com';

const TOKEN_KEY = 'amplocate.auth.token';

export async function getToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

type Options = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
};

export async function apiRequest<T = any>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true } = options;
  const url = new URL(`${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // Timeout guard — the free-tier server sleeps and can take ~60s to wake,
  // and a request must never hang the UI forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 70_000);

  let resp: Response;
  try {
    resp = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new ApiError(0, 'The server is taking too long — it may be waking from sleep. Please try again in a minute.');
    }
    throw new ApiError(0, 'Cannot reach Amplocate — check your connection (the free server may take ~60s to wake up).');
  } finally {
    clearTimeout(timer);
  }

  if (resp.status === 401 && auth) await setToken(null);
  if (resp.status === 204) return null as T;

  const text = await resp.text();
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

  if (!resp.ok) {
    let detail = (payload && typeof payload === 'object' && payload.detail) || `Request failed (${resp.status})`;
    if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ');
    throw new ApiError(resp.status, String(detail));
  }
  return payload as T;
}

export const api = {
  get: <T = any>(path: string, params?: Options['params'], auth = true) =>
    apiRequest<T>(path, { params, auth }),
  post: <T = any>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body, auth }),
  patch: <T = any>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T = any>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
