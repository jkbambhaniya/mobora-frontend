"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "./auth-context";
import { apiClient } from "@/actions/apiClient";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

export interface ChatMessage {
	id: string;
	sender: "admin" | "vendor" | "customer";
	senderId?: number | string;
	senderName?: string;
	text?: string;
	timestamp: string;
	status: "sent" | "delivered" | "read" | "unread";
	attachment?: {
		type: "image" | "video" | "file";
		name: string;
		size?: string;
		url: string;
	};
}

export interface ChatSession {
	id: string;
	customerName: string;
	customerPhone?: string;
	customerEmail?: string;
	avatar: string;
	profileImg?: string;
	status: "online" | "offline";
	lastMessage?: string;
	unreadCount: number;
	lastActive?: string;
	deviceInterest?: string;
	notes?: string;
	isGroup: boolean;
	groupName?: string;
	groupMembers: number[];
	vendorId?: number;
}

interface AdminChatContextType {
  chats: ChatSession[];
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  activeChatMessages: ChatMessage[];
  setActiveChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isConnected: boolean;
  socketRef: React.MutableRefObject<Socket | null>;
  fetchSessions: () => Promise<void>;
  fetchMessages: (chatId: string, limit?: number, offset?: number) => Promise<{ messages: ChatMessage[]; hasMore: boolean } | null>;
  sendMessage: (chatId: string, text: string, attachment?: any) => void;
}

const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

export function AdminChatProvider({ children }: { children: React.ReactNode }) {
  const { admin } = useAdminAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);

  const activeChatIdRef = useRef<string | null>(null);
  const pathnameRef = useRef<string>(pathname);
  const prevChatsRef = useRef<Map<string, number>>(new Map());
  const recentNotifRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const fetchSessions = async () => {
    if (!admin) return;
    try {
      const res = await apiClient.get("/admin/chat/sessions");
      if (res?.data?.success) {
        setChats(res.data.chats || []);
      }
    } catch (err: any) {
      console.error("[AdminChatContext] Error fetching sessions:", err.message);
    }
  };

  const fetchMessages = async (chatId: string, limit = 15, offset = 0) => {
    if (!admin) return null;
    try {
      const res = await apiClient.get(`/admin/chat/sessions/${chatId}/messages?limit=${limit}&offset=${offset}`);
      if (res?.data?.success) {
        const newMessages = res.data.messages || [];
        const hasMore = res.data.hasMore || false;
        if (offset === 0) {
          setActiveChatMessages(newMessages);
        } else {
          setActiveChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const filteredNew = newMessages.filter((m: any) => !existingIds.has(m.id));
            return [...filteredNew, ...prev];
          });
        }
        return { messages: newMessages, hasMore };
      }
      return null;
    } catch (err: any) {
      console.error("[AdminChatContext] Error fetching messages:", err.message);
      return null;
    }
  };

  const sendMessage = (chatId: string, text: string, attachment?: any) => {
    if (!socketRef.current || !isConnected || !admin) {
      toast.error("Chat is currently offline. Retrying connection...");
      return;
    }
    socketRef.current.emit("send_message", {
      chatId,
      adminId: admin.id,
      text,
      attachment
    });
  };

  useEffect(() => {
    if (!admin) {
      setChats([]);
      setActiveChatMessages([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    fetchSessions();

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (isLocalhost
      ? `${window.location.protocol}//${window.location.hostname}:5000`
      : `${window.location.protocol}//${window.location.hostname}`);
    console.log(`[AdminChatContext] Connecting to socket at ${socketUrl}`);

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[AdminChatContext] Socket connected!");
      setIsConnected(true);
      socket.emit("register_admin", { adminId: admin.id });
    });

    socket.on("connect_error", (err) => {
      console.warn("[AdminChatContext] Connection error:", err.message);
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      console.log("[AdminChatContext] Socket disconnected.");
      setIsConnected(false);
    });

    let isFirstSessionsUpdate = true;

    socket.on("admin_sessions_update", (updatedSessions: ChatSession[]) => {
      const currentActiveChatId = activeChatIdRef.current;
      const currentPathname = pathnameRef.current;
      const prevUnread = prevChatsRef.current;

      if (!isFirstSessionsUpdate) {
        for (const session of updatedSessions) {
          const prevCount = prevUnread.get(session.id) ?? 0;
          const newCount = session.unreadCount ?? 0;
          const isViewingThisChat =
            currentPathname === "/admin/chat" && currentActiveChatId === session.id;

          if (newCount > prevCount && !isViewingThisChat) {
            // Dedup check
            const lastNotifTime = recentNotifRef.current.get(session.id) ?? 0;
            if (Date.now() - lastNotifTime < 3000) continue;
            recentNotifRef.current.set(session.id, Date.now());

            const senderName = session.customerName;
            const lastMsg = session.lastMessage || "New message received";

            toast(
              `${senderName}: ${lastMsg.length > 45 ? lastMsg.slice(0, 45) + "…" : lastMsg}`,
              {
                duration: 5000,
                icon: "💬",
                style: { fontSize: "12px", fontWeight: "600", borderRadius: "12px" },
              }
            );
          }
        }
      }

      isFirstSessionsUpdate = false;
      prevChatsRef.current = new Map(updatedSessions.map(s => [s.id, s.unreadCount ?? 0]));
      setChats(updatedSessions);
    });

    socket.on("receive_message", (message: ChatMessage) => {
      setActiveChatMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("messages_read", ({ chatId }: { chatId: string }) => {
      setActiveChatMessages(prev =>
        prev.map(m =>
          m.sender === "admin" && m.status !== "read" ? { ...m, status: "read" } : m
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [admin]);

  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    if (pathname === "/admin/chat" && activeChatId) {
      socketRef.current.emit("active_chat_changed", { chatId: activeChatId });
    } else {
      socketRef.current.emit("active_chat_changed", { chatId: null });
    }
  }, [activeChatId, pathname, isConnected]);

  return (
    <AdminChatContext.Provider
      value={{
        chats,
        setChats,
        activeChatId,
        setActiveChatId,
        activeChatMessages,
        setActiveChatMessages,
        isConnected,
        socketRef,
        fetchSessions,
        fetchMessages,
        sendMessage,
      }}
    >
      {children}
    </AdminChatContext.Provider>
  );
}

export function useAdminChats() {
  const context = useContext(AdminChatContext);
  if (context === undefined) {
    throw new Error("useAdminChats must be used within an AdminChatProvider");
  }
  return context;
}
