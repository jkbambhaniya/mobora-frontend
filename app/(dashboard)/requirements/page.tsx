"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/select";
import { SelectWithCreate } from "@/components/ui/SelectWithCreate";
import { useDashboard } from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { DeviceRequirement } from "@/context/vendor/requirements-context";
import * as yup from "yup";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";

const requirementSchema = yup.object().shape({
	brandId: yup.string().trim().required("Brand is required."),
	modelId: yup.string().trim().required("Model is required."),
	storageId: yup.string().trim().required("Storage capacity is required."),
	ramId: yup.string().trim().required("RAM capacity is required."),
	color: yup
		.string()
		.trim()
		.max(100, "Color cannot exceed 100 characters.")
		.nullable()
		.notRequired(),
});

interface RequirementItem {
	id: number;
	brandId: number;
	brand: string;
	modelId: number;
	model: string;
	storageId: number;
	storage: string;
	ramId: number;
	ram: string;
	color: string;
	status: string;
	createdAt?: string;
}

export default function RequirementsPage() {
	const {
		requirements,
		isLoading,
		addRequirement,
		removeRequirement,
		fetchRequirements,
	} = useDashboard();

	const specs = useSpecifications();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Confirm delete modal states
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [deletingRequirement, setDeletingRequirement] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Form fields
	const [brandId, setBrandId] = useState("");
	const [modelId, setModelId] = useState("");
	const [storageId, setStorageId] = useState("");
	const [ramId, setRamId] = useState("");
	const [color, setColor] = useState("");

	// Fetch requirements on mount
	useEffect(() => {
		fetchRequirements();
		if (specs.refreshAllSpecs) {
			specs.refreshAllSpecs();
		}
	}, []);

	// Filter models based on selected brand
	const filteredModelsList = specs.allModels.filter(
		(m) => !brandId || m.brand_id === Number(brandId)
	);

	// Options for custom Select components
	const brandOptions = specs.allBrands.map((b) => ({ value: b.id, label: b.name }));
	const modelOptions = filteredModelsList.map((m) => ({ value: m.id, label: m.name }));
	const storageOptions = specs.allStorages.map((s) => ({ value: s.id, label: s.value }));
	const ramOptions = specs.allRams.map((r) => ({ value: r.id, label: r.value }));

	const handleCreateModel = async (name: string) => {
		if (!brandId) {
			toast.error("Please select a Brand first.");
			return undefined;
		}

		try {
			const res = await specs.addModel(name, Number(brandId));
			if (res.success && res.data?.model) {
				toast.success("Model created successfully.");
				if (specs.refreshAllSpecs) {
					await specs.refreshAllSpecs();
				}
				return res.data.model.id;
			} else {
				throw new Error(res.message || "Failed to create model.");
			}
		} catch (error: any) {
			throw error;
		}
	};

	const handleRequirementSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});

		try {
			await requirementSchema.validate(
				{
					brandId,
					modelId,
					storageId,
					ramId,
					color: color || null,
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
				});
				setFieldErrors(errors);
			} else {
				toast.error("Form validation failed.");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await addRequirement({
				brand_id: Number(brandId),
				model_id: Number(modelId),
				storage_id: Number(storageId),
				ram_id: Number(ramId),
				color: color.trim() || undefined,
			});

			if (res.success) {
				toast.success("Device requirement added successfully!");
				// Reset form
				setBrandId("");
				setModelId("");
				setStorageId("");
				setRamId("");
				setColor("");
				fetchRequirements();
			} else {
				toast.error(res.message || "Failed to add requirement.");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred during submission.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteClick = (r: DeviceRequirement) => {
		setDeletingRequirement({
			id: r.id,
			name: `${r.brand} ${r.model} (${r.storage}/${r.ram}${r.color ? `, ${r.color}` : ""})`,
		});
		setIsConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingRequirement) return;
		setIsDeleting(true);
		const success = await removeRequirement(deletingRequirement.id);
		setIsDeleting(false);
		setIsConfirmOpen(false);
		if (success) {
			toast.success("Requirement deleted.");
			setDeletingRequirement(null);
			fetchRequirements();
		} else {
			toast.error("Failed to delete requirement.");
		}
	};

	// Filter requirements list based on search query
	const filteredRequirements = requirements.filter((r: DeviceRequirement) => {
		const term = searchQuery.toLowerCase();
		const brandStr = r.brand || "";
		const modelStr = r.model || "";
		const colorStr = r.color || "";
		return (
			brandStr.toLowerCase().includes(term) ||
			modelStr.toLowerCase().includes(term) ||
			colorStr.toLowerCase().includes(term)
		);
	});

	// Columns definition for DataTable
	const columns: Column<DeviceRequirement>[] = [
		{
			key: "brand",
			title: "Brand",
			render: (r) => <span className="font-bold text-zinc-900 dark:text-zinc-100">{r.brand}</span>,
		},
		{
			key: "model",
			title: "Model",
			render: (r) => <span className="text-zinc-700 dark:text-zinc-300">{r.model}</span>,
		},
		{
			key: "storage",
			title: "Storage",
			render: (r) => <span className="text-zinc-600 dark:text-zinc-400 font-medium">{r.storage}</span>,
		},
		{
			key: "ram",
			title: "RAM",
			render: (r) => <span className="text-zinc-600 dark:text-zinc-400 font-medium">{r.ram}</span>,
		},
		{
			key: "color",
			title: "Color",
			render: (r) => <span className="capitalize text-zinc-600 dark:text-zinc-400">{r.color}</span>,
		},
		{
			key: "status",
			title: "Status",
			render: (r) => (
				<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
					{r.status}
				</span>
			),
		},
		{
			key: "created_at",
			title: "Date Created",
			render: (r) => {
				const dateStr = r.createdAt;
				return (
					<span className="text-zinc-500 dark:text-zinc-500 text-xs">
						{dateStr ? new Date(dateStr).toLocaleDateString() : "N/A"}
					</span>
				);
			},
		},
		{
			key: "id",
			title: "Actions",
			render: (r) => (
				<button
					onClick={() => handleDeleteClick(r)}
					className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
					title="Delete Requirement"
				>
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
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			),
		},
	];

	return (
		<div className="space-y-8 pb-12">
			{/* Top Hero Section */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-primary/10 via-zinc-100/5 to-transparent p-6 rounded-3xl border border-primary/20">
				<div>
					<h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
						<svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						Device Requirement Alerts
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
						Define specifications for devices you are looking for. Whenever any vendor registers a matching device, you will be notified and a B2B chat will automatically start!
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
				{/* Register form */}
				<div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm h-fit">
					<h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Set Alert Requirement</h2>
					<form onSubmit={handleRequirementSubmit} className="space-y-4" noValidate>
						<div>
							<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
								Brand
							</label>
							<Select
								value={brandId}
								onChange={(e) => {
									setBrandId(e.target.value);
									setModelId(""); // Reset model when brand changes
									setFieldErrors((prev) => ({ ...prev, brandId: "", modelId: "" }));
								}}
								options={brandOptions}
								placeholder="Select Brand"
								required
								error={fieldErrors.brandId}
							/>
						</div>

						<SelectWithCreate
							label="Model"
							addButtonLabel="+ Request Model"
							value={modelId}
							onChange={(e) => {
								setModelId(e.target.value);
								setFieldErrors((prev) => ({ ...prev, modelId: "" }));
							}}
							options={modelOptions}
							placeholder="Select Model"
							disabled={!brandId || isSubmitting}
							required
							canAdd={!!brandId}
							disabledAddMessage="Please select a Brand first."
							onCreate={handleCreateModel}
							error={fieldErrors.modelId}
						/>

						<div>
							<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
								Storage
							</label>
							<Select
								value={storageId}
								onChange={(e) => {
									setStorageId(e.target.value);
									setFieldErrors((prev) => ({ ...prev, storageId: "" }));
								}}
								options={storageOptions}
								placeholder="Select Storage"
								required
								error={fieldErrors.storageId}
							/>
						</div>

						<div>
							<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
								RAM
							</label>
							<Select
								value={ramId}
								onChange={(e) => {
									setRamId(e.target.value);
									setFieldErrors((prev) => ({ ...prev, ramId: "" }));
								}}
								options={ramOptions}
								placeholder="Select RAM"
								required
								error={fieldErrors.ramId}
							/>
						</div>

						<div>
							<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
								Color (Optional)
							</label>
							<input
								type="text"
								value={color}
								onChange={(e) => {
									setColor(e.target.value);
									if (fieldErrors.color) {
										setFieldErrors((prev) => ({ ...prev, color: "" }));
									}
								}}
								className={`w-full h-11 px-4 rounded-xl border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
									fieldErrors.color ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"
								}`}
								placeholder="e.g. Space Gray, Silver"
							/>
							{fieldErrors.color && (
								<p className="mt-1.5 ml-1 text-xs text-red-500 flex items-center animate-fadeIn">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1 shrink-0">
										<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
									</svg>
									{fieldErrors.color}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Saving Alert..." : "Set Requirement Alert"}
						</Button>
					</form>
				</div>

				{/* Table of Active Requirements */}
				<div className="xl:col-span-2 bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
						<h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400">My Requirement Alerts</h2>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search requirements..."
							className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
						/>
					</div>

					<DataTable
						data={filteredRequirements}
						columns={columns}
						loading={isLoading}
						emptyMessage="No active requirements set. Create one using the form on the left!"
					/>
				</div>
			</div>

			<ConfirmDeleteModal
				isOpen={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingRequirement?.name || ""}
				loading={isDeleting}
			/>
		</div>
	);
}
