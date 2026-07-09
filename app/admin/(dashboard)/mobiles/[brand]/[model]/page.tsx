"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";
import { getAdminMobileDeviceStocksBySlugAction, deleteAdminMobileAction } from "@/actions/admin-mobiles";

interface StockRecord {
	stockId: string;
	status: string;
	repairingCost: number;
	price: number;
	purchasePrice?: number;
	createdAt: string;
	vendor: {
		id: number;
		name: string;
		email: string;
		shopName: string;
	} | null;
	mobile?: {
		color: string;
		condition: string;
		batteryHealth?: number;
		imei?: string;
	};
}

interface MobileDevice {
	id: string;
	brand: string;
	model: string;
	storage: string;
	ram: string;
	color: string;
	imei?: string;
	condition: "NEW" | "OLD";
	batteryHealth?: number;
	description?: string;
}

export default function AdminMobileDeviceSlugDetailPage({ params }: { params: Promise<{ brand: string; model: string }> }) {
	const router = useRouter();
	const resolvedParams = use(params);
	const { brand: brandSlug, model: modelSlug } = resolvedParams;

	const [mobile, setMobile] = useState<MobileDevice | null>(null);
	const [stocks, setStocks] = useState<StockRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	// Client-side search and filters
	const [searchTerm, setSearchTerm] = useState("");
	const [conditionFilter, setConditionFilter] = useState("All");

	const fetchDetails = async () => {
		setIsLoading(true);
		try {
			const res = await getAdminMobileDeviceStocksBySlugAction(brandSlug, modelSlug);
			if (res.success && res.data && res.data.success) {
				setMobile(res.data.mobile);
				setStocks(res.data.stocks || []);
			} else {
				toast.error(res.message || "Failed to load device details.");
				router.push("/admin/mobiles");
			}
		} catch (error) {
			console.error("Error fetching device stocks detail by slug:", error);
			toast.error("An error occurred loading device details.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDetails();
	}, [brandSlug, modelSlug]);

	const handleDeleteStock = async (stockId: string) => {
		if (!confirm("Are you sure you want to remove this dealer stock listing? This action cannot be undone.")) return;
		setActionLoadingId(stockId);
		try {
			const res = await deleteAdminMobileAction(stockId);
			if (res.success) {
				toast.success("Stock entry removed successfully.");
				fetchDetails();
			} else {
				toast.error(res.message || "Failed to delete stock entry.");
			}
		} catch (error) {
			console.error("Delete stock entry error:", error);
			toast.error("Failed to delete stock entry.");
		} finally {
			setActionLoadingId(null);
		}
	};

	// Metrics Calculation
	const metrics = useMemo(() => {
		const total = stocks.length;
		const active = stocks.filter(s => s.status === "Available").length;
		const investment = stocks.filter(s => s.status === "Available").reduce((sum, s) => sum + (s.purchasePrice || 0) + s.repairingCost, 0);
		const margin = stocks.filter(s => s.status === "Available").reduce((sum, s) => sum + (s.price - (s.purchasePrice || 0) - s.repairingCost), 0);
		const avgPrice = active > 0 ? Math.round(stocks.filter(s => s.status === "Available").reduce((sum, s) => sum + s.price, 0) / active) : 0;
		return { total, active, investment, margin, avgPrice };
	}, [stocks]);

	// Filter & Search Stocks
	const filteredStocks = useMemo(() => {
		return stocks.filter(s => {
			const search = searchTerm.toLowerCase();
			const matchesSearch = 
				(s.vendor?.shopName || "").toLowerCase().includes(search) ||
				(s.vendor?.name || "").toLowerCase().includes(search) ||
				(mobile?.color || "").toLowerCase().includes(search) ||
				(mobile?.storage || "").toLowerCase().includes(search) ||
				(mobile?.ram || "").toLowerCase().includes(search);

			const matchesCondition = 
				conditionFilter === "All" || 
				(mobile?.condition || "").toLowerCase() === conditionFilter.toLowerCase();

			return matchesSearch && matchesCondition;
		});
	}, [stocks, searchTerm, conditionFilter, mobile]);

	const getStatusColor = (status: string) => {
		const s = status.toLowerCase();
		if (s === "available") return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
		if (s === "sold") return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
		if (s === "review") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
		if (s === "transit") return "bg-violet-500/10 text-violet-500 border border-violet-500/20";
		return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
	};

	if (isLoading) {
		return (
			<div className="flex-1 bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-8">
				<svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<p className="text-sm text-zinc-500 dark:text-gray-400">Loading device details...</p>
			</div>
		);
	}

	if (!mobile) {
		return (
			<div className="flex-1 bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-8">
				<p className="text-sm text-zinc-500 dark:text-gray-400">Device details not found.</p>
				<Button onClick={() => router.push("/admin/mobiles")} className="mt-4">
					Go back to Directory
				</Button>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#0d0e12] p-8 space-y-8 animate-fadeIn">
			{/* Top Action Bar & Title */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/5 pb-6">
				<div>
					<span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 block mb-1">
						Model Configurations
					</span>
					<h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
						{mobile.brand.toLowerCase()} {mobile.model}
					</h1>
					<button
						onClick={() => router.push("/admin/mobiles")}
						className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 mt-3"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to Mobiles
					</button>
				</div>
				<div className="text-right">
					<span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
						Configuration Inventory
					</span>
					<h2 className="text-xl font-bold text-zinc-800 dark:text-white">
						{mobile.brand} {mobile.model}
					</h2>
				</div>
			</div>

			{/* Metric Cards Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Total Stock */}
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Total Stock
					</span>
					<div className="flex items-center justify-between mt-2">
						<span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
							{metrics.total}
						</span>
						<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
							{metrics.active} Active
						</span>
					</div>
				</div>

				{/* Investment Value */}
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Investment Value
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
							₹{metrics.investment.toLocaleString("en-IN")}
						</span>
						<span className="text-[10px] text-zinc-400 font-medium">Available Stock</span>
					</div>
				</div>

				{/* Est. Profit Margin */}
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Est. Profit Margin
					</span>
					<div className="flex items-center justify-between mt-2">
						<span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
							₹{metrics.margin.toLocaleString("en-IN")}
						</span>
						<span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
							Markups
						</span>
					</div>
				</div>

				{/* Avg. Selling Price */}
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Avg. Selling Price
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
							₹{metrics.avgPrice.toLocaleString("en-IN")}
						</span>
						<span className="text-[10px] text-zinc-400 font-medium">Per Active Device</span>
					</div>
				</div>
			</div>

			{/* Search & Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
				<div className="relative w-full md:w-80">
					<span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search IMEI, specs, color..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-zinc-800 dark:text-white"
					/>
				</div>

				<div className="flex items-center gap-3 w-full md:w-auto">
					<select
						value={conditionFilter}
						onChange={(e) => setConditionFilter(e.target.value)}
						className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
					>
						<option value="All">All Conditions</option>
						<option value="NEW">New</option>
						<option value="OLD">Old</option>
					</select>
				</div>
			</div>

			{/* Devices Listing Table */}
			<div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
								<th className="py-4 px-6">Specification</th>
								<th className="py-4 px-6">IMEI</th>
								<th className="py-4 px-6 text-center">Condition</th>
								<th className="py-4 px-6 text-center">Battery</th>
								<th className="py-4 px-6 text-right">Cost Price</th>
								<th className="py-4 px-6 text-right">Selling Price</th>
								<th className="py-4 px-6 text-center">Status</th>
								<th className="py-4 px-6 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-200 dark:divide-white/5">
							{filteredStocks.length === 0 ? (
								<tr>
									<td colSpan={8} className="text-center py-12 text-sm text-zinc-500 dark:text-gray-400">
										No dealer stock entries registered for this device matching your search.
									</td>
								</tr>
							) : (
								filteredStocks.map((stock) => (
									<tr key={stock.stockId} className="text-sm hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors group">
										{/* Specification */}
										<td className="py-4 px-6">
											<div className="flex flex-col">
												<span className="font-semibold text-zinc-900 dark:text-white">
													{mobile.color}
												</span>
												<span className="text-xs text-zinc-500">
													{mobile.storage} • {mobile.ram} RAM • Shop: {stock.vendor?.shopName || "Unknown"}
												</span>
											</div>
										</td>

										{/* IMEI */}
										<td className="py-4 px-6 font-mono text-indigo-500 dark:text-indigo-400">
											{stock.mobile?.imei || "No IMEI"}
										</td>

										{/* Condition */}
										<td className="py-4 px-6 text-center">
											<span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
												mobile.condition === "NEW" 
													? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" 
													: "bg-orange-500/10 text-orange-500 border-orange-500/20"
											}`}>
												{mobile.condition}
											</span>
										</td>

										{/* Battery */}
										<td className="py-4 px-6 text-center font-semibold text-zinc-800 dark:text-zinc-200">
											{mobile.batteryHealth ? `${mobile.batteryHealth}%` : "N/A"}
										</td>

										{/* Cost Price */}
										<td className="py-4 px-6 text-right font-semibold text-zinc-700 dark:text-zinc-350">
											₹{(stock.purchasePrice || 0).toLocaleString("en-IN")}
										</td>

										{/* Selling Price */}
										<td className="py-4 px-6 text-right font-bold text-zinc-900 dark:text-zinc-150">
											₹{stock.price.toLocaleString("en-IN")}
										</td>

										{/* Status */}
										<td className="py-4 px-6 text-center">
											<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(stock.status)}`}>
												{stock.status}
											</span>
										</td>

										{/* Actions */}
										<td className="py-4 px-6 text-right">
											<div className="flex items-center justify-end gap-3.5">
												<button
													onClick={() => router.push(`/admin/mobiles/${brandSlug}/${modelSlug}/${stock.mobile?.imei || 'unknown'}`)}
													className="text-xs font-bold bg-zinc-100 hover:bg-indigo-500 hover:text-white dark:bg-white/5 dark:hover:bg-indigo-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
													title="Show History"
												>
													Show History
												</button>

												<button
													onClick={() => handleDeleteStock(stock.stockId)}
													disabled={actionLoadingId === stock.stockId}
													className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-50 hover:text-red-600 dark:bg-white/5 dark:hover:bg-red-550/10 dark:hover:text-red-400 transition-all text-zinc-500 dark:text-gray-400 cursor-pointer disabled:opacity-50"
													title="Delete stock entry"
												>
													{actionLoadingId === stock.stockId ? (
														<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
													) : (
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													)}
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
