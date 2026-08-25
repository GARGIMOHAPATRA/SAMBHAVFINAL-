const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8080' : 'https://signbridge-backend-k4k5.onrender.com');
console.log('[SignBridge Debug] API_URL resolved to:', API_URL);

export async function apiRequest(
  path: string,
  method: string = 'GET',
  body?: any,
  accessToken?: string | null,
  timeoutMs: number = 15000
) {
  console.log('[SignBridge Debug] apiRequest:', method, `${API_URL}${path}`);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const options: RequestInit = {
    method,
    headers,
    signal: controller.signal,
  };

  // Cookie-authenticated routes require credentials inclusion
  if (path.startsWith('/api/auth/refresh') || path.startsWith('/api/auth/logout')) {
    options.credentials = 'include';
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, options);

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : 'Request failed. Please check your network connection.');
      throw new Error(errorMsg);
    }

    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Server took too long to respond. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestForgotPasswordOtp(email: string): Promise<{ message: string }> {
  return await apiRequest('/api/auth/forgot-password', 'POST', { email });
}

export async function verifyForgotPasswordOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
  return await apiRequest('/api/auth/verify-otp', 'POST', { email, otp });
}

export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
  return await apiRequest('/api/auth/reset-password', 'POST', { email, otp, newPassword });
}
