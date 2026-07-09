"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	getAdminRequirementByIdAction,
	deleteAdminRequirementAction,
	updateAdminRequirementStatusAction,
} from "@/actions/admin-requirements";
import { Modal } from "@/components/ui/modal";

interface RequirementDetail {
	id: number;
	brand: string;
	model: string;
	storage: string;
	ram: string;
	color: string;
	status: string;
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

export default function RequirementDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const [id, setId] = React.useState<string>("");
	const [requirement, setRequirement] = useState<RequirementDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isTogglingStatus, setIsTogglingStatus] = useState(false);

	React.useEffect(() => {
		params.then((p) => setId(p.id));
	}, [params]);

	useEffect(() => {
		if (!id) return;
		const fetchRequirement = async () => {
			setIsLoading(true);
			try {
				const res = await getAdminRequirementByIdAction(id);
				if (res.success && res.data) {
					setRequirement(res.data.requirement);
				}
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRequirement();
	}, [id]);

	const handleDelete = async () => {
		if (!requirement) return;
		setIsDeleting(true);
		try {
			const res = await deleteAdminRequirementAction(requirement.id);
			if (res.success) {
				router.push("/admin/requirements");
			} else {
				alert(res.message || "Failed to delete requirement.");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!requirement) return;
		const newStatus = requirement.status === "Active" ? "Inactive" : "Active";
		setIsTogglingStatus(true);
		try {
			const res = await updateAdminRequirementStatusAction(requirement.id, newStatus as "Active" | "Inactive");
			if (res.success) {
				setRequirement({ ...requirement, status: newStatus });
			} else {
				alert(res.message || "Failed to update status.");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsTogglingStatus(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6 animate-pulse pb-12">
				<div className="h-8 bg-zinc-200 dark:bg-white/5 rounded-xl w-48" />
				<div className="h-48 bg-zinc-200 dark:bg-white/5 rounded-2xl" />
				<div className="grid grid-cols-3 gap-6">
					<div className="h-32 bg-zinc-200 dark:bg-white/5 rounded-2xl col-span-2" />
					<div className="h-32 bg-zinc-200 dark:bg-white/5 rounded-2xl" />
				</div>
			</div>
		);
	}

	if (!requirement) {
		return (
			<div className="flex flex-col items-center justify-center h-64 gap-4">
				<div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
					<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<p className="text-zinc-500 dark:text-gray-400 font-medium">Device requirement not found.</p>
				<Button variant="outline" onClick={() => router.push("/admin/requirements")}>← Back to Requirements</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-fadeIn pb-12">
			{/* Back Nav */}
			<button
				onClick={() => router.push("/admin/requirements")}
				className="flex items-center gap-2 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium cursor-pointer"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Requirements
			</button>

			{/* Hero Banner */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white shadow-xl shadow-violet-600/20">
				<div className="absolute inset-0 opacity-10">
					<svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
						<polygon points="0,100 100,0 100,100" fill="currentColor" />
					</svg>
				</div>
				<div className="relative flex flex-col md:flex-row md:items-center gap-6">
					<div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
						<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
					</div>
					<div className="flex-1">
						<p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">Requirement Alert #{requirement.id}</p>
						<h1 className="text-3xl font-black">{requirement.brand} {requirement.model}</h1>
						<p className="text-violet-100 text-sm mt-2">
							{requirement.storage} Storage · {requirement.ram} RAM · {requirement.color}
						</p>
					</div>
					<div className="flex flex-wrap gap-3 shrink-0">
						<button
							onClick={handleToggleStatus}
							disabled={isTogglingStatus}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
						>
							{isTogglingStatus ? "Updating..." : requirement.status === "Active" ? "Deactivate Alert" : "Activate Alert"}
						</button>
						<button
							onClick={() => setDeleteOpen(true)}
							className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/40 border border-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Delete
						</button>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Requirement Specs Card */}
				<div className="lg:col-span-2 bg-white dark:bg-[#13151a] rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden">
					<div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
						<h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-gray-500">Device Specifications</h2>
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
								requirement.status === "Active"
									? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
									: "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400 border-zinc-200 dark:border-white/10"
							}`}
						>
							<span className={`w-1.5 h-1.5 rounded-full ${requirement.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
							{requirement.status}
						</span>
					</div>
					<div className="p-6">
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
							{[
								{ label: "Brand", value: requirement.brand, icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
								{ label: "Model", value: requirement.model, icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
								{ label: "Storage", value: requirement.storage, icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
								{ label: "RAM", value: requirement.ram, icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" },
								{ label: "Color", value: requirement.color, icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
							].map((spec) => (
								<div key={spec.label} className="bg-zinc-50 dark:bg-[#0d0e12] rounded-2xl p-4 border border-zinc-200 dark:border-white/5">
									<div className="flex items-center gap-2 mb-2">
										<svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={spec.icon} />
										</svg>
										<p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-gray-500">{spec.label}</p>
									</div>
									<p className="text-base font-bold text-zinc-900 dark:text-white capitalize">{spec.value}</p>
								</div>
							))}
						</div>

						<div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/5 grid grid-cols-2 gap-6">
							<div>
								<p className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider mb-1">Date Created</p>
								<p className="text-sm font-medium text-zinc-900 dark:text-white">
									{requirement.createdAt
										? new Date(requirement.createdAt).toLocaleDateString("en-IN", {
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
									{requirement.updatedAt
										? new Date(requirement.updatedAt).toLocaleDateString("en-IN", {
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

				{/* Vendor Card */}
				<div className="bg-white dark:bg-[#13151a] rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-sm overflow-hidden h-fit">
					<div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5">
						<h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-gray-500">Requesting Dealer</h2>
					</div>
					<div className="p-6 space-y-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-md shadow-violet-500/20">
								{requirement.vendor.name.slice(0, 2).toUpperCase()}
							</div>
							<div className="overflow-hidden">
								<p className="font-bold text-zinc-900 dark:text-white truncate">{requirement.vendor.name}</p>
								{requirement.vendor.shopName && (
									<p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{requirement.vendor.shopName}</p>
								)}
							</div>
						</div>
						<div className="space-y-3 pt-2">
							{requirement.vendor.email && (
								<div className="flex items-center gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300 truncate">{requirement.vendor.email}</span>
								</div>
							)}
							{requirement.vendor.phone && (
								<div className="flex items-center gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300">{requirement.vendor.phone}</span>
								</div>
							)}
							{requirement.vendor.address && (
								<div className="flex items-start gap-2.5 text-sm">
									<svg className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<span className="text-zinc-600 dark:text-gray-300">{requirement.vendor.address}</span>
								</div>
							)}
						</div>
						<div className="pt-3 border-t border-zinc-200 dark:border-white/5">
							<button
								onClick={() => router.push(`/admin/dealer/${requirement.vendor.id}`)}
								className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer"
							>
								View Dealer Profile
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
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</div>
					<h3 className="text-lg font-bold text-zinc-950 dark:text-white">Delete Requirement</h3>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">
						Are you sure you want to delete this{" "}
						<strong className="text-zinc-800 dark:text-gray-200">{requirement.brand} {requirement.model}</strong> requirement? This action is irreversible.
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
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
