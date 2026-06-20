"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
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
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { isValidPhoneNumber } from "libphonenumber-js";

const quickCustomerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name is required."),
	phone: yup
		.string()
		.required("Phone number is required.")
		.test(
			"is-valid-phone",
			"Please enter a valid international phone number.",
			(value) => !!value && isValidPhoneNumber(value),
		),
	address: yup.string().trim().nullable().notRequired(),
});
export default function ModelDetailsPage() {
	const router = useRouter();
	const params = useParams();

	const rawBrand = params.brand as string;
	const rawModel = params.model as string;

	const brandSlug = decodeURIComponent(rawBrand);
	const modelSlug = decodeURIComponent(rawModel);

	const {
		devices,
		isLoading,
		addDevice,
		editDevice,
		removeDevice,
		refreshDevices,
		customers,
		addCustomer,
	} = useDashboard();

	const specs = useSpecifications();

	// Find matched brand and model objects from specifications database
	const matchedBrandObj = useMemo(() => {
		return specs.allBrands.find((b) => b.slug === brandSlug);
	}, [specs.allBrands, brandSlug]);

	const matchedModelObj = useMemo(() => {
		if (!matchedBrandObj) return null;
		return specs.allModels.find(
			(m) => m.brand_id === matchedBrandObj.id && m.slug === modelSlug
		);
	}, [specs.allModels, matchedBrandObj, modelSlug]);

	const brand = matchedBrandObj ? matchedBrandObj.name : brandSlug;
	const model = matchedModelObj ? matchedModelObj.name : modelSlug;

	const isAppleBrand = brand.toLowerCase() === "apple";

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState<Mobile | null>(
		null,
	);

	// Deletion Confirmation States
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deletingDevice, setDeletingDevice] = useState<{ id: string; name: string } | null>(null);

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
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Quick-add customer states
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});

	const [formError, setFormError] = useState("");
	const [storageInlineError, setStorageInlineError] = useState("");
	const [ramInlineError, setRamInlineError] = useState("");
	const [custFormError, setCustFormError] = useState("");

	const handleCreateCustomer = async () => {
		setCustErrors({});
		setCustFormError("");
		try {
			await quickCustomerSchema.validate(
				{
					name: newCustName,
					phone: newCustPhone,
					address: newCustAddress || null,
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
				setCustErrors(errors);
			} else {
				setCustFormError("Validation failed.");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await addCustomer({
				name: newCustName,
				phone: newCustPhone,
				email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
				status: "Active",
				address: newCustAddress || "Store Walk-in Registration",
				notes: "Quick registered during transaction from inventory catalog.",
			});

			if (res.success) {
				// @ts-ignore
				setFormCustomerId(res.customer?.id?.toString() || "");
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setCustErrors({});
				toast.success(`Customer ${newCustName} registered.`);
			} else {
				if (res.errors) {
					setCustErrors(res.errors);
				} else {
					setCustFormError(res.message || "Failed to register customer.");
				}
			}
		} catch (err) {
			setCustFormError("An unexpected error occurred registering customer.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Dynamic Add Dialog States
	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [newStorageVal, setNewStorageVal] = useState("");
	const [isSubmittingStorage, setIsSubmittingStorage] = useState(false);

	const [isAddingRam, setIsAddingRam] = useState(false);
	const [newRamVal, setNewRamVal] = useState("");
	const [isSubmittingRam, setIsSubmittingRam] = useState(false);

	// Field-level validation errors
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});

	// Pagination States
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	// Search & Condition Filter States
	const [level2Search, setLevel2Search] = useState("");
	const [level2Condition, setLevel2Condition] = useState("All");
	const [sortBy, setSortBy] = useState<"color" | "imei" | "condition" | "batteryHealth" | "purchasePrice" | "price" | "status">("color");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

	useEffect(() => {
		setPage(1);
	}, [level2Search, level2Condition, sortBy, sortOrder]);

	// Fetch fresh lists from backend
	useEffect(() => {
		refreshDevices(undefined, true);
	}, []);

	// Open Handlers
	const handleOpenAdd = () => {
		setEditingDevice(null);
		setFormImei("");
		setFormBrand(matchedBrandObj ? matchedBrandObj.id.toString() : "");
		setFormModel(matchedModelObj ? matchedModelObj.id.toString() : "");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("NEW");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormDescription("");
		setFormCustomerId("");
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setNewCustAddress("");
		setCustErrors({});
		setFieldErrors({});
		setFormError("");
		setStorageInlineError("");
		setRamInlineError("");
		setCustFormError("");
		setIsFormOpen(true);
	};

	const handleOpenEdit = (device: Mobile) => {
		setEditingDevice(device);
		setFormImei(device.imei || "");
		setFormBrand(device.brandId ? device.brandId.toString() : (matchedBrandObj?.id.toString() || ""));
		setFormModel(device.modelId ? device.modelId.toString() : (matchedModelObj?.id.toString() || ""));
		setFormStorage(device.storageId ? device.storageId.toString() : "");
		setFormRam(device.ramId ? device.ramId.toString() : "");
		setFormColor(device.color);
		setFormCondition(device.condition);
		setFormBatteryHealth(device.batteryHealth);
		setFormPurchasePrice(
			device.purchasePrice ? device.purchasePrice.toString() : "",
		);
		setFormDescription(device.description);
		setFormCustomerId("");
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setNewCustAddress("");
		setCustErrors({});
		setFieldErrors({});
		setFormError("");
		setStorageInlineError("");
		setRamInlineError("");
		setCustFormError("");
		setIsFormOpen(true);
	};
	// Submit Handler
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});
		setFormError("");

		const selectedBrandName = specs.allBrands.find(b => b.id.toString() === formBrand)?.name || brand;
		const selectedModelName = specs.allModels.find(m => m.id.toString() === formModel)?.name || model;
		const selectedStorageValue = specs.allStorages.find(s => s.id.toString() === formStorage)?.value || "";
		const selectedRamValue = specs.allRams.find(r => r.id.toString() === formRam)?.value || "";

		try {
			await mobileValidationSchema.validate(
				{
					brand: selectedBrandName,
					model: selectedModelName,
					storage: selectedStorageValue,
					ram: selectedRamValue,
					color: formColor,
					imei: formImei || null,
					condition: formCondition,
					batteryHealth: formBatteryHealth,
					purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : undefined,
					description: formDescription || null,
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
				setFormError("Form validation failed.");
			}
			return;
		}

		const purchasePriceNum = parseFloat(formPurchasePrice);
		const priceNum = Math.round(purchasePriceNum * 1.2); // Markup selling price by 20%

		const payload = {
			brand_id: Number(formBrand),
			model_id: Number(formModel),
			storage_id: Number(formStorage),
			ram_id: Number(formRam),
			color: formColor || "Space Gray",
			imei: formImei || null,
			condition: formCondition,
			price: priceNum,
			purchase_price: purchasePriceNum,
			battery_health: formBatteryHealth,
			status: editingDevice ? editingDevice.status : "Available",
			description: formDescription || `Registered ${selectedBrandName} ${selectedModelName}.`,
			customer_id: formCustomerId ? Number(formCustomerId) : null,
		};

		if (editingDevice) {
			const res = await editDevice(editingDevice.id, payload);
			if (res.success) {
				toast.success(`Updated device entry successfully.`);
				setIsFormOpen(false);
			} else {
				if (res.errors) {
					setFieldErrors(res.errors);
				} else {
					setFormError(res.message || "Failed to update device.");
				}
			}
		} else {
			const res = await addDevice(payload);
			if (res.success) {
				toast.success(`Added device entry successfully.`);
				setIsFormOpen(false);
			} else {
				if (res.errors) {
					setFieldErrors(res.errors);
				} else {
					setFormError(res.message || "Failed to add device.");
				}
			}
		}
	};

	// Dynamic spec creators
	const handleCreateStorage = async () => {
		if (newStorageVal.trim()) {
			setIsSubmittingStorage(true);
			setStorageInlineError("");
			try {
				const res = await specs.addStorage(newStorageVal.trim());
				if (res.success) {
					toast.success("Storage capacity request submitted.");
					await specs.refreshAllSpecs();
					setNewStorageVal("");
					setIsAddingStorage(false);
					clearFieldError("storage");
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
					await specs.refreshAllSpecs();
					setNewRamVal("");
					setIsAddingRam(false);
					clearFieldError("ram");
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
	// Delete confirmation handlers
	const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		setDeletingDevice({ id, name });
		setIsDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingDevice) return;
		const { id, name } = deletingDevice;
		const success = await removeDevice(id);
		if (success) {
			toast.success(`Deleted ${name} from inventory.`);
		} else {
			toast.error("Failed to delete device.");
		}
		setIsDeleteOpen(false);
		setDeletingDevice(null);
	};

	// Filter devices matching this specific brand and model
	const modelDevices = useMemo(() => {
		return devices.filter(
			(d) =>
				d.brand.toLowerCase() === brand.toLowerCase() &&
				d.model.toLowerCase() === model.toLowerCase(),
		);
	}, [devices, brand, model]);

	// Apply search/condition filters & sorting
	const sortedAndFilteredModelDevices = useMemo(() => {
		let result = modelDevices.filter((d) => {
			const query = level2Search.toLowerCase();
			const matchesSearch =
				(d.imei && d.imei.toLowerCase().includes(query)) ||
				d.color.toLowerCase().includes(query) ||
				d.storage.toLowerCase().includes(query) ||
				d.ram.toLowerCase().includes(query);

			const matchesCondition =
				level2Condition === "All" || d.condition === level2Condition;

			return matchesSearch && matchesCondition;
		});

		// Sorting
		result.sort((a, b) => {
			let valA: any = "";
			let valB: any = "";

			if (sortBy === "color") {
				valA = a.color.toLowerCase();
				valB = b.color.toLowerCase();
			} else if (sortBy === "imei") {
				valA = a.imei ? a.imei : "";
				valB = b.imei ? b.imei : "";
			} else if (sortBy === "condition") {
				valA = a.condition;
				valB = b.condition;
			} else if (sortBy === "batteryHealth") {
				valA = a.batteryHealth;
				valB = b.batteryHealth;
			} else if (sortBy === "purchasePrice") {
				valA = a.purchasePrice || 0;
				valB = b.purchasePrice || 0;
			} else if (sortBy === "price") {
				valA = a.price;
				valB = b.price;
			} else if (sortBy === "status") {
				valA = a.status;
				valB = b.status;
			}

			if (valA < valB) return sortOrder === "asc" ? -1 : 1;
			if (valA > valB) return sortOrder === "asc" ? 1 : -1;
			return 0;
		});

		return result;
	}, [modelDevices, level2Search, level2Condition, sortBy, sortOrder]);

	// Paginate devices
	const paginatedModelDevices = useMemo(() => {
		const start = (page - 1) * limit;
		return sortedAndFilteredModelDevices.slice(start, start + limit);
	}, [sortedAndFilteredModelDevices, page, limit]);

	// Table columns configuration — battery column shown only for Apple
	const columns: Column<Mobile>[] = [
		{
			key: "color",
			title: "Specification",
			sortable: true,
			render: (d) => (
				<div>
					<div className="font-bold text-zinc-900 dark:text-white leading-tight">
						{d.color}
					</div>
					<div className="text-[11px] text-zinc-400 mt-1 font-semibold">
						{d.storage} / {d.ram} RAM
					</div>
				</div>
			),
		},
		{
			key: "imei",
			title: "IMEI",
			sortable: true,
			render: (d) => (
				<span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
					{d.imei ? (
						<Link
							href={`/mobiles/${matchedBrandObj?.slug || brandSlug}/${matchedModelObj?.slug || modelSlug}/${d.imei}`}
							className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
						>
							{d.imei}
						</Link>
					) : (
						<span className="text-zinc-400 italic font-sans text-[11px]">
							No IMEI Registered
						</span>
					)}
				</span>
			),
		},
		{
			key: "condition",
			title: "Condition",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center",
			render: (d) => {
				const conditionColorMap: Record<string, string> = {
					NEW: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
					OLD: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
				};
				return (
					<span
						className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
							conditionColorMap[d.condition] || "bg-zinc-100 text-zinc-700"
						}`}
					>
						{d.condition}
					</span>
				);
			},
		},
		...(isAppleBrand ? [{
			key: "batteryHealth",
			title: "Battery",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center font-semibold text-zinc-700 dark:text-zinc-300",
			render: (d: Mobile) => <span>{d.batteryHealth}%</span>,
		} as Column<Mobile>] : []),
		{
			key: "purchasePrice",
			title: "Cost Price",
			sortable: true,
			headerClassName: "text-right",
			className: "text-right text-zinc-500 font-medium",
			render: (d) => (
				<span suppressHydrationWarning>
					{d.purchasePrice ? `₹${d.purchasePrice.toLocaleString()}` : "-"}
				</span>
			),
		},
		{
			key: "price",
			title: "Selling Price",
			sortable: true,
			headerClassName: "text-right",
			className: "text-right font-extrabold text-zinc-900 dark:text-zinc-100",
			render: (d) => (
				<span suppressHydrationWarning>
					₹{d.price.toLocaleString()}
				</span>
			),
		},
		{
			key: "status",
			title: "Status",
			sortable: true,
			headerClassName: "text-center",
			className: "text-center",
			render: (d) => (
				<span
					className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
						d.status === "Available"
							? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
							: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
					}`}
				>
					{d.status === "Available" ? "Available" : d.status}
				</span>
			),
		},
		{
			key: "actions",
			title: "Actions",
			sortable: false,
			headerClassName: "text-center",
			className: "text-center",
			render: (d) => (
				<div className="flex items-center justify-center gap-2">
					<button
						onClick={() => handleOpenEdit(d)}
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
						title="Edit device specs"
					>
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
					</button>

					{d.imei ? (
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								router.push(
									`/mobiles/${matchedBrandObj?.slug || brandSlug}/${matchedModelObj?.slug || modelSlug}/${d.imei}`,
								);
							}}
							className="px-2.5 py-1 text-[11px] font-semibold hover:bg-primary hover:text-white transition-colors cursor-pointer"
						>
							History
						</Button>
					) : (
						<span className="text-[10px] text-zinc-400 italic">Cannot Trace</span>
					)}

					<button
						onClick={(e) => handleDelete(d.id, `${brand} ${model} (${d.imei || "No IMEI"})`, e)}
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-105 dark:hover:bg-zinc-850 text-zinc-650 hover:text-red-500 transition-colors cursor-pointer"
						title="Delete Device"
					>
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
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* Header with Title and Back Button */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push("/mobiles")}
					className="flex items-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer self-start"
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
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Mobiles
				</Button>

				<div className="text-left">
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Configuration Inventory
					</span>
					<h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-none">
						{brand} {model}
					</h1>
				</div>
			</div>

			{/* SEARCH & FILTERS */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
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
						value={level2Search}
						onChange={(e) => setLevel2Search(e.target.value)}
						placeholder="Search IMEI, specs, color..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
				</div>

				<div className="flex items-center gap-3 w-full md:w-auto">
					<Select
						value={level2Condition}
						onChange={(e) => setLevel2Condition(e.target.value)}
						options={[
							{ value: "All", label: "All Conditions" },
							{ value: "NEW", label: "New" },
							{ value: "OLD", label: "Old" },
						]}
						className="w-40"
					/>

					<Button
						variant="gradient"
						size="sm"
						onClick={handleOpenAdd}
						className="px-3.5 py-2.5 rounded-xl font-bold cursor-pointer"
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
							Add Device
						</span>
					</Button>
				</div>
			</div>

			{/* INDIVIDUAL IMEI LISTING TABLE */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				<DataTable
					columns={columns}
					data={paginatedModelDevices}
					loading={isLoading}
					onSort={handleSort}
					sortDir={getSortDir}
					emptyMessage={
						<div className="text-center py-16 space-y-3">
							<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
								No Configured Devices Found
							</h4>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
								We couldn't find any individual devices matching your search or filters.
							</p>
						</div>
					}
				/>

				{sortedAndFilteredModelDevices.length > 0 && (
					<Pagination
						page={page}
						total={sortedAndFilteredModelDevices.length}
						limit={limit}
						onPageChange={setPage}
						onLimitChange={(l) => {
							setLimit(l);
							setPage(1);
						}}
					/>
				)}
			</div>

			{/* DYNAMIC MODAL FORM */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingDevice
						? `Edit Device: ${editingDevice.brand} ${editingDevice.model}`
						: `Register Mobile Device`
				}
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
								value={formImei}
								onChange={(e) => {
									setFormImei(e.target.value.replace(/\D/g, ""));
									clearFieldError("imei");
								}}
								placeholder="e.g. 359283748291827"
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none font-mono transition-colors ${
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
								value={formColor}
								onChange={(e) => {
									setFormColor(e.target.value);
									clearFieldError("color");
								}}
								placeholder="e.g. Phantom Black"
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Condition */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Condition *
							</label>
							<Select
								value={formCondition}
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
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Battery Health (%) *
							</label>
							<input
								type="number"
								min={50}
								max={100}
								value={formBatteryHealth}
								onChange={(e) => {
									setFormBatteryHealth(parseInt(e.target.value) || 0);
									clearFieldError("batteryHealth");
								}}
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
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

					{/* Customer Select */}
					{!editingDevice && (
						<div className="space-y-1.5 animate-fadeIn">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Select Customer (for Purchase Transaction)
								</label>
								<button
									type="button"
									onClick={() => {
										setIsAddingCust(!isAddingCust);
										setCustErrors({});
									}}
									className="text-[10px] text-primary hover:underline font-bold"
								>
									{isAddingCust ? "Cancel" : "+ Quick-Add New Customer"}
								</button>
							</div>

							{isAddingCust ? (
								<div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-scaleUp text-left">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-zinc-400 uppercase">
												Full Name *
											</label>
											<input
												type="text"
												disabled={isSubmitting}
												value={newCustName}
												onChange={(e) => {
													setNewCustName(e.target.value);
													setCustErrors((prev) => ({ ...prev, name: "" }));
												}}
												placeholder="John Doe"
												className={`w-full px-3 py-2 border rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
													${custErrors.name ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
											/>
											{custErrors.name && (
												<p className="text-[10px] text-red-500 font-semibold">
													{custErrors.name}
												</p>
											)}
										</div>
										<div className="space-y-1">
											<label className="text-[10px] font-semibold text-zinc-400 uppercase">
												Mobile Number *
											</label>
											<PhoneInputField
												disabled={isSubmitting}
												size="sm"
												value={newCustPhone}
												onChange={(phone) => {
													setNewCustPhone(phone);
													setCustErrors((prev) => ({ ...prev, phone: "" }));
												}}
												error={custErrors.phone}
											/>
										</div>
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-zinc-400 uppercase">
											Address
										</label>
										<textarea
											disabled={isSubmitting}
											value={newCustAddress}
											onChange={(e) => {
												setNewCustAddress(e.target.value);
												setCustErrors((prev) => ({ ...prev, address: "" }));
											}}
											placeholder="Enter customer address..."
											rows={2}
											className={`w-full px-3 py-2 border rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
												${custErrors.address ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
										/>
										{custErrors.address && (
											<p className="text-xs text-red-500 font-medium mt-1">
												{custErrors.address}
											</p>
										)}
									</div>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={handleCreateCustomer}
										className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer h-9"
									>
										{isSubmitting ? (
											<>
												<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
												</svg>
												<span>Saving Customer...</span>
											</>
										) : (
											"Save and Select Customer"
										)}
									</button>
									{custFormError && (
										<p className="text-xs text-red-500 font-semibold text-center mt-2">
											{custFormError}
										</p>
									)}
								</div>
							) : (
								<Select
									value={formCustomerId}
									onChange={(e) => setFormCustomerId(e.target.value)}
									options={[
										{ value: "", label: "-- Select Customer --" },
										...customers.map((c) => ({ value: c.id.toString(), label: `${c.name} (${c.phone})` })),
									]}
								/>
							)}
						</div>
					)}

					{/* Cost Price */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Purchase / Cost Price * (₹)
						</label>
						<input
							type="number"
							required
							value={formPurchasePrice}
							onChange={(e) => {
								setFormPurchasePrice(e.target.value);
								clearFieldError("purchasePrice");
							}}
							placeholder="e.g. 30000"
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
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
							onChange={(e) => {
								setFormDescription(e.target.value);
								clearFieldError("description");
							}}
							placeholder="e.g. Mint condition. Minor scratch on screen, box and original cable available..."
							rows={3}
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-colors ${
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
							onClick={() => setIsFormOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="gradient" size="sm">
							{editingDevice ? "Save Changes" : "Register Stock Item"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* DELETE CONFIRMATION MODAL */}
			<ConfirmDeleteModal
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingDevice?.name || ""}
				warningText="Removing this device will delete it permanently from the inventory database."
			/>
		</div>
	);
}
