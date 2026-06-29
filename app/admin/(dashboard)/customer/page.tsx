"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/ui/Pagination";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
	getAdminCustomersAction,
	updateAdminCustomerAction,
	deleteAdminCustomerAction
} from "@/actions/admin-customers";
import { KycDocumentUpload } from "@/components/vendor/profile/KycDocumentUpload";

export interface CustomerDetail {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: string;
	totalOrders: number;
	totalSpent: number;
	joinedDate: string;
	address: string;
	profileImg: string | null;
	vendor?: {
		id: string;
		name: string;
		shopName: string;
	} | null;
	kycStatus?: string | null;
	idType?: string | null;
	idNumber?: string | null;
	kycDocumentImg?: string | null;
}

export default function AdminCustomersPage() {
	const router = useRouter();
	const [customers, setCustomers] = useState<CustomerDetail[]>([]);
	const [metrics, setMetrics] = useState({
		totalCustomers: 0,
		activeCustomers: 0,
		totalSpent: 0
	});
	const [isLoading, setIsLoading] = useState(true);

	// Filters and Pagination
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [currentPage, setCurrentPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Loading state for single items
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

	// Edit Modal state
	const [editOpen, setEditOpen] = useState(false);
	const [editCustomer, setEditCustomer] = useState<CustomerDetail | null>(null);
	const [editName, setEditName] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editStatus, setEditStatus] = useState("Active");
	const [editAddress, setEditAddress] = useState("");
	const [editProfileImg, setEditProfileImg] = useState("");
	const [editIdType, setEditIdType] = useState("");
	const [editIdNumber, setEditIdNumber] = useState("");
	const [editKycDocImg, setEditKycDocImg] = useState<string | null>(null);

	// Delete Modal state
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteCustomerObj, setDeleteCustomerObj] = useState<CustomerDetail | null>(null);

	// Fetch Customers function
	const fetchCustomers = async () => {
		setIsLoading(true);
		try {
			const res = await getAdminCustomersAction({
				search: searchQuery,
				status: statusFilter,
				page: currentPage,
				limit,
				sortBy,
				sortOrder
			});
			if (res.success && res.data) {
				setCustomers(res.data.customers || []);
				setTotalCount(res.data.total || 0);
				setTotalPages(Math.ceil((res.data.total || 0) / limit));
				if (res.data.metrics) {
					setMetrics(res.data.metrics);
				}
			}
		} catch (error) {
			console.error("Error fetching customers:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCustomers();
	}, [searchQuery, statusFilter, currentPage, limit, sortBy, sortOrder]);

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

	// Open edit modal
	const handleOpenEdit = (customer: CustomerDetail) => {
		setEditCustomer(customer);
		setEditName(customer.name || "");
		setEditEmail(customer.email || "");
		setEditPhone(customer.phone || "");
		setEditStatus(customer.status || "Active");
		setEditAddress(customer.address || "");
		setEditProfileImg(customer.profileImg || "");
		setEditIdType(customer.idType || "");
		setEditIdNumber(customer.idNumber || "");
		setEditKycDocImg(customer.kycDocumentImg || null);
		setEditOpen(true);
	};

	const handleCloseEdit = () => {
		setEditCustomer(null);
		setEditProfileImg("");
		setEditIdType("");
		setEditIdNumber("");
		setEditKycDocImg(null);
		setEditOpen(false);
	};

	// File upload convert to base64
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setEditProfileImg(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editCustomer) return;
		setActionLoadingId(editCustomer.id);
		try {
			const res = await updateAdminCustomerAction(editCustomer.id, {
				name: editName,
				email: editEmail,
				phone: editPhone,
				status: editStatus,
				address: editAddress,
				profileImg: editProfileImg,
				idType: editIdType || null,
				idNumber: editIdNumber || null,
				kycDocumentImg: editKycDocImg || null,
			});
			if (res.success) {
				handleCloseEdit();
				fetchCustomers();
			} else {
				alert(res.message || "Failed to update customer.");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	// Open Delete Modal
	const handleOpenDelete = (customer: CustomerDetail) => {
		setDeleteCustomerObj(customer);
		setDeleteOpen(true);
	};

	const handleCloseDelete = () => {
		setDeleteCustomerObj(null);
		setDeleteOpen(false);
	};

	const handleDeleteSubmit = async () => {
		if (!deleteCustomerObj) return;
		setActionLoadingId(deleteCustomerObj.id);
		try {
			const res = await deleteAdminCustomerAction(deleteCustomerObj.id);
			if (res.success) {
				handleCloseDelete();
				fetchCustomers();
			} else {
				alert(res.message || "Failed to delete customer.");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setActionLoadingId(null);
		}
	};

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Customer Directory</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">Manage, view details and monitor client transactions globally.</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Customers</p>
					{isLoading ? (
						<div className="h-9 w-20 bg-zinc-200/60 dark:bg-white/5 animate-pulse rounded-lg mt-2" />
					) : (
						<h3 className="text-3xl font-extrabold text-zinc-950 dark:text-white mt-2">
							{metrics.totalCustomers}
						</h3>
					)}
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Active Customers</p>
					{isLoading ? (
						<div className="h-9 w-20 bg-zinc-200/60 dark:bg-white/5 animate-pulse rounded-lg mt-2" />
					) : (
						<h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
							{metrics.activeCustomers}
						</h3>
					)}
				</div>
				<div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13151a] p-6 border border-zinc-200/80 dark:border-white/5 shadow-sm">
					<p className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">Total Spent Globally</p>
					{isLoading ? (
						<div className="h-9 w-32 bg-zinc-200/60 dark:bg-white/5 animate-pulse rounded-lg mt-2" />
					) : (
						<h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
							₹{metrics.totalSpent.toLocaleString()}
						</h3>
					)}
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
						placeholder="Search by name, phone, email..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white"
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
						className="w-full sm:w-40 px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white cursor-pointer"
					>
						<option value="All">All Statuses</option>
						<option value="Active">Active</option>
						<option value="Inactive">Inactive</option>
					</select>
				</div>
			</div>

			{/* Customers Table */}
			<div className="bg-white dark:bg-[#13151a] border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#1c1e24]/30 text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider select-none">
								<th className="px-6 py-4">Customer</th>
								<th className="px-6 py-4">Contact Info</th>
								<th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort("name")}>
									<div className="flex items-center gap-1">
										Vendor Owner
										{renderSortIcon("name")}
									</div>
								</th>
								<th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort("totalSpent")}>
									<div className="flex items-center gap-1">
										Total Spent
										{renderSortIcon("totalSpent")}
									</div>
								</th>
								<th className="px-6 py-4">Orders</th>
								<th className="px-6 py-4">Status</th>
								<th className="px-6 py-4">KYC Status</th>
								<th className="px-6 py-4 cursor-pointer group" onClick={() => handleSort("joinedDate")}>
									<div className="flex items-center gap-1">
										Joined Date
										{renderSortIcon("joinedDate")}
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
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-zinc-200/60 dark:bg-white/5 shrink-0" />
												<div className="space-y-2">
													<div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-28" />
													<div className="h-3 bg-zinc-200/60 dark:bg-white/5 rounded w-36" />
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="space-y-2">
												<div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-28" />
												<div className="h-3 bg-zinc-200/60 dark:bg-white/5 rounded w-36" />
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="space-y-2">
												<div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-24" />
												<div className="h-3 bg-zinc-200/60 dark:bg-white/5 rounded w-16" />
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="h-4 bg-zinc-200/60 dark:bg-white/5 rounded w-16" />
										</td>
										<td className="px-6 py-4">
											<div className="h-6 bg-zinc-200/60 dark:bg-white/5 rounded-full w-20" />
										</td>
										<td className="px-6 py-4">
											<div className="h-6 bg-zinc-200/60 dark:bg-white/5 rounded-full w-16" />
										</td>
										<td className="px-6 py-4">
											<div className="h-6 bg-zinc-200/60 dark:bg-white/5 rounded-full w-24" />
										</td>
										<td className="px-6 py-4">
											<div className="h-3 bg-zinc-200/60 dark:bg-white/5 rounded w-20" />
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2.5">
												<div className="w-8 h-8 rounded-lg bg-zinc-200/60 dark:bg-white/5" />
												<div className="w-8 h-8 rounded-lg bg-zinc-200/60 dark:bg-white/5" />
												<div className="w-8 h-8 rounded-lg bg-zinc-200/60 dark:bg-white/5" />
											</div>
										</td>
									</tr>
								))
							) : customers.length === 0 ? (
								<tr>
									<td className="px-6 py-12 text-center text-zinc-500 dark:text-gray-400" colSpan={9}>
										No customers found matching filters.
									</td>
								</tr>
							) : (
								customers.map((c) => (
									<tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												{c.profileImg ? (
													<img src={c.profileImg} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10" alt="" />
												) : (
													<div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
														{c.name.slice(0, 2).toUpperCase()}
													</div>
												)}
												<div>
													<p className="font-semibold text-zinc-900 dark:text-white">{c.name}</p>
													<p className="text-xs text-zinc-500 dark:text-gray-400 truncate max-w-[180px]">{c.email || "No Email"}</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<p className="text-zinc-900 dark:text-white font-medium">{c.phone}</p>
											<p className="text-xs text-zinc-500 dark:text-gray-400 truncate max-w-[180px]">{c.address || "No Address"}</p>
										</td>
										<td className="px-6 py-4">
											{c.vendor ? (
												<div>
													<p className="font-semibold text-zinc-900 dark:text-white">{c.vendor.name}</p>
													<p className="text-xs text-indigo-600 dark:text-indigo-400">{c.vendor.shopName}</p>
												</div>
											) : (
												<span className="text-zinc-400 dark:text-gray-500 text-xs">Unknown Vendor</span>
											)}
										</td>
										<td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
											₹{c.totalSpent.toLocaleString()}
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-gray-300 border border-zinc-200 dark:border-white/10">
												{c.totalOrders} Orders
											</span>
										</td>
										<td className="px-6 py-4">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
												c.status === "Active"
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
													: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
											}`}>
												{c.status}
											</span>
										</td>
										<td className="px-6 py-4">
											{c.idType || c.kycStatus ? (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
													Uploaded
												</span>
											) : (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-white/10">
													Not Uploaded
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-zinc-500 dark:text-gray-400 text-xs">
											{c.joinedDate}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2.5">
												<button
													onClick={() => router.push(`/admin/customer/${c.id}`)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-600/15 text-zinc-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="View Details"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
 
												<button
													onClick={() => handleOpenEdit(c)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-yellow-50 dark:bg-white/5 dark:hover:bg-yellow-600/15 text-zinc-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="Edit Customer"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
													</svg>
												</button>
 
												<button
													onClick={() => handleOpenDelete(c)}
													className="p-2 rounded-lg bg-zinc-50 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-600/15 text-zinc-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all border border-zinc-200/50 dark:border-white/5 cursor-pointer"
													title="Delete Customer"
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

			{/* Edit Customer Modal */}
			<Modal isOpen={editOpen} onClose={handleCloseEdit} size="lg">
				<div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Edit Customer Profile</h3>
					<p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">Modify account details and details of this client.</p>

					<form onSubmit={handleEditSubmit} className="space-y-4 mt-6">
						{/* Image Uploader */}
						<div className="flex items-center gap-4">
							{editProfileImg ? (
								<img src={editProfileImg} className="w-16 h-16 rounded-full object-cover border border-zinc-200 dark:border-white/10" alt="" />
							) : (
								<div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 text-xs font-semibold border border-dashed border-zinc-300 dark:border-white/10">
									No Image
								</div>
							)}
							<div className="flex flex-col gap-1">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Profile Image</label>
								<input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-zinc-500 dark:text-gray-400" />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Full Name</label>
								<input
									type="text"
									required
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Phone Number</label>
								<PhoneInputField
									value={editPhone}
									onChange={setEditPhone}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Email Address</label>
								<input
									type="email"
									value={editEmail}
									onChange={(e) => setEditEmail(e.target.value)}
									className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Status</label>
								<select
									value={editStatus}
									onChange={(e) => setEditStatus(e.target.value)}
									className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">ID Document Type</label>
								<select
									value={editIdType}
									onChange={(e) => setEditIdType(e.target.value)}
									className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									<option value="">Select ID Type</option>
									<option value="Aadhaar Card">Aadhaar Card</option>
									<option value="PAN Card">PAN Card</option>
									<option value="Voter ID">Voter ID</option>
									<option value="Driving License">Driving License</option>
								</select>
							</div>

							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">ID Document Number</label>
								<input
									type="text"
									value={editIdNumber}
									onChange={(e) => setEditIdNumber(e.target.value)}
									placeholder="e.g. Aadhaar / PAN"
									className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300 block">
								Upload ID Document Copy (Front/Back Image)
							</label>
							<KycDocumentUpload
								name="kyc_document_img"
								value={editKycDocImg || undefined}
								onChange={(base64) => setEditKycDocImg(base64)}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-zinc-700 dark:text-gray-300">Address</label>
							<textarea
								rows={2}
								value={editAddress}
								onChange={(e) => setEditAddress(e.target.value)}
								className="px-3 py-2 text-sm bg-zinc-50 dark:bg-[#0d0e12] border border-zinc-200 dark:border-white/5 rounded-xl text-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
							/>
						</div>

						<div className="flex justify-end gap-3 mt-6">
							<Button type="button" variant="outline" onClick={handleCloseEdit}>Cancel</Button>
							<Button type="submit" disabled={actionLoadingId !== null}>
								{actionLoadingId !== null ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</div>
			</Modal>

			{/* Delete Customer Confirmation Modal */}
			<Modal isOpen={deleteOpen} onClose={handleCloseDelete}>
				<div className="p-6 max-w-sm w-full text-center">
					<div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mx-auto mb-4">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Delete Customer</h3>
					<p className="text-xs text-zinc-500 dark:text-gray-400 mt-2">
						Are you sure you want to delete customer <strong className="text-zinc-800 dark:text-gray-200">{deleteCustomerObj?.name}</strong>? This action is irreversible.
					</p>

					<div className="flex gap-3 mt-6">
						<Button className="flex-1" variant="outline" onClick={handleCloseDelete}>Cancel</Button>
						<Button className="flex-1 bg-red-600 hover:bg-red-500 text-white" disabled={actionLoadingId !== null} onClick={handleDeleteSubmit}>
							{actionLoadingId !== null ? "Deleting..." : "Delete Customer"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
