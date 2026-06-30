"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { DataTable, Column } from "@/components/ui/DataTable";
import { getBlacklistedDevicesAction, blacklistDeviceAction } from "@/actions/blacklist";
import { ImeiInput } from "@/components/ui/imei-input";

import * as yup from "yup";
import { ErrorMessage } from "@/components/ui/error-message";

interface BlacklistedDevice {
	id: number;
	imei: string;
	reason: string;
	created_at: string;
	createdAt?: string;
}

const blacklistSchema = yup.object().shape({
	imei: yup
		.string()
		.trim()
		.required("Please enter an IMEI number.")
		.length(15, "IMEI must be exactly 15 digits."),
	reason: yup
		.string()
		.trim()
		.required("Please provide a reason for blacklisting."),
});

export default function BlacklistPage() {
	const [devices, setDevices] = useState<BlacklistedDevice[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Form fields
	const [imei, setImei] = useState("");
	const [reason, setReason] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const fetchBlacklist = async () => {
		setIsLoading(true);
		try {
			const res = await getBlacklistedDevicesAction();
			if (res.success && res.data?.success) {
				setDevices(res.data.blacklistedDevices || []);
			} else {
				toast.error(res.message || "Failed to load blacklist.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchBlacklist();
	}, []);

	const handleBlacklistSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});
		const trimmedImei = imei.trim();
		const trimmedReason = reason.trim();

		try {
			await blacklistSchema.validate(
				{
					imei: trimmedImei,
					reason: trimmedReason,
				},
				{ abortEarly: false }
			);
		} catch (err: any) {
			if (err instanceof yup.ValidationError) {
				const errors: Record<string, string> = {};
				err.inner.forEach((validationError: any) => {
					if (validationError.path && !errors[validationError.path]) {
						errors[validationError.path] = validationError.message;
					}
				});
				setFieldErrors(errors);
			} else {
				toast.error("Form validation failed.");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await blacklistDeviceAction(trimmedImei, trimmedReason);
			if (res.success && res.data?.success) {
				toast.success("Device added to blacklist.");
				setImei("");
				setReason("");
				fetchBlacklist();
			} else {
				toast.error(res.message || "Failed to blacklist device.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred during submission.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Filter devices
	const filteredDevices = devices.filter((d) =>
		d.imei.includes(searchQuery) || d.reason.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Columns definition for DataTable
	const columns: Column<BlacklistedDevice>[] = [
		{
			key: "imei",
			title: "IMEI Number",
			render: (d) => <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{d.imei}</span>,
		},
		{
			key: "reason",
			title: "Reason / Description",
			render: (d) => <span className="text-zinc-600 dark:text-zinc-400">{d.reason}</span>,
		},
		{
			key: "created_at",
			title: "Blacklisted Date",
			render: (d) => {
				const dateStr = d.createdAt || d.created_at;
				return (
					<span className="text-zinc-500 dark:text-zinc-500 text-xs">
						{dateStr ? new Date(dateStr).toLocaleDateString() : "N/A"}
					</span>
				);
			},
		},
	];

	return (
		<div className="space-y-8 pb-12">
			{/* Top Hero Section */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-red-500/10 via-zinc-100/5 to-transparent p-6 rounded-3xl border border-red-500/20">
				<div>
					<h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
						<svg className="w-7 h-7 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						Blacklist Center
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
						Flag stolen, lost, or fraudulent devices globally. Any attempt by other vendors to buy or register these IMEIs will be blocked and flagged.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Register form */}
				<div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm h-fit">
					<h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Blacklist A Device</h2>
					<form onSubmit={handleBlacklistSubmit} className="space-y-4">
						<ImeiInput
							value={imei}
							onChange={(val) => {
								setImei(val);
								if (fieldErrors.imei) {
									setFieldErrors((prev) => {
										const copy = { ...prev };
										delete copy.imei;
										return copy;
									});
								}
							}}
							error={fieldErrors.imei}
							label="IMEI Number"
							placeholder="e.g. 358901234567890"
							required
						/>

						<div className="space-y-1">
							<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
								Reason / Description *
							</label>
							<textarea
								value={reason}
								onChange={(e) => {
									setReason(e.target.value);
									if (fieldErrors.reason) {
										setFieldErrors((prev) => {
											const copy = { ...prev };
											delete copy.reason;
											return copy;
										});
									}
								}}
								className={`w-full p-4 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2 min-h-[100px] transition-colors ${
									fieldErrors.reason
										? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/10"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-red-500"
								}`}
								placeholder="e.g. Stolen from warehouse on 2026-06-25, case reference #..."
							/>
							<ErrorMessage message={fieldErrors.reason} />
						</div>

						<Button
							type="submit"
							className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Blacklisting..." : "Blacklist Device"}
						</Button>
					</form>
				</div>

				{/* Table of Blacklisted Mobiles */}
				<div className="xl:col-span-2 bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
						<h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400">My Blacklisted Devices</h2>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by IMEI or reason..."
							className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
						/>
					</div>

					<DataTable
						data={filteredDevices}
						columns={columns}
						loading={isLoading}
						emptyMessage="No blacklisted devices found."
					/>
				</div>
			</div>
		</div>
	);
}
