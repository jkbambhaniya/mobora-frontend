"use client";

import React, { useState } from "react";
import { useAdminDashboard, VendorDetail } from "@/context/admin/dashboard-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PaginationComponent from "@/components/ui/Pagination";

export default function AdminVendorsPage() {
	const router = useRouter();
	const {
		vendors,
		isLoadingVendors,
		stats,
		isLoadingStats,
		searchQuery,
		statusFilter,
		setSearchQuery,
		setStatusFilter,
		updateVendorStatus,
		updateVendorDetails,
		deleteVendor,
		currentPage,
		limit,
		totalCount,
		totalPages,
		sortBy,
		sortOrder,
		setCurrentPage,
		setLimit,
		setSortBy,
		setSortOrder
	} = useAdminDashboard();

	const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	const renderSortIcon = (field: string) => {
		if (sortBy !== field) {
			return (
				<svg className="w-3 h-3 text-zinc-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			);
		}
		return sortOrder === "asc" ? (
			<svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 15l4-4 4 4" />
			</svg>
		) : (
			<svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4 4 4-4" />
			</svg>
		);
	};
	
	// Confirmation Modal state for status toggles / approvals
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedVendor, setSelectedVendor] = useState<VendorDetail | null>(null);
	const [targetStatus, setTargetStatus] = useState<"pending" | "active" | "inactive" | null>(null);

	// Edit Modal state
	const [editOpen, setEditOpen] = useState(false);
	const [editVendor, setEditVendor] = useState<VendorDetail | null>(null);
	const [editName, setEditName] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editShopName, setEditShopName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editAddress, setEditAddress] = useState("");
	const [editProfileImg, setEditProfileImg] = useState("");

	// Delete Modal state
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteVendorObj, setDeleteVendorObj] = useState<VendorDetail | null>(null);

	// Status Toggle click handler
	const handleStatusToggle = (vendor: VendorDetail) => {
		const nextStatus = vendor.status === "active" ? "inactive" : "active";
		setSelectedVendor(vendor);
		setTargetStatus(nextStatus);
		setConfirmOpen(true);
	};

	// Approve/Decline click handlers for pending vendors
	const handleOpenConfirm = (vendor: VendorDetail, status: "pending" | "active" | "inactive") => {
		setSelectedVendor(vendor);
		setTargetStatus(status);
		setConfirmOpen(true);
	};

	const handleCloseConfirm = () => {
		setSelectedVendor(null);
		setTargetStatus(null);
		setConfirmOpen(false);
	};

	const handleStatusChangeSubmit = async () => {
		if (!selectedVendor || !targetStatus) return;
		setActionLoadingId(selectedVendor.id);
		try {
			await updateVendorStatus(selectedVendor.id, targetStatus);
			handleCloseConfirm();
		} finally {
			setActionLoadingId(null);
		}
	};


	// Edit modal actions
	const handleOpenEdit = (vendor: VendorDetail) => {
		setEditVendor(vendor);
		setEditName(vendor.name || "");
		setEditEmail(vendor.email || "");
		setEditShopName(vendor.businessDetail?.shop_name || "");
		setEditPhone(vendor.businessDetail?.phone || "");
		setEditAddress(vendor.businessDetail?.address || "");
		setEditProfileImg(vendor.profile_img || "");
		setEditOpen(true);
	};

	const handleCloseEdit = () => {
		setEditVendor(null);
		setEditProfileImg("");
		setEditOpen(false);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editVendor) return;
		setActionLoadingId(editVendor.id);
		try {
			const success = await updateVendorDetails(editVendor.id, {
				name: editName,
				email: editEmail,
				shop_name: editShopName,
				phone: editPhone,
				address: editAddress,
				profile_img: editProfileImg,
			});
			if (success) {
				handleCloseEdit();
			}
		} finally {
			setActionLoadingId(null);
		}
	};

	// Delete modal actions
	const handleOpenDelete = (vendor: VendorDetail) => {
		setDeleteVendorObj(vendor);
		setDeleteOpen(true);
	};

	const handleCloseDelete = () => {
		setDeleteVendorObj(null);
		setDeleteOpen(false);
	};

	const handleDeleteSubmit = async () => {
		if (!deleteVendorObj) return;
		setActionLoadingId(deleteVendorObj.id);
		try {
			const success = await deleteVendor(deleteVendorObj.id);
			if (success) {
				handleCloseDelete();
			}
		} finally {
			setActionLoadingId(null);
		}
	};

	const getModalTitleAndDescription = () => {
		if (!selectedVendor || !targetStatus) return { title: "", desc: "", theme: "indigo", confirmText: "Confirm" };

		if (selectedVendor.status === "pending") {
			if (targetStatus === "active") {
				return {
					title: "Approve Dealer Registration",
					desc: `Are you sure you want to approve registration for "${selectedVendor.name}"? This will activate their dealer dashboard and allow them to start posting listings and receiving orders.`,
					theme: "emerald",
					confirmText: "Approve Dealer"
				};
			} else {
				return {
					title: "Decline Dealer Registration",
					desc: `Are you sure you want to decline registration for "${selectedVendor.name}"? They will not be able to log in or access the dealer dashboard.`,
					theme: "red",
					confirmText: "Decline Dealer"
				};
			}
		} else if (selectedVendor.status === "active") {
			return {
				title: "Deactivate Dealer Account",
				desc: `Are you sure you want to deactivate vendor "${selectedVendor.name}"? All their listings will be hidden, and they will be blocked from accessing the dealer dashboard until reactivated.`,
				theme: "red",
				confirmText: "Deactivate Account"
			};
		} else {
			return {
				title: "Reactivate Dealer Account",
				desc: `Are you sure you want to reactivate vendor "${selectedVendor.name}"? This will restore their active status and re-enable access to their dealer panel.`,
				theme: "emerald",
				confirmText: "Activate Account"
			};
		}
	};

	const modalInfo = getModalTitleAndDescription();

	return (
		<div className="space-y-8 w-full transition-colors duration-300">
			{/* Welcome Banner */}
			<div>
				<h1 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">Vendors</h1>
				<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">Manage vendor registrations, verify credentials, and set access permissions.</p>
			</div>

			{/* Stats Cards Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Total Dealers Card */}
				<button
					onClick={() => setStatusFilter("")}
					className={`p-5 rounded-2xl text-left bg-white dark:bg-[#13151a]/50 backdrop-blur-md border shadow-sm dark:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
						statusFilter === ""
							? "border-indigo-500/50 dark:border-indigo-500/40 ring-2 ring-indigo-500/10"
							: "border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
					}`}
				>
					<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
						</svg>
					</div>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Dealers</p>
						<span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">ALL</span>
					</div>
					{isLoadingStats ? (
						<div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-950 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stats?.totalVendors ?? 0}</p>
					)}
				</button>

				{/* Pending Approval Card */}
				<button
					onClick={() => setStatusFilter("pending")}
					className={`p-5 rounded-2xl text-left bg-white dark:bg-[#13151a]/50 backdrop-blur-md border shadow-sm dark:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
						statusFilter === "pending"
							? "border-amber-500/50 dark:border-amber-500/40 ring-2 ring-amber-500/10"
							: "border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
					}`}
				>
					<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Pending Review</p>
						<span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">PENDING</span>
					</div>
					{isLoadingStats ? (
						<div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-950 dark:text-white mt-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{stats?.pendingVendors ?? 0}</p>
					)}
				</button>

				{/* Active Card */}
				<button
					onClick={() => setStatusFilter("active")}
					className={`p-5 rounded-2xl text-left bg-white dark:bg-[#13151a]/50 backdrop-blur-md border shadow-sm dark:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
						statusFilter === "active"
							? "border-emerald-500/50 dark:border-emerald-500/40 ring-2 ring-emerald-500/10"
							: "border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
					}`}
				>
					<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Active Dealers</p>
						<span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">ACTIVE</span>
					</div>
					{isLoadingStats ? (
						<div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-950 dark:text-white mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{stats?.activeVendors ?? 0}</p>
					)}
				</button>

				{/* Deactivated Card */}
				<button
					onClick={() => setStatusFilter("inactive")}
					className={`p-5 rounded-2xl text-left bg-white dark:bg-[#13151a]/50 backdrop-blur-md border shadow-sm dark:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden ${
						statusFilter === "inactive"
							? "border-red-500/50 dark:border-red-500/40 ring-2 ring-red-500/10"
							: "border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
					}`}
				>
					<div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
						<svg className="w-24 h-24 text-zinc-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
						</svg>
					</div>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Deactivated</p>
						<span className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">INACTIVE</span>
					</div>
					{isLoadingStats ? (
						<div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/5 animate-pulse rounded-lg mt-3" />
					) : (
						<p className="text-3xl font-bold text-zinc-950 dark:text-white mt-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{stats?.inactiveVendors ?? 0}</p>
					)}
				</button>
			</div>

			{/* Filters & Vendor Table Panel */}
			<div className="bg-white dark:bg-[#13151a]/50 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					{/* Status Filters */}
					<div className="flex bg-[#f4f4f5] dark:bg-[#1c1e24] p-1 rounded-xl gap-1 shrink-0">
						<button
							onClick={() => setStatusFilter("")}
							className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								statusFilter === "" ? "bg-white dark:bg-[#272a33] text-zinc-950 dark:text-white shadow-sm" : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white"
							}`}
						>
							All Vendors
						</button>
						<button
							onClick={() => setStatusFilter("pending")}
							className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								statusFilter === "pending" ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white"
							}`}
						>
							Pending Approval
						</button>
						<button
							onClick={() => setStatusFilter("active")}
							className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								statusFilter === "active" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white"
							}`}
						>
							Active
						</button>
						<button
							onClick={() => setStatusFilter("inactive")}
							className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
								statusFilter === "inactive" ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white"
							}`}
						>
							Deactivated
						</button>
					</div>

					{/* Search Field */}
					<div className="relative w-full sm:max-w-xs">
						<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-gray-500">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
						</span>
						<input
							type="text"
							placeholder="Search by vendor name or email..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-[#f4f4f5] dark:bg-[#1c1e24] border border-zinc-200/50 dark:border-white/5 pl-9 pr-4 py-2 text-xs text-zinc-800 dark:text-white rounded-xl placeholder-zinc-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors h-9"
						/>
					</div>
				</div>

				{/* Vendors Table */}
				<div className="overflow-x-auto border border-zinc-200/80 dark:border-white/5 rounded-xl">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-zinc-50/70 dark:bg-[#1c1e24]/40 border-b border-zinc-200/80 dark:border-white/5 select-none">
								<th onClick={() => handleSort("name")} className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider cursor-pointer group hover:text-zinc-950 dark:hover:text-white transition-colors">
									<div className="flex items-center gap-1.5">
										Dealer Info
										{renderSortIcon("name")}
									</div>
								</th>
								<th onClick={() => handleSort("shop_name")} className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider cursor-pointer group hover:text-zinc-950 dark:hover:text-white transition-colors">
									<div className="flex items-center gap-1.5">
										Shop Name
										{renderSortIcon("shop_name")}
									</div>
								</th>
								<th onClick={() => handleSort("phone")} className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider cursor-pointer group hover:text-zinc-950 dark:hover:text-white transition-colors">
									<div className="flex items-center gap-1.5">
										Phone / Location
										{renderSortIcon("phone")}
									</div>
								</th>
								<th onClick={() => handleSort("status")} className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider cursor-pointer group hover:text-zinc-950 dark:hover:text-white transition-colors">
									<div className="flex items-center gap-1.5">
										Status
										{renderSortIcon("status")}
									</div>
								</th>
								<th onClick={() => handleSort("created_at")} className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider cursor-pointer group hover:text-zinc-950 dark:hover:text-white transition-colors">
									<div className="flex items-center gap-1.5">
										Registered
										{renderSortIcon("created_at")}
									</div>
								</th>
								<th className="px-6 py-4 text-xs font-semibold text-zinc-500 dark:text-gray-400 tracking-wider text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-200/80 dark:divide-white/5">
							{isLoadingVendors ? (
								Array.from({ length: 3 }).map((_, i) => (
									<tr key={i} className="animate-pulse">
										<td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-32" /></td>
										<td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-24" /></td>
										<td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-28" /></td>
										<td className="px-6 py-4"><div className="h-6 bg-zinc-200/60 dark:bg-white/5 rounded w-16" /></td>
										<td className="px-6 py-4"><div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-20" /></td>
										<td className="px-6 py-4"><div className="h-8 bg-zinc-200/60 dark:bg-white/5 rounded w-20 ml-auto" /></td>
									</tr>
								))
							) : vendors.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-gray-500">
										No vendors found matching current search/filter.
									</td>
								</tr>
							) : (
								vendors.map((vendor) => (
									<tr key={vendor.id} className="hover:bg-zinc-50/40 dark:hover:bg-white/2 transition-colors">
										{/* Dealer Info */}
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm overflow-hidden shrink-0">
													{vendor.profile_img ? (
														<img src={vendor.profile_img} alt={vendor.name} className="w-full h-full object-cover" />
													) : (
														vendor.name.slice(0, 1).toUpperCase()
													)}
												</div>
												<div>
													<p className="text-sm font-semibold text-zinc-900 dark:text-white">{vendor.name}</p>
													<p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">{vendor.email}</p>
												</div>
											</div>
										</td>

										{/* Shop Name */}
										<td className="px-6 py-4 text-sm text-zinc-700 dark:text-gray-300">
											{vendor.businessDetail?.shop_name || "N/A"}
										</td>

										{/* Phone / Location */}
										<td className="px-6 py-4">
											<p className="text-sm text-zinc-700 dark:text-gray-300">{vendor.businessDetail?.phone || "N/A"}</p>
											<p className="text-xs text-zinc-400 dark:text-gray-400 mt-0.5 max-w-[200px] truncate">{vendor.businessDetail?.address || "No address details"}</p>
										</td>

										{/* Status Badge & Toggle Switch */}
										<td className="px-6 py-4">
											{vendor.status === "pending" ? (
												<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 tracking-wide uppercase">
													Pending Review
												</span>
											) : (
												<div className="flex items-center gap-2">
													<button
														disabled={actionLoadingId === vendor.id}
														onClick={() => handleStatusToggle(vendor)}
														className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
															vendor.status === "active" ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"
														}`}
													>
														<span
															className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
																vendor.status === "active" ? "translate-x-5" : "translate-x-0"
															}`}
														/>
													</button>
													<span className={`text-xs font-semibold uppercase tracking-wider ${
														vendor.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
													}`}>
														{vendor.status === "active" ? "Active" : "Inactive"}
													</span>
												</div>
											)}
										</td>

										{/* Registered Date */}
										<td className="px-6 py-4 text-sm text-zinc-700 dark:text-gray-300">
											{new Date(vendor.created_at).toLocaleDateString(undefined, {
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</td>

										{/* Actions */}
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-3">
												{/* Pending Action Buttons */}
												{vendor.status === "pending" && (
													<div className="flex items-center gap-1.5 mr-2">
														<button
															disabled={actionLoadingId === vendor.id}
															onClick={() => handleOpenConfirm(vendor, "active")}
															className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20 flex items-center gap-1"
														>
															<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
															</svg>
															Approve
														</button>
														<button
															disabled={actionLoadingId === vendor.id}
															onClick={() => handleOpenConfirm(vendor, "inactive")}
															className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-red-50 dark:bg-[#272a33] dark:hover:bg-red-500/10 border border-zinc-200 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/20 text-zinc-700 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer disabled:opacity-50 flex items-center gap-1"
														>
															<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
															</svg>
															Decline
														</button>
													</div>
												)}

												{/* Standard actions (View, Edit, Delete) */}
												<div className="flex items-center gap-1">
													{/* View Icon */}
													<button
														onClick={() => router.push(`/admin/dealer/${vendor.id}`)}
														className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#272a33] text-zinc-500 dark:text-gray-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
														title="View Vendor Details"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
														</svg>
													</button>

													{/* Edit Icon */}
													<button
														onClick={() => handleOpenEdit(vendor)}
														className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#272a33] text-zinc-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
														title="Edit Dealer"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
														</svg>
													</button>

													{/* Delete Icon */}
													<button
														onClick={() => handleOpenDelete(vendor)}
														className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#272a33] text-zinc-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
														title="Delete Dealer"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Controls */}
				<PaginationComponent
					page={currentPage}
					total={totalCount}
					limit={limit}
					onPageChange={setCurrentPage}
					onLimitChange={(l) => {
						setLimit(l);
						setCurrentPage(1);
					}}
					label="vendors"
				/>
			</div>

			{/* Custom Action Confirmation Modal */}
			<Modal
				isOpen={confirmOpen}
				onClose={handleCloseConfirm}
				title={modalInfo.title}
				size="md"
			>
				<div className="space-y-4">
					{selectedVendor && (
						<div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#1c1e24]/40 border border-zinc-200/50 dark:border-white/5 text-left space-y-3">
							<div>
								<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Dealer Info</span>
								<div className="flex items-center gap-3 mt-1">
									<div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
										{selectedVendor.name.slice(0, 1).toUpperCase()}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-zinc-950 dark:text-white truncate">{selectedVendor.name}</p>
										<p className="text-xs text-zinc-500 dark:text-gray-400 truncate">{selectedVendor.email}</p>
									</div>
								</div>
							</div>
							
							<div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-200/50 dark:border-white/5">
								<div>
									<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Shop Name</span>
									<p className="text-xs font-semibold text-zinc-800 dark:text-gray-300 mt-0.5">{selectedVendor.businessDetail?.shop_name || "N/A"}</p>
								</div>
								<div>
									<span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Current Status</span>
									<div className="mt-0.5">
										{selectedVendor.status === "pending" && (
											<span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
												Pending
											</span>
										)}
										{selectedVendor.status === "active" && (
											<span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
												Active
											</span>
										)}
										{selectedVendor.status === "inactive" && (
											<span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 uppercase">
												Inactive
											</span>
										)}
									</div>
								</div>
							</div>
						</div>
					)}

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
							disabled={actionLoadingId !== null}
						>
							Cancel
						</Button>
						<button
							onClick={handleStatusChangeSubmit}
							disabled={actionLoadingId !== null}
							className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-60 cursor-pointer min-w-[100px] flex items-center justify-center shadow-md ${
								modalInfo.theme === "red" 
									? "bg-red-600 hover:bg-red-500 shadow-red-600/20" 
									: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
							}`}
						>
							{actionLoadingId !== null ? "Processing..." : modalInfo.confirmText}
						</button>
					</div>
				</div>
			</Modal>


			{/* Edit Dealer Modal */}
			<Modal
				isOpen={editOpen}
				onClose={handleCloseEdit}
				title="Edit Dealer Account Details"
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

						{/* Dealer Name */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase">Dealer Name</label>
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
							disabled={actionLoadingId !== null}
						>
							Cancel
						</Button>
						<button
							type="submit"
							disabled={actionLoadingId !== null}
							className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center min-w-[90px]"
						>
							{actionLoadingId !== null ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</Modal>

			{/* Confirm Delete Modal */}
			<Modal
				isOpen={deleteOpen}
				onClose={handleCloseDelete}
				title="Delete Dealer Account"
				size="md"
			>
				<div className="space-y-4">
					<div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-left text-sm text-red-700 dark:text-red-400">
						{deleteVendorObj && (
							<p>
								Are you sure you want to permanently delete the dealer account <span className="font-bold">&ldquo;{deleteVendorObj.name}&rdquo;</span>? This action is irreversible. All dealer details, listings, and configurations will be permanently destroyed.
							</p>
						)}
					</div>

					<div className="flex justify-end items-center gap-3 pt-3">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleCloseDelete}
							disabled={actionLoadingId !== null}
						>
							Cancel
						</Button>
						<button
							onClick={handleDeleteSubmit}
							disabled={actionLoadingId !== null}
							className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-red-600 hover:bg-red-500 transition-colors shadow-md shadow-red-600/20 flex items-center justify-center min-w-[100px]"
						>
							{actionLoadingId !== null ? "Deleting..." : "Permanently Delete"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
