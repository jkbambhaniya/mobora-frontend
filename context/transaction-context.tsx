"use client";

import React, { createContext, useContext, useState } from "react";
import { ExchangeRequest, OrderRecord, TradeTransaction, InvoiceRecord, MobileListing } from "./types";
import { useUi } from "./ui-context";
import { useInventory } from "./inventory-context";

interface TransactionContextType {
  exchanges: ExchangeRequest[];
  setExchanges: React.Dispatch<React.SetStateAction<ExchangeRequest[]>>;
  orders: OrderRecord[];
  setOrders: React.Dispatch<React.SetStateAction<OrderRecord[]>>;
  trades: TradeTransaction[];
  setTrades: React.Dispatch<React.SetStateAction<TradeTransaction[]>>;
  invoices: InvoiceRecord[];
  setInvoices: React.Dispatch<React.SetStateAction<InvoiceRecord[]>>;
  handleAcceptExchange: (id: string, name: string, offer: number, target: string, price: number) => void;
  handleRejectExchange: (id: string) => void;
  handleAddTradeTransaction: (transaction: Omit<TradeTransaction, "id">) => void;
  handleAddInvoice: (invoice: Omit<InvoiceRecord, "id">) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { triggerToast } = useUi();
  const { devices, setDevices } = useInventory();

  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([
    {
      id: "EXCH-101",
      customerName: "Rahul Mehta",
      customerPhone: "iPhone Xr",
      customerPhoneSpecs: "128GB Black",
      customerPhoneCondition: "Fair",
      customerPhoneBattery: 80,
      targetDevice: "iPhone 13 Pro",
      targetPrice: 58000,
      valuationOffer: 12000,
      status: "Pending",
      date: "2026-06-10",
    },
    {
      id: "EXCH-102",
      customerName: "Priya Patel",
      customerPhone: "OnePlus 8T",
      customerPhoneSpecs: "128GB Green",
      customerPhoneCondition: "Good",
      customerPhoneBattery: 83,
      targetDevice: "OnePlus 10 Pro",
      targetPrice: 34000,
      valuationOffer: 9500,
      status: "Accepted",
      date: "2026-06-08",
    },
    {
      id: "EXCH-103",
      customerName: "Amit Sharma",
      customerPhone: "Galaxy S20",
      customerPhoneSpecs: "128GB Grey",
      customerPhoneCondition: "Fair",
      customerPhoneBattery: 78,
      targetDevice: "Galaxy S22 Ultra",
      targetPrice: 49000,
      valuationOffer: 8000,
      counterOffer: 9500,
      status: "Countered",
      date: "2026-06-05",
    },
  ]);

  const [orders, setOrders] = useState<OrderRecord[]>([
    {
      id: "ORD-9842",
      customerName: "Amit Shah",
      date: "2026-06-10",
      device: "iPhone 13 Pro (128GB Graphite)",
      type: "Purchase",
      amount: 58000,
      status: "Shipped",
    },
    {
      id: "ORD-9839",
      customerName: "Priya Patel",
      date: "2026-06-08",
      device: "OnePlus 10 Pro (128GB Emerald Forest)",
      type: "Exchange",
      amount: 24500,
      status: "Delivered",
    },
    {
      id: "ORD-9831",
      customerName: "Karan Johar",
      date: "2026-06-05",
      device: "iPhone 12 Mini (64GB Blue)",
      type: "Purchase",
      amount: 24500,
      status: "Delivered",
    },
  ]);

  const [trades, setTrades] = useState<TradeTransaction[]>([
    {
      id: "TRD-1001",
      imei: "1232342343454345",
      deviceBrand: "Apple",
      deviceModel: "iPhone 16 Pro Max",
      type: "Purchase",
      customerName: "Customer 1",
      amount: 50000,
      date: "2026-06-01",
      notes: "Initial purchase from Customer 1.",
    },
    {
      id: "TRD-1002",
      imei: "1232342343454345",
      deviceBrand: "Apple",
      deviceModel: "iPhone 16 Pro Max",
      type: "Sale",
      customerName: "Customer 2",
      amount: 60000,
      date: "2026-06-03",
      notes: "Sold to Customer 2.",
    },
    {
      id: "TRD-1003",
      imei: "1232342343454345",
      deviceBrand: "Apple",
      deviceModel: "iPhone 16 Pro Max",
      type: "Purchase",
      customerName: "Customer 2",
      amount: 55000,
      date: "2026-06-06",
      notes: "Buyback from Customer 2.",
    },
    {
      id: "TRD-1004",
      imei: "1232342343454345",
      deviceBrand: "Apple",
      deviceModel: "iPhone 16 Pro Max",
      type: "Sale",
      customerName: "Customer 3",
      amount: 65000,
      date: "2026-06-10",
      notes: "Sold to Customer 3.",
    },
    {
      id: "TRD-1011",
      imei: "359283748291827",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13 Pro",
      type: "Purchase",
      customerName: "Rajesh Sharma",
      amount: 48000,
      date: "2026-06-05",
      notes: "Purchased from customer in Mint condition with original box.",
    },
    {
      id: "TRD-1012",
      imei: "359283748291827",
      deviceBrand: "Apple",
      deviceModel: "iPhone 13 Pro",
      type: "Sale",
      customerName: "Suresh Gupta",
      amount: 58000,
      date: "2026-06-09",
      notes: "Sold variant to Suresh. UPI payment received.",
    },
  ]);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    {
      id: "INV-8001",
      customerName: "Rahul Mehta",
      customerPhone: "+91 99887 76655",
      date: "2026-06-10",
      billType: "MarginScheme",
      items: [
        { type: "Sale", description: "iPhone 13 Pro (128GB Graphite)", rate: 58000, cost: 47000, imei: "359283748291827" },
        { type: "Repair", description: "Screen Guard installation", rate: 500 },
        { type: "Exchange", description: "iPhone Xr 128GB Black (Trade-in)", rate: 12000, imei: "356192837482910" }
      ],
      taxRate: 18,
      taxAmount: 1980,
      subtotal: 58500,
      exchangeDeduction: 12000,
      totalAmount: 48480,
      paymentMethod: "UPI"
    }
  ]);

  const handleAcceptExchange = (id: string, name: string, offer: number, target: string, price: number) => {
    setExchanges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Accepted" } : item))
    );
    const newOrder: OrderRecord = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: name,
      date: new Date().toISOString().split("T")[0],
      device: `${target} (Exchange Traded-in)`,
      type: "Exchange",
      amount: price - offer,
      status: "Processing",
    };
    setOrders((prev) => [newOrder, ...prev]);
    triggerToast(`Exchange offer accepted! Generated Order ${newOrder.id}.`);
  };

  const handleRejectExchange = (id: string) => {
    setExchanges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Rejected" } : item))
    );
    triggerToast("Exchange request declined.");
  };

  const handleAddTradeTransaction = (transaction: Omit<TradeTransaction, "id">) => {
    const newId = `TRD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrade: TradeTransaction = {
      ...transaction,
      id: newId,
    };
    
    setTrades((prev) => [newTrade, ...prev]);

    if (transaction.type === "Sale") {
      const newOrder: OrderRecord = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: transaction.customerName,
        date: transaction.date,
        device: `${transaction.deviceBrand} ${transaction.deviceModel} (IMEI: ${transaction.imei})`,
        type: "Purchase",
        amount: transaction.amount,
        status: "Delivered",
      };
      setOrders((prev) => [newOrder, ...prev]);

      setDevices((prev) =>
        prev.map((item) =>
          (transaction.imei && item.imei === transaction.imei) ||
          (!transaction.imei &&
            item.brand.toLowerCase() === transaction.deviceBrand.toLowerCase() &&
            item.model.toLowerCase() === transaction.deviceModel.toLowerCase())
            ? { ...item, status: "Sold", stock: 0 }
            : item
        )
      );

      triggerToast(`Successfully recorded sale. Generated Order ${newOrder.id}`);
    } else {
      const existingListing = devices.find(
        (item) =>
          (transaction.imei && item.imei === transaction.imei) ||
          (!transaction.imei &&
            item.brand.toLowerCase() === transaction.deviceBrand.toLowerCase() &&
            item.model.toLowerCase() === transaction.deviceModel.toLowerCase())
      );

      if (existingListing) {
        setDevices((prev) =>
          prev.map((item) =>
            item.id === existingListing.id
              ? { 
                  ...item, 
                  status: "Active", 
                  stock: 1, 
                  purchasePrice: transaction.amount,
                  price: Math.round(transaction.amount * 1.2), 
                  condition: transaction.condition || item.condition,
                  batteryHealth: transaction.batteryHealth || item.batteryHealth,
                  storage: transaction.storage || item.storage,
                  ram: transaction.ram || item.ram,
                  color: transaction.color || item.color,
                  description: transaction.notes || `Re-acquired via buyback from ${transaction.customerName}.`
                }
              : item
          )
        );
      } else {
        const newListing: MobileListing = {
          id: `LIST-${Date.now().toString().slice(-4)}`,
          brand: transaction.deviceBrand,
          model: transaction.deviceModel,
          storage: transaction.storage || "128GB",
          ram: transaction.ram || "6GB",
          color: transaction.color || "Space Gray",
          imei: transaction.imei,
          condition: transaction.condition || "Excellent",
          price: Math.round(transaction.amount * 1.2),
          purchasePrice: transaction.amount,
          stock: 1,
          batteryHealth: transaction.batteryHealth || 90,
          status: "Active",
          description: transaction.notes || `Acquired via trade-in from ${transaction.customerName} (IMEI: ${transaction.imei}).`,
        };
        setDevices((prev) => [newListing, ...prev]);
      }

      triggerToast(`Successfully recorded trade-in purchase of ${transaction.deviceBrand} ${transaction.deviceModel}.`);
    }
  };

  const handleAddInvoice = (newInvoice: Omit<InvoiceRecord, "id">) => {
    const newId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice: InvoiceRecord = {
      ...newInvoice,
      id: newId
    };
    setInvoices((prev) => [invoice, ...prev]);

    invoice.items.forEach((item) => {
      if (item.type === "Sale") {
        setDevices((prev) =>
          prev.map((d) => {
            if (d.imei === item.imei || (d.model && item.description.includes(d.model))) {
              return { ...d, status: "Sold", stock: Math.max(0, d.stock - 1) };
            }
            return d;
          })
        );

        const newTrade: TradeTransaction = {
          id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
          imei: item.imei || "359283748291827",
          deviceBrand: item.description.split(" ")[0] || "Apple",
          deviceModel: item.description.split("(")[0].trim() || "iPhone 13 Pro",
          type: "Sale",
          customerName: invoice.customerName,
          amount: item.rate,
          date: invoice.date,
          notes: `Sold via Invoice ${newId} (${invoice.billType === "MarginScheme" ? "Margin Scheme" : "Standard"})`
        };
        setTrades((prev) => [newTrade, ...prev]);

        const newOrder: OrderRecord = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: invoice.customerName,
          date: invoice.date,
          device: item.description,
          type: "Purchase",
          amount: item.rate,
          status: "Delivered"
        };
        setOrders((prev) => [newOrder, ...prev]);
      } else if (item.type === "Exchange") {
        const newTrade: TradeTransaction = {
          id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
          imei: item.imei || "356192837482910",
          deviceBrand: item.description.split(" ")[0] || "Apple",
          deviceModel: item.description.split(" ")[1] || "Device",
          type: "Purchase",
          customerName: invoice.customerName,
          amount: item.rate,
          date: invoice.date,
          notes: `Traded in via Invoice ${newId}`
        };
        setTrades((prev) => [newTrade, ...prev]);

        const newListing: MobileListing = {
          id: `LIST-${Date.now().toString().slice(-4)}`,
          brand: newTrade.deviceBrand,
          model: newTrade.deviceModel,
          storage: "128GB",
          ram: "6GB",
          color: "Space Gray",
          imei: newTrade.imei,
          condition: "Good",
          price: Math.round(item.rate * 1.2),
          purchasePrice: item.rate,
          stock: 1,
          batteryHealth: 84,
          status: "Active",
          description: `Acquired via trade-in on Invoice ${newId} from ${invoice.customerName}.`
        };
        setDevices((prev) => [newListing, ...prev]);
      }
    });

    triggerToast(`Successfully generated Invoice ${newId}`);
  };

  return (
    <TransactionContext.Provider
      value={{
        exchanges,
        setExchanges,
        orders,
        setOrders,
        trades,
        setTrades,
        invoices,
        setInvoices,
        handleAcceptExchange,
        handleRejectExchange,
        handleAddTradeTransaction,
        handleAddInvoice,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
}
