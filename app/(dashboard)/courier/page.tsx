"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";
import { useDashboard } from "@/context/vendor/dashboard-context";
import {
	getCourierOrdersAction,
	shipCourierOrderAction,
	receiveCourierOrderAction,
	cancelCourierOrderAction,
} from "@/actions/courier";
import { showConfirm } from "@/utils/confirm";

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
	seller: { id: number; name: string };
	buyer: { id: number; name: string };
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

export default function CourierOrdersPage() {
	const { vendor } = useDashboard();
	const [orders, setOrders] = useState<CourierOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"sales" | "purchases">("sales");

	// Shipping modal states
	const [shippingOrder, setShippingOrder] = useState<CourierOrder | null>(null);
	const [courierName, setCourierName] = useState("");
	const [trackingId, setTrackingId] = useState("");
	const [isShippingSubmitting, setIsShippingSubmitting] = useState(false);

	const fetchOrders = async () => {
		setIsLoading(true);
		try {
			const res = await getCourierOrdersAction();
			if (res.success && res.data) {
				setOrders(res.data.orders || []);
			} else {
				toast.error(res.message || "Failed to load courier orders.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (vendor) {
			fetchOrders();
		}
	}, [vendor]);

	const handleShipSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!shippingOrder) return;
		if (!courierName.trim() || !trackingId.trim()) {
			toast.error("Please fill in all courier details.");
			return;
		}

		setIsShippingSubmitting(true);
		try {
			const res = await shipCourierOrderAction(shippingOrder.id, {
				courier_name: courierName.trim(),
				tracking_id: trackingId.trim(),
			});

			if (res.success) {
				toast.success("Order marked as shipped!");
				setShippingOrder(null);
				setCourierName("");
				setTrackingId("");
				fetchOrders();
			} else {
				toast.error(res.message || "Failed to update shipping details.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while updating shipment.");
		} finally {
			setIsShippingSubmitting(false);
		}
	};

	const handleReceiveOrder = (orderId: number) => {
		showConfirm(async () => {
			try {
				const res = await receiveCourierOrderAction(orderId);
				if (res.success) {
					toast.success("Delivery confirmed! Device added to your inventory.");
					fetchOrders();
				} else {
					toast.error(res.message || "Failed to confirm receipt.");
				}
			} catch (error) {
				console.error(error);
				toast.error("An error occurred.");
			}
		}, {
			title: "Confirm Receipt",
			message: "Are you sure you have received this device? This will add the device to your active inventory and record transaction records.",
			okButtonText: "Confirm",
		});
	};

	const handleCancelOrder = (orderId: number) => {
		showConfirm(async () => {
			try {
				const res = await cancelCourierOrderAction(orderId);
				if (res.success) {
					toast.success("Order cancelled successfully.");
					fetchOrders();
				} else {
					toast.error(res.message || "Failed to cancel order.");
				}
			} catch (error) {
				console.error(error);
				toast.error("An error occurred.");
			}
		}, {
			title: "Cancel Order",
			message: "Are you sure you want to cancel this order? This will make the seller's device available again.",
			okButtonText: "Cancel Order",
			isDestructive: true,
		});
	};

	const filteredOrders = orders.filter((o) => {
		if (!vendor) return false;
		if (activeTab === "sales") {
			return Number(o.seller_id) === Number(vendor.id);
		} else {
			return Number(o.buyer_id) === Number(vendor.id);
		}
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "Pending":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
						Pending Dispatch
					</span>
				);
			case "Shipped":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse">
						In Transit
					</span>
				);
			case "Delivered":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
						Completed
					</span>
				);
			case "Cancelled":
				return (
					<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
						Cancelled
					</span>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-8 pb-12">
			{/* Top Hero Section */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-primary/10 via-zinc-100/5 to-transparent p-6 rounded-3xl border border-primary/20">
				<div>
					<h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
						<svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
						</svg>
						Courier Shipments
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
						Manage and track direct courier transactions between vendors. Keep track of shipped devices and confirm receipt safely.
					</p>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
				<button
					onClick={() => setActiveTab("sales")}
					className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-all ${
						activeTab === "sales"
							? "border-b-2 border-primary text-primary"
							: "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
					}`}
				>
					Sales (Sent/To Send)
				</button>
				<button
					onClick={() => setActiveTab("purchases")}
					className={`pb-3 text-sm font-extrabold uppercase tracking-widest transition-all ${
						activeTab === "purchases"
							? "border-b-2 border-primary text-primary"
							: "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
					}`}
				>
					Purchases (Incoming)
				</button>
			</div>

			{/* Loading view */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
				</div>
			) : filteredOrders.length === 0 ? (
				<div className="text-center py-16 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80">
					<svg className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
					<h3 className="text-zinc-900 dark:text-zinc-100 font-bold">No orders found</h3>
					<p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">You do not have any courier {activeTab === "sales" ? "sales" : "purchases"} recorded yet.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredOrders.map((order) => (
						<div
							key={order.id}
							className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
						>
							<div className="space-y-4">
								<div className="flex items-start justify-between">
									<div>
										<span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
											Order #{order.id}
										</span>
										<span className="text-xs text-zinc-500">{order.date}</span>
									</div>
									{getStatusBadge(order.status)}
								</div>

								{/* Mobile Spec Info */}
								<div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
									<h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
										{order.sellerMobile ? `${order.sellerMobile.brand?.name || ""} ${order.sellerMobile.model?.name || ""}` : "Unknown Device"}
									</h4>
									<div className="text-xs text-zinc-500 space-y-1 mt-2">
										<p>Specs: {order.sellerMobile?.storage?.value || "N/A"} / {order.sellerMobile?.ram?.value || "N/A"} | {order.sellerMobile?.color}</p>
										<p>Condition: <span className="font-bold text-primary">{order.sellerMobile?.condition}</span></p>
										{order.sellerMobile?.imei && <p className="font-mono mt-1 bg-zinc-200/50 dark:bg-zinc-800/80 px-2 py-0.5 rounded w-fit">IMEI: {order.sellerMobile.imei}</p>}
									</div>
								</div>

								{/* Partner details */}
								<div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
									<p>
										<span className="font-bold">{activeTab === "sales" ? "Buyer:" : "Seller:"}</span>{" "}
										{activeTab === "sales" ? order.buyer.name : order.seller.name}
									</p>
									<p>
										<span className="font-bold">Deal Price:</span> ₹{order.amount.toLocaleString()}
									</p>
									{order.notes && (
										<p className="italic text-zinc-400 dark:text-zinc-500 mt-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
											"{order.notes}"
										</p>
									)}
								</div>

								{/* Shipment Details */}
								{(order.courier_name || order.tracking_id) && (
									<div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-2xl border border-blue-100/30 dark:border-blue-900/30 text-xs">
										<span className="font-bold uppercase tracking-wider text-[10px] text-blue-500 block mb-1">
											Shipping Details
										</span>
										<p className="text-zinc-700 dark:text-zinc-300">Courier: <span className="font-semibold">{order.courier_name}</span></p>
										<p className="text-zinc-700 dark:text-zinc-300 mt-0.5">Tracking ID: <span className="font-mono font-bold select-all bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900">{order.tracking_id}</span></p>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className="flex flex-col gap-2 mt-6">
								{activeTab === "sales" && order.status === "Pending" && (
									<Button
										onClick={() => setShippingOrder(order)}
										className="w-full text-xs font-bold py-2.5 rounded-xl"
									>
										Ship Device
									</Button>
								)}

								{activeTab === "purchases" && order.status === "Shipped" && (
									<Button
										onClick={() => handleReceiveOrder(order.id)}
										className="w-full text-xs font-bold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none"
									>
										Mark as Received
									</Button>
								)}

								{(order.status === "Pending" || order.status === "Shipped") && (
									<Button
										onClick={() => handleCancelOrder(order.id)}
										variant="outline"
										className="w-full text-xs font-bold py-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200 dark:border-red-900/30 dark:hover:bg-red-950/20"
									>
										Cancel Order
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Shipping Modal */}
			{shippingOrder && (
				<Modal isOpen={true} onClose={() => setShippingOrder(null)} title="Dispatch / Ship Order">
					<form onSubmit={handleShipSubmit} className="space-y-4 pt-4">
						<p className="text-xs text-zinc-500">
							Add shipment details for <b>{shippingOrder.sellerMobile?.brand?.name || ""} {shippingOrder.sellerMobile?.model?.name || ""}</b> being sent to <b>{shippingOrder.buyer?.name || ""}</b>.
						</p>
						<div className="space-y-1">
							<label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
								Courier / Logistics Company Name *
							</label>
							<input
								type="text"
								required
								value={courierName}
								onChange={(e) => setCourierName(e.target.value)}
								placeholder="e.g. BlueDart, DTDC, Delhivery"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>

						<div className="space-y-1">
							<label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
								Tracking ID / AWB Number *
							</label>
							<input
								type="text"
								required
								value={trackingId}
								onChange={(e) => setTrackingId(e.target.value)}
								placeholder="e.g. AWB123456789"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>

						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" type="button" onClick={() => setShippingOrder(null)}>
								Cancel
							</Button>
							<Button type="submit" disabled={isShippingSubmitting}>
								{isShippingSubmitting ? "Updating..." : "Ship & Dispatch"}
							</Button>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
}
