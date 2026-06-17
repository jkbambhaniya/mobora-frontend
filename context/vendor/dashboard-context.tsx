"use client";

import React from "react";
import { UiProvider, useUi } from "./ui-context";
import { AuthProvider, useAuth } from "./auth-context";
import { InventoryProvider, useInventory } from "./inventory-context";
import { TransactionProvider, useTransactions } from "./transaction-context";
import { CustomerProvider, useCustomers } from "./customer-context";
import { ChatProvider, useChats } from "./chat-context";
import { NotificationProvider, useNotifications } from "./notification-context";

// Re-export types for backward compatibility
export type {
  VendorProfile,
  MobileListing,
  ExchangeRequest,
  OrderRecord,
  TradeTransaction,
  InvoiceItem,
  InvoiceRecord,
  PurchaseHistoryItem,
  Customer,
  Attachment,
  ChatMessage,
  ChatSession,
} from "./types";

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  return (
    <UiProvider>
      <AuthProvider>
        <InventoryProvider>
          <TransactionProvider>
            <CustomerProvider>
              <NotificationProvider>
                <ChatProvider>{children}</ChatProvider>
              </NotificationProvider>
            </CustomerProvider>
          </TransactionProvider>
        </InventoryProvider>
      </AuthProvider>
    </UiProvider>
  );
}

export function useDashboard() {
  const ui = useUi();
  const auth = useAuth();
  const inventory = useInventory();
  const transactions = useTransactions();
  const customer = useCustomers();
  const chat = useChats();
  const notifications = useNotifications();

  return {
    ...ui,
    ...auth,
    ...inventory,
    ...transactions,
    ...customer,
    ...chat,
    ...notifications,
  };
}

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
