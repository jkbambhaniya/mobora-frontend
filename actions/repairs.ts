"use server";

import { apiClient } from "./apiClient";
import { ActionResponse } from "./transactions";

export interface RepairFilters {
	search?: string;
	status?: string;
	sortBy?: string;
	sortOrder?: string;
}

function formatError(error: any, defaultMessage: string): ActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

export async function getRepairsAction(filters?: RepairFilters): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/repairs", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch repair job sheets.");
	}
}

export async function createRepairAction(data: any): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/repairs", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create repair job sheet.");
	}
}

export async function updateRepairAction(id: number | string, data: any): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(`/vendor/repairs/${id}`, data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update repair job.");
	}
}

export async function deleteRepairAction(id: number | string): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(`/vendor/repairs/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete repair job.");
	}
}
