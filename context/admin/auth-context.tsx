"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAdminProfileAction } from "@/actions/admin-auth";

export interface AdminProfile {
  id: string | number;
  name: string;
  email: string;
  role: string;
  profile_img?: string;
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  isLoadingAdmin: boolean;
  fetchAdminProfile: () => Promise<void>;
  setAdmin: React.Dispatch<React.SetStateAction<AdminProfile | null>>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  const fetchAdminProfile = async () => {
    setIsLoadingAdmin(true);
    try {
      const result = await getAdminProfileAction();
      if (result.success && result.data && result.data.success) {
        setAdmin(result.data.admin);
      } else {
        console.warn("[AdminAuthContext] Failed to retrieve admin profile:", result);
      }
    } catch (err) {
      console.error("[AdminAuthContext] Failed to retrieve admin profile:", err);
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoadingAdmin, fetchAdminProfile, setAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
