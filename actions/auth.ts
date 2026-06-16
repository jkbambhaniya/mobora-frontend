'use server';

import { cookies } from "next/headers";
import { apiClient } from "./apiClient";

// Helper function to parse set-cookie headers from backend response
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

// Forward cookies from backend response to client browser
async function forwardCookies(response: any) {
  const setCookieHeaders = response.headers["set-cookie"];
  if (setCookieHeaders) {
    const cookieStore = await cookies();
    for (const cookieStr of setCookieHeaders) {
      const parsed = parseCookie(cookieStr);
      if (parsed) {
        try {
          cookieStore.set(parsed.name, parsed.value, parsed.options);
        } catch (err: any) {
          console.error("[forwardCookies] Failed to set cookie:", parsed.name, err.message);
        }
      }
    }
  }
}

/**
 * Handles vendor authentication login.
 * On success, persists the token using tokenManager.
 */
export async function loginAction(email: string, password: string) {
  try {
    const response = await apiClient.post("/vendor/auth/login", {
      email,
      password,
    });
    
    await forwardCookies(response);

    const data = response.data;
    return { success: true, data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      await forwardCookies(error.response);
      return {
        success: false,
        status: error.response.status,
        errorData: error.response.data,
      };
    }
    return {
      success: false,
      message: error.message || "An unexpected error occurred during login.",
    };
  }
}

/**
 * Handles vendor registration application.
 */
export async function registerAction(name: string, email: string, password: string) {
  try {
    const response = await apiClient.post("/vendor/auth/register", {
      name,
      email,
      password,
    });
    
    await forwardCookies(response);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      await forwardCookies(error.response);
      return {
        success: false,
        status: error.response.status,
        errorData: error.response.data,
      };
    }
    return {
      success: false,
      message: error.message || "An unexpected error occurred during registration.",
    };
  }
}

/**
 * Handles vendor session logout.
 * Safely clears token storage from the client regardless of whether API request succeeds or fails.
 */
export async function logoutAction() {
  try {
    const response = await apiClient.post("/vendor/auth/logout");
    await forwardCookies(response);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      await forwardCookies(error.response);
    }
    return {
      success: false,
      message: error.message || "Logout failed.",
    };
  }
}

/**
 * Retrieve current authenticated vendor details.
 */
export async function getProfileAction() {
  try {
    const response = await apiClient.get("/vendor/auth/profile");
    await forwardCookies(response);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      await forwardCookies(error.response);
      return {
        success: false,
        status: error.response.status,
        errorData: error.response.data,
      };
    }
    return {
      success: false,
      message: error.message || "Failed to retrieve profile.",
    };
  }
}

/**
 * Update vendor profile details.
 */
export async function updateProfileAction(profileData: any) {
  try {
    console.log("[updateProfileAction] Invoked with keys:", Object.keys(profileData));
    const response = await apiClient.put("/vendor/auth/profile", profileData);
    await forwardCookies(response);
    console.log("[updateProfileAction] Response success:", response.data?.success);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("[updateProfileAction] Error details:", error.message, error.response?.status, error.response?.data);
    if (error.response) {
      await forwardCookies(error.response);
      return {
        success: false,
        status: error.response.status,
        errorData: error.response.data,
      };
    }
    return {
      success: false,
      message: error.message || "Failed to update profile.",
    };
  }
}

/**
 * Change vendor password.
 */
export async function changePasswordAction(passwordData: any) {
  try {
    const response = await apiClient.put("/vendor/auth/change-password", passwordData);
    await forwardCookies(response);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      await forwardCookies(error.response);
      return {
        success: false,
        status: error.response.status,
        errorData: error.response.data,
      };
    }
    return {
      success: false,
      message: error.message || "Failed to change password.",
    };
  }
}
