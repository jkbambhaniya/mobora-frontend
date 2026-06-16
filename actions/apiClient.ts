import axios from "axios";

const isServer = typeof window === "undefined";
const baseURL = isServer
  ? (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://127.0.0.1:5000/api")
  : "/api";

/**
 * Helper function to parse set-cookie headers from backend response.
 */
function parseCookie(cookieStr: string) {
  const parts = cookieStr.split(";").map((p) => p.trim());
  const [nameValue, ...options] = parts;
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;
  const name = nameValue.slice(0, eqIdx);
  const value = decodeURIComponent(nameValue.slice(eqIdx + 1));

  const optObj: any = {};
  options.forEach((opt) => {
    const [k, v] = opt.split("=");
    const key = k.toLowerCase().trim();
    if (key === "path") {
      optObj.path = v;
    } else if (key === "httponly") {
      optObj.httpOnly = true;
    } else if (key === "secure") {
      optObj.secure = true;
    } else if (key === "max-age") {
      optObj.maxAge = parseInt(v, 10);
    } else if (key === "samesite") {
      optObj.sameSite = v.toLowerCase();
    } else if (key === "expires") {
      optObj.expires = new Date(v);
    }
  });
  return { name, value, options: optObj };
}

/**
 * Propagates Set-Cookie headers from the backend response into the Next.js server-side cookie store.
 */
async function syncServerCookies(response: any) {
  if (isServer) {
    try {
      const setCookieHeaders = response.headers["set-cookie"];
      if (setCookieHeaders) {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        for (const cookieStr of setCookieHeaders) {
          const parsed = parseCookie(cookieStr);
          if (parsed) {
            cookieStore.set(parsed.name, parsed.value, parsed.options);
          }
        }
      }
    } catch (err) {
      console.warn("[apiClient] Failed to sync cookies on server response", err);
    }
  }
}

/**
 * Centralized Axios client instance.
 * Automatically handles baseURL, cross-origin credentials (for HttpOnly cookies), and dynamic header setup.
 */
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically manage headers (e.g. forward cookies on server requests)
apiClient.interceptors.request.use(
  async (config) => {
    // If executing on Next.js server side (Server Actions), manually forward all browser cookies to the backend
    if (isServer) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
        if (cookieHeader) {
          config.headers.Cookie = cookieHeader;
        }
      } catch (err) {
        console.warn("[apiClient] Failed to forward cookies on server request", err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor to handle global issues like 401 Unauthorized / token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Intercept 401 unauthorized to trigger silent refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/vendor/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        apiClient
          .post("/vendor/auth/refresh")
          .then(async (refreshResponse) => {
            await syncServerCookies(refreshResponse);
            processQueue(null);
            resolve(apiClient(originalRequest));
          })
          .catch(async (refreshError) => {
            processQueue(refreshError);

            // If refresh fails, clear cookies on server if running Server Actions
            if (isServer) {
              try {
                const { cookies } = await import("next/headers");
                const cookieStore = await cookies();
                const allCookies = cookieStore.getAll();
                allCookies.forEach((c) => {
                  if (c.name.startsWith("mb_")) {
                    cookieStore.delete(c.name);
                  }
                });
              } catch (_) {}
            }

            // Redirect to login page on client browser
            if (
              typeof window !== "undefined" &&
              !["/login", "/register", "/forgot-password", "/reset-password"].includes(
                window.location.pathname
              )
            ) {
              window.location.href = "/login";
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // Direct redirect for 403 Forbidden (e.g. Account suspended/unauthorized role)
    if (error.response && error.response.status === 403) {
      if (
        typeof window !== "undefined" &&
        !["/login", "/register", "/forgot-password", "/reset-password"].includes(
          window.location.pathname
        )
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
