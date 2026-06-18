'use server';

import { apiClient } from "./apiClient";

/**
 * Fetch all customers for current vendor with optional query filters
 */
export async function getCustomersAction(filters?: {
  search?: string;
  status?: string;
  spent?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await apiClient.get("/vendor/customers", { params: filters });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to retrieve customers.",
    };
  }
}

/**
 * Fetch details of a single customer by ID
 */
export async function getCustomerByIdAction(id: string) {
  try {
    const response = await apiClient.get(`/vendor/customers/${id}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to retrieve customer details.",
    };
  }
}

/**
 * Register a new customer
 */
export async function createCustomerAction(customerData: any) {
  try {
    const response = await apiClient.post("/vendor/customers", customerData);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to register customer.",
      errors: error.response?.data?.errors || null
    };
  }
}

/**
 * Update an existing customer profile
 */
export async function updateCustomerAction(id: string, customerData: any) {
  try {
    const response = await apiClient.put(`/vendor/customers/${id}`, customerData);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to update customer.",
      errors: error.response?.data?.errors || null
    };
  }
}

/**
 * Delete a single customer
 */
export async function deleteCustomerAction(id: string) {
  try {
    const response = await apiClient.delete(`/vendor/customers/${id}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to delete customer.",
    };
  }
}

/**
 * Bulk delete customers
 */
export async function bulkDeleteCustomersAction(ids: string[]) {
  try {
    const response = await apiClient.post("/vendor/customers/bulk-delete", { ids });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to delete selected customers.",
    };
  }
}

/**
 * Bulk update status for multiple customers
 */
export async function bulkUpdateStatusAction(ids: string[], status: "Active" | "Inactive") {
  try {
    const response = await apiClient.post("/vendor/customers/bulk-status", { ids, status });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to update selected customers status.",
    };
  }
}
