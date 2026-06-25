"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/vendor/dashboard-context";

export default function Dashboard() {
	const { devices, matchingDevices, fetchMatchingDevices } = useDashboard();

	useEffect(() => {
		if (fetchMatchingDevices) {
			fetchMatchingDevices();
		}
	}, []);

	// DATA METRICS COMPUTATIONS
	const totalListings = devices.reduce((acc, curr) => acc + curr.stock, 0);
	const lowStockDevices = devices.filter((d) => d.stock < 3).length;
	const outOfStockDevices = devices.filter((d) => d.stock === 0).length;

	// Brand Shares
	const brandList = Array.from(new Set(devices.map((item) => item.brand)));
	const brandShare = brandList.map((brand) => {
		const count = devices
			.filter((item) => item.brand === brand)
			.reduce((acc, cur) => acc + cur.stock, 0);
		return { brand, count };
	});

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* MATCHING REQUIREMENTS INFOBOX */}
			{matchingDevices && matchingDevices.length > 0 && (
				<div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/20 dark:bg-indigo-950/10 backdrop-blur-md shadow-sm space-y-4">
					<div>
						<h3 className="font-extrabold text-lg text-indigo-900 dark:text-indigo-100 flex items-center gap-2 tracking-tight">
							<svg className="w-5 h-5 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Requirement Matches Available!
						</h3>
						<p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
							Other vendors have registered devices matching your active requirements.
						</p>
					</div>

					{/* Horizontal scroll count badge */}
					{matchingDevices.length > 2 && (
						<p className="text-[10px] text-indigo-500/70 dark:text-indigo-400/70 mb-1 text-right">
							{matchingDevices.length} matches — scroll to see all →
						</p>
					)}
					<div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin] [scrollbar-color:#c7d2fe_transparent]">
						{matchingDevices.map((item) => (
							<div key={item.id} className="p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 shrink-0 w-72 snap-start">
								<div>
									<div className="flex items-center justify-between">
										<span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-100">
											{item.brand} {item.model}
										</span>
										<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">
											{item.condition}
										</span>
									</div>
									<p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
										{item.color} · {item.ram} RAM · {item.storage} Storage
									</p>
									<div className="mt-4 space-y-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/40 pt-2">
										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-1.5 min-w-0">
												<svg className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
												</svg>
												<span className="font-bold text-zinc-700 dark:text-zinc-300 truncate" title={item.shopName}>
													{item.shopName}
												</span>
											</div>
											{item.vendorPhone && (
												<div className="flex items-center gap-1.5 shrink-0">
													<svg className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
													</svg>
													<span className="font-medium text-zinc-600 dark:text-zinc-400">{item.vendorPhone}</span>
												</div>
											)}
										</div>

										<div className="flex items-center justify-between gap-4">
											<div className="flex items-center gap-1.5 min-w-0">
												<svg className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
												<span className="truncate" title={item.vendorName}>
													{item.vendorName}
												</span>
											</div>
											{item.vendorEmail && (
												<div className="flex items-center gap-1.5 min-w-0">
													<svg className="w-3.5 h-3.5 text-zinc-450 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
													</svg>
													<span className="truncate text-zinc-500/90 dark:text-zinc-450/90" title={item.vendorEmail}>
														{item.vendorEmail}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>
								<div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
									<Link
										href={`/chat?partnerId=${item.vendorId}`}
										className="w-full h-8 flex items-center justify-center text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer"
									>
											Chat to Purchase
									</Link>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* METRICS CARDS GRID */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{/* Metric 1 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
						Total Phone Inventory
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{totalListings}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Units listed
						</span>
					</div>
				</div>

				{/* Metric 2 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
						Low Stock Mobiles
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{lowStockDevices}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Fewer than 3 units
						</span>
					</div>
				</div>

				{/* Metric 3 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
						Out of Stock
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{outOfStockDevices}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							0 units remaining
						</span>
					</div>
				</div>
			</div>

			{/* BRAND STOCK SPLIT */}
			<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-5 max-w-xl">
				<div>
					<h3 className="font-bold text-lg text-zinc-900 dark:text-white">
						Brand Stock Split
					</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						Listed stock quantities segmented by brand
					</p>
				</div>

				<div className="space-y-4">
					{brandShare.map((b, idx) => {
						const percentage =
							totalListings > 0
								? Math.round(
									  (b.count / totalListings) * 100,
								  )
								: 0;
						const barColors = [
							"bg-primary",
							"bg-secondary",
							"bg-success",
							"bg-purple-500",
						];
						const colorClass =
							barColors[idx % barColors.length];

						return (
							<div key={idx} className="space-y-1.5">
								<div className="flex items-center justify-between text-xs font-semibold">
									<span className="text-zinc-600 dark:text-zinc-300">
										{b.brand}
									</span>
									<span className="text-zinc-400">
										{b.count} units ({percentage}%)
									</span>
								</div>
								<div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>

				<div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between text-[11px] text-zinc-400">
					<span>Active Brands: {brandShare.length}</span>
				</div>
			</div>
		</div>
	);
}

