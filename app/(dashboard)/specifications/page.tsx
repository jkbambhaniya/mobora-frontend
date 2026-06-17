"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import * as yup from "yup";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
import {
	useSpecifications,
	SpecBrand,
	SpecModel,
	SpecStorage,
	SpecRam,
} from "@/context/vendor/specifications-context";
import { useAuth } from "@/context/vendor/auth-context";
import toast from "react-hot-toast";

type Tab = "brands" | "models" | "storages" | "rams";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// ─────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────

const brandValidationSchema = yup.object().shape({
	name: yup
		.string()
		.trim()
		.required("Brand name is required.")
		.max(255, "Brand name cannot exceed 255 characters."),
});

const modelValidationSchema = yup.object().shape({
	name: yup
		.string()
		.trim()
		.required("Model name is required.")
		.max(255, "Model name cannot exceed 255 characters."),
	brand_id: yup
		.number()
		.integer("Brand ID must be an integer.")
		.required("Brand is required.")
		.positive("Invalid Brand ID."),
});

const storageValidationSchema = yup.object().shape({
	value: yup
		.string()
		.trim()
		.required("Storage capacity is required.")
		.max(100, "Storage capacity cannot exceed 100 characters."),
});

const ramValidationSchema = yup.object().shape({
	value: yup
		.string()
		.trim()
		.required("RAM size is required.")
		.max(100, "RAM size cannot exceed 100 characters."),
});

// ─────────────────────────────────────────────
// ICON HELPERS
// ─────────────────────────────────────────────

function EditIcon() {
	return (
		<svg
			className="w-4 h-4"
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
	);
}

function DeleteIcon() {
	return (
		<svg
			className="w-4 h-4"
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
	);
}

function SortIcon({ dir }: { dir?: "asc" | "desc" | null }) {
	return (
		<span className="inline-flex flex-col ml-1 opacity-50">
			<svg
				className={`w-2.5 h-2.5 -mb-0.5 ${dir === "asc" ? "opacity-100 text-primary" : ""}`}
				viewBox="0 0 10 6"
				fill="currentColor"
			>
				<path d="M0 6l5-6 5 6z" />
			</svg>
			<svg
				className={`w-2.5 h-2.5 ${dir === "desc" ? "opacity-100 text-primary" : ""}`}
				viewBox="0 0 10 6"
				fill="currentColor"
			>
				<path d="M0 0l5 6 5-6z" />
			</svg>
		</span>
	);
}

function LoadingRows({ cols }: { cols: number }) {
	return (
		<>
			{[...Array(5)].map((_, i) => (
				<tr
					key={i}
					className="border-b border-zinc-100 dark:border-zinc-800/40"
				>
					{[...Array(cols)].map((_, j) => (
						<td key={j} className="py-4 px-6">
							<div
								className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"
								style={{ width: `${60 + Math.random() * 30}%` }}
							/>
						</td>
					))}
				</tr>
			))}
		</>
	);
}

// ─────────────────────────────────────────────
// PAGINATION COMPONENT
// ─────────────────────────────────────────────

function Pagination({
	page,
	total,
	limit,
	onPageChange,
	onLimitChange,
}: {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
	onLimitChange: (l: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	const pages: (number | "...")[] = [];
	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) pages.push(i);
	} else {
		pages.push(1);
		if (page > 3) pages.push("...");
		for (
			let i = Math.max(2, page - 1);
			i <= Math.min(totalPages - 1, page + 1);
			i++
		)
			pages.push(i);
		if (page < totalPages - 2) pages.push("...");
		pages.push(totalPages);
	}

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/40">
			<div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
				<span>Show</span>
				<select
					value={limit}
					onChange={(e) => onLimitChange(Number(e.target.value))}
					className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
				>
					{PAGE_SIZE_OPTIONS.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<span>entries</span>
				<span className="ml-2 text-zinc-400">·</span>
				<span className="ml-2">
					{total === 0
						? "No entries"
						: `Showing ${from}–${to} of ${total}`}
				</span>
			</div>
			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>
					<svg
						className="w-3.5 h-3.5"
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
				</button>
				{pages.map((p, i) =>
					p === "..." ? (
						<span
							key={`e-${i}`}
							className="px-2 text-zinc-400 text-xs"
						>
							…
						</span>
					) : (
						<button
							key={p}
							onClick={() => onPageChange(Number(p))}
							className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
								p === page
									? "bg-primary text-white border-primary shadow-sm"
									: "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							}`}
						>
							{p}
						</button>
					),
				)}
				<button
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>
					<svg
						className="w-3.5 h-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth="2.5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function SpecificationsPage() {
	const {
		specMetrics,
		brands,
		brandsLoading,
		fetchBrands,
		addBrand,
		editBrand,
		removeBrand,
		models,
		modelsLoading,
		fetchModels,
		addModel,
		editModel,
		removeModel,
		storages,
		storagesLoading,
		fetchStorages,
		addStorage,
		editStorage,
		removeStorage,
		rams,
		ramsLoading,
		fetchRams,
		addRam,
		editRam,
		removeRam,
		allBrands,
	} = useSpecifications();

	const { vendor } = useAuth();

	const [activeTab, setActiveTab] = useState<Tab>("brands");

	// ─── Search/Filter/Sort/Page state per tab ───
	const [brandsFilters, setBrandsFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "name",
		sortOrder: "asc" as "asc" | "desc",
	});
	const [modelsFilters, setModelsFilters] = useState({
		search: "",
		brandId: "",
		page: 1,
		limit: 10,
		sortBy: "name",
		sortOrder: "asc" as "asc" | "desc",
	});
	const [storagesFilters, setStoragesFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "value",
		sortOrder: "asc" as "asc" | "desc",
	});
	const [ramsFilters, setRamsFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "value",
		sortOrder: "asc" as "asc" | "desc",
	});

	// Debounce search
	const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

	// ─── Modal state ───
	const [addModal, setAddModal] = useState(false);
	const [addValue, setAddValue] = useState("");
	const [addBrandId, setAddBrandId] = useState<number | "">("");
	const [addErrors, setAddErrors] = useState<Record<string, string>>({});
	const [addLoading, setAddLoading] = useState(false);

	const [editModal, setEditModal] = useState<{
		tab: Tab;
		id: number;
		currentValue: string;
		currentBrandId?: number;
	} | null>(null);
	const [editValue, setEditValue] = useState("");
	const [editBrandId, setEditBrandId] = useState<number | "">("");
	const [editErrors, setEditErrors] = useState<Record<string, string>>({});
	const [editLoading, setEditLoading] = useState(false);

	const [deleteModal, setDeleteModal] = useState<{
		tab: Tab;
		id: number;
		label: string;
	} | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// ─── Fetching helpers ───
	const doFetchBrands = useCallback(
		(f = brandsFilters, force = false) => {
			fetchBrands({ ...f, brandId: undefined }, force);
		},
		[fetchBrands, brandsFilters],
	);

	const doFetchModels = useCallback(
		(f = modelsFilters, force = false) => {
			fetchModels({ ...f, brandId: f.brandId || undefined }, force);
		},
		[fetchModels, modelsFilters],
	);

	const doFetchStorages = useCallback(
		(f = storagesFilters, force = false) => {
			fetchStorages(f, force);
		},
		[fetchStorages, storagesFilters],
	);

	const doFetchRams = useCallback(
		(f = ramsFilters, force = false) => {
			fetchRams(f, force);
		},
		[fetchRams, ramsFilters],
	);

	// Bootstrap each tab when it first becomes active
	useEffect(() => {
		if (activeTab === "brands") doFetchBrands();
		else if (activeTab === "models") doFetchModels();
		else if (activeTab === "storages") doFetchStorages();
		else if (activeTab === "rams") doFetchRams();
	}, [activeTab]);

	// ─── Debounced search ───
	const handleSearch = (value: string) => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(() => {
			if (activeTab === "brands") {
				const f = { ...brandsFilters, search: value, page: 1 };
				setBrandsFilters(f);
				fetchBrands(f, true);
			} else if (activeTab === "models") {
				const f = { ...modelsFilters, search: value, page: 1 };
				setModelsFilters(f);
				fetchModels({ ...f, brandId: f.brandId || undefined }, true);
			} else if (activeTab === "storages") {
				const f = { ...storagesFilters, search: value, page: 1 };
				setStoragesFilters(f);
				fetchStorages(f, true);
			} else if (activeTab === "rams") {
				const f = { ...ramsFilters, search: value, page: 1 };
				setRamsFilters(f);
				fetchRams(f, true);
			}
		}, 400);
	};

	const currentSearch =
		activeTab === "brands"
			? brandsFilters.search
			: activeTab === "models"
			  ? modelsFilters.search
			  : activeTab === "storages"
				? storagesFilters.search
				: ramsFilters.search;

	// ─── Sort handler ───
	const handleSort = (col: string) => {
		if (activeTab === "brands") {
			const sameCol = brandsFilters.sortBy === col;
			const f = {
				...brandsFilters,
				sortBy: col,
				sortOrder: (sameCol && brandsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const sameCol = modelsFilters.sortBy === col;
			const f = {
				...modelsFilters,
				sortBy: col,
				sortOrder: (sameCol && modelsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const sameCol = storagesFilters.sortBy === col;
			const f = {
				...storagesFilters,
				sortBy: col,
				sortOrder: (sameCol && storagesFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const sameCol = ramsFilters.sortBy === col;
			const f = {
				...ramsFilters,
				sortBy: col,
				sortOrder: (sameCol && ramsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setRamsFilters(f);
			fetchRams(f, true);
		}
	};

	const sortDir = (col: string): "asc" | "desc" | null => {
		if (activeTab === "brands")
			return brandsFilters.sortBy === col
				? brandsFilters.sortOrder
				: null;
		if (activeTab === "models")
			return modelsFilters.sortBy === col
				? modelsFilters.sortOrder
				: null;
		if (activeTab === "storages")
			return storagesFilters.sortBy === col
				? storagesFilters.sortOrder
				: null;
		if (activeTab === "rams")
			return ramsFilters.sortBy === col ? ramsFilters.sortOrder : null;
		return null;
	};

	// ─── Page change ───
	const handlePageChange = (p: number) => {
		if (activeTab === "brands") {
			const f = { ...brandsFilters, page: p };
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const f = { ...modelsFilters, page: p };
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const f = { ...storagesFilters, page: p };
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const f = { ...ramsFilters, page: p };
			setRamsFilters(f);
			fetchRams(f, true);
		}
	};

	const handleLimitChange = (l: number) => {
		if (activeTab === "brands") {
			const f = { ...brandsFilters, limit: l, page: 1 };
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const f = { ...modelsFilters, limit: l, page: 1 };
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const f = { ...storagesFilters, limit: l, page: 1 };
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const f = { ...ramsFilters, limit: l, page: 1 };
			setRamsFilters(f);
			fetchRams(f, true);
		}
	};

	// ─── Models brand filter ───
	const handleModelBrandFilter = (brandId: string) => {
		const f = { ...modelsFilters, brandId, page: 1 };
		setModelsFilters(f);
		fetchModels({ ...f, brandId: brandId || undefined }, true);
	};

	// ─── ADD ───
	const openAdd = () => {
		setAddValue("");
		setAddBrandId(allBrands.length > 0 ? allBrands[0].id : "");
		setAddErrors({});
		setAddModal(true);
	};

	const handleAdd = async (e: React.FormEvent) => {
		e.preventDefault();
		setAddErrors({});
		try {
			if (activeTab === "brands") {
				await brandValidationSchema.validate(
					{ name: addValue },
					{ abortEarly: false },
				);
			} else if (activeTab === "models") {
				await modelValidationSchema.validate(
					{
						name: addValue,
						brand_id: addBrandId ? Number(addBrandId) : undefined,
					},
					{ abortEarly: false },
				);
			} else if (activeTab === "storages") {
				await storageValidationSchema.validate(
					{ value: addValue },
					{ abortEarly: false },
				);
			} else if (activeTab === "rams") {
				await ramValidationSchema.validate(
					{ value: addValue },
					{ abortEarly: false },
				);
			}
		} catch (err: any) {
			if (
				err.name === "ValidationError" ||
				err instanceof yup.ValidationError
			) {
				const errorsMap: Record<string, string> = {};
				if (err.inner && err.inner.length > 0) {
					err.inner.forEach((error: any) => {
						if (error.path) {
							errorsMap[error.path] = error.message;
						}
					});
				} else {
					errorsMap[err.path || "name"] = err.message;
				}
				setAddErrors(errorsMap);
				return;
			}
			throw err;
		}

		setAddLoading(true);
		let result: { success: boolean; message?: string; errors?: any };
		if (activeTab === "brands") result = await addBrand(addValue);
		else if (activeTab === "models")
			result = await addModel(addValue, Number(addBrandId));
		else if (activeTab === "storages") result = await addStorage(addValue);
		else result = await addRam(addValue);
		setAddLoading(false);
		if (result.success) {
			setAddModal(false);
			if (activeTab === "brands") {
				toast.success("Brand request submitted successfully!");
			} else if (activeTab === "models") {
				toast.success("Model added successfully!");
			} else if (activeTab === "storages") {
				toast.success("Storage request submitted successfully!");
			} else if (activeTab === "rams") {
				toast.success("Ram request submitted successfully!");
			}
		} else {
			if (result.errors && typeof result.errors === "object") {
				setAddErrors(result.errors);
			} else {
				setAddErrors({
					general: result.message || "Something went wrong.",
				});
			}
		}
	};

	// ─── EDIT ───
	const openEdit = (
		tab: Tab,
		id: number,
		currentValue: string,
		currentBrandId?: number,
	) => {
		setEditModal({ tab, id, currentValue, currentBrandId });
		setEditValue(currentValue);
		setEditBrandId(currentBrandId || "");
		setEditErrors({});
	};

	const handleEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editModal) return;
		setEditErrors({});
		const { tab, id } = editModal;
		try {
			if (tab === "brands") {
				await brandValidationSchema.validate(
					{ name: editValue },
					{ abortEarly: false },
				);
			} else if (tab === "models") {
				await modelValidationSchema.validate(
					{
						name: editValue,
						brand_id: editBrandId ? Number(editBrandId) : undefined,
					},
					{ abortEarly: false },
				);
			} else if (tab === "storages") {
				await storageValidationSchema.validate(
					{ value: editValue },
					{ abortEarly: false },
				);
			} else if (tab === "rams") {
				await ramValidationSchema.validate(
					{ value: editValue },
					{ abortEarly: false },
				);
			}
		} catch (err: any) {
			if (
				err.name === "ValidationError" ||
				err instanceof yup.ValidationError
			) {
				const errorsMap: Record<string, string> = {};
				if (err.inner && err.inner.length > 0) {
					err.inner.forEach((error: any) => {
						if (error.path) {
							errorsMap[error.path] = error.message;
						}
					});
				} else {
					errorsMap[err.path || "name"] = err.message;
				}
				setEditErrors(errorsMap);
				return;
			}
			throw err;
		}

		setEditLoading(true);
		let result: { success: boolean; message?: string; errors?: any };
		if (tab === "brands") result = await editBrand(id, editValue);
		else if (tab === "models")
			result = await editModel(id, {
				name: editValue,
				brand_id: Number(editBrandId) || undefined,
			});
		else if (tab === "storages") result = await editStorage(id, editValue);
		else result = await editRam(id, editValue);
		setEditLoading(false);
		if (result.success) {
			setEditModal(null);
		} else {
			if (result.errors && typeof result.errors === "object") {
				setEditErrors(result.errors);
			} else {
				setEditErrors({
					general: result.message || "Something went wrong.",
				});
			}
		}
	};

	// ─── DELETE ───
	const openDelete = (tab: Tab, id: number, label: string) => {
		setDeleteModal({ tab, id, label });
	};

	const handleDelete = async () => {
		if (!deleteModal) return;
		setDeleteLoading(true);
		const { tab, id } = deleteModal;
		let ok: boolean;
		if (tab === "brands") ok = await removeBrand(id);
		else if (tab === "models") ok = await removeModel(id);
		else if (tab === "storages") ok = await removeStorage(id);
		else ok = await removeRam(id);
		setDeleteLoading(false);
		if (ok) setDeleteModal(null);
	};

	const isLoading =
		(activeTab === "brands" && brandsLoading) ||
		(activeTab === "models" && modelsLoading) ||
		(activeTab === "storages" && storagesLoading) ||
		(activeTab === "rams" && ramsLoading);

	const paginatedData =
		activeTab === "brands"
			? brands
			: activeTab === "models"
			  ? models
			  : activeTab === "storages"
				? storages
				: rams;

	// ─── ADD PLACEHOLDER ───
	const addPlaceholder =
		activeTab === "brands"
			? "e.g. Motorola"
			: activeTab === "models"
			  ? "e.g. Moto Edge 50 Ultra"
			  : activeTab === "storages"
				? "e.g. 512GB"
				: "e.g. 16GB";

	// ─── METRIC CARDS ───
	const metricCards = [
		{
			label: "Brands",
			value: specMetrics.totalBrands,
			color: "bg-indigo-500",
			tab: "brands" as Tab,
		},
		{
			label: "Models",
			value: specMetrics.totalModels,
			color: "bg-violet-500",
			tab: "models" as Tab,
		},
		{
			label: "Storages",
			value: specMetrics.totalStorages,
			color: "bg-sky-500",
			tab: "storages" as Tab,
		},
		{
			label: "RAM Sizes",
			value: specMetrics.totalRams,
			color: "bg-emerald-500",
			tab: "rams" as Tab,
		},
	];

	const tabConfig: { key: Tab; label: string }[] = [
		{ key: "brands", label: "Brands Setup" },
		{ key: "models", label: "Model Catalog" },
		{ key: "storages", label: "Storage Options" },
		{ key: "rams", label: "RAM Options" },
	];

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRIC CARDS */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
				{metricCards.map((card) => (
					<button
						key={card.tab}
						onClick={() => {
							setActiveTab(card.tab);
						}}
						className={`p-5 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 cursor-pointer group ${
							activeTab === card.tab
								? "border-primary/40 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-primary/20"
								: "border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 hover:shadow-sm"
						}`}
					>
						<div
							className={`absolute top-0 left-0 w-1.5 h-full ${card.color}`}
						/>
						<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pl-1">
							{card.label}
						</span>
						<span className="text-3xl font-extrabold tracking-tight mt-1 block pl-1">
							{card.value}
						</span>
					</button>
				))}
			</div>

			{/* TABLE CARD */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm overflow-hidden">
				{/* TABLE HEADER */}
				<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/40">
					{/* Tabs */}
					<div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-955 p-1 rounded-xl overflow-x-auto w-full lg:w-auto">
						{tabConfig.map(({ key, label }) => (
							<button
								key={key}
								id={`spec-tab-${key}`}
								onClick={() => setActiveTab(key)}
								className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer ${
									activeTab === key
										? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
										: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
								}`}
							>
								{label}
							</button>
						))}
					</div>

					{/* Controls */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
						{/* Models: brand filter */}
						{activeTab === "models" && (
							<select
								value={modelsFilters.brandId}
								onChange={(e) =>
									handleModelBrandFilter(e.target.value)
								}
								className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="">All Brands</option>
								{allBrands.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
						)}

						{/* Search */}
						<div className="relative w-full sm:w-56">
							<span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 pointer-events-none">
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</span>
							<input
								type="text"
								defaultValue={currentSearch}
								key={activeTab}
								onChange={(e) => handleSearch(e.target.value)}
								placeholder={`Search ${activeTab}...`}
								className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary placeholder-zinc-400"
							/>
						</div>

						<Button
							id="spec-add-btn"
							variant="gradient"
							size="sm"
							className="whitespace-nowrap"
							onClick={openAdd}
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
								{activeTab === "brands"
									? "Request Brand"
									: activeTab === "storages"
									  ? "Request Storage"
									  : activeTab === "rams"
										? "Request RAM"
										: "Add Model"}
							</span>
						</Button>
					</div>
				</div>

				{/* TABLE BODY */}
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							{activeTab === "brands" && (
								<tr className="bg-zinc-50/80 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200/40 dark:border-zinc-800/40">
									<th className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors w-8">
										#
									</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("name")}
									>
										<span className="flex items-center">
											Brand Name{" "}
											<SortIcon dir={sortDir("name")} />
										</span>
									</th>
									<th className="py-3.5 px-6 text-center">
										Associated Models
									</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("created_at")}
									>
										<span className="flex items-center">
											Added{" "}
											<SortIcon
												dir={sortDir("created_at")}
											/>
										</span>
									</th>
								</tr>
							)}
							{activeTab === "models" && (
								<tr className="bg-zinc-50/80 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200/40 dark:border-zinc-800/40">
									<th className="py-3.5 px-6 w-8">#</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("brand")}
									>
										<span className="flex items-center">
											Brand{" "}
											<SortIcon dir={sortDir("brand")} />
										</span>
									</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("name")}
									>
										<span className="flex items-center">
											Model Name{" "}
											<SortIcon dir={sortDir("name")} />
										</span>
									</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("created_at")}
									>
										<span className="flex items-center">
											Added{" "}
											<SortIcon
												dir={sortDir("created_at")}
											/>
										</span>
									</th>
									<th className="py-3.5 px-6 text-center">
										Actions
									</th>
								</tr>
							)}
							{(activeTab === "storages" ||
								activeTab === "rams") && (
								<tr className="bg-zinc-50/80 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-200/40 dark:border-zinc-800/40">
									<th className="py-3.5 px-6 w-8">#</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("value")}
									>
										<span className="flex items-center">
											{activeTab === "storages"
												? "Storage Capacity"
												: "RAM Size"}
											<SortIcon dir={sortDir("value")} />
										</span>
									</th>
									<th
										className="py-3.5 px-6 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
										onClick={() => handleSort("created_at")}
									>
										<span className="flex items-center">
											Added{" "}
											<SortIcon
												dir={sortDir("created_at")}
											/>
										</span>
									</th>
								</tr>
							)}
						</thead>
						<tbody>
							{isLoading ? (
								<LoadingRows
									cols={
										activeTab === "models"
											? 5
											: activeTab === "brands"
											  ? 4
											  : 3
									}
								/>
							) : paginatedData.data.length === 0 ? (
								<tr>
									<td
										colSpan={
											activeTab === "models"
												? 5
												: activeTab === "brands"
												  ? 4
												  : 3
										}
										className="py-16 text-center"
									>
										<div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
											<svg
												className="w-10 h-10 opacity-40"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="1.5"
													d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-1.5-1.5M4 13l1.5-1.5"
												/>
											</svg>
											<span className="text-sm font-medium">
												No {activeTab} found
											</span>
											<span className="text-xs">
												Add your first{" "}
												{activeTab.slice(0, -1)} to get
												started.
											</span>
										</div>
									</td>
								</tr>
							) : (
								<>
									{/* BRANDS ROWS */}
									{activeTab === "brands" &&
										(brands.data as SpecBrand[]).map(
											(b, i) => (
												<tr
													key={b.id}
													className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors group"
												>
													<td className="py-4 px-6 text-zinc-400 font-medium">
														{(brands.page - 1) *
															brands.limit +
															i +
															1}
													</td>
													<td className="py-4 px-6">
														<div className="flex flex-col">
															<span className="font-bold text-zinc-900 dark:text-white text-sm">
																{b.name}
															</span>
															{b.status ===
																"pending" && (
																<span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 animate-fadeIn">
																	Pending
																	Approval
																</span>
															)}
														</div>
													</td>
													<td className="py-4 px-6 text-center">
														<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
															{b.model_count ?? 0}{" "}
															model
															{(b.model_count ??
																0) !== 1
																? "s"
																: ""}
														</span>
													</td>
													<td className="py-4 px-6 text-zinc-400 text-xs">
														{b.created_at
															? new Date(
																  b.created_at,
															  ).toLocaleDateString(
																  "en-IN",
																  {
																	  day: "2-digit",
																	  month: "short",
																	  year: "numeric",
																  },
															  )
															: "—"}
													</td>
												</tr>
											),
										)}

									{/* MODELS ROWS */}
									{activeTab === "models" &&
										(models.data as SpecModel[]).map(
											(m, i) => (
												<tr
													key={m.id}
													className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors"
												>
													<td className="py-4 px-6 text-zinc-400 font-medium">
														{(models.page - 1) *
															models.limit +
															i +
															1}
													</td>
													<td className="py-4 px-6">
														<span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
															{m.brand_name}
														</span>
													</td>
													<td className="py-4 px-6 font-bold text-zinc-900 dark:text-white text-sm">
														{m.name}
													</td>
													<td className="py-4 px-6 text-zinc-400 text-xs">
														{m.created_at
															? new Date(
																  m.created_at,
															  ).toLocaleDateString(
																  "en-IN",
																  {
																	  day: "2-digit",
																	  month: "short",
																	  year: "numeric",
																  },
															  )
															: "—"}
													</td>
													<td className="py-4 px-6">
														{m.vendor_id &&
														vendor &&
														Number(m.vendor_id) ===
															Number(
																vendor.id,
															) ? (
															<div className="flex items-center justify-center gap-2">
																<button
																	onClick={() =>
																		openEdit(
																			"models",
																			m.id,
																			m.name,
																			m.brand_id,
																		)
																	}
																	className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-primary transition-colors cursor-pointer"
																	title="Edit"
																>
																	<EditIcon />
																</button>
																<button
																	onClick={() =>
																		openDelete(
																			"models",
																			m.id,
																			m.name,
																		)
																	}
																	className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
																	title="Delete"
																>
																	<DeleteIcon />
																</button>
															</div>
														) : (
															<div className="flex items-center justify-center text-zinc-400 dark:text-zinc-500 gap-1 font-medium text-[11px]">
																<svg
																	className="w-3 h-3"
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
																<span>
																	System
																</span>
															</div>
														)}
													</td>
												</tr>
											),
										)}

									{/* STORAGES ROWS */}
									{activeTab === "storages" &&
										(storages.data as SpecStorage[]).map(
											(s, i) => (
												<tr
													key={s.id}
													className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors"
												>
													<td className="py-4 px-6 text-zinc-400 font-medium">
														{(storages.page - 1) *
															storages.limit +
															i +
															1}
													</td>
													<td className="py-4 px-6">
														<div className="flex flex-col">
															<span className="font-bold text-zinc-900 dark:text-white text-sm">
																{s.value}
															</span>
															{s.status ===
																"pending" && (
																<span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 animate-fadeIn">
																	Pending
																	Approval
																</span>
															)}
														</div>
													</td>
													<td className="py-4 px-6 text-zinc-400 text-xs">
														{s.created_at
															? new Date(
																  s.created_at,
															  ).toLocaleDateString(
																  "en-IN",
																  {
																	  day: "2-digit",
																	  month: "short",
																	  year: "numeric",
																  },
															  )
															: "—"}
													</td>
												</tr>
											),
										)}

									{/* RAMS ROWS */}
									{activeTab === "rams" &&
										(rams.data as SpecRam[]).map((r, i) => (
											<tr
												key={r.id}
												className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors"
											>
												<td className="py-4 px-6 text-zinc-400 font-medium">
													{(rams.page - 1) *
														rams.limit +
														i +
														1}
												</td>
												<td className="py-4 px-6">
													<div className="flex flex-col">
														<span className="font-bold text-zinc-900 dark:text-white text-sm">
															{r.value}
														</span>
														{r.status ===
															"pending" && (
															<span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 animate-fadeIn">
																Pending Approval
															</span>
														)}
													</div>
												</td>
												<td className="py-4 px-6 text-zinc-400 text-xs">
													{r.created_at
														? new Date(
															  r.created_at,
														  ).toLocaleDateString(
															  "en-IN",
															  {
																  day: "2-digit",
																  month: "short",
																  year: "numeric",
															  },
														  )
														: "—"}
												</td>
											</tr>
										))}
								</>
							)}
						</tbody>
					</table>
				</div>

				{/* PAGINATION */}
				<Pagination
					page={paginatedData.page}
					total={paginatedData.total}
					limit={paginatedData.limit}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
				/>
			</div>

			{/* ─── ADD MODAL ─── */}
			<Modal
				isOpen={addModal}
				onClose={() => setAddModal(false)}
				title={
					activeTab === "brands"
						? "Request New Brand"
						: activeTab === "storages"
						  ? "Request New Storage"
						  : activeTab === "rams"
							? "Request New RAM"
							: "Add New Model"
				}
				size="sm"
			>
				<form onSubmit={handleAdd} className="space-y-4" noValidate>
					{(activeTab === "brands" ||
						activeTab === "storages" ||
						activeTab === "rams") && (
						<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
							Submit a request to add a new{" "}
							{activeTab === "brands"
								? "brand"
								: activeTab === "storages"
								  ? "storage option"
								  : "RAM option"}
							. It will be available in listings and dropdowns
							once approved by an administrator.
						</div>
					)}
					{activeTab === "models" && (
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
								Brand *
							</label>
							<select
								value={addBrandId}
								onChange={(e) => {
									setAddBrandId(Number(e.target.value));
									setAddErrors((prev) => {
										const next = { ...prev };
										delete next.brand_id;
										return next;
									});
								}}
								required
								className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:outline-none transition-all ${
									addErrors.brand_id
										? "border-red-500 focus:ring-red-500/20"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
								}`}
							>
								<option value="">— Select Brand —</option>
								{allBrands.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
							{addErrors.brand_id && (
								<p className="text-xs text-red-500 mt-1">
									{addErrors.brand_id}
								</p>
							)}
						</div>
					)}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
							{activeTab === "rams"
								? "RAM Size"
								: activeTab
									  .slice(0, -1)
									  .charAt(0)
									  .toUpperCase() +
								  activeTab.slice(0, -1).slice(1)}{" "}
							Value *
						</label>
						<input
							type="text"
							autoFocus
							value={addValue}
							onChange={(e) => {
								setAddValue(e.target.value);
								setAddErrors((prev) => {
									const next = { ...prev };
									delete next.name;
									delete next.value;
									delete next.general;
									return next;
								});
							}}
							placeholder={addPlaceholder}
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-all ${
								addErrors.name || addErrors.value
									? "border-red-500 focus:ring-red-500/20"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
							}`}
							required
						/>
						{addErrors.name && (
							<p className="text-xs text-red-500 mt-1">
								{addErrors.name}
							</p>
						)}
						{addErrors.value && (
							<p className="text-xs text-red-500 mt-1">
								{addErrors.value}
							</p>
						)}
						{addErrors.general && (
							<p className="text-xs text-red-500 mt-1">
								{addErrors.general}
							</p>
						)}
					</div>
					<div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setAddModal(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="gradient"
							size="sm"
							disabled={addLoading}
						>
							{addLoading
								? activeTab === "brands"
									? "Submitting…"
									: "Adding…"
								: activeTab === "brands"
								  ? "Submit Request"
								  : "Add"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* ─── EDIT MODAL ─── */}
			<Modal
				isOpen={editModal !== null}
				onClose={() => setEditModal(null)}
				title={
					editModal
						? `Edit ${editModal.tab === "rams" ? "RAM" : editModal.tab.slice(0, -1).charAt(0).toUpperCase() + editModal.tab.slice(0, -1).slice(1)}`
						: "Edit"
				}
				size="sm"
			>
				<form onSubmit={handleEdit} className="space-y-4" noValidate>
					{editModal?.tab === "models" && (
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
								Brand *
							</label>
							<select
								value={editBrandId}
								onChange={(e) => {
									setEditBrandId(Number(e.target.value));
									setEditErrors((prev) => {
										const next = { ...prev };
										delete next.brand_id;
										return next;
									});
								}}
								required
								className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:outline-none transition-all ${
									editErrors.brand_id
										? "border-red-500 focus:ring-red-500/20"
										: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
								}`}
							>
								{allBrands.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name}
									</option>
								))}
							</select>
							{editErrors.brand_id && (
								<p className="text-xs text-red-500 mt-1">
									{editErrors.brand_id}
								</p>
							)}
						</div>
					)}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
							Value *
						</label>
						<input
							type="text"
							autoFocus
							value={editValue}
							onChange={(e) => {
								setEditValue(e.target.value);
								setEditErrors((prev) => {
									const next = { ...prev };
									delete next.name;
									delete next.value;
									delete next.general;
									return next;
								});
							}}
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-all ${
								editErrors.name || editErrors.value
									? "border-red-500 focus:ring-red-500/20"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
							}`}
							required
						/>
						{editErrors.name && (
							<p className="text-xs text-red-500 mt-1">
								{editErrors.name}
							</p>
						)}
						{editErrors.value && (
							<p className="text-xs text-red-500 mt-1">
								{editErrors.value}
							</p>
						)}
						{editErrors.general && (
							<p className="text-xs text-red-500 mt-1">
								{editErrors.general}
							</p>
						)}
					</div>
					<div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setEditModal(null)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="gradient"
							size="sm"
							disabled={editLoading}
						>
							{editLoading ? "Saving…" : "Save Changes"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* ─── DELETE CONFIRMATION MODAL ─── */}
			<ConfirmDeleteModal
				isOpen={deleteModal !== null}
				onClose={() => setDeleteModal(null)}
				onConfirm={handleDelete}
				itemName={deleteModal?.label || ""}
				warningText={
					deleteModal?.tab === "brands"
						? "⚠ All models under this brand will also be deleted."
						: undefined
				}
				loading={deleteLoading}
			/>
		</div>
	);
}
