"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/ui/Pagination";
import { formatDate } from "@/utils/date";
import {
	getAdminMobilesAction,
	getAdminMobileStatsAction,
	deleteAdminMobileAction,
	AdminMobileFilters
} from "@/actions/admin-mobiles";
import { getAdminBrandsAction } from "@/actions/admin-specs";

interface MobileStockItem {
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
	totalUnits?: number;
	brandSlug?: string;
	modelSlug?: string;
	vendor?: {
		id: number;
		name: string;
		email: string;
		shopName: string;
	} | null;
}

interface MobileStats {
	total: number;
	available: number;
	sold: number;
	review: number;
	totalRepairingCost: number;
}

export default function AdminMobilesPage() {
	const router = useRouter();
	const [mobiles, setMobiles] = useState<MobileStockItem[]>([]);
	const [stats, setStats] = useState<MobileStats>({
		total: 0,
		available: 0,
		sold: 0,
		review: 0,
		totalRepairingCost: 0
	});
	const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters and Pagination
	const [searchQuery, setSearchQuery] = useState("");
	const [brandFilter, setBrandFilter] = useState("All");
	const [conditionFilter, setConditionFilter] = useState("All");
	const [currentPage, setCurrentPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Actions state
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<MobileStockItem | null>(null);

	// Fetch Stats
	const fetchStats = async () => {
		try {
			const res = await getAdminMobileStatsAction();
			if (res.success && res.data && res.data.success) {
				setStats(res.data.stats);
			}
		} catch (error) {
			console.error("Error fetching admin mobile stats:", error);
		}
	};

	// Fetch Brands for filtering
	const fetchBrands = async () => {
		try {
			const res = await getAdminBrandsAction({ limit: 100 });
			if (res.success && res.data && res.data.brands) {
				setBrands(res.data.brands);
			}
		} catch (error) {
			console.error("Error fetching brands:", error);
		}
	};

	// Fetch Mobiles list
	const fetchMobiles = useCallback(async () => {
		setIsLoading(true);
		try {
			const filters: AdminMobileFilters = {};
			if (searchQuery) filters.search = searchQuery;
			if (brandFilter !== "All") filters.brand = brandFilter;
			if (conditionFilter !== "All") filters.condition = conditionFilter;
			filters.page = currentPage;
			filters.limit = limit;
			filters.sortBy = sortBy;
			filters.sortOrder = sortOrder;

			const res = await getAdminMobilesAction(filters);
			if (res.success && res.data && res.data.success) {
				setMobiles(res.data.mobiles || []);
				if (res.data.pagination) {
					setTotalCount(res.data.pagination.totalCount);
					setTotalPages(res.data.pagination.totalPages);
				}
			}
		} catch (error) {
			console.error("Error fetching mobiles:", error);
			toast.error("Failed to load mobiles.");
		} finally {
			setIsLoading(false);
		}
	}, [searchQuery, brandFilter, conditionFilter, currentPage, limit, sortBy, sortOrder]);

	useEffect(() => {
		fetchStats();
		fetchBrands();
	}, []);

	useEffect(() => {
		fetchMobiles();
	}, [fetchMobiles]);

	// Handle sort click
	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("desc");
		}
		setCurrentPage(1);
	};

	// Delete stock handler
	const handleDelete = async () => {
		if (!selectedItem) return;
		setActionLoadingId(selectedItem.stockId);
		setDeleteOpen(false);
		try {
			const res = await deleteAdminMobileAction(selectedItem.stockId);
			if (res.success) {
				toast.success("Mobile device deleted from stock successfully.");
				fetchMobiles();
				fetchStats();
			} else {
				toast.error(res.message || "Failed to delete device.");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("An error occurred during deletion.");
		} finally {
			setActionLoadingId(null);
			setSelectedItem(null);
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

	return (
		<div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#0d0e12] p-8 space-y-8">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Mobiles Directory</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400">View and manage all registered mobile device stock listings across all shop vendors.</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
				{/* Total listings */}
				<div className="bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Listings</span>
						<div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
							</svg>
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.total}</span>
						<span className="text-xs text-zinc-500 dark:text-gray-400">active devices</span>
					</div>
				</div>

				{/* Available */}
				<div className="bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Available Stock</span>
						<div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.available}</span>
						<span className="text-xs text-emerald-500 font-semibold">
							{stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}% available
						</span>
					</div>
				</div>

				{/* Sold */}
				<div className="bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Sold</span>
						<div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
							</svg>
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.sold}</span>
						<span className="text-xs text-zinc-500 dark:text-gray-400">completed sales</span>
					</div>
				</div>

				{/* Total Repair Cost */}
				<div className="bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Stock Repair Valuation</span>
						<div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
					</div>
					<div className="mt-3 flex items-baseline gap-2">
						<span className="text-2xl font-bold text-zinc-900 dark:text-white">₹{stats.totalRepairingCost.toLocaleString("en-IN")}</span>
						<span className="text-xs text-amber-500 font-semibold">repair fees</span>
					</div>
				</div>
			</div>

			{/* Filters Panel */}
			<div className="bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
				<div className="flex flex-col lg:flex-row gap-4 items-center">
					{/* Search */}
					<div className="relative w-full lg:flex-1">
						<span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</span>
						<input
							type="text"
							placeholder="Search by IMEI, Brand, Model, Color or Vendor Shop..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 dark:bg-[#0d0e12]/60 border border-zinc-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-800 dark:text-white"
						/>
					</div>

					{/* Brand Select */}
					<div className="w-full lg:w-48">
						<select
							value={brandFilter}
							onChange={(e) => {
								setBrandFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 dark:bg-[#0d0e12]/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-800 dark:text-white cursor-pointer"
						>
							<option value="All">All Brands</option>
							{brands.map((b) => (
								<option key={b.id} value={b.id}>
									{b.name}
								</option>
							))}
						</select>
					</div>



					{/* Condition Select */}
					<div className="w-full lg:w-40">
						<select
							value={conditionFilter}
							onChange={(e) => {
								setConditionFilter(e.target.value);
								setCurrentPage(1);
							}}
							className="w-full bg-zinc-50 dark:bg-[#0d0e12]/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-zinc-800 dark:text-white cursor-pointer"
						>
							<option value="All">All Conditions</option>
							<option value="NEW">New</option>
							<option value="OLD">Old</option>
						</select>
					</div>
				</div>
			</div>

			{/* Mobiles Card Grid */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm">
					<svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					<span className="text-sm text-zinc-500 dark:text-gray-400">Loading mobile devices...</span>
				</div>
			) : mobiles.length === 0 ? (
				<div className="text-center py-20 bg-white dark:bg-[#13151a]/40 border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm text-sm text-zinc-500 dark:text-gray-400">
					No mobile devices registered in stock found matching filters.
				</div>
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{mobiles.map((item) => (
							<div
								key={item.id}
								className="p-6 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-white dark:bg-[#13151a]/40 hover:bg-zinc-50/50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm flex flex-col justify-between group"
							>
								<div className="space-y-4">
									<div className="flex justify-between items-start">
										<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 uppercase tracking-wider">
											{item.brand}
										</span>
										<span className="text-[10px] text-zinc-400 font-bold tracking-widest font-mono">
											{item.totalUnits || 0} UNITS
										</span>
									</div>

									<div>
										<h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
											{item.brand} {item.model}
										</h3>
										<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1.5 font-medium">
											{item.storage} • {item.ram} RAM • {item.color}
										</p>
									</div>

									<div className="py-2.5 border-t border-b border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-gray-400">
										<span>Condition:</span>
										<span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
											item.condition === "NEW" 
												? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" 
												: "bg-orange-500/10 text-orange-500 border-orange-500/20"
										}`}>
											{item.condition}
										</span>
									</div>
								</div>

								<Button
									variant="outline"
									onClick={() => router.push(`/admin/mobiles/${item.brandSlug || 'unknown'}/${item.modelSlug || 'unknown'}`)}
									className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all duration-300 cursor-pointer"
								>
									View Devices
								</Button>
							</div>
						))}
					</div>

					{/* Pagination */}
					{!isLoading && totalPages > 1 && (
						<div className="px-6 py-4 border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#13151a]/40 rounded-2xl flex items-center justify-between shadow-sm">
							<span className="text-xs text-zinc-500 dark:text-gray-400">
								Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} mobile devices
							</span>
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
			)}

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={deleteOpen}
				onClose={() => {
					setDeleteOpen(false);
					setSelectedItem(null);
				}}
				title="Remove Stock Entry"
			>
				<div className="space-y-4">
					<p className="text-sm text-zinc-500 dark:text-gray-400 leading-relaxed">
						Are you sure you want to remove the <strong className="text-zinc-900 dark:text-white">{selectedItem?.brand} {selectedItem?.model}</strong> stock listing for shop <strong className="text-zinc-900 dark:text-white">{selectedItem?.vendor?.shopName}</strong>? This action will delete the item from the active inventory.
					</p>
					<div className="flex justify-end gap-3 pt-2">
						<Button
							variant="outline"
							onClick={() => {
								setDeleteOpen(false);
								setSelectedItem(null);
							}}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							variant="danger"
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
						>
							Delete Stock Listing
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
