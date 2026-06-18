import React, { createContext, useContext, useState, useEffect } from "react";
import { ExchangeRequest, OrderRecord, TradeTransaction, InvoiceRecord, Mobile } from "./types";
import { useUi } from "./ui-context";
import { useInventory } from "./inventory-context";
import { useAuth } from "./auth-context";
import { getTransactionsAction, createTransactionAction } from "@/actions/transactions";

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
  handleAddTradeTransaction: (transaction: Omit<TradeTransaction, "id">, suppressToast?: boolean) => Promise<any>;
  handleAddInvoice: (invoice: Omit<InvoiceRecord, "id">) => void;
  refreshTrades: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { triggerToast } = useUi();
  const { devices, setDevices, refreshDevices, refreshMetrics } = useInventory();
  const { vendor } = useAuth();

  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [trades, setTrades] = useState<TradeTransaction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const refreshTrades = async () => {
    if (!vendor) return;
    try {
      const res = await getTransactionsAction();
      if (res.success && res.data && res.data.success) {
        setTrades(res.data.transactions || []);
      }
    } catch (err) {
      console.error("[TransactionContext] Error refreshing trades:", err);
    }
  };

  useEffect(() => {
    if (vendor) {
      refreshTrades();
    } else {
      setTrades([]);
    }
  }, [vendor]);

  const handleAcceptExchange = (id: string, name: string, offer: number, target: string, price: number) => {
    triggerToast(`Exchange offer accepted!`);
  };

  const handleRejectExchange = (id: string) => {
    triggerToast("Exchange request declined.");
  };

  const handleAddTradeTransaction = async (transaction: Omit<TradeTransaction, "id">, suppressToast = false) => {
    const existingListing = devices.find(
      (item) =>
        (transaction.imei && item.imei === transaction.imei) ||
        (!transaction.imei &&
          item.brand.toLowerCase() === transaction.deviceBrand.toLowerCase() &&
          item.model.toLowerCase() === transaction.deviceModel.toLowerCase())
    );

    const payload = {
      mobile_id: existingListing ? Number(existingListing.id) : null,
      customer_name: transaction.customerName,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      notes: transaction.notes,
      condition: transaction.condition,
      battery_health: transaction.batteryHealth,
      imei: transaction.imei,
      brand_name: transaction.deviceBrand,
      model_name: transaction.deviceModel,
      storage_val: transaction.storage,
      ram_val: transaction.ram,
      color: transaction.color,
    };

    try {
      const res = await createTransactionAction(payload);
      if (res.success && res.data && res.data.success) {
        if (!suppressToast) {
          triggerToast(`Successfully recorded ${transaction.type.toLowerCase()} transaction.`);
        }
        await refreshDevices(undefined, true);
        await refreshMetrics();
        await refreshTrades();
        return res.data.transaction;
      } else {
        triggerToast(res.message || "Failed to record transaction.", "error");
      }
    } catch (err) {
      console.error("[TransactionContext] Error adding trade transaction:", err);
      triggerToast("An error occurred while saving the transaction.", "error");
    }
  };

  const handleAddInvoice = (newInvoice: Omit<InvoiceRecord, "id">) => {
    triggerToast(`Invoice recorded successfully.`);
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
        refreshTrades,
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
