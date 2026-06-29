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

export interface AdminCourierFilters {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

/**
 * Admin: Fetch all courier orders across all vendors.
 */
export async function getAdminCourierOrdersAction(
	filters?: AdminCourierFilters
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.get("/admin/courier", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve courier orders.");
	}
}

/**
 * Admin: Cancel a pending or shipped courier order.
 */
export async function cancelAdminCourierOrderAction(
	id: string | number
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.post(`/admin/courier/${id}/cancel`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to cancel courier order.");
	}
}
