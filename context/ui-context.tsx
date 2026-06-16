"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "react-hot-toast";

interface UiContextType {
  activeTab: "overview" | "device" | "exchanges" | "orders" | "settings" | "trades";
  setActiveTab: (tab: "overview" | "device" | "exchanges" | "orders" | "settings" | "trades") => void;
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<"overview" | "device" | "exchanges" | "orders" | "settings" | "trades">("overview");

  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  return (
    <UiContext.Provider value={{ activeTab, setActiveTab, toastMessage: null, triggerToast }}>
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const context = useContext(UiContext);
  if (context === undefined) {
    throw new Error("useUi must be used within a UiProvider");
  }
  return context;
}
