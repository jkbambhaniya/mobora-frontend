"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/vendor/dashboard-context";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
	ResponsiveContainer,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Cell,
	Legend,
	PieChart,
	Pie,
} from "recharts";

export default function Dashboard() {
	const {
		devices,
		matchingDevices,
		fetchMatchingDevices,
		trades,
		refreshTrades,
		vendor,
	} = useDashboard();

	// Group matching devices by specification
	const groupedMatchingDevices = useMemo(() => {
		const groups: {
			[key: string]: {
				key: string;
				brand: string;
				model: string;
				condition: string;
				color: string;
				ram: string;
				storage: string;
				items: typeof matchingDevices;
			};
		} = {};

		(matchingDevices || []).forEach((item) => {
			const specKey = `${item.brand}-${item.model}-${item.condition}-${item.color}-${item.ram}-${item.storage}`.toLowerCase();
			if (!groups[specKey]) {
				groups[specKey] = {
					key: specKey,
					brand: item.brand,
					model: item.model,
					condition: item.condition,
					color: item.color,
					ram: item.ram,
					storage: item.storage,
					items: [],
				};
			}
			groups[specKey].items.push(item);
		});

		return Object.values(groups);
	}, [matchingDevices]);

	const [selectedGroup, setSelectedGroup] = useState<typeof groupedMatchingDevices[number] | null>(null);

	// Default ranges helper
	const getDaysAgoStr = (days: number) => {
		const d = new Date();
		d.setDate(d.getDate() - days);
		return d.toISOString().split("T")[0];
	};
	const getTodayStr = () => {
		return new Date().toISOString().split("T")[0];
	};

	const [startDate, setStartDate] = useState(getDaysAgoStr(7));
	const [endDate, setEndDate] = useState(getTodayStr());
	const [selectedPreset, setSelectedPreset] = useState("Last 7 Days");

	useEffect(() => {
		if (fetchMatchingDevices) {
			fetchMatchingDevices();
		}
		if (refreshTrades) {
			refreshTrades();
		}
	}, []);

	// Filter trades based on date range selection
	const filteredTrades = useMemo(() => {
		if (!endDate) return [];
		const start = new Date(startDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		return trades.filter((t) => {
			const tradeDate = new Date(t.date);
			return tradeDate >= start && tradeDate <= end;
		});
	}, [trades, startDate, endDate]);

	// DATA METRICS COMPUTATIONS
	const totalStockCount = devices.reduce((acc, curr) => acc + curr.stock, 0);
	const lowStockDevices = devices.filter((d) => d.stock > 0 && d.stock < 3).length;
	const outOfStockDevices = devices.filter((d) => d.stock === 0).length;
	const totalPortfolioValue = devices.reduce((acc, curr) => acc + curr.price * curr.stock, 0);

	// Sales & Purchases summary (filtered by selected dates)
	const salesTrades = useMemo(() => filteredTrades.filter((t) => t.type === "Sale"), [filteredTrades]);
	const purchasesTrades = useMemo(() => filteredTrades.filter((t) => t.type === "Purchase"), [filteredTrades]);
	const totalSales = useMemo(() => salesTrades.reduce((acc, t) => acc + t.amount, 0), [salesTrades]);
	const totalPurchases = useMemo(() => purchasesTrades.reduce((acc, t) => acc + t.amount, 0), [purchasesTrades]);

	// Brand Shares
	const brandShare = useMemo(() => {
		const brandList = Array.from(new Set(devices.map((item) => item.brand)));
		return brandList
			.map((brand) => {
				const count = devices
					.filter((item) => item.brand === brand)
					.reduce((acc, cur) => acc + cur.stock, 0);
				return { name: brand, value: count };
			})
			.sort((a, b) => b.value - a.value);
	}, [devices]);

	// Condition Shares
	const conditionShare = useMemo(() => {
		const brandNew = devices.filter((d) => d.condition === "NEW").reduce((acc, curr) => acc + curr.stock, 0);
		const preOwned = devices.filter((d) => d.condition === "OLD").reduce((acc, curr) => acc + curr.stock, 0);
		return [
			{ name: "Brand New (NEW)", value: brandNew, color: "#4f46e5" },
			{ name: "Pre-Owned (OLD)", value: preOwned, color: "#10b981" },
		];
	}, [devices]);

	// Timeline Data
	const transactionTimelineData = useMemo(() => {
		const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		const groups: { [key: string]: { date: string; Sales: number; Purchases: number } } = {};

		sortedTrades.forEach((t) => {
			let dateStr = t.date;
			try {
				const d = new Date(t.date);
				dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
			} catch (e) {}

			if (!groups[dateStr]) {
				groups[dateStr] = { date: dateStr, Sales: 0, Purchases: 0 };
			}

			if (t.type === "Sale") {
				groups[dateStr].Sales += t.amount;
			} else if (t.type === "Purchase") {
				groups[dateStr].Purchases += t.amount;
			}
		});

		return Object.values(groups);
	}, [filteredTrades]);

	const isDemoTrades = transactionTimelineData.length === 0;
	const timelineData = !isDemoTrades
		? transactionTimelineData
		: [
				{ date: "Mon", Sales: 12000, Purchases: 8000 },
				{ date: "Tue", Sales: 19000, Purchases: 12000 },
				{ date: "Wed", Sales: 15000, Purchases: 22000 },
				{ date: "Thu", Sales: 27000, Purchases: 15000 },
				{ date: "Fri", Sales: 32000, Purchases: 19000 },
				{ date: "Sat", Sales: 24000, Purchases: 11000 },
				{ date: "Sun", Sales: 38000, Purchases: 14000 },
		  ];

	// Format currency helper
	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: "INR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	// Recent Activities list (filtered by selected dates)
	const recentActivities = useMemo(() => {
		return [...filteredTrades]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 5);
	}, [filteredTrades]);

	// Excel Export Logic
	const handleExportToExcel = () => {
		const headers = [
			"Transaction Date",
			"Type",
			"IMEI",
			"Brand",
			"Model",
			"Storage",
			"RAM",
			"Color",
			"Condition",
			"Partner Name",
			"Transaction Amount (INR)",
			"Buy Price (INR)",
			"Sell Price (INR)",
			"Margin/Profit (INR)",
			"Purchase Date",
			"Sale Date",
			"Notes",
		];

		const rows = filteredTrades.map((t) => {
			let buyPrice = 0;
			let sellPrice = 0;
			let margin = 0;
			let purchaseDate = "N/A";
			let saleDate = "N/A";

			if (t.type === "Sale") {
				sellPrice = t.amount;
				saleDate = t.date;

				const purTrade = trades.find((ot) => ot.type === "Purchase" && ot.imei === t.imei && t.imei);
				if (purTrade) {
					buyPrice = purTrade.amount;
					purchaseDate = purTrade.date;
				} else {
					const dev = devices.find((d) => d.imei === t.imei || (d.brand === t.deviceBrand && d.model === t.deviceModel));
					buyPrice = dev?.purchasePrice || 0;
				}
				margin = sellPrice - buyPrice;
			} else {
				buyPrice = t.amount;
				purchaseDate = t.date;

				const saleTrade = trades.find((ot) => ot.type === "Sale" && ot.imei === t.imei && t.imei);
				if (saleTrade) {
					sellPrice = saleTrade.amount;
					saleDate = saleTrade.date;
					margin = sellPrice - buyPrice;
				} else {
					const dev = devices.find((d) => d.imei === t.imei || (d.brand === t.deviceBrand && d.model === t.deviceModel));
					sellPrice = dev?.price || 0;
					margin = sellPrice > 0 ? sellPrice - buyPrice : 0;
				}
			}

			return [
				t.date,
				t.type === "Sale" ? "Sell" : "Buy",
				t.imei || "N/A",
				t.deviceBrand,
				t.deviceModel,
				t.storage || "N/A",
				t.ram || "N/A",
				t.color || "N/A",
				t.condition || "N/A",
				t.customerName,
				t.amount,
				buyPrice || "N/A",
				sellPrice || "N/A",
				margin,
				purchaseDate,
				saleDate,
				t.notes || "",
			];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Trades Detail");

		XLSX.writeFile(wb, `Mobora_Trades_Report_${startDate}_to_${endDate}.xlsx`);
	};

	const handleDateRangeChange = (start: string, end: string, preset: string) => {
		setStartDate(start);
		setEndDate(end);
		setSelectedPreset(preset);
	};

	return (
		<div className="space-y-8 animate-fadeIn px-4 sm:px-6">
			{/* Welcome Banner */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-950 dark:border dark:border-white/5 shadow-xl relative overflow-hidden">
				<div className="absolute top-0 right-0 p-4 opacity-10">
					<svg className="w-40 h-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
					</svg>
				</div>
				<div className="space-y-1 relative z-10">
					<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
						Welcome Back, {vendor?.shop_name || vendor?.name || "Partner"}!
					</h1>
					<p className="text-zinc-400 text-sm">
						Here's a premium visual summary of your store's stock telemetry and recent trades.
					</p>
				</div>
				<div className="flex gap-2.5 shrink-0 relative z-10">
					<Link
						href="/inventory"
						className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
						</svg>
						Add Device
					</Link>
					<Link
						href="/requirements"
						className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-all border border-zinc-700/50 flex items-center gap-1.5"
					>
						Add Requirement
					</Link>
				</div>
			</div>

			{/* DATE FILTER & EXPORT BAR */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-white dark:bg-[#13151a]/40 border border-zinc-200/60 dark:border-white/5 shadow-sm relative">
				<DateRangePicker
					startDate={startDate}
					endDate={endDate}
					onChange={handleDateRangeChange}
					defaultPreset={selectedPreset}
				/>

				<button
					onClick={handleExportToExcel}
					className="px-4 py-2 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Export Report
				</button>
			</div>

			{/* MATCHING REQUIREMENTS INFOBOX */}
			{groupedMatchingDevices && groupedMatchingDevices.length > 0 && (
				<div className="p-6 rounded-3xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/10 dark:bg-indigo-950/5 backdrop-blur-md shadow-sm space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-extrabold text-lg text-indigo-900 dark:text-indigo-205 flex items-center gap-2 tracking-tight">
								<svg className="w-5 h-5 text-indigo-505 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Requirement Matches Available ({matchingDevices.length})
							</h3>
							<p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
								Other vendors are looking for items matching your device specifications. Click to see details.
							</p>
						</div>
					</div>

					<div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin] [scrollbar-color:#c7d2fe_transparent]">
						{groupedMatchingDevices.map((group) => (
							<div key={group.key} className="p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 shrink-0 w-72 snap-start">
								<div>
									<div className="flex items-center justify-between">
										<span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5 truncate">
											<span className="truncate">{group.brand} {group.model}</span>
											<span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
												{group.items.length}
											</span>
										</span>
										<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 capitalize">
											{group.condition}
										</span>
									</div>
									<p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1">
										{group.color} · {group.ram} RAM · {group.storage} Storage
									</p>
								</div>
								<div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
									<button
										onClick={() => setSelectedGroup(group)}
										className="w-full h-8 flex items-center justify-center text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer"
									>
										View Matches ({group.items.length})
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* METRICS CARDS GRID */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Metric 1 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
					<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block">
						Portfolio Stock Value
					</span>
					<p className="text-2xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white">
						{formatCurrency(totalPortfolioValue)}
					</p>
					<span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
						From {totalStockCount} listed units
					</span>
				</div>

				{/* Metric 2 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
					<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block">
						Filtered Sales Revenue
					</span>
					<p className="text-2xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white">
						{formatCurrency(totalSales)}
					</p>
					<span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
						{salesTrades.length} orders in range
					</span>
				</div>

				{/* Metric 3 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400" />
					<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block">
						Filtered Stock Purchases
					</span>
					<p className="text-2xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white">
						{formatCurrency(totalPurchases)}
					</p>
					<span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
						{purchasesTrades.length} receipts in range
					</span>
				</div>

				{/* Metric 4 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/40 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
					<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block">
						Stock Status Alerts
					</span>
					<p className="text-2xl font-extrabold tracking-tight mt-2 text-zinc-900 dark:text-white">
						{lowStockDevices + outOfStockDevices}
					</p>
					<span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
						{lowStockDevices} low stock · {outOfStockDevices} sold out
					</span>
				</div>
			</div>

			{/* VISUAL CHARTS GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Sales vs Purchases area chart */}
				<div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#13151a]/40 border border-zinc-200/60 dark:border-white/5 shadow-sm flex flex-col min-h-[380px]">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-150">
								Trade Volumes Trend
							</h3>
							<p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
								Telemetry showing sales versus stock acquisition in selected range.
							</p>
						</div>
						{isDemoTrades && (
							<span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
								Demo Data
							</span>
						)}
					</div>

					<div className="flex-1 w-full min-h-0 mt-6">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
								<defs>
									<linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
										<stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-white/5" />
								<XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} />
								<YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
								<Tooltip
									formatter={(v: any) => [formatCurrency(Number(v)), ""]}
									contentStyle={{
										background: "var(--tooltip-bg, #ffffff)",
										borderColor: "var(--tooltip-border, #e4e4e7)",
										borderRadius: "16px",
										fontSize: "11px",
										boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
									}}
								/>
								<Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
								<Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" name="Sales Revenue" />
								<Area type="monotone" dataKey="Purchases" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPurchases)" name="Stock Purchases" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Brand share pie chart */}
				<div className="p-6 rounded-3xl bg-white dark:bg-[#13151a]/40 border border-zinc-200/60 dark:border-white/5 shadow-sm flex flex-col justify-between min-h-[380px]">
					<div>
						<h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-150">
							Brand Distribution
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
							Distribution of active listed stock by manufacturer.
						</p>
					</div>

					<div className="flex-1 w-full min-h-0 flex items-center justify-center my-4">
						{brandShare.length > 0 ? (
							<ResponsiveContainer width="100%" height={220}>
								<PieChart>
									<Pie
										data={brandShare}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={4}
										dataKey="value"
									>
										{brandShare.map((entry, index) => {
											const COLORS = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
											return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
										})}
									</Pie>
									<Tooltip formatter={(v) => [`${v} units`, "Stock"]} />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<p className="text-xs text-zinc-400">No active stock listed.</p>
						)}
					</div>

					{/* Custom Legend */}
					<div className="space-y-2 max-h-[100px] overflow-y-auto [scrollbar-width:none]">
						{brandShare.slice(0, 4).map((b, idx) => {
							const COLORS = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];
							return (
								<div key={idx} className="flex items-center justify-between text-xs">
									<div className="flex items-center gap-2">
										<span
											className="w-2.5 h-2.5 rounded-full shrink-0"
											style={{ backgroundColor: COLORS[idx % COLORS.length] }}
										/>
										<span className="text-zinc-700 dark:text-zinc-300 font-semibold">{b.name}</span>
									</div>
									<span className="text-zinc-400">{b.value} units</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* LOWER GRID: RECENT ACTIVITIES & QUICK STATS */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Recent Activity Timeline */}
				<div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#13151a]/40 border border-zinc-200/60 dark:border-white/5 shadow-sm space-y-5">
					<div>
						<h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-150">
							Recent Activity Feed
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
							Chronological history of recorded device sales and inventory acquisitions in range.
						</p>
					</div>

					<div className="space-y-4">
						{recentActivities.length > 0 ? (
							recentActivities.map((act) => (
								<div
									key={act.id}
									className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div
											className={`p-2.5 rounded-xl shrink-0 ${
												act.type === "Sale"
													? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
													: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
											}`}
										>
											{act.type === "Sale" ? (
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
												</svg>
											) : (
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
												</svg>
											)}
										</div>
										<div>
											<p className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200">
												{act.deviceBrand} {act.deviceModel}
											</p>
											<p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-0.5">
												{act.type === "Sale" ? "Sold to" : "Bought from"} {act.customerName} · {act.date}
											</p>
										</div>
									</div>
									<span
										className={`text-xs font-black shrink-0 ${
											act.type === "Sale" ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
										}`}
									>
										{act.type === "Sale" ? "+" : "-"} {formatCurrency(act.amount)}
									</span>
								</div>
							))
						) : (
							<div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
								<p className="text-xs text-zinc-400">No transactions recorded in this date range.</p>
							</div>
						)}
					</div>
				</div>

				{/* Quick Statistics details card */}
				<div className="p-6 rounded-3xl bg-white dark:bg-[#13151a]/40 border border-zinc-200/60 dark:border-white/5 shadow-sm space-y-6">
					<div>
						<h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-150">
							Condition Shares
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
							Overview of stock condition distribution.
						</p>
					</div>

					<div className="space-y-4">
						{conditionShare.map((cs, idx) => {
							const percentage =
								totalStockCount > 0 ? Math.round((cs.value / totalStockCount) * 100) : 0;
							return (
								<div key={idx} className="space-y-1.5">
									<div className="flex justify-between items-center text-xs font-bold">
										<span className="text-zinc-606 dark:text-zinc-400">{cs.name}</span>
										<span className="text-zinc-800 dark:text-zinc-200">
											{cs.value} units ({percentage}%)
										</span>
									</div>
									<div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
										<div
											className="h-full rounded-full transition-all duration-500"
											style={{
												width: `${percentage}%`,
												backgroundColor: cs.color,
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>

					<div className="border-t border-zinc-100 dark:border-zinc-850 pt-4 flex flex-col gap-2.5 text-xs">
						<div className="flex justify-between">
							<span className="text-zinc-500 dark:text-zinc-450">Active Brands:</span>
							<span className="font-bold text-zinc-800 dark:text-zinc-200">{brandShare.length}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-zinc-500 dark:text-zinc-450">Low Stock Lines:</span>
							<span className="font-bold text-amber-600 dark:text-amber-400">{lowStockDevices}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-zinc-500 dark:text-zinc-450">Out of Stock Lines:</span>
							<span className="font-bold text-rose-500">{outOfStockDevices}</span>
						</div>
					</div>
				</div>
			</div>

			<Modal
				isOpen={!!selectedGroup}
				onClose={() => setSelectedGroup(null)}
				title={
					selectedGroup ? (
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
								<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
							</div>
							<div className="flex flex-col">
								<span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
									{selectedGroup.brand} {selectedGroup.model}
									<span className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-black rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
										{selectedGroup.items.length} {selectedGroup.items.length === 1 ? 'Match' : 'Matches'}
									</span>
								</span>
								<span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
									{selectedGroup.color} · {selectedGroup.ram} RAM · {selectedGroup.storage} Storage · <span className="capitalize">{selectedGroup.condition}</span>
								</span>
							</div>
						</div>
					) : undefined
				}
				size="lg"
			>
				{selectedGroup && (
					<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
						<div className="grid grid-cols-1 gap-3.5">
							{selectedGroup.items.map((item) => (
								<div
									key={item.id}
									className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20 hover:border-indigo-500/25 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
								>
									<div className="flex items-start gap-3.5">
										<div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/40 dark:border-zinc-700/40 font-bold text-xs text-zinc-650 dark:text-zinc-350">
											{item.shopName ? item.shopName.charAt(0).toUpperCase() : 'V'}
										</div>
										<div className="space-y-1">
											<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
												<span className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100">
													{item.shopName}
												</span>
											</div>
											
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
												<span className="flex items-center gap-1">
													<svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
													</svg>
													{item.vendorName}
												</span>
												<span className="flex items-center gap-1">
													<svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
													</svg>
													{item.vendorPhone || "N/A"}
												</span>
												{item.vendorEmail && (
													<span className="flex items-center gap-1 sm:col-span-2 mt-0.5">
														<svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
														</svg>
														{item.vendorEmail}
													</span>
												)}
											</div>
										</div>
									</div>
									<div className="shrink-0 flex items-center md:justify-end self-stretch md:self-auto border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/60 pt-3 md:pt-0">
										<Link
											href={`/chat?partnerId=${item.vendorId}&message=${encodeURIComponent(
												`Hi, I am interested in purchasing your ${selectedGroup.brand} ${selectedGroup.model} (${selectedGroup.color}, ${selectedGroup.ram} RAM, ${selectedGroup.storage} Storage, ${selectedGroup.condition.toUpperCase()}).`
											)}`}
											onClick={() => setSelectedGroup(null)}
											className="w-full md:w-auto px-4 h-9 flex items-center justify-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
										>
											<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
											</svg>
											Chat to Purchase
										</Link>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
