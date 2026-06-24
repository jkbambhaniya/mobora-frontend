"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { DataTable, Column } from "@/components/ui/DataTable";
import { formatDate } from "@/utils/date";
import PaginationComponent from "@/components/ui/Pagination";
import { useAdminAuth } from "@/context/admin/auth-context";
import {
	getAdminSpecSummaryAction,
	getAdminBrandsAction,
	updateAdminBrandStatusAction,
	deleteAdminBrandAction,
	getAdminRamsAction,
	updateAdminRamStatusAction,
	deleteAdminRamAction,
	getAdminStoragesAction,
	updateAdminStorageStatusAction,
	deleteAdminStorageAction,
	getAdminModelsAction,
	deleteAdminModelAction,
	updateAdminModelAction,
} from "@/actions/admin-specs";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type SpecStatus = "pending" | "approved" | "rejected";
type ActiveTab = "brands" | "rams" | "storages" | "models";

interface SpecItem {
	id: number;
	name?: string;
	value?: string;
	status: SpecStatus;
	created_at: string;
}

interface ModelItem {
	id: number;
	name: string;
	slug?: string;
	brand_id: number;
	brand_name: string;
	vendor_id: number | null;
	vendor_name: string;
	vendor_email: string | null;
	vendor_profile_img: string | null;
	created_at: string;
}

interface Pagination {
	totalCount: number;
	totalPages: number;
	currentPage: number;
	limit: number;
}

interface Summary {
	brands: { pending: number; approved: number; rejected: number };
	rams: { pending: number; approved: number; rejected: number };
	storages: { pending: number; approved: number; rejected: number };
	models: { total: number };
	totalPending: number;
}

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: SpecStatus }) {
	const config = {
		pending: {
			bg: "bg-amber-50 dark:bg-amber-500/10",
			border: "border-amber-200 dark:border-amber-500/20",
			text: "text-amber-700 dark:text-amber-400",
			dot: "bg-amber-500",
			label: "Pending",
		},
		approved: {
			bg: "bg-emerald-50 dark:bg-emerald-500/10",
			border: "border-emerald-200 dark:border-emerald-500/20",
			text: "text-emerald-700 dark:text-emerald-400",
			dot: "bg-emerald-500",
			label: "Approved",
		},
		rejected: {
			bg: "bg-red-50 dark:bg-red-500/10",
			border: "border-red-200 dark:border-red-500/20",
			text: "text-red-700 dark:text-red-400",
			dot: "bg-red-500",
			label: "Rejected",
		},
	};
	const c = config[status] || config.pending;
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
			{c.label}
		</span>
	);
}

// ─────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	confirmClass: string;
	onConfirm: () => void;
	onCancel: () => void;
	isLoading?: boolean;
}

function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	confirmClass,
	onConfirm,
	onCancel,
	isLoading,
}: ConfirmDialogProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="w-full max-w-sm bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-2xl">
				<div className="flex flex-col items-center text-center">
					<div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-4">
						<svg className="w-6 h-6 text-zinc-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">{description}</p>
				</div>
				<div className="flex gap-3 mt-6">
					<button
						onClick={onCancel}
						disabled={isLoading}
						className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-sm text-zinc-700 dark:text-gray-300 transition-all cursor-pointer disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={isLoading}
						className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 ${confirmClass}`}
					>
						{isLoading ? "Processing..." : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// SPEC DATA TABLE
// ─────────────────────────────────────────────

interface SpecTableProps {
	tab: ActiveTab;
	items: SpecItem[];
	isLoading: boolean;
	pagination: Pagination | null;
	search: string;
	statusFilter: SpecStatus | "";
	sortBy: string;
	sortOrder: string;
	limit: number;
	onSearchChange: (v: string) => void;
	onStatusFilterChange: (v: SpecStatus | "") => void;
	onPageChange: (p: number) => void;
	onLimitChange: (limit: number) => void;
	onSort: (field: string) => void;
	onApprove: (item: SpecItem) => void;
	onReject: (item: SpecItem) => void;
	onDelete: (item: SpecItem) => void;
	actionLoadingId: number | null;
}

function SpecTable({
	tab,
	items,
	isLoading,
	pagination,
	search,
	statusFilter,
	sortBy,
	sortOrder,
	limit,
	onSearchChange,
	onStatusFilterChange,
	onPageChange,
	onLimitChange,
	onSort,
	onApprove,
	onReject,
	onDelete,
	actionLoadingId,
}: SpecTableProps) {
	const labelField = tab === "brands" ? "name" : "value";
	const columnLabel = tab === "brands" ? "Brand Name" : tab === "rams" ? "RAM Size" : "Storage Size";

	const renderSortIcon = (field: string) => {
		if (sortBy !== field)
			return (
				<svg className="w-3 h-3 text-zinc-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
				</svg>
			);
		return sortOrder === "asc" ? (
			<svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 15l4-4 4 4" />
			</svg>
		) : (
			<svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4 4 4-4" />
			</svg>
		);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative flex-1 min-w-[220px]">
					<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						placeholder={`Search ${columnLabel.toLowerCase()}...`}
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-800 dark:text-gray-100 placeholder-zinc-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
					/>
				</div>
				{/* Status Filter */}
				<div className="flex items-center gap-1.5 bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-xl p-1">
					{(["", "pending", "approved", "rejected"] as const).map((s) => (
						<button
							key={s}
							onClick={() => onStatusFilterChange(s)}
							className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
								statusFilter === s
									? "bg-indigo-600 text-white shadow-sm"
									: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5"
							}`}
						>
							{s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
								<th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider w-12">#</th>
								<th
									className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider cursor-pointer group"
									onClick={() => onSort(labelField)}
								>
									<span className="flex items-center gap-1.5">
										{columnLabel}
										{renderSortIcon(labelField)}
									</span>
								</th>
								<th
									className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider cursor-pointer group"
									onClick={() => onSort("status")}
								>
									<span className="flex items-center gap-1.5">
										Status
										{renderSortIcon("status")}
									</span>
								</th>
								<th
									className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider cursor-pointer group"
									onClick={() => onSort("created_at")}
								>
									<span className="flex items-center gap-1.5">
										Submitted On
										{renderSortIcon("created_at")}
									</span>
								</th>
								<th className="px-5 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-gray-500 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-white/[0.03]">
							{isLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										<td className="px-5 py-4"><div className="h-4 w-6 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" /></td>
										<td className="px-5 py-4"><div className="h-4 w-32 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" /></td>
										<td className="px-5 py-4"><div className="h-6 w-20 bg-zinc-100 dark:bg-white/5 rounded-lg animate-pulse" /></td>
										<td className="px-5 py-4"><div className="h-4 w-28 bg-zinc-100 dark:bg-white/5 rounded animate-pulse" /></td>
										<td className="px-5 py-4 text-right"><div className="h-8 w-40 bg-zinc-100 dark:bg-white/5 rounded-xl animate-pulse ml-auto" /></td>
									</tr>
								))
							) : items.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-5 py-16 text-center">
										<div className="flex flex-col items-center gap-3">
											<div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 flex items-center justify-center">
												<svg className="w-6 h-6 text-zinc-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
												</svg>
											</div>
											<p className="text-sm font-medium text-zinc-500 dark:text-gray-500">No {tab} found</p>
											<p className="text-xs text-zinc-400 dark:text-gray-600">Try adjusting your filters</p>
										</div>
									</td>
								</tr>
							) : (
								items.map((item, idx) => {
									const label = item.name || item.value || "—";
									const isActing = actionLoadingId === item.id;
									const offset = ((pagination?.currentPage ?? 1) - 1) * (pagination?.limit ?? 15);
									return (
										<tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors group">
											<td className="px-5 py-4 text-zinc-400 dark:text-gray-600 font-mono text-xs">{offset + idx + 1}</td>
											<td className="px-5 py-4">
												<span className="font-semibold text-zinc-900 dark:text-white">{label}</span>
											</td>
											<td className="px-5 py-4">
												<StatusBadge status={item.status} />
											</td>
											<td className="px-5 py-4 text-zinc-500 dark:text-gray-400 text-xs">
												{new Date(item.created_at).toLocaleDateString("en-IN", {
													day: "numeric", month: "short", year: "numeric"
												})}
											</td>
											<td className="px-5 py-4">
												<div className="flex items-center justify-end gap-2">
													{item.status === "pending" && (
														<>
															<button
																onClick={() => onApprove(item)}
																disabled={isActing}
																className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
															>
																<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
																</svg>
																Approve
															</button>
															<button
																onClick={() => onReject(item)}
																disabled={isActing}
																className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
															>
																<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
																</svg>
																Reject
															</button>
														</>
													)}
													{item.status === "approved" && (
														<button
															onClick={() => onReject(item)}
															disabled={isActing}
															className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
															</svg>
															Revoke
														</button>
													)}
													{item.status === "rejected" && (
														<button
															onClick={() => onApprove(item)}
															disabled={isActing}
															className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
														>
															<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
															</svg>
															Re-Approve
														</button>
													)}
													<button
														onClick={() => onDelete(item)}
														disabled={isActing}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
													>
														<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
														Delete
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{pagination && (
					<PaginationComponent
						page={pagination.currentPage}
						total={pagination.totalCount}
						limit={limit}
						onPageChange={onPageChange}
						onLimitChange={onLimitChange}
						label={tab}
					/>
				)}
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// SUMMARY STAT CARD
// ─────────────────────────────────────────────

interface StatCardProps {
	label: string;
	pending: number;
	approved: number;
	rejected: number;
	icon: React.ReactNode;
	onClick: () => void;
	active?: boolean;
}

function StatCard({ label, pending, approved, rejected, icon, onClick, active }: StatCardProps) {
	return (
		<button
			onClick={onClick}
			className={`group w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
				active
					? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
					: "bg-white dark:bg-[#13151a] border-zinc-200/80 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20"
			}`}
		>
			<div className="flex items-start justify-between gap-3 mb-4">
				<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
					active ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400"
				}`}>
					{icon}
				</div>
				{pending > 0 && (
					<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
						{pending} pending
					</span>
				)}
			</div>
			<p className={`text-sm font-bold mb-3 ${active ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-900 dark:text-white"}`}>{label}</p>
			<div className="flex items-center gap-3 text-xs">
				<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
					<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
					{approved} approved
				</span>
				<span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold">
					<span className="w-1.5 h-1.5 rounded-full bg-red-500" />
					{rejected} rejected
				</span>
			</div>
		</button>
	);
}

// ─────────────────────────────────────────────
// MODEL TABLE (uses reusable DataTable)
// ─────────────────────────────────────────────

function ModelTable({
	items,
	isLoading,
	pagination,
	search,
	sortBy,
	sortOrder,
	limit,
	onSearchChange,
	onPageChange,
	onLimitChange,
	onSort,
	onEdit,
	onDelete,
	actionLoadingId,
}: {
	items: ModelItem[];
	isLoading: boolean;
	pagination: Pagination | null;
	search: string;
	sortBy: string;
	sortOrder: "asc" | "desc";
	limit: number;
	onSearchChange: (v: string) => void;
	onPageChange: (p: number) => void;
	onLimitChange: (limit: number) => void;
	onSort: (f: string) => void;
	onEdit: (item: ModelItem) => void;
	onDelete: (item: ModelItem) => void;
	actionLoadingId: number | null;
}) {
	const sortDir = (key: string): "asc" | "desc" | null => {
		if (sortBy !== key) return null;
		return sortOrder;
	};

	const columns: Column<ModelItem>[] = [
		{
			key: "index",
			title: "#",
			sortable: false,
			headerClassName: "w-8",
			className: "text-zinc-400 font-medium",
			render: (_, index) => ((pagination?.currentPage ?? 1) - 1) * (pagination?.limit ?? 15) + index + 1,
		},
		{
			key: "name",
			title: "Model Name",
			sortable: true,
			className: "font-bold text-zinc-900 dark:text-white text-sm",
		},
		{
			key: "brand",
			title: "Brand",
			sortable: false,
			render: (row) => (
				<span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
					{row.brand_name}
				</span>
			),
		},
		{
			key: "vendor",
			title: "Vendor",
			sortable: false,
			render: (row) =>
				row.vendor_id ? (
					<div className="flex items-center gap-3">
						{row.vendor_profile_img ? (
							<img
								src={row.vendor_profile_img}
								alt={row.vendor_name}
								className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/5 shrink-0"
							/>
						) : (
							<div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">
								{row.vendor_name.slice(0, 1).toUpperCase()}
							</div>
						)}
						<div className="min-w-0">
							<Link
								href={`/admin/vendor/${row.vendor_id}`}
								className="font-semibold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors block text-xs truncate"
							>
								{row.vendor_name}
							</Link>
							{row.vendor_email && (
								<p className="text-zinc-400 dark:text-gray-500 text-[10px] truncate leading-none mt-0.5">
									{row.vendor_email}
								</p>
							)}
						</div>
					</div>
				) : (
					<span className="text-xs text-zinc-400 dark:text-gray-500 italic">Global</span>
				),
		},
		{
			key: "created_at",
			title: "Added",
			sortable: true,
			className: "text-zinc-400 text-xs",
			render: (row) => formatDate(row.created_at),
		},
		{
			key: "actions",
			title: "Actions",
			sortable: false,
			headerClassName: "text-right",
			className: "text-right",
			render: (row) => {
				const isActing = actionLoadingId === row.id;
				return (
					<div className="flex items-center justify-end gap-2">
						<button
							onClick={() => onEdit(row)}
							disabled={isActing}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
						>
							Edit
						</button>
						<button
							onClick={() => onDelete(row)}
							disabled={isActing}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
						>
							{isActing ? "..." : "Delete"}
						</button>
					</div>
				);
			},
		},
	];

	return (
		<div className="flex flex-col gap-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[220px]">
					<svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input
						type="text"
						placeholder="Search models..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-800 dark:text-gray-100 placeholder-zinc-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
					/>
				</div>
				{pagination && (
					<span className="text-xs text-zinc-500 dark:text-gray-400 ml-auto">{pagination.totalCount} total</span>
				)}
			</div>

			{/* DataTable */}
			<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
				<DataTable<ModelItem>
					columns={columns}
					data={items}
					loading={isLoading}
					onSort={onSort}
					sortDir={sortDir}
					emptyMessage={
						<div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-gray-500">
							<svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
							</svg>
							<span className="text-sm font-medium">No models found</span>
							<span className="text-xs">Try adjusting your search</span>
						</div>
					}
				/>

				{/* Pagination */}
				{pagination && (
					<PaginationComponent
						page={pagination.currentPage}
						total={pagination.totalCount}
						limit={limit}
						onPageChange={onPageChange}
						onLimitChange={onLimitChange}
						label="models"
					/>
				)}
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function AdminSpecificationsPage() {
	const { admin, isLoadingAdmin } = useAdminAuth();
	const [activeTab, setActiveTab] = useState<ActiveTab>("brands");
	const [summary, setSummary] = useState<Summary | null>(null);
	const [isLoadingSummary, setIsLoadingSummary] = useState(false);

	// Table state per tab
	const [items, setItems] = useState<SpecItem[]>([]);
	const [modelItems, setModelItems] = useState<ModelItem[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [isLoadingItems, setIsLoadingItems] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<SpecStatus | "">("");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [currentPage, setCurrentPage] = useState(1);
	const [limit, setLimit] = useState(15);

	// Action state
	const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean;
		title: string;
		description: string;
		confirmLabel: string;
		confirmClass: string;
		onConfirm: () => void;
	} | null>(null);
	const [isConfirmLoading, setIsConfirmLoading] = useState(false);

	const [editModelData, setEditModelData] = useState<{
		open: boolean;
		model: ModelItem | null;
		name: string;
		brandId: number;
	}>({ open: false, model: null, name: "", brandId: 0 });

	const [allBrands, setAllBrands] = useState<{ id: number; name: string }[]>([]);
	const [isLoadingBrands, setIsLoadingBrands] = useState(false);

	const fetchAllApprovedBrands = useCallback(async () => {
		setIsLoadingBrands(true);
		try {
			const res = await getAdminBrandsAction({ status: "approved", limit: 100 });
			if (res.success && res.data?.success) {
				setAllBrands(res.data.data || []);
			}
		} catch (err) {
			console.error("Failed to fetch approved brands:", err);
		} finally {
			setIsLoadingBrands(false);
		}
	}, []);

	useEffect(() => {
		if (admin) {
			fetchAllApprovedBrands();
		}
	}, [admin, fetchAllApprovedBrands]);

	const handleSaveModelEdit = async () => {
		if (!editModelData.model) return;
		if (!editModelData.name.trim() || !editModelData.brandId) {
			toast.error("Please fill in all fields.");
			return;
		}
		setIsConfirmLoading(true);
		try {
			const res = await updateAdminModelAction(editModelData.model.id, {
				name: editModelData.name.trim(),
				brand_id: editModelData.brandId,
			});
			if (res.success && res.data?.success) {
				toast.success("Model updated successfully.");
				setEditModelData({ open: false, model: null, name: "", brandId: 0 });
				await fetchItems();
			} else {
				toast.error(res.message || "Failed to update model.");
			}
		} catch (err) {
			toast.error("Something went wrong.");
		} finally {
			setIsConfirmLoading(false);
		}
	};



	// Fetch summary
	const fetchSummary = useCallback(async () => {
		if (!admin) return;
		setIsLoadingSummary(true);
		try {
			const res = await getAdminSpecSummaryAction();
			if (res.success && res.data?.success) {
				setSummary(res.data.summary);
			} else {
				console.error("[Specs] Summary fetch failed:", res.message, res);
			}
		} catch (err) {
			console.error("[Specs] Summary fetch exception:", err);
		}
		finally { setIsLoadingSummary(false); }
	}, [admin]);

	// Fetch items for current tab
	const fetchItems = useCallback(async () => {
		if (!admin) return;
		setIsLoadingItems(true);
		const filters = {
			search: search || undefined,
			status: statusFilter || undefined,
			page: currentPage,
			limit,
			sortBy,
			sortOrder,
		};
		try {
			if (activeTab === "models") {
				const res = await getAdminModelsAction(filters as any);
				if (res.success && res.data?.success) {
					setModelItems(res.data.data || []);
					setPagination(res.data.pagination || null);
				} else {
					console.error("[Specs] fetchModels failed:", res.message, res);
					setModelItems([]);
					setPagination(null);
				}
			} else {
				let res;
				if (activeTab === "brands") res = await getAdminBrandsAction(filters as any);
				else if (activeTab === "rams") res = await getAdminRamsAction(filters as any);
				else res = await getAdminStoragesAction(filters as any);

				if (res.success && res.data?.success) {
					setItems(res.data.data || []);
					setPagination(res.data.pagination || null);
				} else {
					console.error("[Specs] fetchItems failed:", res.message, res);
					setItems([]);
					setPagination(null);
				}
			}
		} catch (err) {
			console.error("[Specs] fetchItems exception:", err);
			setItems([]);
			setModelItems([]);
			setPagination(null);
		} finally {
			setIsLoadingItems(false);
		}
	}, [admin, activeTab, search, statusFilter, currentPage, limit, sortBy, sortOrder]);

	useEffect(() => { if (admin) fetchSummary(); }, [fetchSummary, admin]);
	useEffect(() => { if (admin) fetchItems(); }, [fetchItems, admin]);

	// Reset page when tab or filters change
	useEffect(() => {
		setCurrentPage(1);
		setItems([]);
	}, [activeTab, search, statusFilter, sortBy, sortOrder]);

	const handleTabChange = (tab: ActiveTab) => {
		setActiveTab(tab);
		setSearch("");
		setStatusFilter("");
		setSortBy("created_at");
		setSortOrder("desc");
		setCurrentPage(1);
	};

	const handleSort = (field: string) => {
		if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		else { setSortBy(field); setSortOrder("asc"); }
	};

	// Generic approve/reject/delete actions
	async function performStatusUpdate(item: SpecItem, status: "approved" | "rejected") {
		setActionLoadingId(item.id);
		setIsConfirmLoading(true);
		try {
			let res;
			if (activeTab === "brands") res = await updateAdminBrandStatusAction(item.id, status);
			else if (activeTab === "rams") res = await updateAdminRamStatusAction(item.id, status);
			else res = await updateAdminStorageStatusAction(item.id, status);

			if (res.success && res.data?.success) {
				toast.success(`${activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)} ${status} successfully.`);
				await Promise.all([fetchItems(), fetchSummary()]);
			} else {
				toast.error(res.message || "Action failed.");
			}
		} catch {
			toast.error("Something went wrong.");
		} finally {
			setActionLoadingId(null);
			setIsConfirmLoading(false);
			setConfirmDialog(null);
		}
	}

	async function performDelete(item: SpecItem | ModelItem) {
		const label = (item as SpecItem).name || (item as SpecItem).value || (item as ModelItem).name || "this entry";
		setActionLoadingId(item.id);
		setIsConfirmLoading(true);
		try {
			let res;
			if (activeTab === "brands") res = await deleteAdminBrandAction(item.id);
			else if (activeTab === "rams") res = await deleteAdminRamAction(item.id);
			else if (activeTab === "storages") res = await deleteAdminStorageAction(item.id);
			else res = await deleteAdminModelAction(item.id);

			if (res.success && res.data?.success) {
				toast.success("Entry deleted successfully.");
				await Promise.all([fetchItems(), fetchSummary()]);
			} else {
				toast.error(res.message || "Delete failed.");
			}
		} catch {
			toast.error("Something went wrong.");
		} finally {
			setActionLoadingId(null);
			setIsConfirmLoading(false);
			setConfirmDialog(null);
		}
	}

	const handleApprove = (item: SpecItem) => {
		const label = item.name || item.value || "this entry";
		setConfirmDialog({
			open: true,
			title: "Approve Request",
			description: `Approve "${label}"? It will become available to vendors for use in listings.`,
			confirmLabel: "Approve",
			confirmClass: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20",
			onConfirm: () => performStatusUpdate(item, "approved"),
		});
	};

	const handleReject = (item: SpecItem) => {
		const label = item.name || item.value || "this entry";
		const isRevoke = item.status === "approved";
		setConfirmDialog({
			open: true,
			title: isRevoke ? "Revoke Approval" : "Reject Request",
			description: isRevoke
				? `Revoke approval for "${label}"? Vendors will no longer be able to use it.`
				: `Reject "${label}"? This will prevent it from being used in listings.`,
			confirmLabel: isRevoke ? "Revoke" : "Reject",
			confirmClass: "bg-red-600 hover:bg-red-500 shadow-red-600/20",
			onConfirm: () => performStatusUpdate(item, "rejected"),
		});
	};

	const handleDelete = (item: SpecItem | ModelItem) => {
		const label = (item as SpecItem).name || (item as SpecItem).value || (item as ModelItem).name || "this entry";
		setConfirmDialog({
			open: true,
			title: "Delete Entry",
			description: `Permanently delete "${label}"? This action cannot be undone.`,
			confirmLabel: "Delete",
			confirmClass: "bg-red-600 hover:bg-red-500 shadow-red-600/20",
			onConfirm: () => performDelete(item),
		});
	};

	const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
		{
			key: "brands",
			label: "Brands",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
				</svg>
			),
		},
		{
			key: "rams",
			label: "RAM",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
				</svg>
			),
		},
		{
			key: "storages",
			label: "Storage",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
				</svg>
			),
		},
		{
			key: "models",
			label: "Models",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
			),
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Specifications</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">
						Review and approve vendor-submitted specification requests for brands, RAM and storage options.
					</p>
				</div>
				{summary && summary.totalPending > 0 && (
					<div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl shrink-0">
						<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
						<span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{summary.totalPending} pending review</span>
					</div>
				)}
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{isLoadingSummary ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 h-32 animate-pulse" />
					))
				) : (
					<>
						<StatCard
							label="Brands"
							pending={summary?.brands.pending ?? 0}
							approved={summary?.brands.approved ?? 0}
							rejected={summary?.brands.rejected ?? 0}
							active={activeTab === "brands"}
							onClick={() => handleTabChange("brands")}
							icon={
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
								</svg>
							}
						/>
						<StatCard
							label="RAM Options"
							pending={summary?.rams.pending ?? 0}
							approved={summary?.rams.approved ?? 0}
							rejected={summary?.rams.rejected ?? 0}
							active={activeTab === "rams"}
							onClick={() => handleTabChange("rams")}
							icon={
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
								</svg>
							}
						/>
						<StatCard
							label="Storage Options"
							pending={summary?.storages.pending ?? 0}
							approved={summary?.storages.approved ?? 0}
							rejected={summary?.storages.rejected ?? 0}
							active={activeTab === "storages"}
							onClick={() => handleTabChange("storages")}
							icon={
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
								</svg>
							}
						/>
						{/* Models stat card — total only, no status flow */}
						<button
							onClick={() => handleTabChange("models")}
							className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
								activeTab === "models"
									? "bg-indigo-50 dark:bg-indigo-600/10 border-indigo-200 dark:border-indigo-500/30 shadow-md shadow-indigo-600/10"
									: "bg-white dark:bg-[#13151a] border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
							}`}
						>
							<div className="flex items-start justify-between gap-3 mb-4">
								<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
									activeTab === "models" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400"
								}`}>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
									</svg>
								</div>
							</div>
							<p className={`text-sm font-bold mb-3 ${activeTab === "models" ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-900 dark:text-white"}`}>Device Models</p>
							<div className="flex items-center gap-2 text-xs">
								<span className="flex items-center gap-1 text-zinc-600 dark:text-gray-400 font-semibold">
									<span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
									{summary?.models?.total ?? 0} total
								</span>
							</div>
						</button>
					</>
				)}
			</div>

			{/* Tabs + Table */}
			<div className="space-y-4">
				{/* Tab bar */}
				<div className="flex items-center gap-1 bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-1.5 w-fit shadow-sm">
					{tabs.map((t) => {
						const pendingCount = summary
							? t.key === "brands" ? (summary.brands?.pending ?? 0)
								: t.key === "rams" ? (summary.rams?.pending ?? 0)
								: t.key === "storages" ? (summary.storages?.pending ?? 0)
								: 0
							: 0;
						return (
							<button
								key={t.key}
								onClick={() => handleTabChange(t.key)}
								className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
									activeTab === t.key
										? "bg-indigo-600 text-white shadow-sm"
										: "text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5"
								}`}
							>
								{t.icon}
								{t.label}
								{pendingCount > 0 && (
									<span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
										activeTab === t.key ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
									}`}>
										{pendingCount}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Data table */}
				{activeTab === "models" ? (
					<ModelTable
						items={modelItems}
						isLoading={isLoadingItems}
						pagination={pagination}
						search={search}
						sortBy={sortBy}
						sortOrder={sortOrder}
						limit={limit}
						onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
						onPageChange={setCurrentPage}
						onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
						onSort={handleSort}
						onEdit={(item) => setEditModelData({ open: true, model: item, name: item.name, brandId: item.brand_id })}
						onDelete={(item) => handleDelete(item)}
						actionLoadingId={actionLoadingId}
					/>
				) : (
					<SpecTable
						tab={activeTab}
						items={items}
						isLoading={isLoadingItems}
						pagination={pagination}
						search={search}
						statusFilter={statusFilter}
						sortBy={sortBy}
						sortOrder={sortOrder}
						limit={limit}
						onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
						onStatusFilterChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
						onPageChange={setCurrentPage}
						onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
						onSort={handleSort}
						onApprove={handleApprove}
						onReject={handleReject}
						onDelete={handleDelete}
						actionLoadingId={actionLoadingId}
					/>
				)}
			</div>

			{/* Confirm Dialog */}
			{confirmDialog && (
				<ConfirmDialog
					open={confirmDialog.open}
					title={confirmDialog.title}
					description={confirmDialog.description}
					confirmLabel={confirmDialog.confirmLabel}
					confirmClass={confirmDialog.confirmClass}
					onConfirm={confirmDialog.onConfirm}
					onCancel={() => setConfirmDialog(null)}
					isLoading={isConfirmLoading}
				/>
			)}

			{/* Edit Model Modal */}
			{editModelData.open && editModelData.model && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-md bg-white dark:bg-[#13151a] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/5">
							<h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Device Model</h3>
							<button
								onClick={() => setEditModelData({ open: false, model: null, name: "", brandId: 0 })}
								className="text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300 cursor-pointer"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="mt-4 space-y-4">
							<div>
								<label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Model Name</label>
								<input
									type="text"
									value={editModelData.name}
									onChange={(e) => setEditModelData(prev => ({ ...prev, name: e.target.value }))}
									placeholder="e.g., iPhone 15 Pro Max"
									className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
								/>
							</div>
							<div>
								<label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Brand</label>
								<select
									value={editModelData.brandId}
									onChange={(e) => setEditModelData(prev => ({ ...prev, brandId: Number(e.target.value) }))}
									className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
								>
									<option value="" disabled className="dark:bg-[#13151a]">Select a brand</option>
									{allBrands.map((b) => (
										<option key={b.id} value={b.id} className="dark:bg-[#13151a]">
											{b.name}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setEditModelData({ open: false, model: null, name: "", brandId: 0 })}
								disabled={isConfirmLoading}
								className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-sm text-zinc-700 dark:text-gray-300 transition-all cursor-pointer disabled:opacity-50"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveModelEdit}
								disabled={isConfirmLoading || !editModelData.name.trim() || !editModelData.brandId}
								className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
							>
								{isConfirmLoading ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
