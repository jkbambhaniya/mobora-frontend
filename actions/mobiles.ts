"use server";

import { apiClient } from "./apiClient";

export interface MobileFilters {
	search?: string;
	brand?: string | number;
	model?: string | number;
	status?: string;
	condition?: string;
	sortBy?: string;
	sortOrder?: string;
	page?: number;
	limit?: number;
}

export interface ActionResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: any;
}

// Helper to format Axios error responses
function formatError(error: any, defaultMessage: string): ActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

export async function getMobilesAction(
	filters?: MobileFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/mobiles", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch mobile listings.");
	}
}

export async function getMobileMetricsAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/mobiles/metrics");
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch mobile metrics.");
	}
}

export async function getMobileAction(id: string | number): Promise<ActionResponse> {
	try {
		const response = await apiClient.get(`/vendor/mobiles/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch mobile listing.");
	}
}

export async function createMobileAction(data: any): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/mobiles", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to register mobile device.");
	}
}

export async function updateMobileAction(
	id: string | number,
	data: any,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(`/vendor/mobiles/${id}`, data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update mobile listing.");
	}
}

export async function deleteMobileAction(
	id: string | number,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(`/vendor/mobiles/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete mobile listing.");
	}
}
