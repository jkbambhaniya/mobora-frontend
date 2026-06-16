"use client";

import React, { createContext, useContext, useState } from "react";
import { Customer } from "./types";

interface CustomerContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "CUST-1049",
      name: "Rahul Mehta",
      email: "rahul.mehta@gmail.com",
      phone: "+91 98210 12345",
      status: "Active",
      totalOrders: 3,
      totalSpent: 82500,
      joinedDate: "2025-04-12",
      address: "Shop 4, MG Road, Bangalore - 560001",
      notes: "Prefers Apple devices. Likes prompt deliveries. Interested in upgrading to iPhone 15 Pro.",
      purchases: [
        { id: "ORD-9842", device: "iPhone 13 Pro (128GB Graphite)", date: "2026-06-10", type: "Purchase", amount: 58000, status: "Shipped" },
        { id: "ORD-9210", device: "iPhone Xs (64GB Silver) Trade-in", date: "2025-09-15", type: "Exchange", amount: 12500, status: "Delivered" },
        { id: "ORD-8941", device: "iPad Air 4 (64GB Grey)", date: "2025-02-10", type: "Purchase", amount: 38000, status: "Delivered" }
      ]
    },
    {
      id: "CUST-1048",
      name: "Priya Patel",
      email: "priya.patel@yahoo.com",
      phone: "+91 99123 45678",
      status: "Active",
      totalOrders: 2,
      totalSpent: 42500,
      joinedDate: "2025-05-18",
      address: "24th Main, HSR Layout, Bangalore - 560102",
      notes: "Frequent trader. Inspects devices thoroughly.",
      purchases: [
        { id: "ORD-9839", device: "OnePlus 10 Pro (128GB Emerald Forest)", date: "2026-06-08", type: "Exchange", amount: 24500, status: "Delivered" },
        { id: "ORD-9304", device: "OnePlus 8T (128GB Green) Trade-in", date: "2025-10-05", type: "Exchange", amount: 9500, status: "Delivered" }
      ]
    },
    {
      id: "CUST-1047",
      name: "Amit Sharma",
      email: "amit.sharma@outlook.com",
      phone: "+91 98765 87654",
      status: "Inactive",
      totalOrders: 1,
      totalSpent: 49000,
      joinedDate: "2025-08-20",
      address: "7th Cross, Indiranagar, Bangalore - 560038",
      notes: "Requires printed GST bills. Prefers UPI/NetBanking payment.",
      purchases: [
        { id: "ORD-9840", device: "Galaxy S22 Ultra (256GB Phantom Black)", date: "2026-06-09", type: "Purchase", amount: 49000, status: "Shipped" }
      ]
    }
  ]);

  return (
    <CustomerContext.Provider value={{ customers, setCustomers }}>
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
