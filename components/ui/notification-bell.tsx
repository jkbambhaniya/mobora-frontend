"use client";

import React, { useState, useRef, useEffect } from "react";
import {
	useNotifications,
	AppNotification,
} from "@/context/vendor/notification-context";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/vendor/dashboard-context";

function timeAgo(timestamp: string): string {
	// timestamp is like "10:30 AM" - just return it
	return timestamp;
}

function NotificationItem({
	notif,
	onRead,
	onClear,
	onNavigate,
}: {
	notif: AppNotification;
	onRead: (id: string) => void;
	onClear: (id: string) => void;
	onNavigate?: (chatId?: string) => void;
}) {
	const iconMap = {
		new_message: (
			<div className="h-8 w-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-secondary shrink-0">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			</div>
		),
		vendor_message: (
			<div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			</div>
		),
		group_message: (
			<div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
					/>
				</svg>
			</div>
		),
		info: (
			<div className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
				<svg
					className="w-4 h-4"
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
			</div>
		),
		requirement_match: (
			<div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
		),
	};

	return (
		<div
			className={`group flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-b-0 transition-colors cursor-pointer ${
				notif.isRead
					? "bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
					: "bg-primary/[0.03] dark:bg-primary/[0.06] hover:bg-primary/[0.06] dark:hover:bg-primary/[0.09]"
			}`}
			onClick={() => {
				onRead(notif.id);
				onNavigate?.(notif.chatId);
			}}
		>
			{iconMap[notif.type]}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<p
						className={`text-[11px] leading-tight font-bold truncate ${notif.isRead ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-50"}`}
					>
						{notif.title}
					</p>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onClear(notif.id);
						}}
						className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
					>
						<svg
							className="w-3 h-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				{/* For group messages: show sender name as a small chip below the group name */}
				{notif.type === "group_message" && notif.senderName && (
					<span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
						<svg
							className="w-2.5 h-2.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						{notif.senderName}
					</span>
				)}
				<p
					className={`text-[10px] mt-0.5 leading-relaxed line-clamp-2 ${notif.isRead ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-300"}`}
				>
					{notif.body}
				</p>
				<span className="text-[9px] text-zinc-400 mt-1 block font-semibold">
					{notif.timestamp}
				</span>
			</div>
			{!notif.isRead && (
				<span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
			)}
		</div>
	);
}

export function NotificationBell() {
	const {
		notifications,
		unreadCount,
		markAllRead,
		markRead,
		clearNotification,
		clearAll,
	} = useNotifications();
	const { setActiveChatId } = useDashboard();
	const [isOpen, setIsOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const router = useRouter();

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				panelRef.current &&
				!panelRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const handleNavigate = (chatId?: string) => {
		setIsOpen(false);
		if (chatId) {
			setActiveChatId(chatId);
			router.push("/chat");
		}
	};

	return (
		<div className="relative">
			{/* Bell Button */}
			<button
				ref={buttonRef}
				id="notification-bell-btn"
				onClick={() => {
					setIsOpen((prev) => !prev);
					if (!isOpen && unreadCount > 0) {
						// Mark all as read when panel opens after a brief delay
					}
				}}
				className="relative p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
				aria-label="Notifications"
				title="Notifications"
			>
				<svg
					className={`w-4.5 h-4.5 transition-transform duration-300 ${isOpen ? "scale-90" : "scale-100"}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>
				{unreadCount > 0 && (
					<span
						className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-white text-[9px] font-extrabold px-1 shadow-md animate-bounce"
						style={{
							animationDuration: "1s",
							animationIterationCount: "3",
						}}
					>
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown Panel */}
			{isOpen && (
				<div
					ref={panelRef}
					id="notification-panel"
					className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-2xl z-[200] overflow-hidden"
					style={{
						animation:
							"notifSlideDown 0.18s cubic-bezier(0.16,1,0.3,1) forwards",
					}}
				>
					{/* Panel Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4 text-primary dark:text-secondary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
								/>
							</svg>
							<h3 className="text-xs font-extrabold text-zinc-900 dark:text-white">
								Notifications
							</h3>
							{unreadCount > 0 && (
								<span className="bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
									{unreadCount} new
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{unreadCount > 0 && (
								<button
									onClick={markAllRead}
									className="text-[10px] font-semibold text-primary dark:text-secondary hover:underline cursor-pointer"
								>
									Mark all read
								</button>
							)}
							{notifications.length > 0 && (
								<button
									onClick={clearAll}
									className="text-[10px] font-semibold text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
									title="Clear all notifications"
								>
									Clear all
								</button>
							)}
						</div>
					</div>

					{/* Notifications List */}
					<div className="max-h-[380px] overflow-y-auto no-scrollbar">
						{notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400">
								<div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
									<svg
										className="w-6 h-6 text-zinc-300 dark:text-zinc-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth="1.5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
										/>
									</svg>
								</div>
								<div className="text-center">
									<p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
										All caught up!
									</p>
									<p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
										No notifications yet.
									</p>
								</div>
							</div>
						) : (
							notifications.map((notif) => (
								<NotificationItem
									key={notif.id}
									notif={notif}
									onRead={markRead}
									onClear={clearNotification}
									onNavigate={handleNavigate}
								/>
							))
						)}
					</div>

					{/* Panel Footer */}
					<div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
						<button
							onClick={() => {
								setIsOpen(false);
								router.push("/notifications");
							}}
							className="w-full text-[10px] font-bold text-primary dark:text-secondary hover:underline cursor-pointer text-center"
						>
							View all notifications →
						</button>
					</div>
				</div>
			)}

			<style jsx>{`
				@keyframes notifSlideDown {
					from {
						opacity: 0;
						transform: translateY(-8px) scale(0.97);
					}
					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}
			`}</style>
		</div>
	);
}
