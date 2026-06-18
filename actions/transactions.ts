"use server";

import { apiClient } from "./apiClient";

export interface TransactionFilters {
	search?: string;
	type?: string;
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

function formatError(error: any, defaultMessage: string): ActionResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

export async function getTransactionsAction(
	filters?: TransactionFilters,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/transactions", {
			params: filters,
		});
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to fetch transactions list.");
	}
}

export async function createTransactionAction(data: any): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/transactions", data);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to record transaction.");
	}
}
