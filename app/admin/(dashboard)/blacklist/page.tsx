"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/ui/Pagination";
import {
	getAdminBlacklistedDevicesAction,
	removeAdminBlacklistedDeviceAction,
} from "@/actions/admin-blacklist";

interface BlacklistedDevice {
	id: number;
	imei: string;
	reason: string;
	createdAt: string;
	vendorId: number;
	vendorName: string;
	vendorEmail: string;
	shopName: string;
	vendorPhone: string;
}

interface Metrics {
	totalBlacklisted: number;
	uniqueVendors: number;
}

export default function AdminBlacklistPage() {
	const router = useRouter();
	const [devices, setDevices] = useState<BlacklistedDevice[]>([]);
	const [metrics, setMetrics] = useState<Metrics>({ totalBlacklisted: 0, uniqueVendors: 0 });
	const [isLoading, setIsLoading] = useState(true);

	// Filters & Pagination
	const [searchQuery, setSearchQuery] = useState("");
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
	const [deleteDevice, setDeleteDevice] = useState<BlacklistedDevice | null>(null);

	const fetchDevices = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await getAdminBlacklistedDevicesAction({
				search: searchQuery,
				page: currentPage,
				limit,
				sortBy,
				sortOrder,
			});
			if (res.success && res.data) {
				setDevices(res.data.blacklistedDevices || []);
				setTotalCount(res.data.total || 0);
				setTotalPages(Math.ceil((res.data.total || 0) / limit));
				if (res.data.metrics) {
					setMetrics(res.data.metrics);
				}
			}
		} catch (error) {
			console.error("Error fetching blacklisted devices:", error);
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, currentPage, limit, sortBy, sortOrder]);

	useEffect(() => {
		fetchDevices();
	}, [fetchDevices]);

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
			<svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 15l4-4 4 4" />
			</svg>
		) : (
			<svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l4 4 4-4" />
			</svg>
		);
	};

	const handleOpenDelete = (device: BlacklistedDevice) => {
		setDeleteDevice(device);
		setDeleteOpen(true);
	};

	const handleCloseDelete = () => {
		setDeleteDevice(null);
		setDeleteOpen(false);
	};

	const handleDeleteSubmit = async () => {
		if (!deleteDevice) return;
		setActionLoadingId(deleteDevice.id);
		try {
			const res = await removeAdminBlacklistedDeviceAction(deleteDevice.id);
			if (res.success) {
				handleCloseDelete();
				fetchDevices();
			} else {
				alert(res.message || "Failed to remove blacklisted device.");
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
						<span className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</span>
						Blacklisted IMEI Registry
					</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1 ml-11">
						Monitor and manage all IMEI numbers blacklisted by vendors across the platform.
					</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Blacklisted</p>
							<h3 className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
								{isLoading ? "..." : metrics.totalBlacklisted}
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
							<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Vendors Reporting</p>
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
						placeholder="Search by IMEI or reason..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-white"
					/>
				</div>
				<p className="text-xs text-zinc-500 dark:text-gray-400 shrink-0">
					{isLoading ? "Loading..." : `${totalCount} total entries`}
				</p>
			</div>

			{/* Table */}
			<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1c1e24]/30 text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider select-none">
								<th className="px-6 py-4">IMEI Number</th>
								<th className="px-6 py-4">Reason</th>
								<th
									className="px-6 py-4 cursor-pointer group"
									onClick={() => handleSort("vendor_id")}
								>
									<div className="flex items-center gap-1">
										Reported By
										{renderSortIcon("vendor_id")}
									</div>
								</th>
								<th
									className="px-6 py-4 cursor-pointer group"
									onClick={() => handleSort("created_at")}
								>
									<div className="flex items-center gap-1">
										Date Added
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
										<td className="px-6 py-4" colSpan={5}>
											<div className="h-5 bg-zinc-200 dark:bg-white/5 rounded w-2/3" />
										</td>
									</tr>
								))
							) : devices.length === 0 ? (
								<tr>
									<td className="px-6 py-16 text-center" colSpan={5}>
										<div className="flex flex-col items-center gap-3">
											<div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
												<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
												</svg>
											</div>
											<p className="text-zinc-500 dark:text-gray-400 font-medium">No blacklisted devices found.</p>
											<p className="text-xs text-zinc-400 dark:text-gray-500">Blacklisted IMEIs will appear here when vendors report them.</p>
										</div>
									</td>
								</tr>
							) : (
								devices.map((device) => (
									<tr key={device.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-2.5">
												<span className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
													<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
													</svg>
												</span>
												<div>
													<p className="font-mono font-bold text-zinc-900 dark:text-white text-sm tracking-wider">{device.imei}</p>
													<p className="text-[10px] text-red-500 dark:text-red-400 font-semibold uppercase tracking-wider mt-0.5">Blacklisted</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 max-w-xs">
											<p className="text-zinc-700 dark:text-gray-300 text-sm line-clamp-2">{device.reason || "No reason provided."}</p>
										</td>
										<td className="px-6 py-4">
											<div>
												<p className="font-semibold text-zinc-900 dark:text-white">{device.vendorName}</p>
												{device.shopName && (
													<p className="text-xs text-indigo-600 dark:text-indigo-400">{device.shopName}</p>
												)}
												<p className="text-xs text-zinc-400 dark:text-gray-500 mt-0.5">{device.vendorEmail}</p>
											</div>
										</td>
										<td className="px-6 py-4 text-zinc-500 dark:text-gray-400 text-xs whitespace-nowrap">
											{device.createdAt
												? new Date(device.createdAt).toLocaleDateString("en-IN", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												  })
												: "N/A"}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2.5">
												<button
													onClick={() => router.push(`/admin/blacklist/${device.id}`)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-600/15 text-zinc-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="View Details"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
												<button
													onClick={() => handleOpenDelete(device)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-600/15 text-zinc-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="Remove from Blacklist"
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
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Remove Blacklisted IMEI</h3>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">
						Are you sure you want to remove IMEI{" "}
						<strong className="font-mono text-zinc-800 dark:text-gray-200">{deleteDevice?.imei}</strong> from the blacklist? This action is irreversible.
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
							{actionLoadingId !== null ? "Removing..." : "Remove"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
