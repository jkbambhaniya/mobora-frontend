"use server";

import { apiClient } from "./apiClient";

export interface SpecFilters {
	search?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
	brandId?: string | number;
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

// ─────────────────────────────────────────────
// METRICS & ALL
// ─────────────────────────────────────────────

export async function getSpecMetricsAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/specifications/metrics");
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch metrics.");
	}
}

export async function getAllSpecsAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/specifications/all");
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch all specs.");
	}
}

// ─────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────

export async function getBrandsAction(
	filters?: SpecFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/specifications/brands", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch brands.");
	}
}

export async function createBrandAction(name: string): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/specifications/brands", {
			name,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create brand.");
	}
}

export async function updateBrandAction(
	id: number | string,
	name: string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(
			`/vendor/specifications/brands/${id}`,
			{ name },
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update brand.");
	}
}

export async function deleteBrandAction(
	id: number | string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(
			`/vendor/specifications/brands/${id}`,
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete brand.");
	}
}

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

export async function getModelsAction(
	filters?: SpecFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/specifications/models", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch models.");
	}
}

export async function createModelAction(
	name: string,
	brand_id: number | string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/specifications/models", {
			name,
			brand_id,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create model.");
	}
}

export async function updateModelAction(
	id: number | string,
	data: { name?: string; brand_id?: number | string },
): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(
			`/vendor/specifications/models/${id}`,
			data,
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update model.");
	}
}

export async function deleteModelAction(
	id: number | string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(
			`/vendor/specifications/models/${id}`,
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete model.");
	}
}

// ─────────────────────────────────────────────
// STORAGES
// ─────────────────────────────────────────────

export async function getStoragesAction(
	filters?: SpecFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get(
			"/vendor/specifications/storages",
			{ params: filters },
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch storages.");
	}
}

export async function createStorageAction(
	value: string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post(
			"/vendor/specifications/storages",
			{ value },
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create storage.");
	}
}

export async function updateStorageAction(
	id: number | string,
	value: string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(
			`/vendor/specifications/storages/${id}`,
			{ value },
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update storage.");
	}
}

export async function deleteStorageAction(
	id: number | string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(
			`/vendor/specifications/storages/${id}`,
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete storage.");
	}
}

// ─────────────────────────────────────────────
// RAMS
// ─────────────────────────────────────────────

export async function getRamsAction(
	filters?: SpecFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/specifications/rams", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch RAM options.");
	}
}

export async function createRamAction(value: string): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/specifications/rams", {
			value,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create RAM option.");
	}
}

export async function updateRamAction(
	id: number | string,
	value: string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.put(
			`/vendor/specifications/rams/${id}`,
			{ value },
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update RAM option.");
	}
}

export async function deleteRamAction(
	id: number | string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(
			`/vendor/specifications/rams/${id}`,
		);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete RAM option.");
	}
}
