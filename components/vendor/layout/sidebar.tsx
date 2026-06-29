"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/context/vendor/dashboard-context";
import { logoutAction } from "@/actions/auth";
import { confirmLogout } from "@/utils/confirm";

export default function Sidebar() {
	const { vendor, chats, setVendor } = useDashboard();

	const handleLogout = () => {
		confirmLogout(async () => {
			try {
				await logoutAction();
			} catch (err) {
				console.error("Logout failed:", err);
			}
			setVendor(null);
			window.location.href = "/login";
		});
	};
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const hasUnreadMessages = chats?.some((c) => c.unreadCount > 0) || false;
	const contactPerson = vendor?.name || "Vendor";
	const pathname = usePathname();

	const isTabActive = (tabPath: string) => {
		return pathname === tabPath || pathname.startsWith(tabPath + "/");
	};

	return (
		<>
			{/* DESKTOP SIDEBAR */}
			<aside className="hidden lg:flex w-72 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200/60 dark:border-zinc-800/60 p-6 flex-col justify-between fixed top-0 left-0 h-screen overflow-y-auto z-30">
				<div className="space-y-8">
					{/* BRAND HEADER */}
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary shadow-md shadow-primary/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								className="w-4.5 h-4.5 text-white"
							>
								<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
							</svg>
						</div>
						<div>
							<h1 className="font-bold text-base tracking-tight leading-tight">
								Mobora Portal
							</h1>
							<span className="text-[10px] uppercase font-bold tracking-widest text-secondary block">
								Vendor Desk
							</span>
						</div>
					</div>

					{/* NAV ITEMS */}
					<nav className="flex flex-col gap-1">
						<Link
							href="/dashboard"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/dashboard")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
								/>
							</svg>
							Overview
						</Link>

						<Link
							href="/inventory"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/inventory")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/>
							</svg>
							Inventory
						</Link>

						<Link
							href="/mobiles"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/mobiles")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
								/>
							</svg>
							Mobiles
						</Link>

						<Link
							href="/courier"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/courier")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>
							Courier Orders
						</Link>


						<Link
							href="/blacklist"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/blacklist")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							Blacklist
						</Link>

						<Link
							href="/requirements"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/requirements")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
								/>
							</svg>
							Requirements
						</Link>

						<Link
							href="/specifications"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/specifications")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
								/>
							</svg>
							Specifications
						</Link>

						<Link
							href="/customer"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								isTabActive("/customer")
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
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
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
							Customers
						</Link>

						<Link
							href="/chat"
							className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer w-full text-left ${
								pathname === "/chat"
									? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
									: "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
							}`}
						>
							<div className="relative">
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
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
								{hasUnreadMessages && (
									<span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
								)}
							</div>
							Messages
						</Link>
					</nav>
				</div>

				{/* SIDEBAR FOOTER */}
				<div className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
					<div className="flex items-center gap-2.5 text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
						{vendor?.profile_img ? (
							<img
								src={vendor.profile_img}
								alt={vendor.name}
								className="h-8 w-8 rounded-lg object-cover shadow-sm border border-zinc-200 dark:border-zinc-800"
							/>
						) : (
							<div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-extrabold text-[10px] shadow-sm">
								{(vendor?.name || "V")
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</div>
						)}
						<div className="min-w-0">
							Logged in as <br />
							<strong className="text-zinc-700 dark:text-zinc-300 block truncate max-w-[150px]">
								{contactPerson}
							</strong>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="w-full text-xs"
						onClick={handleLogout}
					>
						Log Out
					</Button>
				</div>
			</aside>

			{/* MOBILE BOTTOM NAVIGATION */}
			<div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/60 dark:border-zinc-800/80 px-2 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
				<Link
					href="/dashboard"
					className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
						isTabActive("/dashboard")
							? "text-primary dark:text-secondary font-bold"
							: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
					}`}
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
							d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
						/>
					</svg>
					<span className="text-[10px] tracking-tight">Overview</span>
				</Link>

				<Link
					href="/inventory"
					className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
						isTabActive("/inventory")
							? "text-primary dark:text-secondary font-bold"
							: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
					}`}
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
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
					<span className="text-[10px] tracking-tight">
						Inventory
					</span>
				</Link>

				<Link
					href="/chat"
					className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
						pathname === "/chat"
							? "text-primary dark:text-secondary font-bold"
							: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
					}`}
				>
					<div className="relative">
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
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
						{hasUnreadMessages && (
							<span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
						)}
					</div>
					<span className="text-[10px] tracking-tight">Messages</span>
				</Link>

				<button
					onClick={() => setIsMobileMenuOpen(true)}
					className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
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
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<span className="text-[10px] tracking-tight">More</span>
				</button>
			</div>

			{/* MOBILE MENU SHEET (DRAWER) */}
			{isMobileMenuOpen && (
				<div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-zinc-950/70 backdrop-blur-md animate-fadeIn">
					{/* Backdrop Click area */}
					<div
						className="absolute inset-0"
						onClick={() => setIsMobileMenuOpen(false)}
					/>

					<div className="relative bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl p-6 space-y-6 animate-slideUp z-10 max-h-[80vh] overflow-y-auto">
						{/* Handle Bar */}
						<div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto -mt-2 mb-4" />

						{/* Header */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-secondary text-white font-extrabold text-sm shadow-md">
									M
								</div>
								<div>
									<h3 className="font-bold text-base text-zinc-900 dark:text-white">
										{vendor?.shop_name || "My Business"}
									</h3>
									<span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
										Store Menu
									</span>
								</div>
							</div>
							<button
								onClick={() => setIsMobileMenuOpen(false)}
								className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
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
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						{/* Menu Links */}
						<div className="grid grid-cols-1 gap-2 pt-2">
							<Link
								href="/chat"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									pathname === "/chat"
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
								}`}
							>
								<div className="relative">
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
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									{hasUnreadMessages && (
										<span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
									)}
								</div>
								Messages Desk
							</Link>

							<Link
								href="/inventory"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/inventory")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
								}`}
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
										d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
									/>
								</svg>
								Inventory
							</Link>

							<Link
								href="/mobiles"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/mobiles")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
								}`}
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
										d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
									/>
								</svg>
								Mobiles
							</Link>

							<Link
								href="/courier"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/courier")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
								}`}
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
										d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
									/>
								</svg>
								Courier Orders
							</Link>


							<Link
								href="/blacklist"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/blacklist")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
								}`}
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
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								Blacklist
							</Link>

							<Link
								href="/requirements"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/requirements")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850"
								}`}
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
										d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									/>
								</svg>
								Requirements
							</Link>



							<Link
								href="/specifications"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/specifications")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
								}`}
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
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
									/>
								</svg>
								Specifications Setup
							</Link>

							<Link
								href="/customer"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
									isTabActive("/customer")
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
										: "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
								}`}
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
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								Customers
							</Link>

						</div>

						{/* Quick Actions (Theme & Info) */}
						<div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 space-y-4">
							<div className="flex items-center justify-between px-2">
								<span className="text-xs font-semibold text-zinc-500">
									Dark / Light Mode
								</span>
								<ThemeToggle />
							</div>
							<div className="text-xs text-zinc-400 dark:text-zinc-500 leading-normal px-2">
								Logged in as{" "}
								<strong className="text-zinc-700 dark:text-zinc-300">
									{contactPerson}
								</strong>
							</div>
							<Button
								variant="outline"
								className="w-full py-2.5 rounded-2xl text-xs font-bold mt-2"
								onClick={() => {
									setIsMobileMenuOpen(false);
									handleLogout();
								}}
							>
								Log Out
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
