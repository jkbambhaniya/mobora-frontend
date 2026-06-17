"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/vendor/auth-context";
import { updateProfileAction, changePasswordAction } from "@/actions/auth";
import { ProfileImageUpload } from "@/components/vendor/profile/ProfileImageUpload";
import { AccountDetails } from "@/components/vendor/profile/AccountDetails";
import { BusinessDetails } from "@/components/vendor/profile/BusinessDetails";
import { SecuritySettings } from "@/components/vendor/profile/SecuritySettings";
import { toast } from "react-hot-toast";

type TabType = "account" | "business" | "security";

export default function ProfilePage() {
	const { vendor, isLoadingVendor, setVendor } = useAuth();
	const [activeTab, setActiveTab] = useState<TabType>("account");
	const [actionLoading, setActionLoading] = useState(false);

	const triggerToast = (
		message: string,
		type: "success" | "error" = "success",
	) => {
		if (type === "success") {
			toast.success(message);
		} else {
			toast.error(message);
		}
	};

	if (isLoadingVendor) {
		return (
			<div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
				<svg
					className="animate-spin h-8 w-8 text-primary"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					></circle>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<span className="text-xs text-zinc-400 mt-3 font-semibold animate-pulse">
					Loading Profile...
				</span>
			</div>
		);
	}

	if (!vendor) {
		return (
			<div className="p-6 text-center text-red-500 font-bold">
				Profile data unavailable. Please sign in again.
			</div>
		);
	}

	// Handle Account Info Submission
	const handleAccountSubmit = async (data: {
		name: string;
		email: string;
	}) => {
		setActionLoading(true);
		try {
			const response = await updateProfileAction({
				name: data.name,
				email: data.email,
			});
			if (response.success && response.data?.success) {
				setVendor(response.data.vendor);
				triggerToast("Account details updated successfully.");
			} else {
				triggerToast(
					response.errorData?.message ||
						"Failed to update account details.",
					"error",
				);
			}
		} catch (err: any) {
			triggerToast("An unexpected error occurred.", "error");
		} finally {
			setActionLoading(false);
		}
	};

	// Handle Business Info Submission
	const handleBusinessSubmit = async (data: {
		shop_name: string;
		phone: string;
		address: string;
		payment_methods: string;
	}) => {
		setActionLoading(true);
		try {
			const response = await updateProfileAction({
				shop_name: data.shop_name,
				phone: data.phone,
				address: data.address,
				payment_methods: data.payment_methods,
			});
			if (response.success && response.data?.success) {
				setVendor(response.data.vendor);
				triggerToast("Business details updated successfully.");
			} else {
				triggerToast(
					response.errorData?.message ||
						"Failed to update business details.",
					"error",
				);
			}
		} catch (err: any) {
			triggerToast("An unexpected error occurred.", "error");
		} finally {
			setActionLoading(false);
		}
	};

	// Handle Profile Image Submission
	const handleImageChange = async (base64String: string | null) => {
		setActionLoading(true);
		try {
			const response = await updateProfileAction({
				profile_img: base64String,
			});
			if (response.success && response.data?.success) {
				setVendor(response.data.vendor);
				triggerToast(
					base64String
						? "Profile image uploaded successfully."
						: "Profile image removed.",
				);
			} else {
				triggerToast(
					response.errorData?.message ||
						"Failed to update profile image.",
					"error",
				);
			}
		} catch (err: any) {
			triggerToast("An unexpected error occurred.", "error");
		} finally {
			setActionLoading(false);
		}
	};

	// Handle Password Change Submission
	const handlePasswordSubmit = async (data: any) => {
		setActionLoading(true);
		try {
			const response = await changePasswordAction(data);
			if (response.success && response.data?.success) {
				triggerToast("Password changed successfully.");
			} else {
				triggerToast(
					response.errorData?.message ||
						"Failed to change password. Make sure current password is correct.",
					"error",
				);
			}
		} catch (err: any) {
			triggerToast("An unexpected error occurred.", "error");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className="space-y-6 animate-fadeIn pb-12">
			{/* Double Column Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
				{/* Left Column - Sticky Profile Widget */}
				<div className="lg:col-span-4 bg-white dark:bg-zinc-900/30 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl shadow-zinc-200/80 dark:shadow-none border-0">
					{/* Accent Header Banner */}
					<div className="h-24 bg-gradient-to-r from-primary/10 via-secondary/15 to-primary/5 dark:from-primary/20 dark:via-secondary/25 dark:to-primary/10 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
						<div className="absolute -bottom-8 left-8 w-20 h-20 bg-secondary/10 rounded-full blur-xl" />
					</div>

					<div className="p-6 pt-0 relative flex flex-col items-center text-center">
						{/* Avatar overlapping the banner */}
						<div className="-mt-12 mb-4 relative z-10">
							<ProfileImageUpload
								name="profile_img"
								value={vendor.profile_img}
								onChange={handleImageChange}
							/>
						</div>

						<div className="space-y-1">
							<h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
								{vendor.name}
							</h2>
							<p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
								{vendor.email}
							</p>
							<div className="inline-flex items-center gap-1.2 mt-2 px-2.5 py-0.8 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
								<span className="h-1.2 w-1.2 rounded-full bg-emerald-500" />
								{vendor.status} vendor account
							</div>
						</div>

						{/* Vertical Menu Buttons */}
						<nav className="w-full mt-8 flex flex-col gap-1.5">
							{(
								["account", "business", "security"] as TabType[]
							).map((tab) => {
								const isActive = activeTab === tab;
								const getLabel = () => {
									if (tab === "account")
										return "Account Details";
									if (tab === "business")
										return "Business Profile";
									return "Login Security";
								};
								const getIcon = () => {
									if (tab === "account") {
										return (
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
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
										);
									}
									if (tab === "business") {
										return (
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
													d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
												/>
											</svg>
										);
									}
									return (
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
												d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
											/>
										</svg>
									);
								};

								return (
									<button
										key={tab}
										onClick={() => setActiveTab(tab)}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
											isActive
												? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-inner font-extrabold"
												: "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
										}`}
									>
										<span
											className={`${isActive ? "text-primary dark:text-secondary" : "text-zinc-400"}`}
										>
											{getIcon()}
										</span>
										<span>{getLabel()}</span>
									</button>
								);
							})}
						</nav>
					</div>
				</div>

				{/* Right Column - Main Active Form Panel */}
				<div className="lg:col-span-8 bg-white dark:bg-zinc-900/30 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl shadow-zinc-200/80 dark:shadow-none border-0">
					{/* Dynamic Tab Panel */}
					<div className="animate-fadeIn">
						{activeTab === "account" && (
							<div className="space-y-6">
								<div>
									<h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
										Personal Account Details
									</h3>
									<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
										Manage your user registration
										credentials.
									</p>
								</div>
								<AccountDetails
									initialData={{
										name: vendor.name,
										email: vendor.email,
									}}
									onSubmit={handleAccountSubmit}
									isLoading={actionLoading}
								/>
							</div>
						)}

						{activeTab === "business" && (
							<div className="space-y-6">
								<div>
									<h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
										Business / Store Profile
									</h3>
									<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
										Configure public contact details and
										customer-facing billing settings.
									</p>
								</div>
								<BusinessDetails
									initialData={{
										shop_name: vendor.shop_name || "",
										phone: vendor.phone || "",
										address: vendor.address || "",
										payment_methods:
											vendor.payment_methods || "",
									}}
									onSubmit={handleBusinessSubmit}
									isLoading={actionLoading}
								/>
							</div>
						)}

						{activeTab === "security" && (
							<div className="space-y-6">
								<div>
									<h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
										Change Password
									</h3>
									<p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
										Ensure your portal account is secure by
										rotating your password.
									</p>
								</div>
								<SecuritySettings
									onSubmit={handlePasswordSubmit}
									isLoading={actionLoading}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
