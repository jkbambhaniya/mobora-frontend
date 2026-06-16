"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChatSession, ChatMessage, Attachment } from "./types";
import { useAuth } from "./auth-context";
import { useNotifications } from "./notification-context";
import { apiClient } from "@/actions/apiClient";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

interface ChatContextType {
  chats: ChatSession[];
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeChatMessages: ChatMessage[];
  setActiveChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, attachment?: Attachment) => void;
  uploadFile: (file: File) => Promise<Attachment | null>;
  createChatSession: (data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deviceInterest?: string;
    notes?: string;
    initialMessage?: string;
    recipientVendorId?: number;
    isGroup?: boolean;
    groupName?: string;
    memberIds?: number[];
  }) => Promise<string | null>;
  fetchVendors: () => Promise<any[]>;
  typingStatus: { [chatId: string]: boolean };
  isConnected: boolean;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { vendor } = useAuth();
  const { addNotification } = useNotifications();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [typingStatus, setTypingStatus] = useState<{ [chatId: string]: boolean }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);

  // Use refs for all values needed inside socket event callbacks to avoid stale closures
  const activeChatIdRef = useRef<string | null>(null);
  const pathnameRef = useRef<string>(pathname);
  const addNotificationRef = useRef(addNotification);
  // Track previous session unread counts to detect new messages
  const prevChatsRef = useRef<Map<string, number>>(new Map());
  // Deduplication: track chatId -> last notified timestamp (3s window)
  const recentNotifRef = useRef<Map<string, number>>(new Map());

  // Keep refs always in sync with latest values
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Fetch all chat sessions for current vendor
  const fetchSessions = async () => {
    if (!vendor) return;
    try {
      const res = await apiClient.get("/chat/sessions");
      if (res?.data?.success) {
        setChats(res.data.chats || []);
      }
    } catch (err: any) {
      console.error("[ChatContext] Error fetching sessions:", err.message);
    }
  };

  // Fetch message history for a specific session
  const fetchMessages = async (chatId: string) => {
    if (!vendor) return;
    try {
      const res = await apiClient.get(`/chat/sessions/${chatId}/messages`);
      if (res?.data?.success) {
        setActiveChatMessages(res.data.messages || []);
      }
    } catch (err: any) {
      console.error("[ChatContext] Error fetching messages:", err.message);
    }
  };

  // Upload file utility
  const uploadFile = async (file: File): Promise<Attachment | null> => {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

      let type: "image" | "video" | "file" = "file";
      if (file.type.startsWith("image/")) {
        type = "image";
      } else if (file.type.startsWith("video/")) {
        type = "video";
      }

      const res = await apiClient.post("/chat/upload", {
        name: file.name,
        type,
        base64: base64String
      });

      if (res.data && res.data.success) {
        const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        return { type, name: file.name, size: sizeStr, url: res.data.url };
      }
      return null;
    } catch (err: any) {
      console.error("[ChatContext] File upload failed:", err.message);
      toast.error("Failed to upload file. Please try again.");
      return null;
    }
  };

  // Send message over WebSocket
  const sendMessage = (chatId: string, text: string, attachment?: Attachment) => {
    if (!socketRef.current || !isConnected || !vendor) {
      toast.error("Chat is currently offline. Retrying connection...");
      return;
    }
    socketRef.current.emit("send_message", {
      chatId,
      vendorId: vendor.id,
      text,
      attachment
    });
  };

  // Create new chat session manually
  const createChatSession = async (data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deviceInterest?: string;
    notes?: string;
    initialMessage?: string;
    recipientVendorId?: number;
    isGroup?: boolean;
    groupName?: string;
    memberIds?: number[];
  }): Promise<string | null> => {
    try {
      const res = await apiClient.post("/chat/sessions", data);
      if (res?.data?.success) {
        const newChatId = res.data.chatId;
        await fetchSessions();
        return newChatId;
      }
      return null;
    } catch (err: any) {
      console.error("[ChatContext] Error creating chat session:", err.response?.data || err.message);
      const errMsg = err.response?.data?.message || "Failed to create chat session. Please verify inputs.";
      toast.error(errMsg);
      return null;
    }
  };

  // Fetch list of other registered vendors
  const fetchVendors = async (): Promise<any[]> => {
    try {
      const res = await apiClient.get("/chat/vendors");
      if (res?.data?.success) {
        return res.data.vendors || [];
      }
      return [];
    } catch (err: any) {
      console.error("[ChatContext] Error fetching vendors list:", err.message);
      return [];
    }
  };

  // Socket Connection Lifecycle
  useEffect(() => {
    if (!vendor) {
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

    const socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    console.log(`[ChatContext] Connecting to Socket server at ${socketUrl}`);

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ChatContext] Socket connected!");
      setIsConnected(true);
      socket.emit("register", { vendorId: vendor.id });
    });

    socket.on("connect_error", (err) => {
      console.warn("[ChatContext] Socket connection error:", err.message);
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      console.log("[ChatContext] Socket disconnected.");
      setIsConnected(false);
    });

    // ─── sessions_update: PRIMARY notification trigger ───────────────────────
    // Handles B2C (customer) and B2B (vendor-to-vendor) notifications.
    // Group notifications are handled exclusively by new_notification (has senderName).
    let isFirstSessionsUpdate = true;

    socket.on("sessions_update", (updatedSessions: ChatSession[]) => {
      const currentActiveChatId = activeChatIdRef.current;
      const currentPathname = pathnameRef.current;
      const prevUnread = prevChatsRef.current;

      if (!isFirstSessionsUpdate) {
        for (const session of updatedSessions) {
          // Skip group chats — new_notification handles them with proper senderName
          if (session.isGroup) continue;

          const prevCount = prevUnread.get(session.id) ?? 0;
          const newCount = session.unreadCount ?? 0;
          const isViewingThisChat =
            currentPathname === "/chat" && currentActiveChatId === session.id;

          if (newCount > prevCount && !isViewingThisChat) {
            // Dedup check — skip if same chat was notified within last 3 seconds
            const lastNotifTime = recentNotifRef.current.get(session.id) ?? 0;
            if (Date.now() - lastNotifTime < 3000) continue;
            recentNotifRef.current.set(session.id, Date.now());

            const senderName = session.customerName;
            const lastMsg = session.lastMessage || "New message received";

            addNotificationRef.current({
              type: "new_message",
              title: `New message from ${senderName}`,
              body: lastMsg.length > 80 ? lastMsg.slice(0, 80) + "…" : lastMsg,
              chatId: session.id,
              senderName: senderName,
            });

            if (currentPathname !== "/chat") {
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
      }

      isFirstSessionsUpdate = false;
      prevChatsRef.current = new Map(updatedSessions.map(s => [s.id, s.unreadCount ?? 0]));
      setChats(updatedSessions);
    });

    // ─── receive_message: append to active chat messages ──────────────────────
    socket.on("receive_message", (message: ChatMessage) => {
      setActiveChatMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // ─── messages_read: update status ticks ───────────────────────────────────
    socket.on("messages_read", ({ chatId }: { chatId: string }) => {
      setActiveChatMessages(prev =>
        prev.map(m =>
          m.sender === "vendor" && m.status !== "read" ? { ...m, status: "read" } : m
        )
      );
    });

    // ─── typing_status ─────────────────────────────────────────────────────────
    socket.on("typing_status", ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      setTypingStatus(prev => ({ ...prev, [chatId]: isTyping }));
    });

    // ─── new_notification: handles GROUP messages + dedup fallback for B2B/B2C ─
    socket.on("new_notification", (data: {
      type: "vendor_message" | "group_message" | "new_message";
      title: string;
      body: string;
      chatId?: string;
      senderName?: string;
    }) => {
      const currentActiveChatId = activeChatIdRef.current;
      const currentPathname = pathnameRef.current;
      const isViewingThisChat =
        currentPathname === "/chat" && currentActiveChatId === data.chatId;

      if (isViewingThisChat) return;

      // Dedup: skip if same chat was already notified within 3 seconds
      const chatKey = data.chatId || data.title;
      const lastNotifTime = recentNotifRef.current.get(chatKey) ?? 0;
      if (Date.now() - lastNotifTime < 3000) return;
      recentNotifRef.current.set(chatKey, Date.now());

      console.log("[ChatContext] new_notification fired:", data);

      addNotificationRef.current({
        type: data.type,
        title: data.title,
        body: data.body,
        chatId: data.chatId,
        senderName: data.senderName,
      });

      if (currentPathname !== "/chat") {
        // For groups: show "GroupName: SenderName: message"
        // For others: show "SenderName: message"
        const toastText = data.type === "group_message"
          ? `${data.title}: ${data.body.length > 40 ? data.body.slice(0, 40) + "…" : data.body}`
          : `${data.body.length > 50 ? data.body.slice(0, 50) + "…" : data.body}`;

        toast(toastText, {
          duration: 5000,
          icon: data.type === "group_message" ? "👥" : "💬",
          style: { fontSize: "12px", fontWeight: "600", borderRadius: "12px" },
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [vendor]);

  // Sync active chat room with socket
  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    if (pathname === "/chat" && activeChatId) {
      console.log(`[ChatContext] Syncing active chat: ${activeChatId}`);
      socketRef.current.emit("active_chat_changed", { chatId: activeChatId });
    } else {
      console.log(`[ChatContext] Clearing active chat. Path: ${pathname}, ActiveChatId: ${activeChatId}`);
      socketRef.current.emit("active_chat_changed", { chatId: null });
    }
  }, [activeChatId, pathname, isConnected]);

  const joinChatRoom = (chatId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_chat", { chatId });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        activeChatMessages,
        setActiveChatMessages,
        fetchMessages: async (chatId) => {
          joinChatRoom(chatId);
          await fetchMessages(chatId);
        },
        sendMessage,
        uploadFile,
        createChatSession,
        fetchVendors,
        typingStatus,
        isConnected,
        activeChatId,
        setActiveChatId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatProvider");
  }
  return context;
}
