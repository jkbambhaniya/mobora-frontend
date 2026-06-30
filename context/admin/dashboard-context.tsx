import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  getAdminStatsAction, 
  getAdminVendorsAction, 
  updateVendorStatusAction,
  updateVendorDetailsAction,
  deleteVendorAction 
} from "@/actions/admin-auth";
import { useAdminAuth } from "./auth-context";

export interface AdminStats {
  totalVendors: number;
  pendingVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  totalMobiles: number;
  totalRepairs: number;
  totalTransactions: number;
  totalCustomers: number;
  growth?: { name: string; vendors: number; mobiles: number }[];
}

export interface VendorDetail {
  id: number;
  name: string;
  email: string;
  status: "pending" | "active" | "inactive";
  profile_img?: string;
  created_at: string;
  businessDetail?: {
    shop_name: string;
    phone: string;
    address: string;
    payment_methods: string;
    gst_enabled: boolean;
    gst_rate: number;
  };
  models?: any[];
  mobiles?: any[];
  transactions?: any[];
  repairs?: any[];
}

interface AdminDashboardContextType {
  stats: AdminStats | null;
  vendors: VendorDetail[];
  isLoadingStats: boolean;
  isLoadingVendors: boolean;
  searchQuery: string;
  statusFilter: string;
  currentPage: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setCurrentPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: string) => void;
  fetchStats: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  updateVendorStatus: (vendorId: number, status: "pending" | "active" | "inactive") => Promise<boolean>;
  updateVendorDetails: (vendorId: number, data: any) => Promise<boolean>;
  deleteVendor: (vendorId: number) => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

export function AdminDashboardProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [vendors, setVendors] = useState<VendorDetail[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Reset page to 1 when filters change
  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSetStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const fetchStats = async () => {
    if (!admin) return;
    setIsLoadingStats(true);
    try {
      const res = await getAdminStatsAction();
      if (res.success && res.data && res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("[AdminDashboard] Failed to fetch stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchVendors = async () => {
    if (!admin) return;
    setIsLoadingVendors(true);
    try {
      const res = await getAdminVendorsAction({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit,
        sortBy,
        sortOrder
      });
      if (res.success && res.data && res.data.success) {
        setVendors(res.data.vendors);
        if (res.data.pagination) {
          setTotalCount(res.data.pagination.totalCount);
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("[AdminDashboard] Failed to fetch vendors:", err);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const updateVendorStatus = async (vendorId: number, status: "pending" | "active" | "inactive") => {
    try {
      const res = await updateVendorStatusAction(vendorId, status);
      if (res.success && res.data && res.data.success) {
        // Refresh both list and stats to keep the active filter tabs in sync
        await Promise.all([fetchVendors(), fetchStats()]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[AdminDashboard] Failed to update status:", err);
      return false;
    }
  };

  const updateVendorDetails = async (vendorId: number, data: any) => {
    try {
      const res = await updateVendorDetailsAction(vendorId, data);
      if (res.success && res.data && res.data.success) {
        const updated = res.data.vendor;
        setVendors(prev =>
          prev.map(v => (v.id === vendorId ? { ...v, ...updated } : v))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("[AdminDashboard] Failed to update vendor details:", err);
      return false;
    }
  };

  const deleteVendor = async (vendorId: number) => {
    try {
      const res = await deleteVendorAction(vendorId);
      if (res.success && res.data && res.data.success) {
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        fetchStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[AdminDashboard] Failed to delete vendor:", err);
      return false;
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchVendors()]);
  };

  useEffect(() => {
    if (admin) {
      refreshAll();
    } else {
      setStats(null);
      setVendors([]);
    }
  }, [admin, statusFilter, searchQuery, currentPage, limit, sortBy, sortOrder]);

  return (
    <AdminDashboardContext.Provider
      value={{
        stats,
        vendors,
        isLoadingStats,
        isLoadingVendors,
        searchQuery,
        statusFilter,
        currentPage,
        limit,
        totalCount,
        totalPages,
        sortBy,
        sortOrder,
        setSearchQuery: handleSetSearchQuery,
        setStatusFilter: handleSetStatusFilter,
        setCurrentPage,
        setLimit,
        setSortBy,
        setSortOrder,
        fetchStats,
        fetchVendors,
        updateVendorStatus,
        updateVendorDetails,
        deleteVendor,
        refreshAll
      }}
    >
      {children}
    </AdminDashboardContext.Provider>
  );
}

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (context === undefined) {
    throw new Error("useAdminDashboard must be used within an AdminDashboardProvider");
  }
  return context;
}
