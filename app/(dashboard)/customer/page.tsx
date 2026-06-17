"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
import { useDashboard, Customer } from "@/context/vendor/dashboard-context";
import { ProfileImageUpload } from "@/components/vendor/profile/ProfileImageUpload";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { toast } from "react-hot-toast";
import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";
import { DataTable, Column } from "@/components/ui/DataTable";

const customerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name is required."),
	email: yup
		.string()
		.trim()
		.transform((value) => (value === "" ? null : value))
		.email("Please enter a valid email address.")
		.nullable()
		.notRequired(),
	phone: yup
		.string()
		.trim()
		.required("Phone Number is required.")
		.test(
			"is-valid-phone",
			"Please enter a valid international phone number.",
			(value) => !!value && isValidPhoneNumber(value),
		),
	status: yup
		.string()
		.oneOf(
			["Active", "Inactive"],
			"Status must be either Active or Inactive.",
		)
		.required(),
	address: yup.string().trim().nullable().notRequired(),
});

export default function CustomerPage() {
	const router = useRouter();
	const {
		customers,
		metrics,
		isLoading,
		refreshCustomers,
		addCustomer,
		editCustomer,
		removeCustomer,
	} = useDashboard();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [spentFilter, setSpentFilter] = useState("All");
	const [sortBy, setSortBy] = useState<"name" | "totalSpent" | "joinedDate">(
		"name",
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Modal states
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
		null,
	);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [deletingCustomer, setDeletingCustomer] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	React.useEffect(() => {
		refreshCustomers({
			search: debouncedSearchTerm,
			status: statusFilter,
			spent: spentFilter,
			sortBy,
			sortOrder,
		});
	}, [debouncedSearchTerm, statusFilter, spentFilter, sortBy, sortOrder]);

	// Form Fields
	const [formName, setFormName] = useState("");
	const [formEmail, setFormEmail] = useState("");
	const [formPhone, setFormPhone] = useState("");
	const [formStatus, setFormStatus] = useState<"Active" | "Inactive">(
		"Active",
	);
	const [formAddress, setFormAddress] = useState("");
	const [formProfileImg, setFormProfileImg] = useState<string | null>(null);

	// Field-level validation errors
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});

	const triggerToast = (msg: string) => {
		toast.success(msg);
	};

	const handleOpenAdd = () => {
		setEditingCustomer(null);
		setFormName("");
		setFormEmail("");
		setFormPhone("");
		setFormStatus("Active");
		setFormAddress("");
		setFormProfileImg(null);
		setIsFormOpen(true);
	};

	const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
		e?.stopPropagation();
		setEditingCustomer(customer);
		setFormName(customer.name);
		setFormEmail(customer.email || "");
		setFormPhone(customer.phone);
		setFormStatus(customer.status);
		setFormAddress(customer.address || "");
		setFormProfileImg(
			customer.profileImg || (customer as any).profile_img || null,
		);
		setIsFormOpen(true);
	};

	const handleOpenDetails = (customer: Customer) => {
		router.push(`/customer/${customer.id}`);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});

		try {
			await customerSchema.validate(
				{
					name: formName,
					email: formEmail || null,
					phone: formPhone,
					status: formStatus,
					address: formAddress || null,
				},
				{ abortEarly: false },
			);
		} catch (err: any) {
			if (err instanceof yup.ValidationError) {
				const errors: Record<string, string> = {};
				err.inner.forEach((validationError: any) => {
					if (validationError.path && !errors[validationError.path]) {
						errors[validationError.path] = validationError.message;
					}
					// All field errors shown inline — no toast spam
				});
				setFieldErrors(errors);
			} else {
				toast.error("Form validation failed.");
			}
			return;
		}

		if (editingCustomer) {
			// Edit Customer
			const result = await editCustomer(editingCustomer.id, {
				name: formName,
				email: formEmail || null,
				phone: formPhone,
				status: formStatus,
				address: formAddress || null,
				profileImg: formProfileImg || null,
			});
			if (result.success) {
				triggerToast(`Updated profile of ${formName}`);
				setIsFormOpen(false);
			} else {
				toast.error(
					result.message || "Failed to update customer profile.",
				);
			}
		} else {
			// Add Customer
			const result = await addCustomer({
				name: formName,
				email: formEmail || null,
				phone: formPhone,
				status: formStatus,
				address: formAddress || null,
				profile_img: formProfileImg || null,
			});
			if (result.success) {
				triggerToast(`Successfully registered ${formName}`);
				setIsFormOpen(false);
			} else {
				toast.error(result.message || "Failed to register customer.");
			}
		}
	};

	const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		setDeletingCustomer({ id, name });
		setIsConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingCustomer) return;
		const { id, name } = deletingCustomer;
		const success = await removeCustomer(id);
		if (success) {
			triggerToast(`Deleted customer ${name}`);
		} else {
			toast.error("Failed to delete customer.");
		}
		setIsConfirmOpen(false);
		setDeletingCustomer(null);
	};

	const handleSort = (field: "name" | "totalSpent" | "joinedDate") => {
		if (sortBy === field) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	// Metrics calculations
	const totalCustomers = metrics?.totalCustomers || 0;
	const activeCustomers = metrics?.activeCustomers || 0;
	const totalSpentAll = metrics?.totalSpent || 0;
	const averageLTV =
		totalCustomers > 0 ? Math.round(totalSpentAll / totalCustomers) : 0;

	const filteredCustomers = customers;

	const getSortDir = (colKey: string) => {
		if (sortBy === colKey) return sortOrder;
		return null;
	};

	const columns: Column<Customer>[] = [
		{
			key: "name",
			title: "Customer Details",
			sortable: true,
			render: (cust) => {
				const profileImgUrl = cust.profileImg || (cust as any).profile_img;
				return (
					<div className="flex items-center gap-3">
						{profileImgUrl ? (
							<img
								src={profileImgUrl}
								alt={cust.name}
								className="h-9 w-9 rounded-xl object-cover shadow-sm shrink-0 border border-zinc-200 dark:border-zinc-800"
							/>
						) : (
							<div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0 uppercase">
								{cust.name
									.split(" ")
									.map((n) => n[0])
									.join("")
									.slice(0, 2)}
							</div>
						)}
						<div>
							<div className="font-bold text-zinc-900 dark:text-white leading-tight">
								{cust.name}
							</div>
							<div className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px] truncate">
								{cust.address
									? cust.address.split(",")[0]
									: "No address specified"}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			key: "phone",
			title: "Contact Info",
			sortable: false,
			render: (cust) => (
				<>
					<div className="text-zinc-700 dark:text-zinc-300 font-medium">
						{cust.phone}
					</div>
					<div className="text-xs text-zinc-400 mt-0.5">
						{cust.email || "—"}
					</div>
				</>
			),
		},
		{
			key: "totalOrders",
			title: "Orders",
			sortable: false,
			headerClassName: "text-center",
			className: "text-center font-bold text-zinc-700 dark:text-zinc-300",
		},
		{
			key: "totalSpent",
			title: "Total Spent",
			sortable: true,
			headerClassName: "text-right",
			className: "text-right font-extrabold text-zinc-900 dark:text-zinc-100",
			render: (cust) => (
				<span suppressHydrationWarning>
					₹{cust.totalSpent.toLocaleString()}
				</span>
			),
		},
		{
			key: "joinedDate",
			title: "Joined",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium",
			render: (cust) => (
				<span>
					{new Date(cust.joinedDate).toLocaleDateString("en-IN", {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}
				</span>
			),
		},
		{
			key: "status",
			title: "Status",
			sortable: false,
			headerClassName: "text-center",
			className: "text-center",
			render: (cust) => (
				<span
					className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
						cust.status === "Active"
							? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
							: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
					}`}
				>
					{cust.status}
				</span>
			),
		},
		{
			key: "actions",
			title: "Actions",
			sortable: false,
			headerClassName: "text-center",
			className: "text-center",
			render: (cust) => (
				<div className="flex items-center justify-center gap-2">
					<button
						onClick={() => handleOpenDetails(cust)}
						className="p-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary transition-colors cursor-pointer"
						title="View customer details"
					>
						<svg
							className="w-4.5 h-4.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					</button>
					<button
						onClick={(e) => handleOpenEdit(cust, e)}
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
						title="Edit profile"
					>
						<svg
							className="w-4.5 h-4.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
					</button>
					<button
						onClick={(e) => handleDelete(cust.id, cust.name, e)}
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
						title="Delete customer"
					>
						<svg
							className="w-4.5 h-4.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			),
		},
	];

	return (
		<>
			<div className="space-y-8 animate-fadeIn">
				{/* METRICS PANEL */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{/* Metric 1 */}
					<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
						<div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
						<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
							Total Customers
						</span>
						<div className="flex items-baseline gap-2 mt-2">
							<span className="text-2xl font-extrabold tracking-tight">
								{totalCustomers}
							</span>
							<span className="text-xs text-zinc-400 dark:text-zinc-500">
								Registered
							</span>
						</div>
						<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2.5"
									d="M5 10l7-7m0 0l7 7m-7-7v18"
								/>
							</svg>
							<span>+15% Growth rate</span>
						</div>
					</div>

					{/* Metric 2 */}
					<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
						<div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
						<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
							Active Accounts
						</span>
						<div className="flex items-baseline gap-2 mt-2">
							<span className="text-2xl font-extrabold tracking-tight">
								{activeCustomers}
							</span>
							<span className="text-xs text-zinc-400 dark:text-zinc-500">
								Engaged this month
							</span>
						</div>
						<div className="text-xs text-zinc-400 mt-3 flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
							<span>
								{totalCustomers > 0
									? Math.round(
										  (activeCustomers / totalCustomers) *
											  100,
									  )
									: 0}
								% Active index
							</span>
						</div>
					</div>

					{/* Metric 3 */}
					<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
						<div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
						<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
							Customer Sales Value
						</span>
						<div className="flex items-baseline gap-2 mt-2">
							<span
								className="text-2xl font-extrabold tracking-tight"
								suppressHydrationWarning
							>
								₹{totalSpentAll.toLocaleString()}
							</span>
						</div>
						<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2.5"
									d="M5 10l7-7m0 0l7 7m-7-7v18"
								/>
							</svg>
							<span>Lifetime transaction volume</span>
						</div>
					</div>

					{/* Metric 4 */}
					<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
						<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
						<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
							Avg Customer LTV
						</span>
						<div className="flex items-baseline gap-2 mt-2">
							<span
								className="text-2xl font-extrabold tracking-tight"
								suppressHydrationWarning
							>
								₹{averageLTV.toLocaleString()}
							</span>
							<span className="text-xs text-zinc-400 dark:text-zinc-500">
								Per client
							</span>
						</div>
						<div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2.5"
									d="M5 10l7-7m0 0l7 7m-7-7v18"
								/>
							</svg>
							<span>Premium tier rating</span>
						</div>
					</div>
				</div>

				{/* FILTER & DATA CONTROLS HEADER */}
				<div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
					<div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
						{/* Search bar */}
						<div className="relative w-full lg:w-96">
							<span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</span>
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search by name, email, phone or ID..."
								className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
						</div>

						{/* Filtering buttons */}
						<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
							<select
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value)
								}
								className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							>
								<option value="All">All Statuses</option>
								<option value="Active">Active Accounts</option>
								<option value="Inactive">
									Inactive Accounts
								</option>
							</select>

							<select
								value={spentFilter}
								onChange={(e) => setSpentFilter(e.target.value)}
								className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							>
								<option value="All">All Spending Tiers</option>
								<option value="High">
									Premium (&ge; ₹50k)
								</option>
								<option value="Low">
									Standard (&lt; ₹50k)
								</option>
							</select>

							<Button
								variant="gradient"
								size="sm"
								onClick={handleOpenAdd}
							>
								<span className="flex items-center gap-2">
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth="2.5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M12 4v16m8-8H4"
										/>
									</svg>
									Register Customer
								</span>
							</Button>
						</div>
					</div>
				</div>

				{/* CUSTOMER DATATABLE */}
				<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
					<DataTable
						columns={columns}
						data={filteredCustomers}
						loading={isLoading}
						onSort={handleSort}
						sortDir={getSortDir}
						emptyMessage={
							<div className="text-center py-16 space-y-3">
								<div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
									<svg
										className="w-6 h-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								</div>
								<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
									No Customers Found
								</h4>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
									We couldn&apos;t find any customers matching
									&quot;{searchTerm}&quot;. Try refining your
									search query or clear filters.
								</p>
								<div className="pt-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSearchTerm("");
											setStatusFilter("All");
											setSpentFilter("All");
										}}
									>
										Clear All Filters
									</Button>
								</div>
							</div>
						}
					/>

					{/* DataTable Footer Controls */}
					<div className="px-6 py-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850/40 text-xs text-zinc-400 font-semibold bg-zinc-50/20 dark:bg-zinc-900/10 select-none">
						<span>
							Showing {filteredCustomers.length} of{" "}
							{customers.length} customer records
						</span>
						<div className="flex gap-2">
							<button
								disabled
								className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed"
							>
								Previous
							</button>
							<button
								disabled
								className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* ADD / EDIT CUSTOMER MODAL */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingCustomer
						? `Edit Customer: ${editingCustomer.name}`
						: "Register New Customer"
				}
				size="lg"
			>
				<form onSubmit={handleSubmit} noValidate className="space-y-4">
					{/* Profile Image Select */}
					<div className="flex flex-col items-center pb-2">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
							Profile Image
						</label>
						<ProfileImageUpload
							name="profile_img"
							value={formProfileImg || undefined}
							onChange={(base64) => setFormProfileImg(base64)}
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Full Name *
						</label>
						<input
							type="text"
							value={formName}
							onChange={(e) => {
								setFormName(e.target.value);
								clearFieldError("name");
							}}
							placeholder="e.g. Ramesh Kumar"
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
								fieldErrors.name
									? "border-red-400 focus:ring-red-400"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
							}`}
						/>
						{fieldErrors.name && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{fieldErrors.name}
							</p>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Email Address (optional)
							</label>
							<input
								type="email"
								value={formEmail}
								onChange={(e) => {
									setFormEmail(e.target.value);
									clearFieldError("email");
								}}
								placeholder="e.g. ramesh@gmail.com"
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
									fieldErrors.email
										? "border-red-400 focus:ring-red-400"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
								}`}
							/>
							{fieldErrors.email && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.email}
								</p>
							)}
						</div>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Phone Number *
							</label>
							<PhoneInputField
								id="customer-phone"
								value={formPhone}
								onChange={(val) => {
									setFormPhone(val);
									clearFieldError("phone");
								}}
								error={fieldErrors.phone}
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Account Status
						</label>
						<select
							value={formStatus}
							onChange={(e) =>
								setFormStatus(
									e.target.value as "Active" | "Inactive",
								)
							}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						>
							<option value="Active">Active Account</option>
							<option value="Inactive">
								Inactive / Suspended
							</option>
						</select>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Shipping Address
						</label>
						<textarea
							value={formAddress}
							onChange={(e) => setFormAddress(e.target.value)}
							placeholder="Street, Landmark, City, State, Pincode"
							rows={2}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setIsFormOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="gradient" size="sm">
							{editingCustomer
								? "Save Customer Profile"
								: "Register Customer"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingCustomer?.name || ""}
				warningText="This action cannot be undone."
			/>
		</>
	);
}
