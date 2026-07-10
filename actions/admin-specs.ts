"use server";

import { apiClient } from "./apiClient";

export interface AdminSpecFilters {
	search?: string;
	status?: "pending" | "active" | "inactive" | "";
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

export interface AdminSpecActionResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: any;
}

function formatError(error: any, defaultMessage: string): AdminSpecActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────

export async function getAdminSpecSummaryAction(): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.get("/admin/specifications/summary");
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch specification summary.");
	}
}

// ─────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────

export async function getAdminBrandsAction(filters?: AdminSpecFilters): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.get("/admin/specifications/brands", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch brands.");
	}
}

export async function updateAdminBrandStatusAction(
	id: number | string,
	status: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put(`/admin/specifications/brands/${id}/status`, { status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update brand status.");
	}
}

export async function deleteAdminBrandAction(id: number | string): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/specifications/brands/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete brand.");
	}
}

// ─────────────────────────────────────────────
// RAMS
// ─────────────────────────────────────────────

export async function getAdminRamsAction(filters?: AdminSpecFilters): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.get("/admin/specifications/rams", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch RAM options.");
	}
}

export async function updateAdminRamStatusAction(
	id: number | string,
	status: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put(`/admin/specifications/rams/${id}/status`, { status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update RAM status.");
	}
}

export async function deleteAdminRamAction(id: number | string): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/specifications/rams/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete RAM option.");
	}
}

// ─────────────────────────────────────────────
// STORAGES
// ─────────────────────────────────────────────

export async function getAdminStoragesAction(filters?: AdminSpecFilters): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.get("/admin/specifications/storages", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch storage options.");
	}
}

export async function updateAdminStorageStatusAction(
	id: number | string,
	status: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put(`/admin/specifications/storages/${id}/status`, { status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update storage status.");
	}
}

export async function deleteAdminStorageAction(id: number | string): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/specifications/storages/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete storage option.");
	}
}

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

export async function getAdminModelsAction(filters?: AdminSpecFilters & { brandId?: string | number }): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.get("/admin/specifications/models", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch models.");
	}
}

export async function deleteAdminModelAction(id: number | string): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.delete(`/admin/specifications/models/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete model.");
	}
}

export async function updateAdminModelAction(
	id: number | string,
	data: { name: string; brand_id: number },
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put(`/admin/specifications/models/${id}`, data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update model.");
	}
}

export async function updateAdminModelStatusAction(
	id: number | string,
	status: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put(`/admin/specifications/models/${id}/status`, { status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update model status.");
	}
}

export async function reorderAdminRamsAction(
	orders: { id: number; order_by: number }[],
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put("/admin/specifications/rams/reorder", { orders });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to reorder RAM options.");
	}
}

export async function reorderAdminStoragesAction(
	orders: { id: number; order_by: number }[],
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.put("/admin/specifications/storages/reorder", { orders });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to reorder storage options.");
	}
}

// ─── ADD NEW SPECIFICATION ACTIONS ───────────────────────────────────────────

export async function createAdminBrandAction(
	name: string,
	status?: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.post("/admin/specifications/brands", { name, status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create brand.");
	}
}

export async function createAdminRamAction(
	value: string,
	status?: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.post("/admin/specifications/rams", { value, status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create RAM option.");
	}
}

export async function createAdminStorageAction(
	value: string,
	status?: "active" | "inactive",
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.post("/admin/specifications/storages", { value, status });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create storage option.");
	}
}

export async function createAdminModelAction(
	data: { name: string; brand_id: number; status?: "active" | "inactive" },
): Promise<AdminSpecActionResponse> {
	try {
		const response = await apiClient.post("/admin/specifications/models", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create model.");
	}
}
