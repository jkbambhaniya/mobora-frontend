"use client";

import React from "react";
import { useDashboard } from "@/context/vendor/dashboard-context";

export default function Dashboard() {
	const { devices } = useDashboard();

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

