"use server";

import { apiClient } from "./apiClient";
import { ActionResponse } from "./transactions";

export interface CourierOrderFilters {
	type?: "all" | "sales" | "purchases";
}

function formatError(error: any, defaultMessage: string): ActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

export async function getCourierOrdersAction(
	filters?: CourierOrderFilters
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/courier", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch courier orders list.");
	}
}

export async function createCourierOrderAction(data: {
	buyer_id: number;
	mobile_id: number;
	amount: number;
	notes?: string;
}): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/courier/order", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to create courier order.");
	}
}

export async function shipCourierOrderAction(
	id: string | number,
	data: { courier_name: string; tracking_id: string }
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post(`/vendor/courier/order/${id}/ship`, data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to ship courier order.");
	}
}

export async function receiveCourierOrderAction(
	id: string | number
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post(`/vendor/courier/order/${id}/receive`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to confirm receipt of courier order.");
	}
}

export async function cancelCourierOrderAction(
	id: string | number
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post(`/vendor/courier/order/${id}/cancel`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to cancel courier order.");
	}
}
