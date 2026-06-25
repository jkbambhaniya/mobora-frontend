"use server";

import { apiClient } from "./apiClient";

export interface AdminActionResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: any;
}

function formatError(error: any, defaultMessage: string): AdminActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

export interface BlacklistFilters {
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

/**
 * Admin: Fetch all blacklisted devices across all vendors.
 */
export async function getAdminBlacklistedDevicesAction(
	filters?: BlacklistFilters
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.get("/admin/blacklist", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve blacklisted devices.");
	}
}

/**
 * Admin: Fetch a single blacklisted device by ID.
 */
export async function getAdminBlacklistedDeviceByIdAction(
	id: string | number
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.get(`/admin/blacklist/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve blacklisted device details.");
	}
}

/**
 * Admin: Remove a blacklisted device.
 */
export async function removeAdminBlacklistedDeviceAction(
	id: string | number
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/blacklist/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to remove blacklisted device.");
	}
}
