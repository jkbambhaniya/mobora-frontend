"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChatSession, ChatMessage, Attachment } from "./types";
import { useAuth } from "./auth-context";
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
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [typingStatus, setTypingStatus] = useState<{ [chatId: string]: boolean }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);

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
      // 1. Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

      // Determine attachment type
      let type: "image" | "video" | "file" = "file";
      if (file.type.startsWith("image/")) {
        type = "image";
      } else if (file.type.startsWith("video/")) {
        type = "video";
      }

      // 2. Post to upload endpoint
      const res = await apiClient.post("/chat/upload", {
        name: file.name,
        type,
        base64: base64String
      });

      if (res.data && res.data.success) {
        const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        return {
          type,
          name: file.name,
          size: sizeStr,
          url: res.data.url
        };
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
      // Clear states if logged out
      setChats([]);
      setActiveChatMessages([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Fetch initial sessions
    fetchSessions();

    // Setup Socket connection
    // Check current protocol and dynamically link to port 5000 (backend)
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
      
      // Register this vendor connection
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

    // Handle session updates (e.g. sidebar unread badge, new last message)
    socket.on("sessions_update", (updatedSessions: ChatSession[]) => {
      setChats(updatedSessions);
    });

    // Handle receiving a message in real-time
    socket.on("receive_message", (message: ChatMessage) => {
      // Append message if it belongs to current active stream
      setActiveChatMessages(prev => {
        // Avoid duplicate appends
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    // Handle messages read status updates
    socket.on("messages_read", ({ chatId }: { chatId: string }) => {
      setActiveChatMessages(prev => {
        return prev.map(m => {
          if (m.sender === "vendor" && m.status !== "read") {
            return { ...m, status: "read" };
          }
          return m;
        });
      });
    });

    // Handle typing status updates
    socket.on("typing_status", ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      setTypingStatus(prev => ({
        ...prev,
        [chatId]: isTyping
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [vendor]);

  // Sync active chat room selection with socket on backend
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

  // Join chat room whenever messages are queried
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
