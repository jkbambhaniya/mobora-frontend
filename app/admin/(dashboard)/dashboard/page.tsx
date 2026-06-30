"use client";

import React from "react";
import { useAdminDashboard } from "@/context/admin/dashboard-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";

export default function AdminDashboardPage() {
	const { stats, isLoadingStats } = useAdminDashboard();

	const growthData = stats?.growth || [];

	// Vendor status breakdown for chart
	const statusData = [
		{ name: "Active", value: stats?.activeVendors ?? 0, color: "#10b981" },
		{ name: "Pending", value: stats?.pendingVendors ?? 0, color: "#f59e0b" },
		{ name: "Deactivated", value: stats?.inactiveVendors ?? 0, color: "#ef4444" },
	];

	return (
		<div className="space-y-8 max-w-8xl mx-auto transition-colors duration-300">
			{/* Welcome Banner */}
			<div>
				<h1 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">Overview Dashboard</h1>
				<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">Manage vendor registrations, view platform telemetry, and adjust access permissions.</p>
			</div>

			{/* Stats Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Card 1: Total Vendors */}
				<div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-5">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
						</svg>
					</div>
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Vendors</p>
					{isLoadingStats ? (
						<div className="h-9 w-24 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats?.totalVendors ?? 0}</p>
					)}
					<div className="flex items-center gap-2 mt-4 text-xs">
						<span className="text-emerald-600 dark:text-emerald-400 font-medium">{stats?.activeVendors ?? 0} active</span>
						<span className="text-zinc-300 dark:text-gray-500">•</span>
						<span className="text-amber-600 dark:text-amber-400 font-medium">{stats?.pendingVendors ?? 0} pending</span>
					</div>
				</div>

				{/* Card 2: Total Mobiles */}
				<div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-5">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
						</svg>
					</div>
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Platform Mobiles</p>
					{isLoadingStats ? (
						<div className="h-9 w-24 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats?.totalMobiles ?? 0}</p>
					)}
					<div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 dark:text-gray-400">
						<span>Listed on platform</span>
					</div>
				</div>

				{/* Card 3: Total Customers */}
				<div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-5">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
						</svg>
					</div>
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Customers</p>
					{isLoadingStats ? (
						<div className="h-9 w-24 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats?.totalCustomers ?? 0}</p>
					)}
					<div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 dark:text-gray-400">
						<span>Registered buyers & sellers</span>
					</div>
				</div>

				{/* Card 4: Total Transactions */}
				<div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-5">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
						</svg>
					</div>
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Transactions</p>
					{isLoadingStats ? (
						<div className="h-9 w-24 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats?.totalTransactions ?? 0}</p>
					)}
					<div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 dark:text-gray-400">
						<span>Invoiced sales & exchanges</span>
					</div>
				</div>
			</div>

			{/* Charts Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Platform Growth Chart */}
				<div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg flex flex-col justify-between min-h-[360px]">
					<div>
						<h3 className="text-base font-bold text-zinc-800 dark:text-white">Platform Growth</h3>
						<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">Growth chart of active vendor count and total listed devices over time.</p>
					</div>
					<div className="flex-1 min-h-0 w-full mt-6">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<defs>
									<linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="colorMobiles" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-white/5" />
								<XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
								<YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
								<Tooltip
									contentStyle={{
										background: "var(--tooltip-bg, #ffffff)",
										borderColor: "var(--tooltip-border, #e4e4e7)",
										borderRadius: "12px",
										fontSize: "12px",
									}}
								/>
								<Area type="monotone" dataKey="vendors" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorVendors)" name="Vendors" />
								<Area type="monotone" dataKey="mobiles" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMobiles)" name="Mobiles" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Vendor Status Distribution Chart */}
				<div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg flex flex-col justify-between min-h-[360px]">
					<div>
						<h3 className="text-base font-bold text-zinc-800 dark:text-white">Vendors Status</h3>
						<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">Breakdown of registered accounts categorized by activation state.</p>
					</div>
					<div className="flex-1 min-h-0 w-full mt-6">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-white/5" />
								<XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
								<YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
								<Tooltip
									cursor={{ fill: "transparent" }}
									contentStyle={{
										background: "var(--tooltip-bg, #ffffff)",
										borderColor: "var(--tooltip-border, #e4e4e7)",
										borderRadius: "12px",
										fontSize: "12px",
									}}
								/>
								<Bar dataKey="value" radius={[8, 8, 0, 0]} name="Accounts">
									{statusData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
