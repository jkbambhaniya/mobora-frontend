"use server";

import { apiClient } from "./apiClient";
import { ActionResponse } from "./specifications";

export async function getRequirementsAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/requirements");
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to fetch requirements.",
			errors: errorData?.errors || null,
		};
	}
}

export async function createRequirementAction(data: {
	brand_id: number;
	model_id: number;
	storage_id: number;
	ram_id: number;
	color?: string;
}): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/requirements", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to create requirement.",
			errors: errorData?.errors || null,
		};
	}
}

export async function deleteRequirementAction(id: number): Promise<ActionResponse> {
	try {
		const response = await apiClient.delete(`/vendor/requirements/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to delete requirement.",
			errors: errorData?.errors || null,
		};
	}
}

export async function getMatchingDevicesAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/requirements/matches");
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to fetch matching devices.",
			errors: errorData?.errors || null,
		};
	}
}
