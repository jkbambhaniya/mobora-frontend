"use server";

import { apiClient } from "./apiClient";

export interface AdminCustomerFilters {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: string;
}

export interface AdminCustomerResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: any;
}

function formatError(error: any, defaultMessage: string): AdminCustomerResponse {
	const errorData = error.response?.data;
	return {
		success: false,
		message: errorData?.message || error.message || defaultMessage,
		errors: errorData?.errors || null,
	};
}

/**
 * Fetch all customers globally for admin.
 */
export async function getAdminCustomersAction(filters?: AdminCustomerFilters): Promise<AdminCustomerResponse> {
	try {
		const response = await apiClient.get("/admin/customers", { params: filters });
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve customers.");
	}
}

/**
 * Fetch details of a single customer by ID (with all details, transactions, invoice data).
 */
export async function getAdminCustomerByIdAction(id: string): Promise<AdminCustomerResponse> {
	try {
		const response = await apiClient.get(`/admin/customers/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to retrieve customer details.");
	}
}

/**
 * Update customer profile details.
 */
export async function updateAdminCustomerAction(id: string, customerData: any): Promise<AdminCustomerResponse> {
	try {
		const response = await apiClient.put(`/admin/customers/${id}`, customerData);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to update customer details.");
	}
}

/**
 * Delete a customer.
 */
export async function deleteAdminCustomerAction(id: string): Promise<AdminCustomerResponse> {
	try {
		const response = await apiClient.delete(`/admin/customers/${id}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		return formatError(error, "Failed to delete customer.");
	}
}
