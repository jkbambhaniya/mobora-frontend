"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "@/actions/apiClient";

export interface AppNotification {
  id: string;
  type: "new_message" | "vendor_message" | "group_message" | "info";
  title: string;
  body: string;
  chatId?: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, "id" | "isRead" | "timestamp">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const isMounted = useRef(true);

  // ── Load notifications from backend on mount ─────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications");
      if (res?.data?.success && isMounted.current) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err: any) {
      // Silently fail – user might not be authenticated yet
      console.warn("[NotificationContext] Could not fetch notifications:", err?.message);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    return () => { isMounted.current = false; };
  }, [fetchNotifications]);

  // ── Add a new notification (optimistic + backend persist) ─────────────────
  const addNotification = useCallback(
    (notif: Omit<AppNotification, "id" | "isRead" | "timestamp">) => {
      // Optimistic local state
      const tempId = `notif-tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newNotif: AppNotification = { ...notif, id: tempId, isRead: false, timestamp };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));

      // The backend already persists via socketHandler → notificationModel on the server side.
      // We just re-fetch to get the real DB id so subsequent markRead/delete calls work.
      setTimeout(() => { fetchNotifications(); }, 1500);
    },
    [fetchNotifications]
  );

  // ── Mark a single notification as read ───────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    // Optimistic
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    // Persist
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err: any) {
      console.warn("[NotificationContext] markRead failed:", err?.message);
    }
  }, []);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiClient.patch("/notifications/read-all");
    } catch (err: any) {
      console.warn("[NotificationContext] markAllRead failed:", err?.message);
    }
  }, []);

  // ── Clear a single notification ───────────────────────────────────────────
  const clearNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (err: any) {
      console.warn("[NotificationContext] clearNotification failed:", err?.message);
    }
  }, []);

  // ── Clear all notifications ───────────────────────────────────────────────
  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await apiClient.delete("/notifications");
    } catch (err: any) {
      console.warn("[NotificationContext] clearAll failed:", err?.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAllRead,
        markRead,
        clearNotification,
        clearAll,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
