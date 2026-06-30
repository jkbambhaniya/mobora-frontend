"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/ui/Pagination";
import {
	getAdminRequirementsAction,
	deleteAdminRequirementAction,
	updateAdminRequirementStatusAction,
} from "@/actions/admin-requirements";

interface Requirement {
	id: number;
	brandId: number;
	brand: string;
	modelId: number;
	model: string;
	storageId: number;
	storage: string;
	ramId: number;
	ram: string;
	color: string;
	status: string;
	createdAt: string;
	vendorId: number;
	vendorName: string;
	vendorEmail: string;
	shopName: string;
	vendorPhone: string;
}

interface Metrics {
	totalRequirements: number;
	activeRequirements: number;
	uniqueVendors: number;
}

export default function AdminRequirementsPage() {
	const router = useRouter();
	const [requirements, setRequirements] = useState<Requirement[]>([]);
	const [metrics, setMetrics] = useState<Metrics>({ totalRequirements: 0, activeRequirements: 0, uniqueVendors: 0 });
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

	// Loading per item
	const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

	// Delete Modal
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteReq, setDeleteReq] = useState<Requirement | null>(null);

	const fetchRequirements = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await getAdminRequirementsAction({
				search: searchQuery,
				status: statusFilter,
				page: currentPage,
				limit,
				sortBy,
				sortOrder,
			});
			if (res.success && res.data) {
				setRequirements(res.data.requirements || []);
				setTotalCount(res.data.total || 0);
				setTotalPages(Math.ceil((res.data.total || 0) / limit));
				if (res.data.metrics) {
					setMetrics(res.data.metrics);
				}
			}
		} catch (error) {
			console.error("Error fetching requirements:", error);
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, statusFilter, currentPage, limit, sortBy, sortOrder]);

	useEffect(() => {
		fetchRequirements();
	}, [fetchRequirements]);

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
			<svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 15l4-4 4 4" />
			</svg>
		) : (
			<svg className="w-3 h-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4 4 4-4" />
			</svg>
		);
	};

	const handleOpenDelete = (req: Requirement) => {
		setDeleteReq(req);
		setDeleteOpen(true);
	};

	const handleCloseDelete = () => {
		setDeleteReq(null);
		setDeleteOpen(false);
	};

	const handleDeleteSubmit = async () => {
		if (!deleteReq) return;
		setActionLoadingId(deleteReq.id);
		try {
			const res = await deleteAdminRequirementAction(deleteReq.id);
			if (res.success) {
				handleCloseDelete();
				fetchRequirements();
			} else {
				alert(res.message || "Failed to delete requirement.");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	const handleToggleStatus = async (req: Requirement) => {
		const newStatus = req.status === "Active" ? "Inactive" : "Active";
		setActionLoadingId(req.id);
		try {
			const res = await updateAdminRequirementStatusAction(req.id, newStatus);
			if (res.success) {
				fetchRequirements();
			} else {
				alert(res.message || "Failed to update status.");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	return (
		<div className="space-y-8 animate-fadeIn pb-12">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
						<span className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
							</svg>
						</span>
						Device Requirements
					</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1 ml-11">
						Monitor all device requirement alerts set by vendors across the platform.
					</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Requirements</p>
							<h3 className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
								{isLoading ? "..." : metrics.totalRequirements}
							</h3>
						</div>
					</div>
				</div>

				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Active Alerts</p>
							<h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
								{isLoading ? "..." : metrics.activeRequirements}
							</h3>
						</div>
					</div>
				</div>

				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Vendors Requesting</p>
							<h3 className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
								{isLoading ? "..." : metrics.uniqueVendors}
							</h3>
						</div>
					</div>
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
						placeholder="Search by vendor name or email..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-900 dark:text-white"
					/>
				</div>

				<div className="flex items-center gap-3 w-full sm:w-auto">
					<span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase shrink-0">Status:</span>
					<select
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full sm:w-40 px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-zinc-900 dark:text-white cursor-pointer"
					>
						<option value="All">All Statuses</option>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1c1e24]/30 text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider select-none">
								<th className="px-6 py-4">Device Specs</th>
								<th className="px-6 py-4">Color</th>
								<th
									className="px-6 py-4 cursor-pointer group"
									onClick={() => handleSort("status")}
								>
									<div className="flex items-center gap-1">
										Status
										{renderSortIcon("status")}
									</div>
								</th>
								<th
									className="px-6 py-4 cursor-pointer group"
									onClick={() => handleSort("vendor_id")}
								>
									<div className="flex items-center gap-1">
										Vendor
										{renderSortIcon("vendor_id")}
									</div>
								</th>
								<th
									className="px-6 py-4 cursor-pointer group"
									onClick={() => handleSort("created_at")}
								>
									<div className="flex items-center gap-1">
										Created
										{renderSortIcon("created_at")}
									</div>
								</th>
								<th className="px-6 py-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-sm">
							{isLoading ? (
								Array.from({ length: limit }).map((_, idx) => (
									<tr key={idx} className="animate-pulse">
										<td className="px-6 py-4">
											<div className="flex items-center gap-2.5">
												<div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-white/5 shrink-0" />
												<div className="space-y-1.5">
													<div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-28" />
													<div className="h-3 bg-zinc-200 dark:bg-white/5 rounded w-20" />
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-16" />
										</td>
										<td className="px-6 py-4">
											<div className="h-6 bg-zinc-200 dark:bg-white/5 rounded-full w-16" />
										</td>
										<td className="px-6 py-4">
											<div className="space-y-1.5">
												<div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-24" />
												<div className="h-3 bg-zinc-200 dark:bg-white/5 rounded w-32" />
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="h-4 bg-zinc-200 dark:bg-white/5 rounded w-20" />
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-white/5" />
												<div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-white/5" />
												<div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-white/5" />
											</div>
										</td>
									</tr>
								))
							) : requirements.length === 0 ? (
								<tr>
									<td className="px-6 py-16 text-center" colSpan={6}>
										<div className="flex flex-col items-center gap-3">
											<div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
												<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
												</svg>
											</div>
											<p className="text-zinc-500 dark:text-gray-400 font-medium">No device requirements found.</p>
										</div>
									</td>
								</tr>
							) : (
								requirements.map((req) => (
									<tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-2.5">
												<div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
													<svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
													</svg>
												</div>
												<div>
													<p className="font-bold text-zinc-900 dark:text-white">{req.brand} {req.model}</p>
													<p className="text-xs text-zinc-500 dark:text-gray-500">{req.storage} • {req.ram} RAM</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="capitalize text-zinc-700 dark:text-gray-300 text-sm">{req.color}</span>
										</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
													req.status === "Active"
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
														: "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400 border-zinc-200 dark:border-white/10"
												}`}
											>
												<span className={`w-1.5 h-1.5 rounded-full ${req.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
												{req.status}
											</span>
										</td>
										<td className="px-6 py-4">
											<div>
												<p className="font-semibold text-zinc-900 dark:text-white">{req.vendorName}</p>
												{req.shopName && (
													<p className="text-xs text-indigo-600 dark:text-indigo-400">{req.shopName}</p>
												)}
											</div>
										</td>
										<td className="px-6 py-4 text-zinc-500 dark:text-gray-400 text-xs whitespace-nowrap">
											{req.createdAt
												? new Date(req.createdAt).toLocaleDateString("en-IN", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												  })
												: "N/A"}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<button
													onClick={() => router.push(`/admin/requirements/${req.id}`)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-600/15 text-zinc-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="View Details"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
												<button
													onClick={() => handleToggleStatus(req)}
													disabled={actionLoadingId === req.id}
													className={`p-2 rounded-lg transition-all border cursor-pointer ${
														req.status === "Active"
															? "bg-zinc-50 hover:bg-amber-50 dark:bg-white/5 dark:hover:bg-amber-600/15 text-zinc-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 border-zinc-200/50 dark:border-white/5"
															: "bg-zinc-50 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-600/15 text-zinc-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-zinc-200/50 dark:border-white/5"
													}`}
													title={req.status === "Active" ? "Deactivate" : "Activate"}
												>
													{req.status === "Active" ? (
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
													) : (
														<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
													)}
												</button>
												<button
													onClick={() => handleOpenDelete(req)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-600/15 text-zinc-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="Delete Requirement"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

				{!isLoading && totalPages > 1 && (
					<div className="p-6 border-t border-zinc-200 dark:border-white/5">
						<PaginationComponent
							page={currentPage}
							total={totalCount}
							limit={limit}
							onPageChange={(page) => setCurrentPage(page)}
							onLimitChange={(l) => {
								setLimit(l);
								setCurrentPage(1);
							}}
						/>
					</div>
				)}
			</div>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={deleteOpen} onClose={handleCloseDelete}>
				<div className="p-6 max-w-sm w-full text-center">
					<div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mx-auto mb-4">
						<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Delete Requirement</h3>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">
						Are you sure you want to delete the requirement for{" "}
						<strong className="text-zinc-800 dark:text-gray-200">{deleteReq?.brand} {deleteReq?.model}</strong>? This action is irreversible.
					</p>
					<div className="flex gap-3 mt-6">
						<Button className="flex-1" variant="outline" onClick={handleCloseDelete}>
							Cancel
						</Button>
						<Button
							className="flex-1 bg-red-600 hover:bg-red-500 text-white"
							disabled={actionLoadingId !== null}
							onClick={handleDeleteSubmit}
						>
							{actionLoadingId !== null ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
