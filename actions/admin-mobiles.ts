"use server";

import { apiClient } from "./apiClient";

export interface AdminMobileFilters {
	search?: string;
	brand?: string | number;
	model?: string | number;
	status?: string;
	condition?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

export interface AdminMobileResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: any;
}

function formatError(error: any, defaultMessage: string): AdminMobileResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

/**
 * Fetch all mobiles (stock records) across all vendors for admin.
 */
export async function getAdminMobilesAction(filters?: AdminMobileFilters): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get("/admin/mobiles", { params: filters });
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve mobiles list.");
	}
}

/**
 * Get metrics/stats for mobiles inventory.
 */
export async function getAdminMobileStatsAction(): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get("/admin/mobiles/stats");
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve mobile statistics.");
	}
}

/**
 * Fetch details of a single mobile stock entry by ID.
 */
export async function getAdminMobileDetailAction(id: string | number): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get(`/admin/mobiles/${id}`);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve mobile details.");
	}
}

/**
 * Fetch details of a single mobile stock entry by IMEI number.
 */
export async function getAdminMobileDetailByImeiAction(imei: string): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get(`/admin/mobiles/imei/${imei}`);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve mobile details by IMEI.");
	}
}

/**
 * Fetch all stock records for a specific mobile device (IMEI-wise) by mobile ID.
 */
export async function getAdminMobileDeviceStocksAction(id: string | number): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get(`/admin/mobiles/device/${id}`);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve device stocks.");
	}
}

/**
 * Fetch all stock records for a specific mobile device (IMEI-wise) by brand slug and model slug.
 */
export async function getAdminMobileDeviceStocksBySlugAction(brandSlug: string, modelSlug: string): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.get(`/admin/mobiles/device/slug/${brandSlug}/${modelSlug}`);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve device stocks by slug.");
	}
}

/**
 * Update stock status or repairing cost of a mobile.
 */
export async function updateAdminMobileStatusAction(
	id: string | number,
	statusData: { status?: string; repairingCost?: number }
): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.put(`/admin/mobiles/${id}/status`, statusData);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to update mobile status.");
	}
}

/**
 * Delete a mobile stock entry from the database.
 */
export async function deleteAdminMobileAction(id: string | number): Promise<AdminMobileResponse> {
	try {
		const response = await apiClient.delete(`/admin/mobiles/${id}`);
		return { success: true, data: JSON.parse(JSON.stringify(response.data)) };
	} catch (error: any) {
		return formatError(error, "Failed to delete mobile stock record.");
	}
}
