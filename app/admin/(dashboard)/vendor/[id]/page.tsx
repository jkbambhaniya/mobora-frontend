"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminVendorByIdAction } from "@/actions/admin-auth";
import { useAdminDashboard, VendorDetail } from "@/context/admin/dashboard-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";


export default function VendorDetailsPage({ params }: { params?: any }) {
	const router = useRouter();
	const hookParams = useParams();
	
	// Unpack params from props or hook, supporting both sync/async params
	let idStr = "";
	if (params) {
		// If params is a Promise (Next.js 15+ async params)
		if (typeof params.then === "function" || params instanceof Promise) {
			try {
				const unwrapped = React.use(params) as any;
				idStr = unwrapped?.id || "";
			} catch (_) {
				// Fallback to hook if unwrapping fails synchronously
				idStr = (hookParams?.id as string) || "";
			}
		} else {
			idStr = params.id || "";
		}
	} else {
		idStr = (hookParams?.id as string) || "";
	}

	const vendorId = Number(idStr);

	const {
		updateVendorStatus,
		updateVendorDetails,
		deleteVendor,
	} = useAdminDashboard();

	const [vendor, setVendor] = useState<VendorDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Tabs state
	const [activeTab, setActiveTab] = useState<"overview" | "models" | "inventory" | "transactions" | "repairs">("overview");

	// Search states
	const [searchModel, setSearchModel] = useState("");
	const [searchMobile, setSearchMobile] = useState("");
	const [searchTx, setSearchTx] = useState("");
	const [searchRepair, setSearchRepair] = useState("");

	// Filters states
	const [statusFilterMobile, setStatusFilterMobile] = useState<string>("All");
	const [conditionFilterMobile, setConditionFilterMobile] = useState<string>("All");
	const [typeFilterTx, setTypeFilterTx] = useState<string>("All");
	const [statusFilterRepair, setStatusFilterRepair] = useState<string>("All");

	// Confirmation Modal state for status toggles / approvals
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [targetStatus, setTargetStatus] = useState<"pending" | "active" | "inactive" | null>(null);

	// Edit Modal state
	const [editOpen, setEditOpen] = useState(false);
	const [editName, setEditName] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editShopName, setEditShopName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editAddress, setEditAddress] = useState("");
	const [editProfileImg, setEditProfileImg] = useState("");

	// Delete Modal state
	const [deleteOpen, setDeleteOpen] = useState(false);

	const fetchVendorDetails = async () => {
		setLoading(true);
		console.log("[VendorDetails] fetchVendorDetails started. idStr:", idStr, "vendorId:", vendorId);
		try {
			const res = await getAdminVendorByIdAction(vendorId);
			console.log("[VendorDetails] getAdminVendorByIdAction response:", res);
			if (res.success && res.data && res.data.success) {
				setVendor(res.data.vendor);
				setError(null);
			} else {
				setError(res.message || "Failed to retrieve vendor details.");
			}
		} catch (err) {
			console.error("[VendorDetails] Fetch error:", err);
			setError("An error occurred while loading vendor details.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (vendorId) {
			fetchVendorDetails();
		}
	}, [vendorId]);

	const handleStatusToggle = () => {
		if (!vendor) return;
		const nextStatus = vendor.status === "active" ? "inactive" : "active";
		setTargetStatus(nextStatus);
		setConfirmOpen(true);
	};

	const handleOpenConfirm = (status: "pending" | "active" | "inactive") => {
		setTargetStatus(status);
		setConfirmOpen(true);
	};

	const handleCloseConfirm = () => {
		setTargetStatus(null);
		setConfirmOpen(false);
	};

	const handleStatusChangeSubmit = async () => {
		if (!vendor || !targetStatus) return;
		setActionLoading(true);
		try {
			const success = await updateVendorStatus(vendor.id, targetStatus);
			if (success) {
				setVendor({ ...vendor, status: targetStatus });
				handleCloseConfirm();
			}
		} finally {
			setActionLoading(false);
		}
	};

	const handleOpenEdit = () => {
		if (!vendor) return;
		setEditName(vendor.name || "");
		setEditEmail(vendor.email || "");
		setEditShopName(vendor.businessDetail?.shop_name || "");
		setEditPhone(vendor.businessDetail?.phone || "");
		setEditAddress(vendor.businessDetail?.address || "");
		setEditProfileImg(vendor.profile_img || "");
		setEditOpen(true);
	};

	const handleCloseEdit = () => {
		setEditProfileImg("");
		setEditOpen(false);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!vendor) return;
		setActionLoading(true);
		try {
			const success = await updateVendorDetails(vendor.id, {
				name: editName,
				email: editEmail,
				shop_name: editShopName,
				phone: editPhone,
				address: editAddress,
				profile_img: editProfileImg,
			});
			if (success) {
				setVendor({
					...vendor,
					name: editName,
					email: editEmail,
					profile_img: editProfileImg,
					businessDetail: {
						...vendor.businessDetail,
						shop_name: editShopName,
						phone: editPhone,
						address: editAddress,
						payment_methods: vendor.businessDetail?.payment_methods || "",
						gst_enabled: vendor.businessDetail?.gst_enabled ?? true,
						gst_rate: vendor.businessDetail?.gst_rate ?? 18,
					}
				});
				handleCloseEdit();
			}
		} finally {
			setActionLoading(false);
		}
	};

	const handleOpenDelete = () => {
		setDeleteOpen(true);
	};

	const handleCloseDelete = () => {
		setDeleteOpen(false);
	};

	const handleDeleteSubmit = async () => {
		if (!vendor) return;
		setActionLoading(true);
		try {
			const success = await deleteVendor(vendor.id);
			if (success) {
				router.push("/admin/vendor");
			}
		} finally {
			setActionLoading(false);
		}
	};

	const getModalTitleAndDescription = () => {
		if (!vendor || !targetStatus) return { title: "", desc: "", theme: "indigo", confirmText: "Confirm" };

		if (vendor.status === "pending") {
			if (targetStatus === "active") {
				return {
					title: "Approve Vendor Registration",
					desc: `Are you sure you want to approve registration for "${vendor.name}"? This will activate their vendor dashboard and allow them to start posting listings and receiving orders.`,
					theme: "emerald",
					confirmText: "Approve Vendor"
				};
			} else {
				return {
					title: "Decline Vendor Registration",
					desc: `Are you sure you want to decline registration for "${vendor.name}"? They will not be able to log in or access the vendor dashboard.`,
					theme: "red",
					confirmText: "Decline Vendor"
				};
			}
		} else if (vendor.status === "active") {
			return {
				title: "Deactivate Vendor Account",
				desc: `Are you sure you want to deactivate vendor "${vendor.name}"? All their listings will be hidden, and they will be blocked from accessing the vendor dashboard until reactivated.`,
				theme: "red",
				confirmText: "Deactivate Account"
			};
		} else {
			return {
				title: "Reactivate Vendor Account",
				desc: `Are you sure you want to reactivate vendor "${vendor.name}"? This will restore their active status and re-enable access to their vendor panel.`,
				theme: "emerald",
				confirmText: "Activate Account"
			};
		}
	};

	const modalInfo = getModalTitleAndDescription();

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
				<div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
				<p className="text-sm text-zinc-500 dark:text-gray-400">Loading vendor profile details...</p>
			</div>
		);
	}

	if (error || !vendor) {
		return (
			<div className="max-w-2xl mx-auto text-center py-12 space-y-4">
				<div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 text-red-650 rounded-2xl">
					<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Profile Load Error</h3>
				<p className="text-sm text-zinc-500 dark:text-gray-400">{error || "The requested vendor profile could not be found."}</p>
				<Button size="sm" onClick={() => router.push("/admin/vendor")}>
					Back to Vendors
				</Button>
			</div>
		);
	}

	// Dynamic metrics calculations
	const metrics = {
		activeListings: vendor.mobiles?.filter((m: any) => m.status === "Available").length || 0,
		totalSales: vendor.transactions?.filter((t: any) => t.type === "Sale").length || 0,
		totalPurchases: vendor.transactions?.filter((t: any) => t.type === "Purchase").length || 0,
		ongoingRepairs: vendor.repairs?.filter((r: any) => r.status !== "Delivered" && r.status !== "Cancelled").length || 0,
	};

	// ─────────────────────────────────────────────
	// FILTERED LISTS
	// ─────────────────────────────────────────────

	const filteredModels = vendor.models?.filter((m: any) => {
		const term = searchModel.toLowerCase();
		return (
			m.name.toLowerCase().includes(term) ||
			(m.brand?.name || "").toLowerCase().includes(term)
		);
	}) || [];

	const filteredMobiles = vendor.mobiles?.filter((m: any) => {
		const term = searchMobile.toLowerCase();
		const matchesSearch =
			(m.brand?.name || "").toLowerCase().includes(term) ||
			(m.model?.name || "").toLowerCase().includes(term) ||
			(m.color || "").toLowerCase().includes(term) ||
			(m.imei || "").toLowerCase().includes(term);

		const matchesStatus = statusFilterMobile === "All" || m.status === statusFilterMobile;
		const matchesCondition = conditionFilterMobile === "All" || m.condition === conditionFilterMobile;

		return matchesSearch && matchesStatus && matchesCondition;
	}) || [];

	const filteredTxs = vendor.transactions?.filter((t: any) => {
		const term = searchTx.toLowerCase();
		const matchesSearch =
			(t.mobile?.brand?.name || "").toLowerCase().includes(term) ||
			(t.mobile?.model?.name || "").toLowerCase().includes(term) ||
			(t.customer?.name || "").toLowerCase().includes(term) ||
			(t.notes || "").toLowerCase().includes(term) ||
			String(t.id).includes(term) ||
			(t.mobile?.imei || "").toLowerCase().includes(term);

		const matchesType = typeFilterTx === "All" || t.type === typeFilterTx;

		return matchesSearch && matchesType;
	}) || [];

	const filteredRepairs = vendor.repairs?.filter((r: any) => {
		const term = searchRepair.toLowerCase();
		const matchesSearch =
			(r.customer_name || "").toLowerCase().includes(term) ||
			(r.customer_phone || "").toLowerCase().includes(term) ||
			(r.device_model || "").toLowerCase().includes(term) ||
			(r.imei || "").toLowerCase().includes(term) ||
			(r.notes || "").toLowerCase().includes(term);

		const matchesStatus = statusFilterRepair === "All" || r.status === statusFilterRepair;

		return matchesSearch && matchesStatus;
	}) || [];

	// ─────────────────────────────────────────────
	// DATATABLE COLUMNS
	// ─────────────────────────────────────────────

	const modelColumns = [
		{
			key: "name",
			title: "Model Name",
			className: "py-4 px-6 font-semibold text-zinc-800 dark:text-zinc-200 text-xs",
			render: (m: any) => m.name
		},
		{
			key: "brand",
			title: "Brand",
			className: "py-4 px-6 text-zinc-650 dark:text-zinc-350 text-xs",
			render: (m: any) => m.brand?.name || "N/A"
		},
		{
			key: "slug",
			title: "Slug",
			className: "py-4 px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs",
			render: (m: any) => m.slug || "-"
		},
		{
			key: "created_at",
			title: "Created At",
			className: "py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs",
			render: (m: any) => new Date(m.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
		}
	];

	const mobileColumns = [
		{
			key: "device",
			title: "Device Details",
			className: "py-4 px-6 text-xs",
			render: (m: any) => (
				<div>
					<p className="font-semibold text-zinc-800 dark:text-zinc-200">
						{m.brand?.name} {m.model?.name}
					</p>
					<p className="text-[10px] text-zinc-500 dark:text-gray-400 mt-0.5">{m.color}</p>
				</div>
			)
		},
		{
			key: "specs",
			title: "RAM / Storage",
			className: "py-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium text-xs",
			render: (m: any) => `${m.ram?.value || "-"} / ${m.storage?.value || "-"}`
		},
		{
			key: "imei",
			title: "IMEI",
			className: "py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono text-xs",
			render: (m: any) => m.imei || "N/A"
		},
		{
			key: "condition",
			title: "Condition",
			className: "py-4 px-6 text-xs",
			render: (m: any) => (
				<span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
					m.condition === "NEW" 
						? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
						: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
				}`}>
					{m.condition}
				</span>
			)
		},
		{
			key: "battery",
			title: "Battery Health",
			className: "py-4 px-6 text-zinc-700 dark:text-zinc-300 font-semibold text-xs",
			render: (m: any) => m.battery_health ? `${m.battery_health}%` : "-"
		},
		{
			key: "price",
			title: "Value Estimation",
			className: "py-4 px-6 font-bold text-zinc-800 dark:text-zinc-200 text-xs",
			render: (m: any) => {
				const purchaseTx = m.transactions?.find((tx: any) => tx.type === "Purchase");
				const saleTx = m.transactions?.find((tx: any) => tx.type === "Sale");
				const purchasePrice = purchaseTx ? purchaseTx.amount : undefined;
				const price = m.status === "Sold" && saleTx
					? saleTx.amount
					: (purchasePrice ? Math.round(purchasePrice * 1.2) : 0);
				return `₹${price.toLocaleString()}`;
			}
		},
		{
			key: "status",
			title: "Status",
			className: "py-4 px-6 text-xs",
			render: (m: any) => {
				const config = {
					Available: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
					Sold: "bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400",
					Review: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
				};
				const style = config[m.status as keyof typeof config] || config.Available;
				return (
					<span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${style}`}>
						{m.status}
					</span>
				);
			}
		}
	];

	const txColumns = [
		{
			key: "date",
			title: "Date",
			className: "py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs",
			render: (t: any) => t.date
		},
		{
			key: "id",
			title: "TX ID",
			className: "py-4 px-6 font-bold text-zinc-800 dark:text-zinc-200 text-xs",
			render: (t: any) => `#TX-${String(t.id).padStart(4, "0")}`
		},
		{
			key: "type",
			title: "Type",
			className: "py-4 px-6 text-xs",
			render: (t: any) => {
				const colors = {
					Sale: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
					Purchase: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
					Exchange: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
				};
				const style = colors[t.type as keyof typeof colors] || "bg-zinc-100 border-zinc-200 text-zinc-650";
				return (
					<span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${style}`}>
						{t.type}
					</span>
				);
			}
		},
		{
			key: "device",
			title: "Device / IMEI",
			className: "py-4 px-6 text-xs",
			render: (t: any) => (
				<div>
					<p className="font-semibold text-zinc-800 dark:text-zinc-200">
						{t.mobile ? `${t.mobile.brand?.name} ${t.mobile.model?.name}` : "Unknown Device"}
					</p>
					{t.mobile?.imei && (
						<p className="text-[10px] text-zinc-400 font-mono mt-0.5">{t.mobile.imei}</p>
					)}
				</div>
			)
		},
		{
			key: "partner",
			title: "Partner",
			className: "py-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium text-xs",
			render: (t: any) => {
				if (t.partner_type === "Customer") {
					return t.customer?.name || "Walk-in Customer";
				}
				return t.partnerVendor?.name || "Partner Vendor";
			}
		},
		{
			key: "amount",
			title: "Amount",
			className: "py-4 px-6 font-extrabold text-zinc-950 dark:text-white text-xs",
			render: (t: any) => `₹${t.amount.toLocaleString()}`
		},
		{
			key: "notes",
			title: "Notes",
			className: "py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs truncate",
			render: (t: any) => t.notes || "-"
		},
		{
			key: "actions",
			title: "Actions",
			className: "py-4 px-6 text-xs text-center",
			headerClassName: "text-center",
			render: (t: any) => {
				const deviceLabel = t.mobile
					? `${t.mobile.brand?.name || ""} ${t.mobile.model?.name || ""}`.trim()
					: "Device";
				return (
					<div className="flex items-center justify-center gap-1.5">
						<button
							type="button"
							onClick={() => streamInvoice(String(t.id))}
							title="View Invoice"
							className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
						>
							<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						</button>
						<button
							type="button"
							onClick={() => downloadInvoice(String(t.id), deviceLabel)}
							title="Download Invoice"
							className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
						>
							<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
						</button>
					</div>
				);
			}
		}
	];

	const repairColumns = [
		{
			key: "delivery",
			title: "Delivery Date",
			className: "py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs",
			render: (r: any) => r.delivery_date
		},
		{
			key: "customer",
			title: "Customer",
			className: "py-4 px-6 text-xs",
			render: (r: any) => (
				<div>
					<p className="font-semibold text-zinc-800 dark:text-zinc-200">{r.customer_name}</p>
					<p className="text-[10px] text-zinc-500 dark:text-gray-400 mt-0.5">{r.customer_phone}</p>
				</div>
			)
		},
		{
			key: "device",
			title: "Device / IMEI",
			className: "py-4 px-6 text-xs",
			render: (r: any) => (
				<div>
					<p className="font-semibold text-zinc-700 dark:text-zinc-300">{r.device_model}</p>
					{r.imei && (
						<p className="text-[10px] text-zinc-400 font-mono mt-0.5">{r.imei}</p>
					)}
				</div>
			)
		},
		{
			key: "issues",
			title: "Issues",
			className: "py-4 px-6 text-xs text-zinc-600 dark:text-zinc-400 max-w-xs",
			render: (r: any) => {
				let issueList = [];
				try {
					issueList = JSON.parse(r.issues);
				} catch (_) {
					issueList = r.issues ? [r.issues] : [];
				}
				return (
					<div className="flex flex-wrap gap-1">
						{Array.isArray(issueList) ? issueList.map((issue: string, idx: number) => (
							<span key={idx} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-650 dark:text-red-400 text-[10px] font-medium border border-red-500/20">
								{issue}
							</span>
						)) : (
							<span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-650 dark:text-red-400 text-[10px] font-medium border border-red-500/20">
								{r.issues}
							</span>
						)}
					</div>
				);
			}
		},
		{
			key: "cost",
			title: "Cost",
			className: "py-4 px-6 font-extrabold text-zinc-800 dark:text-zinc-200 text-xs",
			render: (r: any) => `₹${r.estimated_cost.toLocaleString()}`
		},
		{
			key: "status",
			title: "Status",
			className: "py-4 px-6 text-xs",
			render: (r: any) => {
				const colors = {
					Received: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
					Diagnosing: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
					Repaired: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
					Delivered: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
					Cancelled: "bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400",
				};
				const style = colors[r.status as keyof typeof colors] || "bg-zinc-100 border-zinc-200 text-zinc-650";
				return (
					<span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${style}`}>
						{r.status}
					</span>
				);
			}
		}
	];

	return (
		<div className="space-y-8 w-full transition-colors duration-300">
			{/* Breadcrumbs & Header Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<button
					onClick={() => router.push("/admin/vendor")}
					className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-gray-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer w-fit"
				>
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
					</svg>
					Back to Vendors
				</button>

				<div className="flex flex-wrap items-center gap-2">
					<button
						onClick={handleOpenEdit}
						className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#13151a]/50 text-zinc-700 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-[#272a33] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
					>
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						Edit Details
					</button>

					<button
						onClick={handleOpenDelete}
						className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-[#13151a]/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
					>
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Delete Account
					</button>
				</div>
			</div>

			{/* Main Layout Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Profile Card & Quick Stats */}
				<div className="space-y-6 lg:col-span-1">
					{/* Profile Summary Card */}
					<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl text-center space-y-4">
						<div className="mx-auto w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center font-extrabold text-indigo-600 dark:text-indigo-400 text-3xl overflow-hidden shrink-0">
							{vendor.profile_img ? (
								<img src={vendor.profile_img} alt={vendor.name} className="w-full h-full object-cover" />
							) : (
								vendor.name.slice(0, 1).toUpperCase()
							)}
						</div>

						<div>
							<h2 className="text-xl font-bold text-zinc-950 dark:text-white leading-tight">{vendor.name}</h2>
							<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">{vendor.email}</p>
						</div>

						<div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex flex-col items-center justify-center gap-2">
							<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Account Status</span>
							{vendor.status === "pending" ? (
								<div className="flex flex-col items-center gap-2 mt-1">
									<span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
										Pending Review
									</span>
									<div className="flex items-center gap-1.5 mt-2">
										<button
											onClick={() => handleOpenConfirm("active")}
											className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-650 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1"
										>
											Approve
										</button>
										<button
											onClick={() => handleOpenConfirm("inactive")}
											className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-[#272a33] border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-gray-400 hover:text-red-650 cursor-pointer"
										>
											Decline
										</button>
									</div>
								</div>
							) : (
								<div className="flex items-center gap-3 mt-1 bg-zinc-50 dark:bg-[#1c1e24]/40 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-white/5">
									<button
										onClick={handleStatusToggle}
										className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
											vendor.status === "active" ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
										}`}
									>
										<span
											className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
												vendor.status === "active" ? "translate-x-5" : "translate-x-0"
											}`}
										/>
									</button>
									<span className={`text-xs font-bold uppercase tracking-wider ${
										vendor.status === "active" ? "text-emerald-650 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
									}`}>
										{vendor.status === "active" ? "Active" : "Inactive"}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Metadata Stats Card */}
					<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
						<h3 className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Registration Details</h3>
						
						<div className="space-y-3 text-left">
							<div>
								<span className="text-[10px] text-zinc-400 dark:text-gray-500 uppercase font-semibold">Registered Date</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-gray-200 mt-0.5">
									{new Date(vendor.created_at).toLocaleDateString(undefined, {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
							<div>
								<span className="text-[10px] text-zinc-400 dark:text-gray-500 uppercase font-semibold">Registered Time</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-gray-200 mt-0.5">
									{new Date(vendor.created_at).toLocaleTimeString(undefined, {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
							<div>
								<span className="text-[10px] text-zinc-400 dark:text-gray-500 uppercase font-semibold">Vendor ID Reference</span>
								<p className="text-xs font-bold text-zinc-800 dark:text-gray-200 mt-0.5">#VND-{String(vendor.id).padStart(4, "0")}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column: Business & Detail Sheets / Tab Navigation */}
				<div className="space-y-6 lg:col-span-2">
					{/* Custom Navigation Tabs */}
					<div className="flex border-b border-zinc-200/80 dark:border-white/5 overflow-x-auto no-scrollbar gap-6 pb-px">
						<button
							onClick={() => setActiveTab("overview")}
							className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
								activeTab === "overview"
									? "border-indigo-655 text-indigo-600 dark:text-indigo-400"
									: "border-transparent text-zinc-400 dark:text-gray-500 hover:text-zinc-650 dark:hover:text-gray-300"
							}`}
						>
							Overview & Profile
						</button>
						<button
							onClick={() => setActiveTab("models")}
							className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
								activeTab === "models"
									? "border-indigo-655 text-indigo-600 dark:text-indigo-400"
									: "border-transparent text-zinc-400 dark:text-gray-500 hover:text-zinc-655 dark:hover:text-gray-300"
							}`}
						>
							Device Models ({vendor.models?.length || 0})
						</button>
						<button
							onClick={() => setActiveTab("inventory")}
							className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
								activeTab === "inventory"
									? "border-indigo-655 text-indigo-600 dark:text-indigo-400"
									: "border-transparent text-zinc-400 dark:text-gray-500 hover:text-zinc-655 dark:hover:text-gray-300"
							}`}
						>
							Inventory ({vendor.mobiles?.length || 0})
						</button>
						<button
							onClick={() => setActiveTab("transactions")}
							className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
								activeTab === "transactions"
									? "border-indigo-655 text-indigo-600 dark:text-indigo-400"
									: "border-transparent text-zinc-400 dark:text-gray-500 hover:text-zinc-655 dark:hover:text-gray-300"
							}`}
						>
							Transactions ({vendor.transactions?.length || 0})
						</button>
						<button
							onClick={() => setActiveTab("repairs")}
							className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
								activeTab === "repairs"
									? "border-indigo-655 text-indigo-600 dark:text-indigo-400"
									: "border-transparent text-zinc-400 dark:text-gray-500 hover:text-zinc-655 dark:hover:text-gray-300"
							}`}
						>
							Repairs ({vendor.repairs?.length || 0})
						</button>
					</div>

					{/* Tab Contents */}
					{activeTab === "overview" && (
						<div className="space-y-6 animate-fadeIn">
							{/* Quick Metrics Stats Grid */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-3">
									<div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
										</svg>
									</div>
									<div className="text-left">
										<span className="text-[10px] text-zinc-450 dark:text-gray-500 uppercase font-bold tracking-wider block">Available</span>
										<p className="text-lg font-extrabold text-zinc-950 dark:text-white leading-tight mt-0.5">{metrics.activeListings}</p>
									</div>
								</div>

								<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-3">
									<div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<div className="text-left">
										<span className="text-[10px] text-zinc-455 dark:text-gray-500 uppercase font-bold tracking-wider block">Sales</span>
										<p className="text-lg font-extrabold text-zinc-955 dark:text-white leading-tight mt-0.5">{metrics.totalSales}</p>
									</div>
								</div>

								<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-3">
									<div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
										</svg>
									</div>
									<div className="text-left">
										<span className="text-[10px] text-zinc-455 dark:text-gray-500 uppercase font-bold tracking-wider block">Purchases</span>
										<p className="text-lg font-extrabold text-zinc-955 dark:text-white leading-tight mt-0.5">{metrics.totalPurchases}</p>
									</div>
								</div>

								<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm flex items-center gap-3">
									<div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
										</svg>
									</div>
									<div className="text-left">
										<span className="text-[10px] text-zinc-455 dark:text-gray-500 uppercase font-bold tracking-wider block">Repairs</span>
										<p className="text-lg font-extrabold text-zinc-955 dark:text-white leading-tight mt-0.5">{metrics.ongoingRepairs}</p>
									</div>
								</div>
							</div>

							{/* Shop Name & Contact details */}
							<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-white/5 pb-3">Business Profile</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
									<div className="space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Shop Name</span>
										<p className="text-sm font-bold text-zinc-800 dark:text-gray-200">{vendor.businessDetail?.shop_name || "Not Configured"}</p>
									</div>

									<div className="space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Phone Number</span>
										<p className="text-sm font-bold text-zinc-800 dark:text-gray-200">{vendor.businessDetail?.phone || "Not Provided"}</p>
									</div>

									<div className="md:col-span-2 space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Business Address</span>
										<p className="text-sm font-bold text-zinc-800 dark:text-gray-200 leading-relaxed max-w-xl whitespace-pre-wrap">{vendor.businessDetail?.address || "No address configured"}</p>
									</div>
								</div>
							</div>

							{/* Taxation and Payment Panel */}
							<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-white/5 pb-3">Billing & Parameters</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
									<div className="space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">GST Configuration</span>
										<div className="flex items-center gap-1.5 mt-0.5">
											<span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
												vendor.businessDetail?.gst_enabled 
													? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
													: "bg-zinc-100 border border-zinc-200 dark:bg-white/5 dark:border-white/5 text-zinc-500 dark:text-gray-400"
											}`}>
												{vendor.businessDetail?.gst_enabled ? "GST Enabled" : "GST Disabled"}
											</span>
										</div>
									</div>

									<div className="space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">GST Rate Apply</span>
										<p className="text-sm font-bold text-zinc-800 dark:text-gray-200">{vendor.businessDetail?.gst_rate ?? 18}%</p>
									</div>

									<div className="md:col-span-2 space-y-1">
										<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Accepted Payment Methods</span>
										<p className="text-sm font-bold text-zinc-800 dark:text-gray-200 mt-1">{vendor.businessDetail?.payment_methods || "N/A"}</p>
									</div>
								</div>
							</div>
						</div>
					)}

					{activeTab === "models" && (
						<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 animate-fadeIn">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white">Device Models Catalog</h3>
								<input
									type="text"
									placeholder="Search models..."
									value={searchModel}
									onChange={(e) => setSearchModel(e.target.value)}
									className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-64 h-9"
								/>
							</div>
							<div className="overflow-x-auto rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#13151a] text-left">
								<DataTable
									columns={modelColumns}
									data={filteredModels}
									emptyMessage="No device models found for this vendor."
								/>
							</div>
						</div>
					)}

					{activeTab === "inventory" && (
						<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 animate-fadeIn">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white">Stock Listings</h3>
								
								<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
									<input
										type="text"
										placeholder="Search inventory..."
										value={searchMobile}
										onChange={(e) => setSearchMobile(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors flex-1 sm:flex-initial sm:w-48 h-9"
									/>
									<select
										value={conditionFilterMobile}
										onChange={(e) => setConditionFilterMobile(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-1.5 text-xs text-zinc-700 dark:text-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer h-9"
									>
										<option value="All">All Conditions</option>
										<option value="NEW">New</option>
										<option value="OLD">Old</option>
									</select>
									<select
										value={statusFilterMobile}
										onChange={(e) => setStatusFilterMobile(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-1.5 text-xs text-zinc-700 dark:text-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer h-9"
									>
										<option value="All">All Statuses</option>
										<option value="Available">Available</option>
										<option value="Sold">Sold</option>
										<option value="Review">Review</option>
									</select>
								</div>
							</div>
							<div className="overflow-x-auto rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#13151a] text-left">
								<DataTable
									columns={mobileColumns}
									data={filteredMobiles}
									emptyMessage="No inventory listings found matching selected filters."
								/>
							</div>
						</div>
					)}

					{activeTab === "transactions" && (
						<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 animate-fadeIn">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white">Transaction Logs</h3>
								
								<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
									<input
										type="text"
										placeholder="Search transactions..."
										value={searchTx}
										onChange={(e) => setSearchTx(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors flex-1 sm:flex-initial sm:w-48 h-9"
									/>
									<select
										value={typeFilterTx}
										onChange={(e) => setTypeFilterTx(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-1.5 text-xs text-zinc-700 dark:text-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer h-9"
									>
										<option value="All">All Types</option>
										<option value="Sale">Sales</option>
										<option value="Purchase">Purchases</option>
										<option value="Exchange">Exchanges</option>
									</select>
								</div>
							</div>
							<div className="overflow-x-auto rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#13151a] text-left">
								<DataTable
									columns={txColumns}
									data={filteredTxs}
									emptyMessage="No transaction logs found for this vendor."
								/>
							</div>
						</div>
					)}

					{activeTab === "repairs" && (
						<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 animate-fadeIn">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<h3 className="text-sm font-bold text-zinc-950 dark:text-white">Repair Work Orders</h3>
								
								<div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
									<input
										type="text"
										placeholder="Search repairs..."
										value={searchRepair}
										onChange={(e) => setSearchRepair(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3.5 py-1.5 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors flex-1 sm:flex-initial sm:w-48 h-9"
									/>
									<select
										value={statusFilterRepair}
										onChange={(e) => setStatusFilterRepair(e.target.value)}
										className="bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-1.5 text-xs text-zinc-700 dark:text-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer h-9"
									>
										<option value="All">All Statuses</option>
										<option value="Received">Received</option>
										<option value="Diagnosing">Diagnosing</option>
										<option value="Repaired">Repaired</option>
										<option value="Delivered">Delivered</option>
										<option value="Cancelled">Cancelled</option>
									</select>
								</div>
							</div>
							<div className="overflow-x-auto rounded-xl border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-[#13151a] text-left">
								<DataTable
									columns={repairColumns}
									data={filteredRepairs}
									emptyMessage="No repair orders found for this vendor."
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Custom Action Confirmation Modal */}
			<Modal
				isOpen={confirmOpen}
				onClose={handleCloseConfirm}
				title={modalInfo.title}
				size="md"
			>
				<div className="space-y-4">
					<div className={`p-4 rounded-xl border text-sm text-left ${
						modalInfo.theme === "red" 
							? "bg-red-500/5 dark:bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400" 
							: "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
					}`}>
						{modalInfo.desc}
					</div>

					{/* Modal Footer */}
					<div className="flex justify-end items-center gap-3 pt-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCloseConfirm}
							disabled={actionLoading}
						>
							Cancel
						</Button>
						<button
							onClick={handleStatusChangeSubmit}
							disabled={actionLoading}
							className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-60 cursor-pointer min-w-[100px] flex items-center justify-center shadow-md ${
								modalInfo.theme === "red" 
									? "bg-red-600 hover:bg-red-500 shadow-red-600/20" 
									: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
							}`}
						>
							{actionLoading ? "Processing..." : modalInfo.confirmText}
						</button>
					</div>
				</div>
			</Modal>

			{/* Edit Vendor Modal */}
			<Modal
				isOpen={editOpen}
				onClose={handleCloseEdit}
				title="Edit Vendor Account Details"
				size="lg"
			>
				<form onSubmit={handleEditSubmit} className="space-y-4 text-left">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Profile Image Uploader */}
						<div className="md:col-span-2 flex items-center gap-4 pb-4 border-b border-zinc-100 dark:border-white/5">
							<div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xl shrink-0">
								{editProfileImg ? (
									<img src={editProfileImg} alt="Preview" className="w-full h-full object-cover" />
								) : (
									editName ? editName.slice(0, 1).toUpperCase() : "V"
								)}
							</div>
							<div className="space-y-1">
								<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase block">Profile Image</label>
								<input
									type="file"
									accept="image/*"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											const reader = new FileReader();
											reader.onloadend = () => {
												setEditProfileImg(reader.result as string);
											};
											reader.readAsDataURL(file);
										}
									}}
									className="text-xs text-zinc-500 dark:text-gray-400 file:mr-4 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 cursor-pointer"
								/>
								{editProfileImg && (
									<button
										type="button"
										onClick={() => setEditProfileImg("")}
										className="text-[10px] text-red-500 hover:underline block"
									>
										Remove Image
									</button>
								)}
							</div>
						</div>

						{/* Vendor Name */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Vendor Name</label>
							<input
								type="text"
								required
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-2 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors h-9"
							/>
						</div>

						{/* Email */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Email Address</label>
							<input
								type="email"
								required
								value={editEmail}
								onChange={(e) => setEditEmail(e.target.value)}
								className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-2 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors h-9"
							/>
						</div>

						{/* Shop Name */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Shop Name</label>
							<input
								type="text"
								value={editShopName}
								onChange={(e) => setEditShopName(e.target.value)}
								className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-2 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors h-9"
							/>
						</div>

						{/* Phone */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Phone Number</label>
							<input
								type="text"
								value={editPhone}
								onChange={(e) => setEditPhone(e.target.value)}
								className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-2 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors h-9"
							/>
						</div>

						{/* Address */}
						<div className="space-y-1 md:col-span-2">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Shop Address</label>
							<textarea
								rows={3}
								value={editAddress}
								onChange={(e) => setEditAddress(e.target.value)}
								className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 px-3 py-2 text-xs text-zinc-800 dark:text-white rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none"
							/>
						</div>
					</div>

					{/* Footer buttons */}
					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-white/5">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCloseEdit}
							disabled={actionLoading}
						>
							Cancel
						</Button>
						<button
							type="submit"
							disabled={actionLoading}
							className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center min-w-[90px]"
						>
							{actionLoading ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</Modal>

			{/* Confirm Delete Modal */}
			<Modal
				isOpen={deleteOpen}
				onClose={handleCloseDelete}
				title="Delete Vendor Account"
				size="md"
			>
				<div className="space-y-4">
					<div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-left text-sm text-red-700 dark:text-red-400">
						<p>
							Are you sure you want to permanently delete the vendor account <span className="font-bold">&ldquo;{vendor.name}&rdquo;</span>? This action is irreversible. All vendor details, listings, and configurations will be permanently destroyed.
						</p>
					</div>

					<div className="flex justify-end items-center gap-3 pt-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCloseDelete}
							disabled={actionLoading}
						>
							Cancel
						</Button>
						<button
							onClick={handleDeleteSubmit}
							disabled={actionLoading}
							className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-red-650 hover:bg-red-500 transition-colors shadow-md shadow-red-600/20 flex items-center justify-center min-w-[100px]"
						>
							{actionLoading ? "Deleting..." : "Permanently Delete"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
