"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminCustomerByIdAction } from "@/actions/admin-customers";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";

interface PurchaseTransaction {
	id: string;
	device: string;
	date: string;
	type: string;
	amount: number;
	status: string;
	imei: string | null;
	color: string | null;
	ram: string | null;
	storage: string | null;
	condition: string | null;
	batteryHealth: string | null;
	vendor?: {
		id: string;
		name: string;
		shopName: string;
	} | null;
}

interface CustomerDetailWithPurchases {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: string;
	totalOrders: number;
	totalSpent: number;
	totalProfit: number;
	joinedDate: string;
	address: string;
	profileImg: string | null;
	vendor?: {
		id: string;
		name: string;
		email: string;
		profileImg: string | null;
		shopName: string;
	} | null;
	purchases: PurchaseTransaction[];
}

export default function AdminCustomerDetailsPage({ params }: { params?: any }) {
	const router = useRouter();
	const hookParams = useParams();

	let idStr = "";
	if (params) {
		if (typeof params.then === "function" || params instanceof Promise) {
			try {
				const unwrapped = React.use(params) as any;
				idStr = unwrapped?.id || "";
			} catch (_) {
				idStr = (hookParams?.id as string) || "";
			}
		} else {
			idStr = params.id || "";
		}
	} else {
		idStr = (hookParams?.id as string) || "";
	}

	const [customer, setCustomer] = useState<CustomerDetailWithPurchases | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("All");

	const fetchDetails = async () => {
		setLoading(true);
		try {
			const res = await getAdminCustomerByIdAction(idStr);
			if (res.success && res.data && res.data.customer) {
				setCustomer(res.data.customer);
				setError(null);
			} else {
				setError(res.message || "Failed to retrieve customer details.");
			}
		} catch (err) {
			console.error(err);
			setError("An error occurred while loading customer details.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (idStr) {
			fetchDetails();
		}
	}, [idStr]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
				<div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
				<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400">Loading customer profile details...</p>
			</div>
		);
	}

	if (error || !customer) {
		return (
			<div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl p-6 text-center">
				<p className="font-semibold">{error || "Customer profile could not be loaded."}</p>
				<button onClick={() => router.push("/admin/customer")} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-500 transition-all">
					Back to Customers
				</button>
			</div>
		);
	}

	// Filter transactions
	const filteredTransactions = customer.purchases.filter((tx) => {
		const matchSearch =
			tx.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(tx.imei && tx.imei.includes(searchQuery));
		const matchType = typeFilter === "All" || tx.type === typeFilter;
		return matchSearch && matchType;
	});

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* Back Button & Header */}
			<div className="flex items-center gap-4">
				<button
					onClick={() => router.push("/admin/customer")}
					className="p-2.5 rounded-xl bg-white hover:bg-zinc-50 dark:bg-[#13151a] dark:hover:bg-white/5 border border-zinc-200/80 dark:border-white/5 text-zinc-700 dark:text-gray-300 transition-all cursor-pointer shadow-sm"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</button>
				<div>
					<h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Customer Profile</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-0.5">Detailed overview of customer records and transactions.</p>
				</div>
			</div>

			{/* Main Grid: Left Profile Card, Right Stats & Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left: Customer Info Card */}
				<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center self-start">
					{customer.profileImg ? (
						<img src={customer.profileImg} className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/20 shadow-md" alt="" />
					) : (
						<div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg">
							{customer.name.slice(0, 2).toUpperCase()}
						</div>
					)}

					<h2 className="text-xl font-bold text-zinc-950 dark:text-white mt-4">{customer.name}</h2>
					{customer.email && (
						<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{customer.email}</p>
					)}
					<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-2.5 ${
						customer.status === "Active"
							? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
							: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
					}`}>
						{customer.status}
					</span>

					<div className="w-full border-t border-zinc-100 dark:border-white/5 my-6"></div>

					<div className="w-full space-y-4 text-left">
						<div>
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider block">Phone Number</span>
							<p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{customer.phone}</p>
						</div>
						<div>
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider block">Email Address</span>
							<p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{customer.email || "No Email Provided"}</p>
						</div>
						<div>
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider block">Billing Address</span>
							<p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{customer.address || "No Address Provided"}</p>
						</div>
						<div>
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider block">Registered By Vendor</span>
							{customer.vendor ? (
								<div className="flex items-center gap-3 mt-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
									{customer.vendor.profileImg ? (
										<img
											src={customer.vendor.profileImg}
											alt=""
											className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
										/>
									) : (
										<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
											{customer.vendor.name.slice(0, 2).toUpperCase()}
										</div>
									)}
									<div className="overflow-hidden">
										<p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight truncate">{customer.vendor.name}</p>
										<p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium leading-tight truncate mt-0.5">{customer.vendor.shopName}</p>
										<p className="text-[10px] text-zinc-500 dark:text-gray-400 truncate mt-0.5">{customer.vendor.email}</p>
									</div>
								</div>
							) : (
								<p className="text-sm font-semibold text-zinc-500 dark:text-gray-400 mt-0.5">Unknown Vendor</p>
							)}
						</div>
						<div>
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider block">Client Since</span>
							<p className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{customer.joinedDate || "N/A"}</p>
						</div>
					</div>
				</div>

				{/* Right: Metrics & Transaction List */}
				<div className="lg:col-span-2 space-y-8">
					{/* Stat Highlights */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
						<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
							<p className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Total Purchase Value</p>
							<h4 className="text-2xl font-black text-zinc-950 dark:text-white mt-1">₹{customer.totalSpent.toLocaleString()}</h4>
						</div>
						<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
							<p className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Total Orders</p>
							<h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{customer.totalOrders} Purchases</h4>
						</div>
						<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
							<p className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Estimated Profit Contribution</p>
							<h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{customer.totalProfit.toLocaleString()}</h4>
						</div>
					</div>

					{/* Search & Transaction History */}
					<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Transaction & Device History</h3>

							<div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
								<input
									type="text"
									placeholder="Search device, IMEI..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white w-full sm:w-48"
								/>
								<select
									value={typeFilter}
									onChange={(e) => setTypeFilter(e.target.value)}
									className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white cursor-pointer w-full sm:w-32"
								>
									<option value="All">All Types</option>
									<option value="Sale">Sales</option>
									<option value="Purchase">Purchases</option>
									<option value="Exchange">Exchanges</option>
								</select>
							</div>
						</div>

						{/* Transaction Table */}
						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse">
								<thead>
									<tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1c1e24]/30 text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider select-none">
										<th className="px-4 py-3">Date</th>
										<th className="px-4 py-3">Type</th>
										<th className="px-4 py-3">Device & Specs</th>
										<th className="px-4 py-3">Vendor / Shop</th>
										<th className="px-4 py-3">Price</th>
										<th className="px-4 py-3 text-right">Invoice</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-sm">
									{filteredTransactions.length === 0 ? (
										<tr>
											<td className="px-4 py-8 text-center text-zinc-500 dark:text-gray-400" colSpan={6}>
												No transaction records found matching search filters.
											</td>
										</tr>
									) : (
										filteredTransactions.map((tx) => (
											<tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
												<td className="px-4 py-3.5 text-zinc-500 dark:text-gray-400 text-xs whitespace-nowrap">
													{tx.date}
												</td>
												<td className="px-4 py-3.5">
													<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
														tx.type === "Sale"
															? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
															: tx.type === "Purchase"
															? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
															: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
													}`}>
														{tx.type}
													</span>
												</td>
												<td className="px-4 py-3.5">
													<div>
														<p className="font-semibold text-zinc-900 dark:text-white">{tx.device}</p>
														<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
															{tx.color && <span>{tx.color}</span>}
															{tx.storage && <span> • {tx.storage}</span>}
															{tx.ram && <span> • {tx.ram} RAM</span>}
															{tx.imei && <span className="block text-[10px] text-indigo-500 mt-0.5">IMEI: {tx.imei}</span>}
														</p>
													</div>
												</td>
												<td className="px-4 py-3.5 text-zinc-950 dark:text-white">
													{tx.vendor ? (
														<div>
															<p className="font-semibold">{tx.vendor.name}</p>
															<p className="text-xs text-zinc-500 dark:text-gray-400">{tx.vendor.shopName}</p>
														</div>
													) : (
														<span className="text-xs text-zinc-400">N/A</span>
													)}
												</td>
												<td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
													₹{Number(tx.amount).toLocaleString()}
												</td>
												<td className="px-4 py-3.5 text-right">
													<div className="flex items-center justify-end gap-1.5">
														<button
															onClick={() => streamInvoice(tx.id)}
															className="p-1.5 rounded-lg bg-zinc-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-600/15 text-zinc-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200/50 dark:border-white/5 transition-all cursor-pointer"
															title="View Invoice"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
															</svg>
														</button>
														<button
															onClick={() => downloadInvoice(tx.id, tx.device)}
															className="p-1.5 rounded-lg bg-zinc-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-600/15 text-zinc-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200/50 dark:border-white/5 transition-all cursor-pointer"
															title="Download Invoice"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
															</svg>
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
			</div>
		</div>
	);
}
