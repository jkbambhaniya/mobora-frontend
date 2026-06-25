"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAdminBlacklistedDeviceByIdAction, removeAdminBlacklistedDeviceAction } from "@/actions/admin-blacklist";
import { Modal } from "@/components/ui/modal";

interface BlacklistedDevice {
	id: number;
	imei: string;
	reason: string;
	createdAt: string;
	updatedAt: string;
	vendor: {
		id: number;
		name: string;
		email: string;
		shopName: string;
		phone: string;
		address: string;
	};
}

export default function BlacklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const [id, setId] = React.useState<string>("");
	const [device, setDevice] = useState<BlacklistedDevice | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	React.useEffect(() => {
		params.then((p) => setId(p.id));
	}, [params]);

	useEffect(() => {
		if (!id) return;
		const fetchDevice = async () => {
			setIsLoading(true);
			try {
				const res = await getAdminBlacklistedDeviceByIdAction(id);
				if (res.success && res.data) {
					setDevice(res.data.blacklistedDevice);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchDevice();
	}, [id]);

	const handleDelete = async () => {
		if (!device) return;
		setIsDeleting(true);
		try {
			const res = await removeAdminBlacklistedDeviceAction(device.id);
			if (res.success) {
				router.push("/admin/blacklist");
			} else {
				alert(res.message || "Failed to remove blacklisted device.");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6 animate-pulse pb-12">
				<div className="h-8 bg-zinc-200 dark:bg-white/5 rounded-xl w-48" />
				<div className="h-48 bg-zinc-200 dark:bg-white/5 rounded-2xl" />
				<div className="h-32 bg-zinc-200 dark:bg-white/5 rounded-2xl" />
			</div>
		);
	}

	if (!device) {
		return (
			<div className="flex flex-col items-center justify-center h-64 gap-4">
				<div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
					<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<p className="text-zinc-500 dark:text-gray-400 font-medium">Blacklisted device not found.</p>
				<Button variant="outline" onClick={() => router.push("/admin/blacklist")}>← Back to Blacklist</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-fadeIn pb-12">
			{/* Back Nav */}
			<button
				onClick={() => router.push("/admin/blacklist")}
				className="flex items-center gap-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium cursor-pointer"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Blacklist Registry
			</button>

			{/* Hero Banner */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 p-8 text-white shadow-xl shadow-red-600/20">
				<div className="absolute inset-0 opacity-10">
					<svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
						<polygon points="0,100 100,0 100,100" fill="currentColor" />
					</svg>
				</div>
				<div className="relative flex flex-col md:flex-row md:items-center gap-6">
					<div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
						<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</div>
					<div className="flex-1">
						<p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-1">Blacklisted IMEI</p>
						<h1 className="text-3xl font-black tracking-widest font-mono">{device.imei}</h1>
						<p className="text-red-100 text-sm mt-2 max-w-xl">{device.reason}</p>
					</div>
					<div className="flex gap-3 shrink-0">
						<button
							onClick={() => setDeleteOpen(true)}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Remove Blacklist
						</button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* IMEI Details Card */}
				<div className="lg:col-span-2 bg-white dark:bg-[#13151a] rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden">
					<div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5">
						<h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-gray-500">Blacklist Details</h2>
					</div>
					<div className="p-6 space-y-5">
						<div className="grid grid-cols-2 gap-6">
							<div>
								<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-1">IMEI Number</p>
								<p className="text-lg font-black font-mono text-zinc-900 dark:text-white tracking-widest">{device.imei}</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-1">Status</p>
								<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
									<span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
									Blacklisted
								</span>
							</div>
						</div>

						<div>
							<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-2">Reason / Description</p>
							<div className="bg-zinc-50 dark:bg-[#0d0e12] rounded-xl p-4 border border-zinc-200 dark:border-white/5">
								<p className="text-sm text-zinc-700 dark:text-gray-300 leading-relaxed">{device.reason || "No reason provided."}</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-6">
							<div>
								<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-1">Date Blacklisted</p>
								<p className="text-sm font-medium text-zinc-900 dark:text-white">
									{device.createdAt
										? new Date(device.createdAt).toLocaleDateString("en-IN", {
											weekday: "long",
											day: "2-digit",
											month: "long",
											year: "numeric",
										  })
										: "N/A"}
								</p>
							</div>
							<div>
								<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-1">Last Updated</p>
								<p className="text-sm font-medium text-zinc-900 dark:text-white">
									{device.updatedAt
										? new Date(device.updatedAt).toLocaleDateString("en-IN", {
											weekday: "long",
											day: "2-digit",
											month: "long",
											year: "numeric",
										  })
										: "N/A"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Reported By Vendor Card */}
				<div className="bg-white dark:bg-[#13151a] rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden h-fit">
					<div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5">
						<h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-gray-500">Reported By Vendor</h2>
					</div>
					<div className="p-6 space-y-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-md shadow-indigo-500/20">
								{device.vendor.name.slice(0, 2).toUpperCase()}
							</div>
							<div className="overflow-hidden">
								<p className="font-bold text-zinc-900 dark:text-white truncate">{device.vendor.name}</p>
								{device.vendor.shopName && (
									<p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{device.vendor.shopName}</p>
								)}
							</div>
						</div>
						<div className="space-y-3 pt-2">
							{device.vendor.email && (
								<div className="flex items-center gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300 truncate">{device.vendor.email}</span>
								</div>
							)}
							{device.vendor.phone && (
								<div className="flex items-center gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300">{device.vendor.phone}</span>
								</div>
							)}
							{device.vendor.address && (
								<div className="flex items-start gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300">{device.vendor.address}</span>
								</div>
							)}
						</div>
						<div className="pt-3 border-t border-zinc-200 dark:border-white/5">
							<button
								onClick={() => router.push(`/admin/vendor/${device.vendor.id}`)}
								className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer"
							>
								View Vendor Profile
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
				<div className="p-6 max-w-sm w-full text-center">
					<div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mx-auto mb-4">
						<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Remove Blacklisted IMEI</h3>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">
						Are you sure you want to remove IMEI{" "}
						<strong className="font-mono text-zinc-800 dark:text-gray-200">{device.imei}</strong> from the blacklist?
					</p>
					<div className="flex gap-3 mt-6">
						<Button className="flex-1" variant="outline" onClick={() => setDeleteOpen(false)}>
							Cancel
						</Button>
						<Button
							className="flex-1 bg-red-600 hover:bg-red-500 text-white"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{isDeleting ? "Removing..." : "Remove"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
