"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useDashboard, ChatMessage, Attachment } from "@/context/dashboard-context";
import { toast } from "react-hot-toast";

const quickReplies = [
  "Hello! Yes, this device is still available in our stock.",
  "We offer a 7-day checking warranty and a 6-month store warranty on all certified pre-owned phones.",
  "Could you share the specifications and condition of your exchange device so I can calculate the valuation?",
  "Our store hours are 10:30 AM to 8:30 PM, Monday through Saturday. You are welcome to visit anytime!",
];

export default function ChatPage() {
  const {
    chats,
    activeChatMessages,
    fetchMessages,
    sendMessage,
    uploadFile,
    createChatSession,
    fetchVendors,
    typingStatus,
    isConnected,
    activeChatId,
    setActiveChatId,
    vendor
  } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New Chat Dialog States
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isSubmittingNewChat, setIsSubmittingNewChat] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [newChatTab, setNewChatTab] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [newChatForm, setNewChatForm] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deviceInterest: string;
    initialMessage: string;
    notes: string;
    recipientVendorId?: number;
  }>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceInterest: "",
    initialMessage: "",
    notes: "",
    recipientVendorId: undefined
  });

  // Fetch vendors list on modal open
  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchVendors().then(list => setVendors(list));
    }
  }, [isNewChatModalOpen]);

  const resetNewChatForm = () => {
    setNewChatForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deviceInterest: "",
      initialMessage: "",
      notes: "",
      recipientVendorId: undefined
    });
    setGroupName("");
    setSelectedVendorIds([]);
    setNewChatTab("direct");
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newChatTab === "direct") {
      if (!newChatForm.recipientVendorId) {
        toast.error("Please select a vendor.");
        return;
      }

      setIsSubmittingNewChat(true);
      try {
        const newChatId = await createChatSession({
          recipientVendorId: newChatForm.recipientVendorId,
          initialMessage: newChatForm.initialMessage,
          customerName: newChatForm.customerName,
          deviceInterest: newChatForm.deviceInterest
        });
        if (newChatId) {
          toast.success("New direct trade session opened!");
          setActiveChatId(newChatId);
          setIsNewChatModalOpen(false);
          resetNewChatForm();
          setShowMobileChat(true);
        }
      } catch (err) {
        toast.error("Failed to start direct trade chat.");
      } finally {
        setIsSubmittingNewChat(false);
      }
    } else {
      // Group Trade Chat channel creation
      if (!groupName.trim()) {
        toast.error("Group name is required.");
        return;
      }
      if (selectedVendorIds.length === 0) {
        toast.error("Please select at least one vendor.");
        return;
      }

      setIsSubmittingNewChat(true);
      try {
        const newChatId = await createChatSession({
          isGroup: true,
          groupName: groupName.trim(),
          memberIds: selectedVendorIds,
          initialMessage: newChatForm.initialMessage
        });
        if (newChatId) {
          toast.success("New group trade channel created!");
          setActiveChatId(newChatId);
          setIsNewChatModalOpen(false);
          resetNewChatForm();
          setShowMobileChat(true);
        }
      } catch (err) {
        toast.error("Failed to create group trade channel.");
      } finally {
        setIsSubmittingNewChat(false);
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default active chat
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // Fetch messages whenever activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages, typingStatus[activeChatId || ""]]);

  const handleSendMessage = async (textToSend = newMessage, attachment?: Attachment) => {
    if (!activeChatId) {
      toast.error("Please select a chat session first.");
      return;
    }
    if (!textToSend.trim() && !attachment) return;

    // Send via socket context
    sendMessage(activeChatId, textToSend, attachment);
    setNewMessage("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File limit check (10MB body size limit on Express & Next.js config)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max allowed size is 10 MB.");
      return;
    }

    setIsUploading(true);
    toast.loading("Uploading file...", { id: "uploading-toast" });

    try {
      const attachment = await uploadFile(file);
      if (attachment) {
        toast.success("Attachment uploaded successfully!", { id: "uploading-toast" });
        // Send file message
        handleSendMessage("", attachment);
      } else {
        toast.error("Failed to upload attachment.", { id: "uploading-toast" });
      }
    } catch (err) {
      toast.error("Error uploading attachment.", { id: "uploading-toast" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChatSelect = (id: string) => {
    setActiveChatId(id);
    setShowMobileChat(true);
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const filteredChats = chats.filter(c => 
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.deviceInterest.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTyping = activeChatId ? typingStatus[activeChatId] : false;

  return (
    <div className="h-full w-full flex rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md overflow-hidden shadow-xl animate-fadeIn">
      
      {/* 1. CHAT SESSIONS SIDEBAR */}
      <div className={`w-full md:w-80 shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 flex flex-col ${
        showMobileChat ? "hidden md:flex" : "flex"
      }`}>
        {/* Search header */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Conversations</span>
              <button 
                onClick={() => setIsNewChatModalOpen(true)}
                className="p-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-primary dark:text-secondary transition-colors cursor-pointer animate-pulse"
                title="Create New Chat"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {/* Real-time socket status badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50">
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-505 bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[9px] font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-850/30">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isCustomerTyping = typingStatus[chat.id];
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-zinc-100/50 dark:bg-zinc-800/40" 
                      : "hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 flex items-center justify-center font-bold text-xs text-primary dark:text-secondary">
                      {chat.avatar}
                    </div>
                    {chat.status === "online" && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">
                        {chat.customerName}
                      </h4>
                      <span className="text-[9px] text-zinc-400">{chat.lastActive}</span>
                    </div>
                    <p className={`text-[11px] truncate pr-4 font-medium ${isCustomerTyping ? "text-primary dark:text-secondary italic" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {isCustomerTyping ? "Typing..." : chat.lastMessage}
                    </p>
                    {chat.deviceInterest && (
                      <span className="inline-block mt-1 text-[8px] bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-zinc-400 font-semibold uppercase tracking-wider">
                        {chat.deviceInterest.split(" ")[0]} Upgrade
                      </span>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="shrink-0 bg-primary text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center self-center shadow">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center text-xs text-zinc-400 py-12">No active chats found.</div>
          )}
        </div>
      </div>

      {/* 2. MAIN ACTIVE CHAT VIEW */}
      {activeChat ? (
        <div className={`flex-1 flex flex-col min-w-0 bg-zinc-50/20 dark:bg-zinc-950/10 ${
          !showMobileChat ? "hidden md:flex" : "flex"
        }`}>
          {/* Chat header */}
          <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                    {activeChat.customerName}
                  </h3>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeChat.isGroup ? "bg-emerald-500 animate-pulse" : (activeChat.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")}`} />
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold">
                  {activeChat.isGroup 
                    ? `${activeChat.groupMembers?.length || 0} Members` 
                    : activeChat.status === "online" ? "Active Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
                title="Toggle customer details panel"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/10 dark:bg-zinc-900/5">
            <div className="text-center py-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full">
                Live conversation started
              </span>
            </div>

            {activeChatMessages.map((m) => {
              const isVendor = m.sender === "vendor";
              return (
                <div 
                  key={m.id} 
                  className={`flex w-full ${isVendor ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm ${
                    isVendor 
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-none" 
                      : "bg-white border border-zinc-200/60 text-zinc-800 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-100 rounded-tl-none"
                  }`}>
                    {activeChat.isGroup && !isVendor && m.senderName && (
                      <span className="block text-[10px] font-extrabold text-primary dark:text-secondary mb-1">
                        {m.senderName}
                      </span>
                    )}
                    {/* Render Message Text if present */}
                    {m.text && <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                    {/* Render Attachment if present */}
                    {m.attachment && (
                      <div className={`${m.text ? "mt-3 pt-3 border-t border-zinc-200/20 dark:border-zinc-700/20" : ""}`}>
                        {m.attachment.type === "image" && (
                          <div className="rounded-lg overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30 max-w-full sm:max-w-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={m.attachment.url} 
                              alt={m.attachment.name} 
                              className="max-h-48 w-full object-cover hover:opacity-90 transition-opacity"
                            />
                            <div className="p-2 bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold flex justify-between items-center">
                              <span className="truncate pr-2">{m.attachment.name}</span>
                              <a 
                                href={m.attachment.url} 
                                download 
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-primary transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        )}

                        {m.attachment.type === "video" && (
                          <div className="rounded-lg overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30 max-w-full sm:max-w-sm bg-black">
                            <video 
                              src={m.attachment.url} 
                              controls 
                              className="w-full max-h-48 object-contain"
                            />
                            <div className="p-2 bg-zinc-800 text-white text-[10px] font-bold flex justify-between items-center">
                              <span className="truncate pr-2">{m.attachment.name} ({m.attachment.size})</span>
                              <span className="text-[8px] bg-red-500 text-white px-1 py-0.5 rounded font-extrabold">MP4</span>
                            </div>
                          </div>
                        )}

                        {m.attachment.type === "file" && (
                          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-100/10 dark:bg-zinc-800/20 border border-zinc-200/10 dark:border-zinc-800/20 max-w-full sm:max-w-sm">
                            <div className="h-10 w-10 shrink-0 bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary rounded-lg flex items-center justify-center font-extrabold text-xs">
                              PDF
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                                {m.attachment.name}
                              </div>
                              <span className="text-[9px] text-zinc-400 font-semibold">{m.attachment.size || "Unknown size"}</span>
                            </div>
                            <a 
                              href={m.attachment.url === "#" ? undefined : m.attachment.url} 
                              download
                              onClick={(e) => {
                                if (m.attachment?.url === "#") {
                                  e.preventDefault();
                                  toast.success("Downloading simulated document specs!");
                                }
                              }}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className="text-[8px] opacity-60 font-semibold">{m.timestamp}</span>
                      {isVendor && (
                        <span className="inline-flex items-center ml-1">
                          {m.status === "delivered" ? (
                            /* Double tick (grey) */
                            <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l4 4L18 4" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l4 4L23 4" />
                            </svg>
                          ) : m.status === "read" ? (
                            /* Double tick (colored blue) */
                            <svg className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l4 4L18 4" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l4 4L23 4" />
                            </svg>
                          ) : (
                            /* Single tick (grey) - fallback / sent */
                            <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white border border-zinc-200/60 dark:bg-zinc-850 dark:border-zinc-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1 shadow-sm">
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies slider */}
          <div className="px-4 py-2 border-t border-zinc-150 dark:border-zinc-850 flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-zinc-100/30 dark:bg-zinc-900/10 no-scrollbar select-none">
            <span className="text-[9px] uppercase font-bold text-zinc-400 mr-2 shrink-0">Templates:</span>
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="text-[10px] bg-white border border-zinc-200 hover:border-primary dark:bg-zinc-850 dark:border-zinc-800 hover:text-primary dark:hover:text-secondary px-3 py-1.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                {reply.length > 25 ? `${reply.substring(0, 25)}...` : reply}
              </button>
            ))}
          </div>

          {/* Input box with attachment button */}
          <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 relative">
            {isUploading && (
              <div className="absolute -top-6 left-4 bg-primary/90 text-white text-[9px] px-2 py-0.5 rounded-t-lg font-bold flex items-center gap-1 shadow">
                <span className="animate-spin h-2.5 w-2.5 border-2 border-white border-t-transparent rounded-full" />
                Uploading attachment...
              </div>
            )}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*,application/pdf"
              />
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                title="Add attachment"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
              />
              <Button 
                type="submit" 
                variant="primary" 
                size="sm" 
                className="h-[38px] px-4 rounded-xl shrink-0"
                disabled={!newMessage.trim() && !isUploading}
              >
                <svg className="w-4 h-4 transform rotate-90 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400 bg-zinc-50/10 dark:bg-zinc-950/10">
          Select a chat session to start messaging.
        </div>
      )}

      {/* 3. CUSTOMER CONTEXT INFO DRAWER */}
      {showDetails && activeChat && (
        <div className="hidden lg:flex w-64 shrink-0 border-l border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-md p-5 flex-col justify-between select-none">
          <div className="space-y-6">
            {/* Avatar header */}
            <div className="text-center space-y-2 pb-4 border-b border-zinc-150 dark:border-zinc-800">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-base flex items-center justify-center mx-auto shadow-md">
                {activeChat.avatar}
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-950 dark:text-white leading-tight">
                  {activeChat.customerName}
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {activeChat.isGroup ? "B2B Group Chat" : activeChat.customerPhone}
                </p>
              </div>
            </div>

            {/* Interest Area */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                {activeChat.isGroup ? "Channel Type" : "Device Interest"}
              </span>
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-2.5">
                <p className="text-[11px] font-bold text-primary dark:text-secondary truncate">
                  {activeChat.isGroup ? "B2B Dealer Trade Group" : activeChat.deviceInterest}
                </p>
                <span className="text-[8px] font-medium text-zinc-400">
                  {activeChat.isGroup ? "Broadcasting Enabled" : "Target Upgrade Spec"}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                {activeChat.isGroup ? "Channel Members" : "Internal Notes"}
              </span>
              <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-800 p-3 rounded-xl max-h-48 overflow-y-auto no-scrollbar">
                {activeChat.isGroup ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                      {activeChat.groupMembers?.length || 0} Participating Vendors
                    </p>
                    <p className="text-[10px] text-zinc-650 dark:text-zinc-350 leading-relaxed italic">
                      This channel connects verified wholesale dealers to coordinate B2B inventory offers and trade listings.
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-300 leading-normal italic">
                    &quot;{activeChat.notes}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 space-y-2">
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Quick Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] py-1.5 w-full rounded-lg"
                onClick={() => {
                  if (activeChat.isGroup) {
                    handleSendMessage("Hi everyone, please check my latest inventory list in the portal.");
                  } else {
                    handleSendMessage("Could you send a screenshot of the settings showing battery percentage?");
                  }
                }}
              >
                {activeChat.isGroup ? "Share Stock" : "Request BH"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] py-1.5 w-full rounded-lg"
                onClick={() => {
                  if (activeChat.isGroup) {
                    handleSendMessage("Are there any dealers interested in bulk iPhone trade-ins today?");
                  } else {
                    handleSendMessage("Our store location is: Shop 12, Metro Plaza, MG Road. Let me know when you plan to arrive.");
                  }
                }}
              >
                {activeChat.isGroup ? "Bulk Inquiry" : "Send Location"}
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* 4. NEW CHAT DIALOG MODAL */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl p-6 relative overflow-hidden animate-slideUp">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">Start B2B Trade Chat</h3>
                <p className="text-[10px] text-zinc-400 mt-1">Initiate a direct, real-time message stream with a verified dealer in the Mobora network.</p>
              </div>
              <button 
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  resetNewChatForm();
                }}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setNewChatTab("direct")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  newChatTab === "direct"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Direct Trade
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab("group")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  newChatTab === "group"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Group Trade
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4">
              {newChatTab === "direct" ? (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Registered Trade Vendor *</label>
                  {vendors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                      {vendors.map((v) => {
                        const isSelected = newChatForm.recipientVendorId === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setNewChatForm(prev => ({
                                ...prev,
                                customerName: v.name,
                                deviceInterest: v.shop_name || "Dealer Store",
                                recipientVendorId: v.id
                              }));
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 w-full cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                                : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-850/40"
                            }`}
                          >
                            {v.profile_img ? (
                              <img src={v.profile_img} alt={v.name} className="h-9 w-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                                {v.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">{v.name}</h5>
                              <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate font-semibold uppercase tracking-wide">
                                {v.shop_name || "Independent Vendor"}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="h-4.5 w-4.5 rounded-full bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs italic">
                      No other registered trade vendors found.
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Group Trade Channel Name *</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. South Region Wholesalers"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary text-zinc-800 dark:text-zinc-150"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Participating Vendors (Multi-select) *</label>
                    {vendors.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                        {vendors.map((v) => {
                          const isSelected = selectedVendorIds.includes(v.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedVendorIds(prev => prev.filter(id => id !== v.id));
                                } else {
                                  setSelectedVendorIds(prev => [...prev, v.id]);
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 w-full cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                                  : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-850/40"
                              }`}
                            >
                              {v.profile_img ? (
                                <img src={v.profile_img} alt={v.name} className="h-9 w-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800" />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                                  {v.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">{v.name}</h5>
                                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate font-semibold uppercase tracking-wide">
                                  {v.shop_name || "Independent Vendor"}
                                </p>
                              </div>
                              <span className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center transition-all ${
                                isSelected 
                                  ? "bg-primary border-primary text-white shadow-sm" 
                                  : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs italic">
                        No other registered trade vendors found.
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Initial Message</label>
                <textarea 
                  value={newChatForm.initialMessage}
                  onChange={(e) => setNewChatForm(prev => ({ ...prev, initialMessage: e.target.value }))}
                  placeholder="Specify your initial trade request or greeting..."
                  rows={2.5}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none text-zinc-800 dark:text-zinc-150"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-xs h-[38px] rounded-xl cursor-pointer"
                  onClick={() => {
                    setIsNewChatModalOpen(false);
                    resetNewChatForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 text-xs h-[38px] rounded-xl cursor-pointer"
                  disabled={isSubmittingNewChat || (newChatTab === "direct" ? !newChatForm.recipientVendorId : (!groupName.trim() || selectedVendorIds.length === 0))}
                >
                  {isSubmittingNewChat ? "Creating..." : "Start Chat"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
