"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/admin/auth-context";
import { AdminDashboardProvider, useAdminDashboard } from "@/context/admin/dashboard-context";
import { adminLogoutAction } from "@/actions/admin-auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AdminAuthProvider>
			<AdminDashboardProvider>
				<AdminDashboardInnerLayout>{children}</AdminDashboardInnerLayout>
			</AdminDashboardProvider>
		</AdminAuthProvider>
	);
}

function AdminDashboardInnerLayout({ children }: { children: React.ReactNode }) {
	const { admin, isLoadingAdmin, setAdmin } = useAdminAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const isLoginPage = pathname === "/admin/login";

	useEffect(() => {
		if (!isLoadingAdmin && !admin && !isLoginPage) {
			router.push("/admin/login");
		}
	}, [isLoadingAdmin, admin, isLoginPage, router]);

	const handleLogout = async () => {
		try {
			await adminLogoutAction();
			setAdmin(null);
			router.push("/admin/login");
		} catch (err) {
			console.error("Admin logout failed:", err);
		}
	};

	if (isLoadingAdmin) {
		return (
			<div className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center p-6">
				<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#13151a] border border-white/5 shadow-md">
					<svg
						className="animate-spin h-7 w-7 text-indigo-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<p className="mt-4 text-xs font-semibold text-gray-500 animate-pulse">
					Verifying admin session...
				</p>
			</div>
		);
	}

	// Render children directly if it is the login page
	if (isLoginPage) {
		return <>{children}</>;
	}

	if (!admin) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-6">
				<p className="text-xs font-semibold text-zinc-500 dark:text-gray-500">Redirecting to Login...</p>
			</div>
		);
	}

	return (
		<div className="h-screen overflow-hidden bg-zinc-50 dark:bg-[#0d0e12] text-zinc-900 dark:text-gray-100 flex">
			{/* Sidebar */}
			<aside className="w-64 h-full bg-white dark:bg-[#13151a]/50 backdrop-blur-xl flex flex-col shrink-0 shadow-xl shadow-zinc-200/30 dark:shadow-black/20 z-30">
				<div className="h-16 px-6 flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-600/30">
						M
					</div>
					<div>
						<span className="font-bold text-zinc-900 dark:text-white tracking-wide">Mobora</span>
						<span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block uppercase tracking-wider leading-none mt-0.5">Admin Portal</span>
					</div>
				</div>

					<nav className="flex-1 p-4 space-y-1.5">
					<a
						href="/admin/dashboard"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname === "/admin/dashboard"
								? "bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
						<span>Dashboard</span>
					</a>

					<a
						href="/admin/vendor"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/vendor")
								? "bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<span>Vendors</span>
					</a>

					<a
						href="/admin/customer"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/customer")
								? "bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<span>Customers</span>
					</a>

					<a
						href="/admin/specifications"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/specifications")
								? "bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
						<span>Specifications</span>
					</a>

					<a
						href="/admin/blacklist"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/blacklist")
								? "bg-red-50 dark:bg-red-600/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
						<span>Blacklist</span>
					</a>

					<a
						href="/admin/requirements"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/requirements")
								? "bg-violet-50 dark:bg-violet-600/10 border border-violet-100 dark:border-violet-500/20 text-violet-600 dark:text-violet-400"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						<span>Requirements</span>
					</a>

					<a
						href="/admin/chat"
						className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
							pathname.includes("/admin/chat")
								? "bg-[#6366f1]/10 dark:bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] dark:text-[#818cf8]"
								: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white"
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
						<span>Chat</span>
					</a>
				</nav>

				<div className="p-4 border-t border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0d0e12]/40 space-y-3">
					<div className="flex items-center gap-3">
						{admin.profile_img ? (
							<img
								src={admin.profile_img}
								alt={admin.name}
								className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10"
							/>
						) : (
							<div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-semibold text-white text-sm">
								{admin.name.slice(0, 2).toUpperCase()}
							</div>
						)}
						<div className="overflow-hidden flex-1">
							<p className="text-sm font-semibold text-zinc-900 dark:text-white truncate leading-snug">{admin.name}</p>
							<p className="text-xs text-zinc-500 dark:text-gray-400 truncate leading-none mt-1">{admin.email}</p>
						</div>
					</div>
					<button
						onClick={() => setShowLogoutConfirm(true)}
						className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium text-xs transition-all cursor-pointer border border-red-200/50 dark:border-red-500/20"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						<span>Sign Out</span>
					</button>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
				{/* Top Bar */}
				<header className="relative z-20 h-16 px-8 bg-white/80 dark:bg-[#13151a]/30 backdrop-blur-xl flex items-center justify-between shrink-0 shadow-sm shadow-zinc-200/30 dark:shadow-black/10">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-bold text-zinc-800 dark:text-white tracking-wide">Administrator Panel</h2>
					</div>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						{/* Admin Profile Dropdown */}
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setDropdownOpen(!dropdownOpen)}
								className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer focus:outline-none"
							>
								{admin.profile_img ? (
									<img
										src={admin.profile_img}
										alt={admin.name}
										className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shrink-0"
									/>
								) : (
									<div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-semibold text-white text-sm shrink-0">
										{admin.name.slice(0, 2).toUpperCase()}
									</div>
								)}
								<div className="hidden md:flex flex-col items-start text-left shrink-0">
									<p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">{admin.name}</p>
									<p className="text-[10px] text-zinc-500 dark:text-gray-400 leading-none mt-1">{admin.email}</p>
								</div>
								<svg className={`w-4 h-4 text-zinc-500 dark:text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>

							{/* Dropdown Menu */}
							{dropdownOpen && (
								<div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#13151a] shadow-xl z-50 p-2 animate-fadeIn">
									<div className="px-3 py-2.5 border-b border-zinc-100 dark:border-white/5 mb-1.5">
										<p className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Signed in as</p>
										<p className="text-sm font-bold text-zinc-950 dark:text-white truncate mt-0.5">{admin.name}</p>
										<p className="text-xs text-zinc-500 dark:text-gray-400 truncate mt-0.5">{admin.email}</p>
									</div>
									<a
										href="/admin/profile"
										onClick={() => setDropdownOpen(false)}
										className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-sm transition-all"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										<span>My Profile</span>
									</a>
									<button
										onClick={() => {
											setDropdownOpen(false);
											setShowLogoutConfirm(true);
										}}
										className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 font-medium text-sm transition-all cursor-pointer text-left"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										<span>Sign Out</span>
									</button>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Children Panel Wrapper */}
				<main className="flex-1 overflow-y-auto p-8">
					{children}
				</main>
			</div>

			{/* Logout Confirmation Modal */}
			{showLogoutConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-sm bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mb-4">
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
							</div>
							<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Confirm Sign Out</h3>
							<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">Are you sure you want to log out of the administrator portal?</p>
						</div>
						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setShowLogoutConfirm(false)}
								className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-sm text-zinc-700 dark:text-gray-300 transition-all cursor-pointer"
							>
								Cancel
							</button>
							<button
								onClick={async () => {
									setShowLogoutConfirm(false);
									await handleLogout();
								}}
								className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-sm text-white shadow-lg shadow-red-600/10 dark:shadow-red-600/20 transition-all cursor-pointer"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
