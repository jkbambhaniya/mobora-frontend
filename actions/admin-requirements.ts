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

export interface RequirementFilters {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

/**
 * Admin: Fetch all device requirements across all vendors.
 */
export async function getAdminRequirementsAction(
	filters?: RequirementFilters
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.get("/admin/requirements", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve device requirements.");
	}
}

/**
 * Admin: Fetch a single device requirement by ID.
 */
export async function getAdminRequirementByIdAction(
	id: string | number
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.get(`/admin/requirements/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve device requirement details.");
	}
}

/**
 * Admin: Delete a device requirement.
 */
export async function deleteAdminRequirementAction(
	id: string | number
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/requirements/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete device requirement.");
	}
}

/**
 * Admin: Update device requirement status (Active / Inactive).
 */
export async function updateAdminRequirementStatusAction(
	id: string | number,
	status: "Active" | "Inactive"
): Promise<AdminActionResponse> {
	try {
		const response = await apiClient.put(`/admin/requirements/${id}/status`, { status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update requirement status.");
	}
}
