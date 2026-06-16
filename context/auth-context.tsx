"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { VendorProfile } from "./types";
import { getProfileAction } from "@/actions/auth";

interface AuthContextType {
  vendor: VendorProfile | null;
  isLoadingVendor: boolean;
  fetchVendorProfile: () => Promise<void>;
  setVendor: React.Dispatch<React.SetStateAction<VendorProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoadingVendor, setIsLoadingVendor] = useState(true);

  const fetchVendorProfile = async () => {
    setIsLoadingVendor(true);
    try {
      const result = await getProfileAction();
      if (result.success && result.data && result.data.success) {
        setVendor(result.data.vendor);
      } else {
        console.warn("[AuthContext] Failed to retrieve profile:", result);
      }
    } catch (err) {
      console.error("[AuthContext] Failed to retrieve vendor profile:", err);
    } finally {
      setIsLoadingVendor(false);
    }
  };

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ vendor, isLoadingVendor, fetchVendorProfile, setVendor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
