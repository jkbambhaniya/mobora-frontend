"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { toast } from "react-hot-toast";
import * as yup from "yup";
import { mobileValidationSchema } from "@/utils/validation";
import {
	useDashboard,
	Mobile,
	slugify,
} from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { useInventory } from "@/context/vendor/inventory-context";
import Link from "next/link";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { checkBlacklistAction } from "@/actions/blacklist";
interface ModelGroup {
	brand: string;
	model: string;
	brandId: number;
	modelId: number;
	brandSlug: string;
	modelSlug: string;
	items: Mobile[];
}

export default function MobilesPage() {
	const router = useRouter();
	const {
		devices,
		isLoading,
		addDevice,
		refreshDevices,
		customers,
		addCustomer,
	} = useDashboard();
	
	const { metrics, refreshMetrics } = useInventory();

	const specs = useSpecifications();

	// View Toggle State: grid (cards) vs table (list)
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);

	// Form Fields
	const [formImei, setFormImei] = useState("");
	const [formBrand, setFormBrand] = useState("");
	const [formModel, setFormModel] = useState("");
	const [formStorage, setFormStorage] = useState("");
	const [formRam, setFormRam] = useState("");
	const [formColor, setFormColor] = useState("");
	const [formCondition, setFormCondition] = useState<
		"NEW" | "OLD"
	>("NEW");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formPurchasePrice, setFormPurchasePrice] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formCustomerId, setFormCustomerId] = useState("");

	const [formError, setFormError] = useState("");
	const [brandInlineError, setBrandInlineError] = useState("");
	const [modelInlineError, setModelInlineError] = useState("");
	const [storageInlineError, setStorageInlineError] = useState("");
	const [ramInlineError, setRamInlineError] = useState("");

	// Dynamic Add Dialog States
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [newBrandVal, setNewBrandVal] = useState("");

	const [isAddingModel, setIsAddingModel] = useState(false);
	const [newModelVal, setNewModelVal] = useState("");

	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [newStorageVal, setNewStorageVal] = useState("");

	const [isAddingRam, setIsAddingRam] = useState(false);
	const [newRamVal, setNewRamVal] = useState("");

	// Submission States
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
	const [isSubmittingModel, setIsSubmittingModel] = useState(false);
	const [isSubmittingStorage, setIsSubmittingStorage] = useState(false);
	const [isSubmittingRam, setIsSubmittingRam] = useState(false);
	const [isEditingModel, setIsEditingModel] = useState(false);
	const [blacklistWarning, setBlacklistWarning] = useState<{
		isBlacklisted: boolean;
		imei: string;
		reason?: string;
		blacklistedBy?: string;
		createdAt?: string;
	} | null>(null);

	// Field Validation Errors
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});

	const isAppleSelected = useMemo(() => {
		const brandObj = specs.allBrands.find((b) => b.id.toString() === formBrand);
		return brandObj?.name.toLowerCase() === "apple";
	}, [formBrand, specs.allBrands]);

	// Pagination States
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(9);

	// Open Handler
	const handleOpenAdd = () => {
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("NEW");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormDescription("");
		setFormCustomerId("");
		setFieldErrors({});
		setFormError("");
		setBrandInlineError("");
		setModelInlineError("");
		setStorageInlineError("");
		setRamInlineError("");
		setIsFormOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent | null, forceBypass = false) => {
		if (e) e.preventDefault();
		setFieldErrors({});
		setFormError("");
		setIsSubmitting(true);

		// If IMEI is provided, check if it's blacklisted
		if (formImei && !forceBypass) {
			try {
				const blacklistRes = await checkBlacklistAction(formImei);
				if (blacklistRes.success && blacklistRes.data?.isBlacklisted) {
					setBlacklistWarning({
						isBlacklisted: true,
						imei: formImei,
						reason: blacklistRes.data.reason,
						blacklistedBy: blacklistRes.data.blacklistedBy,
						createdAt: blacklistRes.data.createdAt,
					});
					setIsSubmitting(false);
					return;
				}
			} catch (err) {
				console.error("Blacklist check failed:", err);
			}
		}

		try {
			// Find names for frontend yup validation matching
			const selectedBrandName = specs.allBrands.find(b => b.id.toString() === formBrand)?.name || "";
			const selectedModelName = specs.allModels.find(m => m.id.toString() === formModel)?.name || "";
			const selectedStorageValue = specs.allStorages.find(s => s.id.toString() === formStorage)?.value || "";
			const selectedRamValue = specs.allRams.find(r => r.id.toString() === formRam)?.value || "";

			await mobileValidationSchema.validate(
				{
					brand: selectedBrandName,
					model: selectedModelName,
					storage: selectedStorageValue,
					ram: selectedRamValue,
					color: formColor,
					imei: formImei || null,
					condition: formCondition,
					batteryHealth: isAppleSelected ? formBatteryHealth : null,
					purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : undefined,
					description: formDescription || null,
				},
				{ abortEarly: false },
			);
		} catch (err: any) {
			setIsSubmitting(false);
			if (err instanceof yup.ValidationError) {
				const errors: Record<string, string> = {};
				err.inner.forEach((validationError: any) => {
					if (validationError.path && !errors[validationError.path]) {
						errors[validationError.path] = validationError.message;
					}
				});
				setFieldErrors(errors);
			} else {
				setFormError("Form validation failed.");
			}
			return;
		}

		try {
			const purchasePriceNum = parseFloat(formPurchasePrice);
			const priceNum = Math.round(purchasePriceNum * 1.2); // Markup selling price by 20%

			const result = await addDevice({
				brand_id: Number(formBrand),
				model_id: Number(formModel),
				storage_id: Number(formStorage),
				ram_id: Number(formRam),
				color: formColor || "Space Gray",
				imei: formImei || null,
				condition: formCondition,
				price: priceNum,
				purchase_price: purchasePriceNum,
				battery_health: isAppleSelected ? formBatteryHealth : null,
				status: "Available",
				description: formDescription || `Registered device in inventory.`,
				customer_id: formCustomerId || null,
			});

			if (result.success) {
				toast.success("Mobile device added to stock successfully.");
				setIsFormOpen(false);
			} else {
				if (result.errors) {
					setFieldErrors(result.errors);
				} else {
					setFormError(result.message || "Failed to add mobile device.");
				}
			}
		} catch (err) {
			setFormError("An unexpected error occurred.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Dynamic creators using backend spec-context actions
	const handleCreateBrand = async () => {
		if (newBrandVal.trim()) {
			setIsSubmittingBrand(true);
			setBrandInlineError("");
			try {
				const res = await specs.addBrand(newBrandVal.trim());
				if (res.success) {
					toast.success("Brand request submitted and is pending approval.");
					setNewBrandVal("");
					setIsAddingBrand(false);
				} else {
					setBrandInlineError(res.message || "Failed to submit brand request.");
				}
			} catch (err) {
				setBrandInlineError("Failed to submit brand request.");
			} finally {
				setIsSubmittingBrand(false);
			}
		}
	};

	const handleCreateModel = async () => {
		if (!formBrand) {
			setFormError("Please choose a brand first.");
			return;
		}
		if (newModelVal.trim()) {
			setIsSubmittingModel(true);
			setModelInlineError("");
			try {
				if (isEditingModel) {
					if (!formModel) return;
					const res = await specs.editModel(Number(formModel), { name: newModelVal.trim() });
					if (res.success) {
						toast.success("Model updated successfully.");
						await specs.refreshAllSpecs();
						setNewModelVal("");
						setIsAddingModel(false);
						setIsEditingModel(false);
						clearFieldError("model");
					} else {
						setModelInlineError(res.message || "Failed to update model.");
					}
				} else {
					const res = await specs.addModel(newModelVal.trim(), Number(formBrand));
					if (res.success) {
						toast.success("Model created successfully.");
						// Re-fetch all specs to get the updated model list
						await specs.refreshAllSpecs();
						setNewModelVal("");
						setIsAddingModel(false);
						clearFieldError("model");
					} else {
						setModelInlineError(res.message || "Failed to add model.");
					}
				}
			} catch (err) {
				setModelInlineError(isEditingModel ? "Failed to update model." : "Failed to add model.");
			} finally {
				setIsSubmittingModel(false);
			}
		}
	};

	const handleCreateStorage = async () => {
		if (newStorageVal.trim()) {
			setIsSubmittingStorage(true);
			setStorageInlineError("");
			try {
				const res = await specs.addStorage(newStorageVal.trim());
				if (res.success) {
					toast.success("Storage capacity request submitted.");
					setNewStorageVal("");
					setIsAddingStorage(false);
				} else {
					setStorageInlineError(res.message || "Failed to add storage.");
				}
			} catch (err) {
				setStorageInlineError("Failed to add storage.");
			} finally {
				setIsSubmittingStorage(false);
			}
		}
	};

	const handleCreateRam = async () => {
		if (newRamVal.trim()) {
			setIsSubmittingRam(true);
			setRamInlineError("");
			try {
				const res = await specs.addRam(newRamVal.trim());
				if (res.success) {
					toast.success("RAM capacity request submitted.");
					setNewRamVal("");
					setIsAddingRam(false);
				} else {
					setRamInlineError(res.message || "Failed to add RAM.");
				}
			} catch (err) {
				setRamInlineError("Failed to add RAM.");
			} finally {
				setIsSubmittingRam(false);
			}
		}
	};

	// Search/Filter states for Catalog
	const [searchTerm, setSearchTerm] = useState("");
	const [brandFilter, setBrandFilter] = useState("All");
	const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Sold
	const [sortBy, setSortBy] = useState<"model" | "brand" | "inHandStock" | "soldStock">("model");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Reset page when filters change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, brandFilter, statusFilter, sortBy, sortOrder]);

	// Fetch latest devices when page mounts or filters apply
	useEffect(() => {
		refreshDevices(undefined, true);
		refreshMetrics();
	}, []);

	// List of unique brands for filters
	const uniqueBrandsList = useMemo(() => {
		return Array.from(new Set(devices.map((d) => d.brand).filter(Boolean)));
	}, [devices]);

	// Group devices by Brand + Model
	const modelGroups = useMemo(() => {
		const groups: {
			[key: string]: ModelGroup;
		} = {};

		devices.forEach((d) => {
			if (!d.brand || !d.model) return;
			const key = `${d.brand} ${d.model}`.toLowerCase();
			if (!groups[key]) {
				// Resolve slugs from specs allBrands/allModels (database slugs)
				const brandObj = specs.allBrands.find((b) => b.id === d.brandId);
				const modelObj = specs.allModels.find((m) => m.id === d.modelId);
				groups[key] = {
					brand: d.brand,
					model: d.model,
					brandId: d.brandId || 0,
					modelId: d.modelId || 0,
					brandSlug: brandObj?.slug || slugify(d.brand),
					modelSlug: modelObj?.slug || slugify(d.model),
					items: [],
				};
			}
			groups[key].items.push(d);
		});

		return Object.values(groups);
	}, [devices, specs.allBrands, specs.allModels]);

	// Apply filters & sorting on catalog model groups
	const sortedAndFilteredModelGroups = useMemo(() => {
		let result = modelGroups.filter((g) => {
			const query = searchTerm.toLowerCase();
			const matchesSearch =
				g.brand.toLowerCase().includes(query) ||
				g.model.toLowerCase().includes(query);

			const matchesBrand =
				brandFilter === "All" || g.brand === brandFilter;

			let matchesStatus = true;
			if (statusFilter === "Available") {
				matchesStatus = g.items.some(
					(d) => d.status === "Available" && d.stock > 0,
				);
			} else if (statusFilter === "Sold") {
				matchesStatus = g.items.some((d) => d.status === "Sold");
			}

			return matchesSearch && matchesBrand && matchesStatus;
		});

		// Apply Sorting
		result.sort((a, b) => {
			let valA: any = "";
			let valB: any = "";

			if (sortBy === "model") {
				valA = a.model.toLowerCase();
				valB = b.model.toLowerCase();
			} else if (sortBy === "brand") {
				valA = a.brand.toLowerCase();
				valB = b.brand.toLowerCase();
			} else if (sortBy === "inHandStock") {
				valA = a.items.filter((d) => d.status === "Available").length;
				valB = b.items.filter((d) => d.status === "Available").length;
			} else if (sortBy === "soldStock") {
				valA = a.items.filter((d) => d.status === "Sold").length;
				valB = b.items.filter((d) => d.status === "Sold").length;
			}

			if (valA < valB) return sortOrder === "asc" ? -1 : 1;
			if (valA > valB) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return result;
	}, [modelGroups, searchTerm, brandFilter, statusFilter, sortBy, sortOrder]);

	// Paginate groups
	const paginatedModelGroups = useMemo(() => {
		const start = (page - 1) * limit;
		return sortedAndFilteredModelGroups.slice(start, start + limit);
	}, [sortedAndFilteredModelGroups, page, limit]);

	// Handle sort click on table headers
	const handleSort = (field: typeof sortBy) => {
		if (sortBy === field) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	const getSortDir = (colKey: string) => {
		if (sortBy === colKey) return sortOrder;
		return null;
	};

	// Table column definitions for DataTable view
	const columns: Column<ModelGroup>[] = [
		{
			key: "model",
			title: "Model details",
			sortable: true,
			render: (g) => (
				<div className="flex flex-col">
					<span className="font-extrabold text-zinc-900 dark:text-white leading-tight">
						{g.brand} {g.model}
					</span>
					<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
						{g.items.length} configurations in catalog
					</span>
				</div>
			),
		},
		{
			key: "brand",
			title: "Brand",
			sortable: true,
			render: (g) => (
				<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary uppercase tracking-wider">
					{g.brand}
				</span>
			),
		},
		{
			key: "inHandStock",
			title: "Available Stock",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center font-bold text-zinc-700 dark:text-zinc-355",
			render: (g) => {
				const activeCount = g.items.filter((d) => d.status === "Available").reduce((sum, d) => sum + d.stock, 0);
				return <span>{activeCount} units</span>;
			},
		},
		{
			key: "soldStock",
			title: "Sold Units",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center font-semibold text-zinc-500 dark:text-zinc-400",
			render: (g) => {
				const soldCount = g.items.filter((d) => d.status === "Sold").length;
				return <span>{soldCount} units</span>;
			},
		},
		{
			key: "priceRange",
			title: "Pricing Range",
			sortable: false,
			headerClassName: "text-right",
			className: "text-right font-extrabold text-zinc-900 dark:text-zinc-150",
			render: (g) => {
				const prices = g.items.map((d) => d.price);
				if (prices.length === 0) return "-";
				const minPrice = Math.min(...prices);
				const maxPrice = Math.max(...prices);
				return (
					<span suppressHydrationWarning>
						{minPrice === maxPrice
							? `₹${minPrice.toLocaleString()}`
							: `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`}
					</span>
				);
			},
		},
		{
			key: "actions",
			title: "Actions",
			sortable: false,
			headerClassName: "text-center",
			className: "text-center",
			render: (g) => (
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						router.push(
							`/mobiles/${g.brandSlug}/${g.modelSlug}`,
						);
					}}
					className="py-1.5 px-3.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-pointer"
				>
					View Devices
				</Button>
			),
		},
	];

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRICS PANEL */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-primary" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Unique Catalog Models
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalUniqueModels}
						</span>
						<span className="text-[11px] text-zinc-400">specifications</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Active Inventory
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.activeStock}
						</span>
						<span className="text-[11px] text-zinc-400">units in stock</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Total Units Sold
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalSold}
						</span>
						<span className="text-[11px] text-zinc-400">completed sales</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						IMEI Logged Devices
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalTracedDevices}
						</span>
						<span className="text-[11px] text-zinc-400">tracked lifecycles</span>
					</div>
				</div>
			</div>

			{/* CONTROLS & FILTERS */}
			<div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
				<div className="flex items-center gap-4 w-full lg:w-auto">
					{/* Search */}
					<div className="relative w-full md:w-80">
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
							placeholder="Search models..."
							className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					{/* View Toggle */}
					<div className="hidden sm:flex border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl gap-0.5 bg-zinc-50 dark:bg-zinc-950 shrink-0">
						<button
							onClick={() => { setViewMode("grid"); setLimit(9); }}
							className={`p-2 rounded-lg transition-all ${
								viewMode === "grid"
									? "bg-white dark:bg-zinc-900 shadow-sm text-primary"
									: "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
							}`}
							title="Grid Card View"
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
									d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
								/>
							</svg>
						</button>
						<button
							onClick={() => { setViewMode("table"); setLimit(10); }}
							className={`p-2 rounded-lg transition-all ${
								viewMode === "table"
									? "bg-white dark:bg-zinc-900 shadow-sm text-primary"
									: "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
							}`}
							title="Structured Table View"
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
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
					<Select
						value={brandFilter}
						onChange={(e) => setBrandFilter(e.target.value)}
						options={[
							{ value: "All", label: "All Brands" },
							...uniqueBrandsList.map((b) => ({ value: b, label: b })),
						]}
						className="w-40"
					/>

					<Select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						options={[
							{ value: "All", label: "All Statuses" },
							{ value: "Available", label: "Has Available Stock" },
							{ value: "Sold", label: "Has Sold Stock" },
						]}
						className="w-48"
					/>

					<Button
						variant="gradient"
						size="sm"
						shape="pill"
						onClick={handleOpenAdd}
						className="font-bold cursor-pointer"
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
							Add Mobile
						</span>
					</Button>
				</div>
			</div>

			{/* GRID VIEW LAYOUT */}
			{viewMode === "grid" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{paginatedModelGroups.length > 0 ? (
						paginatedModelGroups.map((g) => {
							const activeCount = g.items
								.filter((d) => d.status === "Available")
								.reduce((sum, d) => sum + d.stock, 0);
							const soldCount = g.items.filter(
								(d) => d.status === "Sold",
							).length;
							const prices = g.items.map((d) => d.price);
							const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
							const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

							return (
								<div
									key={`${g.brand}-${g.model}`}
									className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80 transition-all duration-300 shadow-sm flex flex-col justify-between group"
								>
									<div className="space-y-4">
										<div className="flex justify-between items-start">
											<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary uppercase tracking-wider">
												{g.brand}
											</span>
											<span className="text-[10px] text-zinc-400 font-bold tracking-widest font-mono">
												{g.items.length} CONFIGS
											</span>
										</div>

										<div>
											<h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
												{g.brand} {g.model}
											</h3>
										</div>

										<div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-zinc-100 dark:border-zinc-850/60">
											<div>
												<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
													Available
												</span>
												<span className="text-sm font-black text-zinc-700 dark:text-zinc-200">
													{activeCount} units
												</span>
											</div>
											<div>
												<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
													Sold Out
												</span>
												<span className="text-sm font-black text-zinc-700 dark:text-zinc-200">
													{soldCount} units
												</span>
											</div>
										</div>

										<div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
											<span>Pricing:</span>
											<span
												className="font-bold text-zinc-900 dark:text-zinc-100"
												suppressHydrationWarning
											>
												{minPrice === maxPrice
													? `₹${minPrice.toLocaleString()}`
													: `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`}
											</span>
										</div>
									</div>

									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											router.push(
												`/mobiles/${g.brandSlug}/${g.modelSlug}`,
											);
										}}
										className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
									>
										View Devices
									</Button>
								</div>
							);
						})
					) : (
						<div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
							<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
								No Mobile Models Found
							</h4>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
								We couldn't find any mobile listings matching the current search parameters. Try adjusting your filters.
							</p>
						</div>
					)}
				</div>
			)}

			{/* TABLE VIEW LAYOUT (DATA TABLE) */}
			{viewMode === "table" && (
				<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
					<DataTable
						columns={columns}
						data={paginatedModelGroups}
						loading={isLoading}
						onSort={handleSort}
						sortDir={getSortDir}
						emptyMessage={
							<div className="text-center py-16 space-y-3">
								<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
									No Mobile Models Found
								</h4>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
									We couldn't find any mobile listings matching your search or filters.
								</p>
							</div>
						}
					/>
				</div>
			)}

			{/* PAGINATION */}
			{sortedAndFilteredModelGroups.length > 0 && (
				<div className="flex justify-end pt-2">
					<Pagination
						page={page}
						total={sortedAndFilteredModelGroups.length}
						limit={limit}
						onPageChange={setPage}
						onLimitChange={(l) => {
							setLimit(l);
							setPage(1);
						}}
					/>
				</div>
			)}

			{/* REGISTER FORM MODAL */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title="Register Mobile Device"
				size="lg"
			>
				<form onSubmit={handleSubmit} noValidate className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* IMEI */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								IMEI (15 digits)
							</label>
							<input
								type="text"
								maxLength={15}
								disabled={isSubmitting}
								value={formImei}
								onChange={(e) => {
									setFormImei(e.target.value.replace(/\D/g, ""));
									clearFieldError("imei");
								}}
								placeholder="e.g. 359283748291827"
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
									fieldErrors.imei
										? "border-red-400 focus:ring-red-400"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
								}`}
							/>
							{fieldErrors.imei && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.imei}
								</p>
							)}
						</div>

						{/* Color */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Color *
							</label>
							<input
								type="text"
								disabled={isSubmitting}
								value={formColor}
								onChange={(e) => {
									setFormColor(e.target.value);
									clearFieldError("color");
								}}
								placeholder="e.g. Phantom Black"
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
									fieldErrors.color
										? "border-red-400 focus:ring-red-400"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
								}`}
							/>
							{fieldErrors.color && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.color}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* BRAND SELECTION & INLINE CREATOR */}
						<div className="space-y-1 relative">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Brand *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingBrand}
									onClick={() => setIsAddingBrand(!isAddingBrand)}
									className="text-[10px] text-primary hover:underline font-bold cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
								>
									{isAddingBrand ? "Cancel" : "Request Brand"}
								</button>
							</div>

							{isAddingBrand ? (
								<div className="flex flex-col gap-1.5 w-full">
									<div className="flex gap-2 animate-scaleUp">
										<input
											type="text"
											disabled={isSubmittingBrand || isSubmitting}
											value={newBrandVal}
											onChange={(e) => {
												setNewBrandVal(e.target.value);
												setBrandInlineError("");
											}}
											placeholder="New Brand Name"
											className={`flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
												${brandInlineError ? "border-red-500" : "border-primary"}`}
										/>
										<button
											type="button"
											disabled={isSubmittingBrand || isSubmitting}
											onClick={handleCreateBrand}
											className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9"
										>
											{isSubmittingBrand ? (
												<>
													<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
													</svg>
													<span>Saving...</span>
												</>
											) : (
												"Save"
											)}
										</button>
									</div>
									{brandInlineError && (
										<p className="text-[10px] text-red-500 font-semibold pl-1">
											{brandInlineError}
										</p>
									)}
								</div>
							) : (
								<Select
									value={formBrand}
									disabled={isSubmitting}
									onChange={(e) => {
										setFormBrand(e.target.value);
										setFormModel("");
										clearFieldError("brand");
									}}
									required
									placeholder="-- Choose Brand --"
									options={specs.allBrands.map((b) => ({ value: b.id.toString(), label: b.name }))}
									error={fieldErrors.brand}
								/>
							)}
						</div>

						{/* MODEL SELECTION & INLINE CREATOR */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Model *
								</label>
								<div className="flex gap-2">
									{formModel && !isAddingModel && (
										<button
											type="button"
											disabled={isSubmitting || isSubmittingModel}
											onClick={() => {
												const modelObj = specs.allModels.find(m => m.id.toString() === formModel);
												if (modelObj) {
													setNewModelVal(modelObj.name);
													setIsEditingModel(true);
													setIsAddingModel(true);
												}
											}}
											className="text-[10px] text-zinc-500 hover:text-primary font-bold cursor-pointer disabled:opacity-50 flex items-center gap-0.5"
											title="Edit Selected Model"
										>
											<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
												<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
											</svg>
											<span>Edit</span>
										</button>
									)}
									<button
										type="button"
										disabled={!formBrand || isSubmitting || isSubmittingModel}
										onClick={() => {
											if (isAddingModel) {
												setNewModelVal("");
												setIsEditingModel(false);
											}
											setIsAddingModel(!isAddingModel);
										}}
										className="text-[10px] text-primary hover:underline font-bold cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
									>
										{isAddingModel ? "Cancel" : "+ Add Model"}
									</button>
								</div>
							</div>

							{isAddingModel ? (
								<div className="flex flex-col gap-1.5 w-full">
									<div className="flex gap-2 animate-scaleUp">
										<input
											type="text"
											disabled={isSubmittingModel || isSubmitting}
											value={newModelVal}
											onChange={(e) => {
												setNewModelVal(e.target.value);
												setModelInlineError("");
											}}
											placeholder="Model Name"
											className={`flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
												${modelInlineError ? "border-red-500" : "border-primary"}`}
										/>
										<button
											type="button"
											disabled={isSubmittingModel || isSubmitting}
											onClick={handleCreateModel}
											className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9"
										>
											{isSubmittingModel ? (
												<>
													<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
													</svg>
													<span>Saving...</span>
												</>
											) : (
												"Save"
											)}
										</button>
									</div>
									{modelInlineError && (
										<p className="text-[10px] text-red-500 font-semibold pl-1">
											{modelInlineError}
										</p>
									)}
								</div>
							) : (
								<Select
									value={formModel}
									disabled={!formBrand || isSubmitting}
									onChange={(e) => {
										setFormModel(e.target.value);
										clearFieldError("model");
									}}
									onOptionEdit={(val, label) => {
										setFormModel(val.toString());
										setNewModelVal(label);
										setIsEditingModel(true);
										setIsAddingModel(true);
									}}
									required
									placeholder={formBrand ? "-- Choose Model --" : "-- Choose Brand First --"}
									options={specs.allModels
										.filter((m) => m.brand_id.toString() === formBrand)
										.map((m) => ({ value: m.id.toString(), label: m.name }))}
									error={fieldErrors.model}
								/>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* STORAGE */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Storage Capacity *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingStorage}
									onClick={() => setIsAddingStorage(!isAddingStorage)}
									className="text-[10px] text-primary hover:underline font-bold cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
								>
									{isAddingStorage ? "Cancel" : "Request Storage"}
								</button>
							</div>

							{isAddingStorage ? (
								<div className="flex flex-col gap-1.5 w-full">
									<div className="flex gap-2 animate-scaleUp">
										<input
											type="text"
											disabled={isSubmittingStorage || isSubmitting}
											value={newStorageVal}
											onChange={(e) => {
												setNewStorageVal(e.target.value);
												setStorageInlineError("");
											}}
											placeholder="e.g. 512GB"
											className={`flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
												${storageInlineError ? "border-red-500" : "border-primary"}`}
										/>
										<button
											type="button"
											disabled={isSubmittingStorage || isSubmitting}
											onClick={handleCreateStorage}
											className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9"
										>
											{isSubmittingStorage ? (
												<>
													<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
													</svg>
													<span>Saving...</span>
												</>
											) : (
												"Save"
											)}
										</button>
									</div>
									{storageInlineError && (
										<p className="text-[10px] text-red-500 font-semibold pl-1">
											{storageInlineError}
										</p>
									)}
								</div>
							) : (
								<Select
									value={formStorage}
									disabled={isSubmitting}
									onChange={(e) => {
										setFormStorage(e.target.value);
										clearFieldError("storage");
									}}
									required
									placeholder="-- Choose Storage --"
									options={specs.allStorages.map((s) => ({ value: s.id.toString(), label: s.value }))}
									error={fieldErrors.storage}
								/>
							)}
						</div>

						{/* RAM */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									RAM Size *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingRam}
									onClick={() => setIsAddingRam(!isAddingRam)}
									className="text-[10px] text-primary hover:underline font-bold cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
								>
									{isAddingRam ? "Cancel" : "Request RAM"}
								</button>
							</div>

							{isAddingRam ? (
								<div className="flex flex-col gap-1.5 w-full">
									<div className="flex gap-2 animate-scaleUp">
										<input
											type="text"
											disabled={isSubmittingRam || isSubmitting}
											value={newRamVal}
											onChange={(e) => {
												setNewRamVal(e.target.value);
												setRamInlineError("");
											}}
											placeholder="e.g. 16GB"
											className={`w-full px-3 py-2.5 rounded-xl border text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
												${ramInlineError ? "border-red-500" : "border-primary"}`}
										/>
										<button
											type="button"
											disabled={isSubmittingRam || isSubmitting}
											onClick={handleCreateRam}
											className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9"
										>
											{isSubmittingRam ? (
												<>
													<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
													</svg>
													<span>Saving...</span>
												</>
											) : (
												"Save"
											)}
										</button>
									</div>
									{ramInlineError && (
										<p className="text-[10px] text-red-500 font-semibold pl-1">
											{ramInlineError}
										</p>
									)}
								</div>
							) : (
								<Select
									value={formRam}
									disabled={isSubmitting}
									onChange={(e) => {
										setFormRam(e.target.value);
										clearFieldError("ram");
									}}
									required
									placeholder="-- Choose RAM --"
									options={specs.allRams.map((r) => ({ value: r.id.toString(), label: r.value }))}
									error={fieldErrors.ram}
								/>
							)}
						</div>
					</div>

					<div className={`grid grid-cols-1 gap-4 transition-all duration-300 ease-in-out ${isAppleSelected ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
						{/* Condition */}
						<div className="space-y-1 p-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Condition *
							</label>
							<Select
								value={formCondition}
								disabled={isSubmitting}
								onChange={(e) => {
									setFormCondition(e.target.value as any);
									clearFieldError("condition");
								}}
								options={[
									{ value: "NEW", label: "New" },
									{ value: "OLD", label: "Old" },
								]}
								className={fieldErrors.condition ? "border-red-400 focus:ring-red-400" : ""}
							/>
							{fieldErrors.condition && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.condition}
								</p>
							)}
						</div>

						{/* Battery Health */}
						<div className={`space-y-1 transition-all duration-350 ease-in-out origin-top overflow-hidden p-1 ${isAppleSelected ? "opacity-100 max-h-[120px] scale-y-100 translate-y-0" : "opacity-0 max-h-0 scale-y-0 -translate-y-4 pointer-events-none"}`}>
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Battery Health (%) *
							</label>
							<input
								type="number"
								min={50}
								max={100}
								disabled={isSubmitting}
								value={formBatteryHealth}
								onChange={(e) => {
									setFormBatteryHealth(parseInt(e.target.value) || 0);
									clearFieldError("batteryHealth");
								}}
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
									fieldErrors.batteryHealth
										? "border-red-400 focus:ring-red-400"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
								}`}
							/>
							{fieldErrors.batteryHealth && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.batteryHealth}
								</p>
							)}
						</div>
					</div>

					{/* Customer Selection */}
					<PartnerSelector
						value={formCustomerId}
						onChange={setFormCustomerId}
						label="Select Customer / Vendor (for Purchase Transaction)"
						placeholder="-- Choose Partner --"
						required={false}
						valueType="id"
					/>

					{/* Cost Price */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Purchase / Cost Price * (₹)
						</label>
						<input
							type="number"
							required
							disabled={isSubmitting}
							value={formPurchasePrice}
							onChange={(e) => {
								setFormPurchasePrice(e.target.value);
								clearFieldError("purchasePrice");
							}}
							placeholder="e.g. 30000"
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
								fieldErrors.purchasePrice
									? "border-red-400 focus:ring-red-400"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
							}`}
						/>
						{fieldErrors.purchasePrice && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{fieldErrors.purchasePrice}
							</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Listing Description
						</label>
						<textarea
							value={formDescription}
							disabled={isSubmitting}
							onChange={(e) => {
								setFormDescription(e.target.value);
								clearFieldError("description");
							}}
							placeholder="e.g. Mint condition. Minor scratch on screen, box and original cable available..."
							rows={3}
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
								fieldErrors.description
									? "border-red-400 focus:ring-red-400"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
							}`}
						/>
						{fieldErrors.description && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{fieldErrors.description}
							</p>
						)}
					</div>

					{formError && (
						<p className="text-xs text-red-500 font-semibold text-center mt-2">
							{formError}
						</p>
					)}

					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={isSubmitting}
							onClick={() => setIsFormOpen(false)}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="gradient"
							size="sm"
							isLoading={isSubmitting}
							className="cursor-pointer"
						>
							Register Stock Item
						</Button>
					</div>
				</form>
			</Modal>

			{/* Blacklist Warning Modal */}
			<Modal
				isOpen={!!blacklistWarning}
				onClose={() => setBlacklistWarning(null)}
				title="⚠️ WARNING: Blacklisted Mobile Device"
				size="md"
			>
				{blacklistWarning && (
					<div className="space-y-6 text-left">
						<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
							<svg className="w-6 h-6 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<div>
								<h4 className="font-extrabold text-red-700 dark:text-red-400 text-sm">Device has been Blacklisted!</h4>
								<p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 leading-relaxed">
									This device (IMEI: <span className="font-mono font-bold text-zinc-900 dark:text-white">{blacklistWarning.imei}</span>) is listed in the global blacklist.
								</p>
							</div>
						</div>

						<div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800">
							<div>
								<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Blacklisted By</span>
								<strong className="text-zinc-800 dark:text-zinc-200 text-sm">{blacklistWarning.blacklistedBy}</strong>
							</div>
							<div>
								<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Date Flagged</span>
								<span className="text-zinc-700 dark:text-zinc-300 text-xs">
									{blacklistWarning.createdAt ? new Date(blacklistWarning.createdAt).toLocaleString() : "N/A"}
								</span>
							</div>
							<div>
								<span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">Reason / Details</span>
								<p className="text-zinc-700 dark:text-zinc-350 text-xs mt-1 italic">
									"{blacklistWarning.reason || "No details provided."}"
								</p>
							</div>
						</div>

						<div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-[11px] text-yellow-600 dark:text-yellow-400 leading-normal">
							Proceeding with this device may violate local security standards or business policies. Make sure you have checked appropriate documentation.
						</div>

						<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setBlacklistWarning(null)}
								className="cursor-pointer"
							>
								Cancel / Reject
							</Button>
							<Button
								type="button"
								variant="gradient"
								size="sm"
								onClick={() => {
									setBlacklistWarning(null);
									handleSubmit(null, true);
								}}
								className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
							>
								Acknowledge & Proceed
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
