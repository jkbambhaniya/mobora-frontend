"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "@/context/admin/auth-context";
import { useAdminDashboard } from "@/context/admin/dashboard-context";
import { useAdminChats } from "@/context/admin/chat-context";
import { apiClient } from "@/actions/apiClient";
import { toast } from "react-hot-toast";

const quickReplies = [
	"Hello! This is a official update from Mobora support team.",
	"Please ensure your inventory list is up to date to receive matching alert notifications.",
	"We have flagged a security alert regarding duplicate entries. Please check your dashboard.",
	"Thank you for contacting Mobora Administrator. How can we help you today?",
];

interface ChatMessage {
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

interface ChatSession {
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

const getAttachmentUrl = (url?: string) => {
	if (!url) return "";
	if (url.startsWith("http://") || url.startsWith("https://")) return url;
	const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
	const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined"
		? (isLocalhost ? `${window.location.protocol}//${window.location.hostname}:5000` : `${window.location.protocol}//${window.location.hostname}`)
		: "http://localhost:5000");
	return `${backendHost}${url}`;
};

export default function AdminChatPage() {
	const { admin } = useAdminAuth();
	const { vendors, fetchVendors, isLoadingVendors } = useAdminDashboard();
	const {
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
	} = useAdminChats();

	const [searchTerm, setSearchTerm] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [showDetails, setShowDetails] = useState(true);
	const [showMobileChat, setShowMobileChat] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	// New Chat Dialog States
	const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
	const [newChatTab, setNewChatTab] = useState<"direct" | "group" | "broadcast">("direct");
	const [groupName, setGroupName] = useState("");
	const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
	const [directVendorId, setDirectVendorId] = useState<number | undefined>(undefined);
	const [initialMessage, setInitialMessage] = useState("");
	const [broadcastText, setBroadcastText] = useState("");

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [offset, setOffset] = useState(15);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Load initial data
	useEffect(() => {
		fetchVendors();
		fetchSessions();
	}, []);

	// Load messages when active chat changes
	useEffect(() => {
		if (activeChatId) {
			setOffset(15);
			setHasMore(true);
			setIsLoadingMore(false);
			fetchMessages(activeChatId, 15, 0);
		}
	}, [activeChatId]);

	// Scroll to bottom
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (activeChatMessages.length > 0) {
			scrollToBottom();
		}
	}, [activeChatMessages]);

	// Load more messages on scroll to top
	const handleScroll = async () => {
		const container = scrollContainerRef.current;
		if (!container) return;

		if (container.scrollTop === 0 && hasMore && !isLoadingMore && activeChatId) {
			setIsLoadingMore(true);
			const previousScrollHeight = container.scrollHeight;

			try {
				const result = await fetchMessages(activeChatId, 15, offset);
				if (result) {
					setOffset((prev) => prev + 15);
					setHasMore(result.hasMore);

					requestAnimationFrame(() => {
						if (scrollContainerRef.current) {
							const newScrollHeight = scrollContainerRef.current.scrollHeight;
							scrollContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
						}
					});
				}
			} catch (err) {
				console.error("[AdminChat] Load more messages error:", err);
			} finally {
				setIsLoadingMore(false);
			}
		}
	};

	// Send message
	const handleSendMessage = async (textToSend = newMessage, attachment?: any) => {
		if (!activeChatId) {
			toast.error("Please select a chat session first.");
			return;
		}
		if (!textToSend.trim() && !attachment) return;

		sendMessage(activeChatId, textToSend, attachment);
		setNewMessage("");
	};

	// Upload file
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > 10 * 1024 * 1024) {
			toast.error("File is too large. Max size is 10 MB.");
			return;
		}

		setIsUploading(true);
		toast.loading("Uploading file...", { id: "uploading" });

		try {
			const reader = new FileReader();
			const base64Promise = new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = (err) => reject(err);
			});
			reader.readAsDataURL(file);
			const base64String = await base64Promise;

			let type: "image" | "video" | "file" = "file";
			if (file.type.startsWith("image/")) {
				type = "image";
			} else if (file.type.startsWith("video/")) {
				type = "video";
			}

			const res = await apiClient.post("/admin/chat/upload", {
				name: file.name,
				type,
				base64: base64String,
			});

			if (res.data?.success) {
				toast.success("File uploaded successfully", { id: "uploading" });
				const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
				handleSendMessage("", {
					type,
					name: file.name,
					size: sizeStr,
					url: res.data.url,
				});
			} else {
				toast.error("Failed to upload file.", { id: "uploading" });
			}
		} catch (err) {
			toast.error("Error uploading file.", { id: "uploading" });
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	// Create a new session
	const handleCreateNewChat = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newChatTab === "direct") {
			if (!directVendorId) {
				toast.error("Select a vendor to message.");
				return;
			}
			try {
				const res = await apiClient.post("/admin/chat/sessions", {
					vendorId: directVendorId,
					initialMessage,
				});
				if (res.data?.success) {
					toast.success("Direct support chat opened!");
					setActiveChatId(res.data.chatId);
					setIsNewChatModalOpen(false);
					setDirectVendorId(undefined);
					setInitialMessage("");
					fetchSessions();
				}
			} catch (err) {
				toast.error("Failed to start chat.");
			}
		} else if (newChatTab === "group") {
			if (!groupName.trim()) {
				toast.error("Group name is required.");
				return;
			}
			if (selectedVendorIds.length === 0) {
				toast.error("Select at least one vendor.");
				return;
			}
			try {
				const res = await apiClient.post("/admin/chat/sessions", {
					isGroup: true,
					groupName,
					memberIds: selectedVendorIds,
					initialMessage,
				});
				if (res.data?.success) {
					toast.success("Group chat channel created!");
					setActiveChatId(res.data.chatId);
					setIsNewChatModalOpen(false);
					setGroupName("");
					setSelectedVendorIds([]);
					setInitialMessage("");
					fetchSessions();
				}
			} catch (err) {
				toast.error("Failed to create group.");
			}
		} else {
			// Broadcast message
			if (!broadcastText.trim()) {
				toast.error("Broadcast message is required.");
				return;
			}
			try {
				const res = await apiClient.post("/admin/chat/broadcast", {
					text: broadcastText,
				});
				if (res.data?.success) {
					toast.success("Broadcast sent successfully to all active vendors!");
					setIsNewChatModalOpen(false);
					setBroadcastText("");
					fetchSessions();
				}
			} catch (err) {
				toast.error("Failed to send broadcast.");
			}
		}
	};

	const toggleVendorSelection = (id: number) => {
		setSelectedVendorIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	const activeChat = chats.find((c) => c.id === activeChatId);

	const getVendorDetails = (vendorId?: number) => {
		if (!vendorId) return null;
		return vendors.find((v) => v.id === vendorId);
	};

	const activeVendorDetails = activeChat ? getVendorDetails(activeChat.vendorId) : null;

	const filteredChats = chats.filter((c) =>
		c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="h-[calc(100vh-140px)] w-full flex rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#13151a]/30 backdrop-blur-xl overflow-hidden shadow-2xl animate-fadeIn">
			{/* 1. SIDEBAR */}
			<div
				className={`w-full md:w-80 shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 flex flex-col ${
					showMobileChat ? "hidden md:flex" : "flex"
				}`}
			>
				{/* Search & Actions Header */}
				<div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
								Conversations
							</span>
							<button
								onClick={() => setIsNewChatModalOpen(true)}
								className="p-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-650/10 dark:hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
								title="Start New Chat / Group / Broadcast"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</button>
						</div>

						{/* Socket status indicator */}
						<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-150/40 dark:bg-white/5 border border-zinc-200/40 dark:border-white/5">
							<span
								className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
							/>
							<span className="text-[9px] font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
								{isConnected ? "Connected" : "Offline"}
							</span>
						</div>
					</div>
					<div className="relative">
						<span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</span>
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search vendors or groups..."
							className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
				</div>

				{/* Sessions list */}
				<div className="flex-1 overflow-y-auto divide-y divide-zinc-100/50 dark:divide-white/5">
					{filteredChats.length > 0 ? (
						filteredChats.map((chat) => {
							const isActive = chat.id === activeChatId;
							return (
								<button
									key={chat.id}
									onClick={() => {
										setActiveChatId(chat.id);
										setShowMobileChat(true);
									}}
									className={`w-full p-4 text-left flex items-start gap-3 transition-all cursor-pointer ${
										isActive
											? "bg-zinc-100/60 dark:bg-white/5"
											: "hover:bg-zinc-50/50 dark:hover:bg-white/2"
									}`}
								>
									<div className="relative shrink-0">
										{chat.profileImg ? (
											<img
												src={chat.profileImg}
												alt={chat.customerName}
												className="h-10 w-10 rounded-xl object-cover"
											/>
										) : (
											<div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
												{chat.avatar}
											</div>
										)}
										{chat.status === "online" && (
											<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex justify-between items-baseline mb-0.5">
											<h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
												{chat.customerName}
											</h4>
											<span className="text-[9px] text-zinc-400">
												{chat.lastActive}
											</span>
										</div>
										<p className="text-[11px] truncate pr-4 font-medium text-zinc-500 dark:text-zinc-400">
											{chat.lastMessage}
										</p>
									</div>
									{chat.unreadCount > 0 && (
										<span className="shrink-0 bg-indigo-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center self-center shadow">
											{chat.unreadCount}
										</span>
									)}
								</button>
							);
						})
					) : (
						<div className="text-center text-xs text-zinc-400 py-12">
							No active chats found.
						</div>
					)}
				</div>
			</div>

			{/* 2. CHAT WINDOW */}
			{activeChat ? (
				<div
					className={`flex-1 flex flex-col min-w-0 bg-zinc-50/20 dark:bg-zinc-950/15 ${
						!showMobileChat ? "hidden md:flex" : "flex"
					}`}
				>
					{/* Header */}
					<div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								onClick={() => setShowMobileChat(false)}
								className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
							</button>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
										{activeChat.customerName}
									</h3>
									<span
										className={`h-1.5 w-1.5 rounded-full ${activeChat.isGroup ? "bg-emerald-500 animate-pulse" : activeChat.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`}
									/>
								</div>
								<span className="text-[10px] text-zinc-400 font-semibold">
									{activeChat.isGroup ? "Group Trade Partner Channel" : "Direct Support Room"}
								</span>
							</div>
						</div>

						<button
							onClick={() => setShowDetails(!showDetails)}
							className="p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-850/60 hover:bg-zinc-150/50 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
							title="Toggle Details Panel"
						>
							<svg
								className="w-4.5 h-4.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</button>
					</div>

					{/* Message Area */}
					<div
						ref={scrollContainerRef}
						onScroll={handleScroll}
						className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/10 dark:bg-zinc-900/5"
					>
						{isLoadingMore && (
							<div className="flex justify-center py-2">
								<div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
							</div>
						)}

						{activeChatMessages.map((m) => {
							const isAdminSender = m.sender === "admin";
							return (
								<div
									key={m.id}
									className={`flex w-full ${isAdminSender ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm ${
											isAdminSender
												? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-none"
												: "bg-white border border-zinc-200/60 text-zinc-800 dark:bg-zinc-850 dark:border-zinc-800 dark:text-zinc-100 rounded-tl-none"
										}`}
									>
										{!isAdminSender && m.senderName && (
											<span className="block text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 mb-1">
												{m.senderName}
											</span>
										)}

										{m.text && (
											<p className="text-xs leading-relaxed whitespace-pre-wrap">
												{m.text}
											</p>
										)}

										{m.attachment && (
											<div className={`${m.text ? "mt-3 pt-3 border-t border-zinc-200/20 dark:border-zinc-700/20" : ""}`}>
												{m.attachment.type === "image" && (
													<div className="rounded-lg overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30 max-w-full sm:max-w-sm">
														<img
															src={getAttachmentUrl(m.attachment.url)}
															alt={m.attachment.name}
															className="max-h-48 w-full object-cover hover:opacity-90 transition-opacity"
														/>
														<div className="p-2 bg-zinc-800 text-white text-[10px] font-bold flex justify-between items-center">
															<span className="truncate pr-2">{m.attachment.name}</span>
															<a
																href={getAttachmentUrl(m.attachment.url)}
																download
																target="_blank"
																rel="noreferrer"
																className="hover:text-indigo-400 transition-colors"
															>
																<svg
																	className="w-3.5 h-3.5"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																	strokeWidth="2.5"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
																	/>
																</svg>
															</a>
														</div>
													</div>
												)}

												{m.attachment.type === "video" && (
													<div className="rounded-lg overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30 max-w-full sm:max-w-sm bg-black">
														<video
															src={getAttachmentUrl(m.attachment.url)}
															controls
															className="w-full max-h-48 object-contain"
														/>
														<div className="p-2 bg-zinc-800 text-white text-[10px] font-bold">
															{m.attachment.name} ({m.attachment.size})
														</div>
													</div>
												)}

												{m.attachment.type === "file" && (
													<div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/10 dark:bg-zinc-800/20 border border-zinc-200/10 dark:border-zinc-800/20 max-w-full sm:max-w-sm">
														<div className="h-10 w-10 shrink-0 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center font-extrabold text-xs">
															DOC
														</div>
														<div className="flex-1 min-w-0">
															<div className="text-xs font-bold truncate text-zinc-950 dark:text-zinc-100">
																{m.attachment.name}
															</div>
															<span className="text-[9px] text-zinc-400 font-semibold">
																{m.attachment.size}
															</span>
														</div>
														<a
															href={getAttachmentUrl(m.attachment.url)}
															download
															target="_blank"
															className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900"
														>
															Download
														</a>
													</div>
												)}
											</div>
										)}

										<div className="flex items-center justify-end gap-1 mt-1.5">
											<span className="text-[8px] opacity-60 font-semibold">
												{m.timestamp}
											</span>
											{isAdminSender && (
												<span className="inline-flex items-center ml-1">
													{m.status === "delivered" ? (
														/* Double tick (grey) */
														<svg
															className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth="2"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M3 12l4 4L18 4"
															/>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M8 12l4 4L23 4"
															/>
														</svg>
													) : m.status === "read" ? (
														/* Double tick (colored indigo) */
														<svg
															className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth="2"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M3 12l4 4L18 4"
															/>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M8 12l4 4L23 4"
															/>
														</svg>
													) : (
														/* Single tick (grey) - fallback / sent */
														<svg
															className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth="2.5"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M5 12l5 5L20 7"
															/>
														</svg>
													)}
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>

					{/* Quick Replies */}
					<div className="px-4 py-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
						{quickReplies.map((reply) => (
							<button
								key={reply}
								onClick={() => handleSendMessage(reply)}
								className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-600/10 dark:hover:text-indigo-400 transition-all cursor-pointer"
							>
								{reply}
							</button>
						))}
					</div>

					{/* Footer Input Area */}
					<div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md flex items-center gap-3">
						<input
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							className="hidden"
							accept="image/*,video/*,application/pdf"
						/>
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading}
							className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-50"
							title="Attach Photo / Video / PDF"
						>
							<svg
								className="w-4.5 h-4.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</button>

						<input
							type="text"
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
							placeholder="Type your official response..."
							className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						<button
							onClick={() => handleSendMessage()}
							className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
						>
							Send
						</button>
					</div>
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/20 dark:bg-zinc-950/15">
					<div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
						<svg
							className="w-8 h-8"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="1.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
					</div>
					<h3 className="font-extrabold text-sm text-zinc-950 dark:text-white">Official Mobora Chat</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 text-center max-w-xs">
						Directly converse with trade vendors, manage administrative groups, or broadcast announcements system-wide.
					</p>
					<button
						onClick={() => setIsNewChatModalOpen(true)}
						className="mt-6 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
					>
						Compose Message
					</button>
				</div>
			)}

			{/* 3. DETAILS PANEL */}
			{activeChat && showDetails && (
				<div className="hidden lg:flex w-72 shrink-0 border-l border-zinc-200/60 dark:border-zinc-800/60 bg-white/30 dark:bg-zinc-900/10 flex-col p-6 overflow-y-auto">
					<h3 className="font-extrabold text-xs text-zinc-900 dark:text-white mb-6 uppercase tracking-wider">
						Support Room Details
					</h3>

					<div className="flex flex-col items-center text-center pb-6 border-b border-zinc-200/60 dark:border-zinc-850/60 mb-6">
						{activeChat.profileImg ? (
							<img
								src={activeChat.profileImg}
								alt={activeChat.customerName}
								className="h-16 w-16 rounded-2xl object-cover mb-3 shadow-md"
							/>
						) : (
							<div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 flex items-center justify-center font-extrabold text-lg text-indigo-600 dark:text-indigo-400 mb-3">
								{activeChat.avatar}
							</div>
						)}
						<h4 className="font-extrabold text-sm text-zinc-950 dark:text-white">
							{activeChat.customerName}
						</h4>
						<span className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
							{activeChat.isGroup ? "Group Trade" : "Direct Support"}
						</span>
					</div>

					{activeVendorDetails && (
						<div className="space-y-4">
							<div>
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
									Company/Shop Name
								</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
									{activeVendorDetails.businessDetail?.shop_name || "Official Vendor Partner"}
								</p>
							</div>
							<div>
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
									Email Address
								</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
									{activeVendorDetails.email}
								</p>
							</div>
							<div>
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
									System ID
								</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">
									Vendor #{activeVendorDetails.id}
								</p>
							</div>
						</div>
					)}

					{activeChat.isGroup && (
						<div className="space-y-4">
							<div>
								<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2 block">
									Group Members ({activeChat.groupMembers.length})
								</span>
								<div className="space-y-2">
									{activeChat.groupMembers.map((mId) => {
										const details = getVendorDetails(mId);
										return (
											<div key={mId} className="flex items-center gap-2">
												<div className="h-6 w-6 rounded bg-zinc-250 dark:bg-zinc-850 flex items-center justify-center font-bold text-[9px] text-indigo-500">
													{details ? details.name.slice(0, 2).toUpperCase() : "VD"}
												</div>
												<span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
													{details ? details.name : `Vendor #${mId}`}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Compose Message Modal */}
			{isNewChatModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div className="w-full max-w-lg bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
						{/* Modal Header tabs */}
						<div className="flex border-b border-zinc-150 dark:border-white/5">
							<button
								onClick={() => setNewChatTab("direct")}
								className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider text-center cursor-pointer ${
									newChatTab === "direct"
										? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
										: "text-zinc-500 hover:text-zinc-700"
								}`}
							>
								Direct support
							</button>
							<button
								onClick={() => setNewChatTab("group")}
								className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider text-center cursor-pointer ${
									newChatTab === "group"
										? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
										: "text-zinc-500 hover:text-zinc-700"
								}`}
							>
								Create group
							</button>
							<button
								onClick={() => setNewChatTab("broadcast")}
								className={`flex-1 py-4 font-bold text-xs uppercase tracking-wider text-center cursor-pointer ${
									newChatTab === "broadcast"
										? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
										: "text-zinc-500 hover:text-zinc-700"
								}`}
							>
								Broadcast
							</button>
						</div>

						<form onSubmit={handleCreateNewChat} className="p-6 space-y-4">
							{newChatTab === "direct" && (
								<div className="space-y-3">
									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
										Select Vendor Partner
									</label>
									<select
										value={directVendorId || ""}
										onChange={(e) => setDirectVendorId(Number(e.target.value))}
										className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="" disabled>-- Choose Active Vendor --</option>
										{vendors.map((v) => (
											<option key={v.id} value={v.id} className="dark:bg-[#13151a]">
												{v.name} ({v.businessDetail?.shop_name || "No Shop Name"})
											</option>
										))}
									</select>

									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-3">
										Initial Welcome Message
									</label>
									<textarea
										value={initialMessage}
										onChange={(e) => setInitialMessage(e.target.value)}
										placeholder="Hello, how can the administrator help your business today?"
										className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20"
									/>
								</div>
							)}

							{newChatTab === "group" && (
								<div className="space-y-3">
									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
										Group Channel Name
									</label>
									<input
										type="text"
										value={groupName}
										onChange={(e) => setGroupName(e.target.value)}
										placeholder="e.g. Official Vendor Advisory"
										className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
									/>

									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
										Select Group Members
									</label>
									<div className="max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
										{vendors.map((v) => {
											const isSelected = selectedVendorIds.includes(v.id);
											return (
												<div
													key={v.id}
													onClick={() => toggleVendorSelection(v.id)}
													className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
														isSelected ? "bg-indigo-50 dark:bg-indigo-650/15" : "hover:bg-zinc-50 dark:hover:bg-white/2"
													}`}
												>
													<span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
														{v.name}
													</span>
													<input
														type="checkbox"
														checked={isSelected}
														onChange={() => {}}
														className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
													/>
												</div>
											);
										})}
									</div>

									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-3">
										Initial Group Message
									</label>
									<textarea
										value={initialMessage}
										onChange={(e) => setInitialMessage(e.target.value)}
										placeholder="Introduce the purpose of this administrative channel..."
										className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-20"
									/>
								</div>
							)}

							{newChatTab === "broadcast" && (
								<div className="space-y-3">
									<div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-xl flex items-start gap-2.5">
										<svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										<div>
											<p className="font-bold">Important Notice</p>
											<p className="mt-0.5 opacity-90">
												Broadcast message will be sent to all active registered vendors individually in their direct admin support chat session.
											</p>
										</div>
									</div>

									<label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
										Broadcast Text Content
									</label>
									<textarea
										value={broadcastText}
										onChange={(e) => setBroadcastText(e.target.value)}
										placeholder="Write system message or maintenance update here..."
										className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-28"
									/>
								</div>
							)}

							<div className="flex gap-3 pt-4 border-t border-zinc-150 dark:border-white/5">
								<button
									type="button"
									onClick={() => {
										setIsNewChatModalOpen(false);
										setDirectVendorId(undefined);
										setGroupName("");
										setSelectedVendorIds([]);
										setInitialMessage("");
										setBroadcastText("");
									}}
									className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/15 cursor-pointer"
								>
									{newChatTab === "broadcast" ? "Send Broadcast" : "Start Chat"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
