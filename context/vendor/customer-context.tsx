"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Customer } from "./types";
import { useAuth } from "./auth-context";
import {
  getCustomersAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  bulkDeleteCustomersAction,
  bulkUpdateStatusAction
} from "@/actions/customer";

interface CustomerContextType {
  customers: Customer[];
  metrics: {
    totalCustomers: number;
    activeCustomers: number;
    totalSpent: number;
  };
  isLoading: boolean;
  refreshCustomers: (
    filters?: {
      search?: string;
      status?: string;
      spent?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    force?: boolean
  ) => Promise<void>;
  addCustomer: (data: any) => Promise<{ success: boolean; message?: string }>;
  editCustomer: (id: string, data: any) => Promise<{ success: boolean; message?: string }>;
  removeCustomer: (id: string) => Promise<boolean>;
  bulkRemoveCustomers: (ids: string[]) => Promise<boolean>;
  bulkUpdateCustomersStatus: (ids: string[], status: "Active" | "Inactive") => Promise<boolean>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const DEFAULT_FILTERS = {
  search: "",
  status: "All",
  spent: "All",
  sortBy: "name",
  sortOrder: "asc"
};

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { vendor } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState({ totalCustomers: 0, activeCustomers: 0, totalSpent: 0 });
  const [activeFilters, setActiveFilters] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCustomers = async (
    filters?: {
      search?: string;
      status?: string;
      spent?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    force = false
  ) => {
    if (!vendor) return;

    const currentFilters = { ...DEFAULT_FILTERS, ...filters };
    const filtersStr = JSON.stringify(currentFilters);
    if (!force && activeFilters === filtersStr) return; // Skip redundant fetches

    setIsLoading(true);
    try {
      const res = await getCustomersAction(currentFilters);
      if (res.success && res.data && res.data.success) {
        setCustomers(res.data.customers);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        setActiveFilters(filtersStr);
      } else {
        console.warn("[CustomerContext] Failed to load customers:", res.message);
      }
    } catch (err) {
      console.error("[CustomerContext] Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vendor) {
      refreshCustomers(undefined, true);
    } else {
      setCustomers([]);
      setMetrics({ totalCustomers: 0, activeCustomers: 0, totalSpent: 0 });
      setActiveFilters(null);
    }
  }, [vendor]);

  const addCustomer = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await createCustomerAction(data);
      if (res.success && res.data && res.data.success) {
        const parsed = activeFilters ? JSON.parse(activeFilters) : undefined;
        await refreshCustomers(parsed, true);
        return { success: true };
      } else {
        console.error("[CustomerContext] Create customer failed:", res.message);
        return { success: false, message: res.message || "Failed to create customer." };
      }
    } catch (err: any) {
      console.error("[CustomerContext] Create customer error:", err);
      return { success: false, message: err.message || "Failed to create customer." };
    } finally {
      setIsLoading(false);
    }
  };

  const editCustomer = async (id: string, data: any) => {
    setIsLoading(true);
    try {
      const res = await updateCustomerAction(id, data);
      if (res.success && res.data && res.data.success) {
        const parsed = activeFilters ? JSON.parse(activeFilters) : undefined;
        await refreshCustomers(parsed, true);
        return { success: true };
      } else {
        console.error("[CustomerContext] Update customer failed:", res.message);
        return { success: false, message: res.message || "Failed to update customer." };
      }
    } catch (err: any) {
      console.error("[CustomerContext] Update customer error:", err);
      return { success: false, message: err.message || "Failed to update customer." };
    } finally {
      setIsLoading(false);
    }
  };

  const removeCustomer = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await deleteCustomerAction(id);
      if (res.success && res.data && res.data.success) {
        const parsed = activeFilters ? JSON.parse(activeFilters) : undefined;
        await refreshCustomers(parsed, true);
        return true;
      } else {
        console.error("[CustomerContext] Delete customer failed:", res.message);
        return false;
      }
    } catch (err) {
      console.error("[CustomerContext] Delete customer error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkRemoveCustomers = async (ids: string[]) => {
    setIsLoading(true);
    try {
      const res = await bulkDeleteCustomersAction(ids);
      if (res.success && res.data && res.data.success) {
        const parsed = activeFilters ? JSON.parse(activeFilters) : undefined;
        await refreshCustomers(parsed, true);
        return true;
      } else {
        console.error("[CustomerContext] Bulk delete failed:", res.message);
        return false;
      }
    } catch (err) {
      console.error("[CustomerContext] Bulk delete error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateCustomersStatus = async (ids: string[], status: "Active" | "Inactive") => {
    setIsLoading(true);
    try {
      const res = await bulkUpdateStatusAction(ids, status);
      if (res.success && res.data && res.data.success) {
        const parsed = activeFilters ? JSON.parse(activeFilters) : undefined;
        await refreshCustomers(parsed, true);
        return true;
      } else {
        console.error("[CustomerContext] Bulk status update failed:", res.message);
        return false;
      }
    } catch (err) {
      console.error("[CustomerContext] Bulk status update error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        metrics,
        isLoading,
        refreshCustomers,
        addCustomer,
        editCustomer,
        removeCustomer,
        bulkRemoveCustomers,
        bulkUpdateCustomersStatus,
        setCustomers
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomers must be used within a CustomerProvider");
  }
  return context;
}
