"use server";

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
					console.error(
						"[forwardCookies] Failed to set cookie:",
						parsed.name,
						err.message,
					);
				}
			}
		}
	}
}

/**
 * Handles admin login.
 */
export async function adminLoginAction(email: string, password: string) {
	try {
		const response = await apiClient.post("/admin/auth/login", {
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
			message: error.message || "An unexpected error occurred during admin login.",
		};
	}
}

/**
 * Handles admin logout.
 */
export async function adminLogoutAction() {
	try {
		const response = await apiClient.post("/admin/auth/logout");
		await forwardCookies(response);

		const cookieStore = await cookies();
		const allCookies = cookieStore.getAll();
		allCookies.forEach((c) => {
			if (c.name.startsWith("mb_")) {
				cookieStore.delete(c.name);
			}
		});

		return { success: true, data: response.data };
	} catch (error: any) {
		if (error.response) {
			await forwardCookies(error.response);
		}

		try {
			const cookieStore = await cookies();
			const allCookies = cookieStore.getAll();
			allCookies.forEach((c) => {
				if (c.name.startsWith("mb_")) {
					cookieStore.delete(c.name);
				}
			});
		} catch (_) {}

		return {
			success: false,
			message: error.message || "Admin logout failed.",
		};
	}
}

/**
 * Retrieve current authenticated admin profile.
 */
export async function getAdminProfileAction() {
	try {
		const response = await apiClient.get("/admin/auth/profile");
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
			message: error.message || "Failed to retrieve admin profile.",
		};
	}
}

/**
 * List all vendors for admin.
 */
export async function getAdminVendorsAction(options: {
	status?: string;
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
} = {}) {
	try {
		const params: any = {};
		if (options.status) params.status = options.status;
		if (options.search) params.search = options.search;
		if (options.page) params.page = options.page;
		if (options.limit) params.limit = options.limit;
		if (options.sortBy) params.sortBy = options.sortBy;
		if (options.sortOrder) params.sortOrder = options.sortOrder;

		const response = await apiClient.get("/admin/vendors", { params });
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
			message: error.message || "Failed to retrieve vendors list.",
		};
	}
}

/**
 * Update a vendor's status.
 */
export async function updateVendorStatusAction(vendorId: number, status: string) {
	try {
		const response = await apiClient.put(`/admin/vendors/${vendorId}/status`, { status });
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
			message: error.message || "Failed to update vendor status.",
		};
	}
}

/**
 * Retrieve admin dashboard statistics.
 */
export async function getAdminStatsAction() {
	try {
		const response = await apiClient.get("/admin/stats");
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
			message: error.message || "Failed to retrieve statistics.",
		};
	}
}

/**
 * Update current admin profile details.
 */
export async function updateAdminProfileAction(name: string, email: string, profile_img: string | null) {
	try {
		const response = await apiClient.put("/admin/auth/profile", {
			name,
			email,
			profile_img,
		});
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
			message: error.message || "Failed to update admin profile.",
		};
	}
}

/**
 * Change current admin password.
 */
export async function changeAdminPasswordAction(currentPassword: string, newPassword: string) {
	try {
		const response = await apiClient.put("/admin/auth/change-password", {
			currentPassword,
			newPassword,
		});
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
			message: error.message || "Failed to change admin password.",
		};
	}
}

/**
 * Update a vendor's profile and business details.
 */
export async function updateVendorDetailsAction(vendorId: number, data: any) {
	try {
		const response = await apiClient.put(`/admin/vendors/${vendorId}`, data);
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
			message: error.message || "Failed to update vendor details.",
		};
	}
}

/**
 * Delete a vendor.
 */
export async function deleteVendorAction(vendorId: number) {
	try {
		const response = await apiClient.delete(`/admin/vendors/${vendorId}`);
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
			message: error.message || "Failed to delete vendor.",
		};
	}
}

/**
 * Retrieve vendor details by ID.
 */
export async function getAdminVendorByIdAction(vendorId: number) {
	try {
		console.log(`[getAdminVendorByIdAction] Calling: /admin/vendors/${vendorId}`);
		const response = await apiClient.get(`/admin/vendors/${vendorId}`);
		console.log(`[getAdminVendorByIdAction] Success:`, response.data);
		await forwardCookies(response);
		return { success: true, data: response.data };
	} catch (error: any) {
		console.error(`[getAdminVendorByIdAction] Error:`, error.message, error.response?.data);
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
			message: error.message || "Failed to retrieve vendor details.",
		};
	}
}


