"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
import { ProfileImageUpload } from "@/components/vendor/profile/ProfileImageUpload";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
	useDashboard,
	Customer,
	PurchaseHistoryItem,
} from "@/context/vendor/dashboard-context";
import { toast as hotToast } from "react-hot-toast";
import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";

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

/* ── Status badge colours ── */
const statusBadge = (status: Customer["status"]) =>
	status === "Active"
		? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
		: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-400/20";

const orderStatusStyle = (s: PurchaseHistoryItem["status"]) => {
	const map: Record<PurchaseHistoryItem["status"], string> = {
		Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
		Shipped: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
		Processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
		Cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
	};
	return map[s];
};

/* ══════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function CustomerDetailPage() {
	const router = useRouter();
	const params = useParams();
	const customerId = params.id as string;

	const { customers, editCustomer, removeCustomer } = useDashboard();
	const customer = customers.find((c) => c.id === customerId);

	/* ── Local state for the page ── */
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	/* Edit form fields */
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
		hotToast.success(msg);
	};

	/* ── Not found guard ── */
	if (!customer) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fadeIn">
				<div className="text-5xl">😕</div>
				<h2 className="text-xl font-bold text-zinc-900 dark:text-white">
					Customer Not Found
				</h2>
				<p className="text-zinc-500 text-sm">
					No customer with ID{" "}
					<span className="font-mono font-bold">{customerId}</span>{" "}
					was found.
				</p>
				<Button variant="primary" onClick={() => router.back()}>
					← Go Back
				</Button>
			</div>
		);
	}

	const initials = customer.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	const avgTicket =
		customer.totalOrders > 0
			? Math.round(customer.totalSpent / customer.totalOrders)
			: 0;
	const profileImgUrl = customer.profileImg || (customer as any).profile_img;

	const handleSaveEdit = async (e: React.FormEvent) => {
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
				hotToast.error("Form validation failed.");
			}
			return;
		}

		const result = await editCustomer(customerId, {
			name: formName,
			email: formEmail || null,
			phone: formPhone,
			status: formStatus,
			address: formAddress || null,
			profileImg: formProfileImg || null,
		});
		if (result.success) {
			setIsEditModalOpen(false);
			triggerToast("Customer profile updated successfully.");
		} else {
			hotToast.error(
				result.message || "Failed to update customer profile.",
			);
		}
	};

	const handleOpenEdit = () => {
		setFormName(customer.name);
		setFormEmail(customer.email || "");
		setFormPhone(customer.phone);
		setFormStatus(customer.status);
		setFormAddress(customer.address || "");
		setFormProfileImg(profileImgUrl || null);
		setIsEditModalOpen(true);
	};

	const handleDelete = () => {
		setIsConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		const success = await removeCustomer(customerId);
		if (success) {
			router.push("/customer");
		} else {
			hotToast.error("Failed to delete customer.");
		}
		setIsConfirmOpen(false);
	};

	return (
		<>
			{/* Edit Modal */}
			<Modal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				title={`Edit Customer: ${customer.name}`}
				size="lg"
			>
				<form
					onSubmit={handleSaveEdit}
					noValidate
					className="space-y-4"
				>
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
								Email (optional)
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
								Phone *
							</label>
							<PhoneInputField
								id="detail-phone"
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
							Status
						</label>
						<select
							value={formStatus}
							onChange={(e) =>
								setFormStatus(
									e.target.value as "Active" | "Inactive",
								)
							}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						>
							<option value="Active">Active Account</option>
							<option value="Inactive">
								Inactive / Suspended
							</option>
						</select>
					</div>
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Address
						</label>
						<textarea
							value={formAddress}
							onChange={(e) => setFormAddress(e.target.value)}
							rows={2}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setIsEditModalOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="gradient" size="sm">
							Save Changes
						</Button>
					</div>
				</form>
			</Modal>

			{/* ─── PAGE BODY ─── */}
			<div className="space-y-8 animate-fadeIn pb-10">
				{/* ── Back nav ── */}
				<button
					onClick={() => router.push("/customer")}
					className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group cursor-pointer"
				>
					<svg
						className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth="2.5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Customers
				</button>

				{/* ── Hero Header Card ── */}
				<div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 shadow-sm">
					{/* Decorative gradient blob */}
					<div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl pointer-events-none" />

					<div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
						{/* Avatar */}
						{profileImgUrl ? (
							<img
								src={profileImgUrl}
								alt={customer.name}
								className="h-20 w-20 rounded-2xl object-cover shadow-xl border border-white dark:border-zinc-800 shrink-0"
							/>
						) : (
							<div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-primary/20 flex-shrink-0">
								{initials}
							</div>
						)}

						{/* Info */}
						<div className="flex-1 space-y-1.5">
							<div className="flex flex-wrap items-center gap-2.5">
								<span
									className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadge(customer.status)}`}
								>
									{customer.status}
								</span>
								<span className="text-xs text-zinc-400 font-medium">
									Member since{" "}
									{new Date(
										customer.joinedDate,
									).toLocaleDateString("en-IN", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>
							<h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight">
								{customer.name}
							</h1>
							<div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
								<span className="flex items-center gap-1.5">
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
									{customer.email || "No email specified"}
								</span>
								<span className="flex items-center gap-1.5">
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548A1 1 0 0119 17V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
									{customer.phone}
								</span>
								{customer.address && (
									<span className="flex items-center gap-1.5">
										<svg
											className="w-4 h-4 flex-shrink-0"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										{customer.address}
									</span>
								)}
							</div>
						</div>

						{/* Action buttons */}
						<div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
							<Button
								variant="gradient"
								size="sm"
								onClick={handleOpenEdit}
							>
								<svg
									className="w-4 h-4 mr-1.5"
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
								Edit Profile
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleDelete}
								className="border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-500/10"
							>
								<svg
									className="w-4 h-4 mr-1.5"
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
								Delete
							</Button>
						</div>
					</div>
				</div>

				{/* ── Stats Row ── */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{
							label: "Total Orders",
							value: customer.totalOrders,
							icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
							color: "text-primary",
						},
						{
							label: "Total Spent",
							value: `₹${customer.totalSpent.toLocaleString()}`,
							icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
							color: "text-emerald-500",
						},
						{
							label: "Avg Ticket",
							value: `₹${avgTicket.toLocaleString()}`,
							icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
							color: "text-secondary",
						},
						{
							label: "Account Status",
							value: customer.status,
							icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
							color:
								customer.status === "Active"
									? "text-emerald-500"
									: "text-zinc-400",
						},
					].map((stat) => (
						<div
							key={stat.label}
							className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md space-y-3"
						>
							<div
								className={`w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${stat.color}`}
							>
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="1.8"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d={stat.icon}
									/>
								</svg>
							</div>
							<div>
								<div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
									{stat.label}
								</div>
								<div
									className="text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5"
									suppressHydrationWarning
								>
									{stat.value}
								</div>
							</div>
						</div>
					))}
				</div>

				{/* ── Main Content Grid ── */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* ── Purchase History (2/3 width) ── */}
					<div className="lg:col-span-2 space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-bold text-zinc-900 dark:text-white">
								Purchase History
							</h2>
							<span className="text-xs text-zinc-400 font-semibold">
								{customer.purchases.length} transaction
								{customer.purchases.length !== 1 ? "s" : ""}
							</span>
						</div>

						{customer.purchases.length > 0 ? (
							<div className="space-y-3">
								{customer.purchases.map((p, i) => (
									<div
										key={p.id}
										className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md flex items-center gap-4 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
									>
										{/* Timeline dot */}
										<div className="flex flex-col items-center gap-1 flex-shrink-0">
											<div
												className={`w-3 h-3 rounded-full border-2 ${p.type === "Exchange" ? "border-cyan-500 bg-cyan-500/20" : "border-primary bg-primary/20"}`}
											/>
											{i <
												customer.purchases.length -
													1 && (
												<div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-800" />
											)}
										</div>

										<div className="flex-1 min-w-0">
											<div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
												{p.device}
											</div>
											<div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1 font-semibold">
												<span className="font-mono">
													{p.id}
												</span>
												<span>•</span>
												<span suppressHydrationWarning>
													{new Date(
														p.date,
													).toLocaleDateString(
														"en-IN",
														{
															day: "numeric",
															month: "short",
															year: "numeric",
														},
													)}
												</span>
												<span>•</span>
												<span
													className={`font-bold ${p.type === "Exchange" ? "text-cyan-500" : "text-emerald-500"}`}
												>
													{p.type}
												</span>
											</div>
										</div>

										<div className="text-right flex-shrink-0">
											<div
												className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50"
												suppressHydrationWarning
											>
												₹{p.amount.toLocaleString()}
											</div>
											<span
												className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${orderStatusStyle(p.status)}`}
											>
												{p.status}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center gap-3">
								<svg
									className="w-10 h-10 text-zinc-300 dark:text-zinc-700"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
									/>
								</svg>
								<p className="text-sm font-semibold text-zinc-400">
									No transactions yet
								</p>
								<p className="text-xs text-zinc-300 dark:text-zinc-600">
									This customer hasn&apos;t made any
									purchases.
								</p>
							</div>
						)}
					</div>

					{/* ── Sidebar (1/3 width): Notes + Contact ── */}
					<div className="space-y-5">
						{/* Contact Details Card */}
						<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md space-y-4">
							<h3 className="text-sm font-bold text-zinc-900 dark:text-white">
								Contact Details
							</h3>
							<div className="space-y-3">
								{[
									{
										icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
										label: "Email",
										value:
											customer.email ||
											"No email specified",
									},
									{
										icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548A1 1 0 0119 17V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
										label: "Phone",
										value: customer.phone,
									},
									{
										icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
										label: "Address",
										value: customer.address || "—",
									},
								].map(({ icon, label, value }) => (
									<div
										key={label}
										className="flex items-start gap-3"
									>
										<div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
											<svg
												className="w-4 h-4 text-zinc-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												strokeWidth="1.8"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d={icon}
												/>
											</svg>
										</div>
										<div>
											<div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
												{label}
											</div>
											<div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 break-words">
												{value}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Quick Actions Card */}
						<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md space-y-3">
							<h3 className="text-sm font-bold text-zinc-900 dark:text-white">
								Quick Actions
							</h3>
							<div className="space-y-2">
								<button
									onClick={handleOpenEdit}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left group cursor-pointer"
								>
									<span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
										<svg
											className="w-4 h-4 text-primary"
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
									</span>
									<span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
										Edit Profile
									</span>
								</button>
								<button
									onClick={() => router.push(`/trades`)}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left group cursor-pointer"
								>
									<span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
										<svg
											className="w-4 h-4 text-cyan-500"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth="2"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
											/>
										</svg>
									</span>
									<span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
										View Trades
									</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={customer.name}
				warningText="This action cannot be undone."
			/>
		</>
	);
}
