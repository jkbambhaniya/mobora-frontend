"use client";

// Hot reload trigger: client context check
import React from "react";
import { useDashboard } from "@/context/vendor/dashboard-context";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";

export default function Dashboard() {
	const { devices, orders, exchanges } = useDashboard();

	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => {
		setMounted(true);
	}, []);

	// DATA METRICS COMPUTATIONS
	const totalListings = devices.reduce((acc, curr) => acc + curr.stock, 0);
	const activeExchanges = exchanges.filter(
		(e) => e.status === "Pending",
	).length;

	const currentMonthSales = orders
		.filter((o) => o.status !== "Cancelled")
		.reduce((acc, curr) => acc + curr.amount, 0);
	const totalSoldDevices = orders.filter(
		(o) => o.status === "Delivered",
	).length;

	// CHART MOCK DATA
	const salesHistoryChartData = [
		{ label: "Jan", sales: 120000 },
		{ label: "Feb", sales: 180000 },
		{ label: "Mar", sales: 150000 },
		{ label: "Apr", sales: 240000 },
		{ label: "May", sales: 310000 },
		{ label: "Jun", sales: currentMonthSales + 150000 }, // Dynamic simulation
	];

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
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Metric 1 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">
						Total Phone Inventory
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{totalListings}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-505">
							Units listed
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M5 10l7-7m0 0l7 7m-7-7v18"
							/>
						</svg>
						<span>+12% vs last week</span>
					</div>
				</div>

				{/* Metric 2 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">
						Trade-In Offers
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{activeExchanges}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-505">
							Pending valuation
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-3 text-xs text-amber-500 font-semibold">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>Requires attention</span>
					</div>
				</div>

				{/* Metric 3 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">
						June Sales Revenue
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span
							className="text-xl font-extrabold tracking-tight"
							suppressHydrationWarning
						>
							₹{currentMonthSales.toLocaleString()}
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M5 10l7-7m0 0l7 7m-7-7v18"
							/>
						</svg>
						<span>+24.5% target pacing</span>
					</div>
				</div>

				{/* Metric 4 */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-505 uppercase tracking-wider block">
						Completed Exchanges
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-xl font-extrabold tracking-tight">
							{totalSoldDevices}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-505">
							Fulfilled sales
						</span>
					</div>
					<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2.5"
								d="M9 12l2 2 4-4"
							/>
						</svg>
						<span>100% customer satisfaction</span>
					</div>
				</div>
			</div>

			{/* CHARTS CONTAINER GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 1. SALES VOLUME TREND */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm lg:col-span-2 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-bold text-lg text-zinc-900 dark:text-white">
								Revenue Performance Trend
							</h3>
							<p className="text-xs text-zinc-500 dark:text-zinc-400">
								Monthly sales volume for pre-owned & exchanges
							</p>
						</div>
						<span className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-widest bg-primary/5 dark:bg-primary/10 px-2.5 py-1 rounded-full">
							H1 2026
						</span>
					</div>

					{/* Recharts Area Chart */}
					<div className="h-[300px] w-full pt-4">
						{mounted ? (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart
									data={salesHistoryChartData}
									margin={{
										top: 10,
										right: 10,
										left: -15,
										bottom: 0,
									}}
								>
									<defs>
										<linearGradient
											id="colorSales"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="#3b82f6"
												stopOpacity={0.3}
											/>
											<stop
												offset="95%"
												stopColor="#3b82f6"
												stopOpacity={0}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="currentColor"
										className="text-zinc-100 dark:text-zinc-800"
									/>
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										className="fill-zinc-400 dark:fill-zinc-505"
										tick={{ fontSize: 8 }}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) =>
											`${value / 1000}k`
										}
										className="fill-zinc-400 dark:fill-zinc-505"
										tick={{ fontSize: 8 }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor:
												"rgba(255, 255, 255, 0.95)",
											border: "1px solid #e4e4e7",
											borderRadius: "12px",
											fontSize: "10px",
											boxShadow:
												"0 10px 15px -3px rgba(0, 0, 0, 0.1)",
										}}
										itemStyle={{
											color: "#3b82f6",
											fontWeight: "bold",
										}}
										labelStyle={{
											color: "#18181b",
											fontWeight: "bold",
										}}
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										formatter={(value: any) => [
											`₹${value.toLocaleString()}`,
											"Sales",
										]}
									/>
									<Area
										type="monotone"
										dataKey="sales"
										stroke="#3b82f6"
										strokeWidth={2.5}
										fillOpacity={1}
										fill="url(#colorSales)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full w-full bg-zinc-100/50 dark:bg-zinc-800/30 animate-pulse rounded-xl flex items-center justify-center">
								<span className="text-xs text-zinc-400">
									Loading chart...
								</span>
							</div>
						)}
					</div>
				</div>

				{/* 2. BRAND STOCK SPLIT */}
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-5">
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

			{/* RECENT ORDERS TABLE SUMMARY */}
			<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-bold text-lg text-zinc-900 dark:text-white">
							Recent Sales & Trade-Ins
						</h3>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Last orders generated from customers
						</p>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm border-collapse">
						<thead>
							<tr className="text-zinc-400 font-semibold text-xs uppercase">
								<th className="pb-3 pr-4">Order ID</th>
								<th className="pb-3 px-4">Client</th>
								<th className="pb-3 px-4">Device Details</th>
								<th className="pb-3 px-4">Type</th>
								<th className="pb-3 px-4 text-right">
									Net Value
								</th>
								<th className="pb-3 pl-4 text-right">Status</th>
							</tr>
						</thead>
						<tbody>
							{orders.slice(0, 3).map((ord) => (
								<tr
									key={ord.id}
									className="border-b border-zinc-50 dark:border-zinc-850/40 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/20 transition-colors"
								>
									<td className="py-3.5 pr-4 font-mono font-bold text-zinc-500">
										{ord.id}
									</td>
									<td className="py-3.5 px-4 font-semibold">
										{ord.customerName}
									</td>
									<td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
										{ord.device}
									</td>
									<td className="py-3.5 px-4">
										<span
											className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
												ord.type === "Exchange"
													? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
													: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											}`}
										>
											{ord.type}
										</span>
									</td>
									<td
										className="py-3.5 px-4 text-right font-bold"
										suppressHydrationWarning
									>
										₹{ord.amount.toLocaleString()}
									</td>
									<td className="py-3.5 pl-4 text-right">
										<span
											className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
												ord.status === "Delivered"
													? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
													: ord.status === "Shipped"
													  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
													  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
											}`}
										>
											{ord.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
