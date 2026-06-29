"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/ui/Pagination";
import { toast } from "react-hot-toast";
import {
	getAdminCourierOrdersAction,
	cancelAdminCourierOrderAction,
} from "@/actions/admin-courier";

interface CourierOrder {
	id: number;
	seller_id: number;
	buyer_id: number;
	seller_mobile_id: number;
	buyer_mobile_id: number | null;
	amount: number;
	courier_name: string | null;
	tracking_id: string | null;
	status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
	date: string;
	notes: string | null;
	createdAt: string;
	seller: {
		id: number;
		name: string;
		email: string;
		businessDetail?: { shop_name: string; phone: string } | null;
	};
	buyer: {
		id: number;
		name: string;
		email: string;
		businessDetail?: { shop_name: string; phone: string } | null;
	};
	sellerMobile: {
		id: string | number;
		brand: { name: string };
		model: { name: string };
		color: string;
		imei?: string;
		condition: string;
		storage: { value: string };
		ram: { value: string };
	};
}

interface Metrics {
	totalCount: number;
	pendingCount: number;
	shippedCount: number;
	deliveredCount: number;
	cancelledCount: number;
}

export default function AdminCourierPage() {
	const router = useRouter();
	const [orders, setOrders] = useState<CourierOrder[]>([]);
	const [metrics, setMetrics] = useState<Metrics>({
		totalCount: 0,
		pendingCount: 0,
		shippedCount: 0,
		deliveredCount: 0,
		cancelledCount: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	// Filters & Pagination
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [currentPage, setCurrentPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [sortBy, setSortBy] = useState("id");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Selected order for view details modal
	const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);

	// Cancel Modal
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelOrderObj, setCancelOrderObj] = useState<CourierOrder | null>(null);
	const [isCancelling, setIsCancelling] = useState(false);

	const fetchOrders = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await getAdminCourierOrdersAction({
				search: searchQuery,
				status: statusFilter,
				page: currentPage,
				limit,
				sortBy,
				sortOrder,
			});
			if (res.success && res.data) {
				setOrders(res.data.orders || []);
				setTotalCount(res.data.pagination?.totalCount || 0);
				setTotalPages(res.data.pagination?.totalPages || 1);
				if (res.data.metrics) {
					setMetrics(res.data.metrics);
				}
			} else {
				toast.error(res.message || "Failed to load courier shipments.");
			}
		} catch (error) {
			console.error("Error fetching admin courier orders:", error);
			toast.error("An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, statusFilter, currentPage, limit, sortBy, sortOrder]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
		setCurrentPage(1);
	};

	const renderSortIcon = (field: string) => {
		if (sortBy !== field) {
			return (
				<svg className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			);
		}
		return sortOrder === "asc" ? (
			<svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 15l4-4 4 4" />
			</svg>
		) : (
			<svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4 4 4-4" />
			</svg>
		);
	};

	const handleOpenCancel = (order: CourierOrder) => {
		setCancelOrderObj(order);
		setCancelOpen(true);
	};

	const handleCloseCancel = () => {
		setCancelOrderObj(null);
		setCancelOpen(false);
	};

	const handleCancelSubmit = async () => {
		if (!cancelOrderObj) return;
		setIsCancelling(true);
		try {
			const res = await cancelAdminCourierOrderAction(cancelOrderObj.id);
			if (res.success) {
				toast.success("Order cancelled successfully.");
				handleCloseCancel();
				fetchOrders();
			} else {
				toast.error(res.message || "Failed to cancel order.");
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to cancel courier order.");
		} finally {
			setIsCancelling(false);
		}
	};

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case "Pending":
				return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30";
			case "Shipped":
				return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30";
			case "Delivered":
				return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30";
			case "Cancelled":
				return "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800/30";
			default:
				return "bg-zinc-50 text-zinc-700 dark:bg-zinc-900/20 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/30";
		}
	};

	return (
		<div className="space-y-8 animate-fadeIn pb-12">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
						<span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
						</span>
						Courier Shipments
					</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1 ml-11">
						Monitor all V2V courier shipments, tracking details, and transactional history.
					</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-5 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</p>
					<h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
						{isLoading ? "..." : metrics.totalCount}
					</h3>
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-5 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Pending</p>
					<h3 className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
						{isLoading ? "..." : metrics.pendingCount}
					</h3>
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-5 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Shipped</p>
					<h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
						{isLoading ? "..." : metrics.shippedCount}
					</h3>
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-5 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Delivered</p>
					<h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
						{isLoading ? "..." : metrics.deliveredCount}
					</h3>
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-5 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Cancelled</p>
					<h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
						{isLoading ? "..." : metrics.cancelledCount}
					</h3>
				</div>
			</div>

			{/* Filters Bar */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-[#13151a] p-4 rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm">
				<div className="relative w-full sm:max-w-xs">
					<span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400 dark:text-gray-500">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>
					<input
						type="text"
						placeholder="Search by vendor, courier name, tracking..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="pl-10 w-full rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-[#0d0e12] px-4 py-2.5 text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
					/>
				</div>

				<div className="flex items-center gap-3 w-full sm:w-auto">
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full sm:w-40 rounded-xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-[#0d0e12] px-4 py-2.5 text-sm text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
					>
						<option value="All">All Statuses</option>
						<option value="Pending">Pending</option>
						<option value="Shipped">Shipped</option>
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
				</div>
			</div>

			{/* Main Content Table */}
			<div className="bg-white dark:bg-[#13151a] rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
									Order Info
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
									Seller (V1)
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
									Buyer (V2)
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
									Device details
								</th>
								<th
									className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group"
									onClick={() => handleSort("amount")}
								>
									<div className="flex items-center gap-1.5">
										Amount
										{renderSortIcon("amount")}
									</div>
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider text-right">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-200/80 dark:divide-white/5">
							{isLoading ? (
								<tr>
									<td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-gray-400">
										<div className="flex flex-col items-center justify-center gap-3">
											<svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
											</svg>
											<span className="text-sm font-medium">Loading shipments...</span>
										</div>
									</td>
								</tr>
							) : orders.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-gray-400">
										<div className="flex flex-col items-center justify-center gap-2">
											<svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
											</svg>
											<p className="text-sm font-semibold">No shipments found</p>
											<p className="text-xs text-zinc-400">Try adjusting your filters or search query.</p>
										</div>
									</td>
								</tr>
							) : (
								orders.map((order) => (
									<tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
										<td className="px-6 py-4">
											<div className="text-sm font-bold text-zinc-900 dark:text-white">Order #{order.id}</div>
											<div className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{order.date}</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm font-semibold text-zinc-900 dark:text-white">
												{order.seller.businessDetail?.shop_name || order.seller.name}
											</div>
											<div className="text-xs text-zinc-500 dark:text-gray-400">
												ID: {order.seller_id}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm font-semibold text-zinc-900 dark:text-white">
												{order.buyer.businessDetail?.shop_name || order.buyer.name}
											</div>
											<div className="text-xs text-zinc-500 dark:text-gray-400">
												ID: {order.buyer_id}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm font-medium text-zinc-900 dark:text-white">
												{order.sellerMobile?.brand?.name} {order.sellerMobile?.model?.name}
											</div>
											<div className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
												{order.sellerMobile?.storage?.value} / {order.sellerMobile?.ram?.value} / {order.sellerMobile?.color}
											</div>
											{order.sellerMobile?.imei && (
												<div className="text-[10px] font-mono text-zinc-400 mt-0.5">
													IMEI: {order.sellerMobile.imei}
												</div>
											)}
										</td>
										<td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">
											₹{order.amount.toLocaleString()}
										</td>
										<td className="px-6 py-4">
											<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
												<span className="w-1.5 h-1.5 rounded-full bg-current" />
												{order.status}
											</span>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => setSelectedOrder(order)}
													className="rounded-lg text-xs"
												>
													Details
												</Button>
												{(order.status === "Pending" || order.status === "Shipped") && (
													<Button
														variant="danger"
														size="sm"
														onClick={() => handleOpenCancel(order)}
														className="rounded-lg text-xs"
													>
														Cancel
													</Button>
												)}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{!isLoading && totalPages > 1 && (
					<div className="px-6 py-4 border-t border-zinc-200/80 dark:border-white/5">
						<PaginationComponent
							page={currentPage}
							total={totalCount}
							limit={limit}
							onPageChange={(page) => setCurrentPage(page)}
							onLimitChange={(l) => setLimit(l)}
						/>
					</div>
				)}
			</div>

			{/* Details Modal */}
			<Modal
				isOpen={!!selectedOrder}
				onClose={() => setSelectedOrder(null)}
				title="Courier Shipment Details"
				size="lg"
			>
				{selectedOrder && (
					<div className="space-y-6">
						<div className="flex justify-between items-start border-b border-zinc-100 dark:border-white/5 pb-4">
							<div>
								<h3 className="text-lg font-bold text-zinc-900 dark:text-white">Order #{selectedOrder.id}</h3>
								<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">Created on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : selectedOrder.date}</p>
							</div>
							<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(selectedOrder.status)}`}>
								<span className="w-1.5 h-1.5 rounded-full bg-current" />
								{selectedOrder.status}
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Seller details */}
							<div className="space-y-2.5 p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5">
								<h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Seller Vendor</h4>
								<div>
									<p className="text-sm font-bold text-zinc-900 dark:text-white">
										{selectedOrder.seller.businessDetail?.shop_name || "N/A"}
									</p>
									<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{selectedOrder.seller.name}</p>
									<p className="text-xs text-zinc-500 dark:text-gray-400">{selectedOrder.seller.email}</p>
									{selectedOrder.seller.businessDetail?.phone && (
										<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">📞 {selectedOrder.seller.businessDetail.phone}</p>
									)}
								</div>
							</div>

							{/* Buyer details */}
							<div className="space-y-2.5 p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5">
								<h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Buyer Vendor</h4>
								<div>
									<p className="text-sm font-bold text-zinc-900 dark:text-white">
										{selectedOrder.buyer.businessDetail?.shop_name || "N/A"}
									</p>
									<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{selectedOrder.buyer.name}</p>
									<p className="text-xs text-zinc-500 dark:text-gray-400">{selectedOrder.buyer.email}</p>
									{selectedOrder.buyer.businessDetail?.phone && (
										<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">📞 {selectedOrder.buyer.businessDetail.phone}</p>
									)}
								</div>
							</div>
						</div>

						{/* Device details */}
						<div className="space-y-3">
							<h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Device & Pricing</h4>
							<div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 space-y-3">
								<div className="flex justify-between items-center">
									<div>
										<p className="text-sm font-bold text-zinc-900 dark:text-white">
											{selectedOrder.sellerMobile?.brand?.name} {selectedOrder.sellerMobile?.model?.name}
										</p>
										<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
											{selectedOrder.sellerMobile?.storage?.value} / {selectedOrder.sellerMobile?.ram?.value} / {selectedOrder.sellerMobile?.color}
										</p>
									</div>
									<p className="text-lg font-extrabold text-zinc-900 dark:text-white">
										₹{selectedOrder.amount.toLocaleString()}
									</p>
								</div>
								<div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-100 dark:border-white/5">
									<div>
										<span className="text-zinc-400">Condition:</span> <span className="font-semibold text-zinc-700 dark:text-gray-300">{selectedOrder.sellerMobile?.condition}</span>
									</div>
									<div>
										<span className="text-zinc-400">IMEI:</span> <span className="font-mono font-semibold text-zinc-700 dark:text-gray-300">{selectedOrder.sellerMobile?.imei || "N/A"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Shipping status */}
						<div className="space-y-3">
							<h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Courier Information</h4>
							<div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 space-y-2">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-xs text-zinc-400">Courier Partner</p>
										<p className="font-semibold text-zinc-900 dark:text-white mt-0.5">
											{selectedOrder.courier_name || "Not Shipped Yet"}
										</p>
									</div>
									<div>
										<p className="text-xs text-zinc-400">Tracking ID</p>
										<p className="font-mono font-semibold text-zinc-900 dark:text-white mt-0.5">
											{selectedOrder.tracking_id || "N/A"}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Notes */}
						{selectedOrder.notes && (
							<div className="space-y-2">
								<h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Order Notes</h4>
								<p className="text-sm text-zinc-600 dark:text-gray-300 bg-zinc-50 dark:bg-white/[0.01] p-3 rounded-lg border border-zinc-100 dark:border-white/5">
									{selectedOrder.notes}
								</p>
							</div>
						)}

						<div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-white/5">
							<Button onClick={() => setSelectedOrder(null)} className="rounded-xl px-6">
								Close
							</Button>
						</div>
					</div>
				)}
			</Modal>

			{/* Cancel Confirmation Modal */}
			<Modal
				isOpen={cancelOpen}
				onClose={handleCloseCancel}
				title="Cancel Courier Order"
			>
				<div className="space-y-4">
					<p className="text-sm text-zinc-600 dark:text-gray-300">
						Are you sure you want to cancel Courier Order <span className="font-bold text-zinc-900 dark:text-white">#{cancelOrderObj?.id}</span>?
					</p>
					<p className="text-xs text-rose-500 dark:text-rose-400 font-semibold bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
						⚠️ This action will revert the Seller's mobile listing status to "Available" and the Buyer's pending listing to "Cancelled". This process cannot be undone.
					</p>
					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
						<Button
							variant="outline"
							onClick={handleCloseCancel}
							disabled={isCancelling}
							className="rounded-xl"
						>
							Go Back
						</Button>
						<Button
							variant="danger"
							onClick={handleCancelSubmit}
							isLoading={isCancelling}
							className="rounded-xl"
						>
							Yes, Cancel Order
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
