/**
 * TUMIN Central API Service
 * Mengelola komunikasi frontend ke backend Express.js secara terpusat:
 * - Menyimpan & mengambil JWT di sessionStorage secara aman (tab-isolated).
 * - Otomatis menyertakan header 'Authorization: Bearer <token>' pada endpoint privat.
 * - Menangani respon error HTTP secara konsisten (401, 403, 503).
 * - Tidak pernah mencetak nilai token atau password ke console / logs.
 */

const TOKEN_KEY = 'tumin_auth_token';

// Tipe callback untuk penanganan event error terpusat
export type AuthErrorHandler = (event: {
  type: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVICE_UNAVAILABLE' | 'NETWORK_ERROR';
  status?: number;
  message: string;
  endpoint?: string;
}) => void;

let errorListeners: AuthErrorHandler[] = [];

export const registerAuthErrorHandler = (handler: AuthErrorHandler) => {
  errorListeners.push(handler);
  return () => {
    errorListeners = errorListeners.filter((h) => h !== handler);
  };
};

const notifyAuthError = (event: {
  type: 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVICE_UNAVAILABLE' | 'NETWORK_ERROR';
  status?: number;
  message: string;
  endpoint?: string;
}) => {
  errorListeners.forEach((listener) => {
    try {
      listener(event);
    } catch {}
  });
};

/**
 * Token Management (sessionStorage)
 * - Hanya disimpan di sessionStorage agar tab-isolated.
 * - Tidak disimpan di localStorage, URL, query string, atau log.
 */
export const getStoredToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    if (token && typeof token === 'string') {
      sessionStorage.setItem(TOKEN_KEY, token.trim());
    }
  } catch {}
};

export const clearStoredToken = (): void => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  source?: string;
  error?: string;
}

export interface ApiFetchOptions extends RequestInit {
  isPublic?: boolean;
  suppressGlobalError?: boolean;
}

/**
 * Pemanggilan API Terpusat (Central API Client)
 */
export const apiFetch = async <T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> => {
  const { isPublic = false, suppressGlobalError = false, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 1. Injeksi Token Otomatis: Hanya ke origin backend TUMIN terpercaya & bukan endpoint publik/login
  const isTrustedOrigin =
    endpoint.startsWith('/') ||
    (typeof window !== 'undefined' && endpoint.startsWith(window.location.origin));

  const isPublicRoute =
    isPublic ||
    endpoint.startsWith('/api/status') ||
    endpoint.startsWith('/api/auth/login');

  const token = getStoredToken();
  if (token && isTrustedOrigin && !isPublicRoute) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Gabungkan custom headers jika ada tanpa menimpa Authorization kecuali eksplisit
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...restOptions,
      headers,
    });

    let jsonResponse: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        jsonResponse = await response.json();
      } catch {
        jsonResponse = null;
      }
    }

    // 2. Penanganan Status HTTP Tertentu Secara Terpusat
    if (!response.ok) {
      const errorMessage =
        jsonResponse?.error ||
        jsonResponse?.message ||
        `Permintaan gagal dengan status HTTP ${response.status}`;

      if (!suppressGlobalError) {
        if (response.status === 401) {
          // Token kedaluwarsa atau tidak valid -> Bersihkan token & sesi, arahkan ke login
          clearStoredToken();
          notifyAuthError({
            type: 'UNAUTHORIZED',
            status: 401,
            message: errorMessage || 'Sesi telah kedaluwarsa. Silakan login kembali.',
            endpoint,
          });
        } else if (response.status === 403) {
          // Akses ditolak (RBAC atau akun dinonaktifkan/ditangguhkan)
          notifyAuthError({
            type: 'FORBIDDEN',
            status: 403,
            message: errorMessage || 'Akses ditolak. Anda tidak memiliki izin untuk fitur ini.',
            endpoint,
          });
        } else if (response.status === 503) {
          // Database Offline (Fail-Closed) -> Jangan hapus token! Tampilkan status database
          notifyAuthError({
            type: 'SERVICE_UNAVAILABLE',
            status: 503,
            message: errorMessage || 'Layanan database sedang tidak tersedia (Database Offline).',
            endpoint,
          });
        }
      }

      return {
        ok: false,
        status: response.status,
        error: errorMessage,
        data: jsonResponse?.data || jsonResponse,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: jsonResponse?.data !== undefined ? jsonResponse.data : jsonResponse,
      source: jsonResponse?.source,
    };
  } catch (netErr: any) {
    // 3. Penanganan Gangguan Jaringan (Bukan 401, JANGAN otomatis logout)
    const netErrorMessage = 'Tidak dapat menghubungi server backend TUMIN. Periksa koneksi jaringan Anda.';
    if (!suppressGlobalError) {
      notifyAuthError({
        type: 'NETWORK_ERROR',
        message: netErrorMessage,
        endpoint,
      });
    }

    return {
      ok: false,
      status: 0,
      error: netErrorMessage,
    };
  }
};
