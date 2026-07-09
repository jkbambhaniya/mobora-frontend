"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";
import {
	getAdminMobileDetailByImeiAction,
	updateAdminMobileStatusAction,
	deleteAdminMobileAction
} from "@/actions/admin-mobiles";

interface Transaction {
	id: number;
	type: "Purchase" | "Sale" | "Buyback" | string;
	amount: number;
	created_at: string;
	customer?: {
		name: string;
		phone: string;
		email?: string;
	} | null;
	vendor?: {
		name: string;
	} | null;
}

interface Repair {
	id: number;
	customer_name: string;
	device_name: string;
	problem_description: string;
	estimated_cost: number;
	status: string;
	created_at: string;
}

interface MobileDetail {
	id: string;
	stockId: string;
	brand: string;
	brandId: number;
	model: string;
	modelId: number;
	storage: string;
	storageId: number;
	ram: string;
	ramId: number;
	color: string;
	imei?: string;
	condition: "NEW" | "OLD";
	price: number;
	purchasePrice?: number;
	repairingCost: number;
	batteryHealth?: number;
	status: string;
	description: string;
	createdAt: string;
	vendorDetails: {
		id: number;
		name: string;
		email: string;
		shopName: string;
		phone: string;
		address: string;
	} | null;
	transactions: Transaction[];
	repairs: Repair[];
}

export default function AdminMobileStockImeiDetailPage({ params }: { params: Promise<{ brand: string; model: string; imei: string }> }) {
	const router = useRouter();
	const resolvedParams = use(params);
	const { brand: brandSlug, model: modelSlug, imei } = resolvedParams;

	const [mobile, setMobile] = useState<MobileDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	// Form edit states
	const [editStatus, setEditStatus] = useState("");
	const [editRepairingCost, setEditRepairingCost] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchDetail = async () => {
		setIsLoading(true);
		try {
			const res = await getAdminMobileDetailByImeiAction(imei);
			if (res.success && res.data && res.data.success) {
				const data = res.data.mobile;
				setMobile(data);
				setEditStatus(data.status);
				setEditRepairingCost(data.repairingCost.toString());
			} else {
				toast.error(res.message || "Failed to load device details.");
				router.push(`/admin/mobiles/${brandSlug}/${modelSlug}`);
			}
		} catch (error) {
			console.error("Error fetching detail by imei:", error);
			toast.error("An error occurred loading device details.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDetail();
	}, [imei]);

	const handleSaveChanges = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!mobile) return;
		setIsSaving(true);
		try {
			const res = await updateAdminMobileStatusAction(mobile.stockId, {
				status: editStatus,
				repairingCost: Number(editRepairingCost) || 0
			});
			if (res.success && res.data && res.data.success) {
				toast.success("Stock details updated successfully.");
				fetchDetail();
			} else {
				toast.error(res.message || "Failed to update details.");
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to save changes.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteStock = async () => {
		if (!mobile) return;
		if (!confirm("Are you absolutely sure you want to delete this stock entry? This cannot be undone.")) return;
		setIsDeleting(true);
		try {
			const res = await deleteAdminMobileAction(mobile.stockId);
			if (res.success) {
				toast.success("Mobile device removed from stock.");
				router.push(`/admin/mobiles/${brandSlug}/${modelSlug}`);
			} else {
				toast.error(res.message || "Failed to delete device.");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("An error occurred during deletion.");
		} finally {
			setIsDeleting(false);
		}
	};

	const getStatusColor = (status: string) => {
		const s = status.toLowerCase();
		if (s === "available") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
		if (s === "sold") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
		if (s === "review") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
		if (s === "transit") return "bg-violet-500/10 text-violet-500 border-violet-500/20";
		return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
	};

	if (isLoading) {
		return (
			<div className="flex-1 bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-8">
				<svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
					<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<p className="text-sm text-zinc-500 dark:text-gray-400">Loading mobile details...</p>
			</div>
		);
	}

	if (!mobile) {
		return (
			<div className="flex-1 bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-8">
				<p className="text-sm text-zinc-500 dark:text-gray-400">Device details not found.</p>
				<Button onClick={() => router.push(`/admin/mobiles/${brandSlug}/${modelSlug}`)} className="mt-4">
					Go back to Configuration
				</Button>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#0d0e12] p-8 space-y-8 animate-fadeIn">
			{/* Top Bar */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/5 pb-6">
				<div>
					<span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 block mb-1">
						History & Transaction Logs
					</span>
					<h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
						IMEI: {mobile.imei}
					</h1>
					<button
						onClick={() => router.push(`/admin/mobiles/${brandSlug}/${modelSlug}`)}
						className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 mt-3"
					>
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Back to Configuration
					</button>
				</div>
				<div className="text-right">
					<span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block mb-1">
						Dealer Shop
					</span>
					<h2 className="text-xl font-bold text-zinc-800 dark:text-white">
						{mobile.vendorDetails?.shopName || "Unknown Dealer"}
					</h2>
				</div>
			</div>

			{/* Main Grid split: Left (Form/Details), Right (Logs) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Device Info & Management Form */}
				<div className="lg:col-span-1 space-y-6">
					{/* Specs details card */}
					<div className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm space-y-4">
						<h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">
							Device Details
						</h3>
						<div className="space-y-3.5 text-sm">
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Model Configuration:</span>
								<span className="font-bold text-zinc-800 dark:text-zinc-200">
									{mobile.brand} {mobile.model}
								</span>
							</div>
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Specs:</span>
								<span className="font-semibold text-zinc-800 dark:text-zinc-200">
									{mobile.storage} • {mobile.ram} RAM
								</span>
							</div>
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Color:</span>
								<span className="font-semibold text-zinc-800 dark:text-zinc-200">
									{mobile.color}
								</span>
							</div>
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Battery Health:</span>
								<span className="font-bold text-zinc-800 dark:text-zinc-200">
									{mobile.batteryHealth ? `${mobile.batteryHealth}%` : "N/A"}
								</span>
							</div>
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Registered Date:</span>
								<span className="font-medium text-zinc-600 dark:text-zinc-400">
									{formatDate(mobile.createdAt)}
								</span>
							</div>
							<div className="flex justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
								<span className="text-zinc-500">Target Selling Price:</span>
								<span className="font-extrabold text-indigo-500">
									₹{mobile.price.toLocaleString("en-IN")}
								</span>
							</div>
							<div className="flex justify-between pb-1">
								<span className="text-zinc-500">Original Cost:</span>
								<span className="font-bold text-zinc-800 dark:text-zinc-200">
									₹{(mobile.purchasePrice || 0).toLocaleString("en-IN")}
								</span>
							</div>
							{mobile.description && (
								<div className="pt-2 border-t border-zinc-100 dark:border-white/5">
									<span className="text-zinc-500 block mb-1">Notes/Description:</span>
									<p className="text-xs text-zinc-600 dark:text-gray-400 bg-zinc-50 dark:bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
										{mobile.description}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Edit Status Form */}
					<form onSubmit={handleSaveChanges} className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm space-y-4">
						<h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">
							Update Status
						</h3>

						<div className="space-y-4">
							<div>
								<label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">
									Stock Status
								</label>
								<select
									value={editStatus}
									onChange={(e) => setEditStatus(e.target.value)}
									className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
								>
									<option value="Available">Available</option>
									<option value="Sold">Sold</option>
									<option value="Review">Review</option>
									<option value="Transit">Transit</option>
									<option value="Pending">Pending</option>
									<option value="Shipped">Shipped</option>
									<option value="Cancelled">Cancelled</option>
								</select>
							</div>

							<div>
								<label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">
									Repairing Cost (₹)
								</label>
								<input
									type="number"
									value={editRepairingCost}
									onChange={(e) => setEditRepairingCost(e.target.value)}
									placeholder="Enter repairing cost"
									className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div className="pt-2 flex gap-3">
								<Button
									type="submit"
									disabled={isSaving}
									className="flex-1 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
								>
									{isSaving ? "Saving..." : "Save Changes"}
								</Button>
								<Button
									type="button"
									onClick={handleDeleteStock}
									disabled={isDeleting}
									variant="danger"
									className="py-2.5 px-4 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
								>
									{isDeleting ? "Deleting..." : "Delete Record"}
								</Button>
							</div>
						</div>
					</form>

					{/* Vendor info card */}
					{mobile.vendorDetails && (
						<div className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm space-y-4">
							<h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-400">
								Owner/Dealer Info
							</h3>
							<div className="space-y-2.5 text-xs">
								<div>
									<span className="text-zinc-400 block">Shop:</span>
									<span className="font-bold text-sm text-zinc-800 dark:text-white">
										{mobile.vendorDetails.shopName}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">Contact Name:</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{mobile.vendorDetails.name}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">Email:</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{mobile.vendorDetails.email}
									</span>
								</div>
								{mobile.vendorDetails.phone && (
									<div>
										<span className="text-zinc-400 block">Phone:</span>
										<span className="font-semibold text-zinc-700 dark:text-zinc-300">
											{mobile.vendorDetails.phone}
										</span>
									</div>
								)}
								{mobile.vendorDetails.address && (
									<div>
										<span className="text-zinc-400 block">Address:</span>
										<span className="font-semibold text-zinc-700 dark:text-zinc-300">
											{mobile.vendorDetails.address}
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Transactions and Repair Logs */}
				<div className="lg:col-span-2 space-y-8">
					{/* Transactions Log */}
					<div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm p-6 space-y-4">
						<h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
							Transaction Logs
						</h3>

						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse text-xs">
								<thead>
									<tr className="border-b border-zinc-200 dark:border-white/5 text-zinc-400 uppercase tracking-wider font-semibold">
										<th className="pb-3">Type</th>
										<th className="pb-3">Partner</th>
										<th className="pb-3 text-right">Amount</th>
										<th className="pb-3 text-right">Date</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
									{mobile.transactions.length === 0 ? (
										<tr>
											<td colSpan={4} className="text-center py-6 text-zinc-400">
												No transaction records registered for this IMEI.
											</td>
										</tr>
									) : (
										mobile.transactions.map((tx) => (
											<tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5">
												<td className="py-3 font-semibold text-zinc-800 dark:text-zinc-200">
													<span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
														tx.type === "Purchase"
															? "bg-emerald-500/10 text-emerald-500"
															: tx.type === "Sale"
															? "bg-indigo-500/10 text-indigo-500"
															: "bg-orange-500/10 text-orange-500"
													}`}>
														{tx.type}
													</span>
												</td>
												<td className="py-3 text-zinc-600 dark:text-zinc-300">
													{tx.type === "Purchase"
														? (tx.vendor?.name || "Dealer Partner")
														: (tx.customer?.name ? `${tx.customer.name} (${tx.customer.phone})` : "B2C Customer")}
												</td>
												<td className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
													₹{tx.amount.toLocaleString("en-IN")}
												</td>
												<td className="py-3 text-right text-zinc-500">
													{formatDate(tx.created_at)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Repair Logs */}
					<div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl shadow-sm p-6 space-y-4">
						<h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
							Associated Repairs History
						</h3>

						<div className="overflow-x-auto">
							<table className="w-full text-left border-collapse text-xs">
								<thead>
									<tr className="border-b border-zinc-200 dark:border-white/5 text-zinc-400 uppercase tracking-wider font-semibold">
										<th className="pb-3">Client</th>
										<th className="pb-3">Issue/Problem</th>
										<th className="pb-3 text-right">Cost</th>
										<th className="pb-3 text-center">Status</th>
										<th className="pb-3 text-right">Registered</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-zinc-200/50 dark:divide-white/5">
									{mobile.repairs.length === 0 ? (
										<tr>
											<td colSpan={5} className="text-center py-6 text-zinc-400">
												No associated repair tickets found for this model.
											</td>
										</tr>
									) : (
										mobile.repairs.map((rp) => (
											<tr key={rp.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5">
												<td className="py-3 font-semibold text-zinc-800 dark:text-zinc-200">
													{rp.customer_name}
												</td>
												<td className="py-3 text-zinc-600 dark:text-zinc-350 max-w-[200px] truncate" title={rp.problem_description}>
													{rp.problem_description}
												</td>
												<td className="py-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
													₹{rp.estimated_cost.toLocaleString("en-IN")}
												</td>
												<td className="py-3 text-center">
													<span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
														rp.status === "Delivered" || rp.status === "Repaired"
															? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
															: rp.status === "Cancelled"
															? "bg-red-500/10 text-red-500 border border-red-500/20"
															: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
													}`}>
														{rp.status}
													</span>
												</td>
												<td className="py-3 text-right text-zinc-500">
													{formatDate(rp.created_at)}
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
