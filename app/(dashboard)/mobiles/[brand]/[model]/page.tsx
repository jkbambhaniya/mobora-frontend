"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { Html5Qrcode } from "html5-qrcode";
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
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { MobileRegisterForm } from "@/components/vendor/MobileRegisterForm";
import { ImeiConflictWarning } from "@/components/vendor/imei-conflict-warning";
import { useAuth } from "@/context/vendor/auth-context";

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
		trades,
	} = useDashboard();

	const specs = useSpecifications();
	const { vendor } = useAuth();
	
	const markupPercent = vendor?.markup !== undefined ? Number(vendor.markup) : 20;

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
	const [conflictInfo, setConflictInfo] = useState<any | null>(null);
	const [editingDevice, setEditingDevice] = useState<Mobile | null>(
		null,
	);

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

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
	const [formCondition, setFormCondition] = useState<"OLD" | "NEW">("OLD");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formPurchasePrice, setFormPurchasePrice] = useState("");
	const [formRepairingCost, setFormRepairingCost] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formCustomerId, setFormCustomerId] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formError, setFormError] = useState("");

	// Advanced Features States
	const [isImportOpen, setIsImportOpen] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [isScannerOpen, setIsScannerOpen] = useState(false);

	// Field-level validation errors
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});

	const registerFormValues = {
		imei: formImei,
		brand: formBrand,
		model: formModel,
		storage: formStorage,
		ram: formRam,
		color: formColor,
		condition: formCondition,
		batteryHealth: formBatteryHealth,
		purchasePrice: formPurchasePrice,
		repairingCost: formRepairingCost,
		description: formDescription,
		customerId: formCustomerId
	};

	const handleFormChange = (field: string, value: any) => {
		clearFieldError(field);
		if (field === "imei") setFormImei(value);
		else if (field === "brand") setFormBrand(value);
		else if (field === "model") setFormModel(value);
		else if (field === "storage") setFormStorage(value);
		else if (field === "ram") setFormRam(value);
		else if (field === "color") setFormColor(value);
		else if (field === "condition") setFormCondition(value);
		else if (field === "batteryHealth") setFormBatteryHealth(value);
		else if (field === "purchasePrice") setFormPurchasePrice(value);
		else if (field === "repairingCost") setFormRepairingCost(value);
		else if (field === "description") setFormDescription(value);
		else if (field === "customerId") setFormCustomerId(value);
	};

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
		setFormCondition("OLD");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormRepairingCost("");
		setFormDescription("");
		setFormCustomerId("");
		setFieldErrors({});
		setFormError("");
		setConflictInfo(null);
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
		setFormRepairingCost(
			device.repairingCost ? device.repairingCost.toString() : "",
		);
		setFormDescription(device.description);
		setFormCustomerId("");
		setFieldErrors({});
		setFormError("");
		setConflictInfo(null);
		setIsFormOpen(true);
	};

	// Export stock Excel handler
	const handleExportExcel = () => {
		try {
			if (sortedAndFilteredModelDevices.length === 0) {
				toast.error("No data to export");
				return;
			}
			const headers = ["IMEI", "Color", "Storage", "RAM", "Condition", "Battery Health", "Cost Price", "Selling Price", "Status"];
			const rows = sortedAndFilteredModelDevices.map(d => [
				d.imei || "No IMEI",
				d.color,
				d.storage,
				d.ram,
				d.condition,
				d.batteryHealth ? `${d.batteryHealth}%` : "-",
				d.purchasePrice || 0,
				d.price || 0,
				d.status
			]);
			const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Stock List");
			XLSX.writeFile(wb, `${brandSlug}_${modelSlug}_stock.xlsx`);
			toast.success("Excel stock list exported successfully!");
		} catch (error) {
			toast.error("Failed to export Excel file");
		}
	};

	// Share stock list clipboard copy handler
	const handleShareStock = () => {
		try {
			const availableDevices = sortedAndFilteredModelDevices.filter(d => d.status === "Available");
			if (availableDevices.length === 0) {
				toast.error("No available devices to share");
				return;
			}
			let text = `📱 ${brand} ${model} - Available Stock List\n`;
			text += `-----------------------------------------\n`;
			availableDevices.forEach((d, idx) => {
				text += `${idx + 1}. ${d.storage}/${d.ram} RAM | ${d.color} | Condition: ${d.condition} | Battery: ${d.batteryHealth}% | Price: ₹${d.price.toLocaleString()}\n`;
			});
			text += `\nGenerated on: ${new Date().toLocaleDateString()}\n`;
			navigator.clipboard.writeText(text);
			toast.success("Stock list copied to clipboard!");
		} catch (error) {
			toast.error("Failed to copy stock list");
		}
	};

	// Download demo/sample Excel template handler
	const handleDownloadDemoSheet = () => {
		try {
			const headers = ["IMEI", "Color", "Storage", "RAM", "Condition", "BatteryHealth", "CostPrice"];
			
			// Get default/example values from specs or fallbacks
			const defaultStorage = specs.allStorages[0]?.value || "128GB";
			const defaultRam = specs.allRams[0]?.value || "8GB";
			const defaultColor = "Space Gray";

			const rows = [
				["358201234567890", defaultColor, defaultStorage, defaultRam, "NEW", "100", "500"],
				["358201234567891", defaultColor, defaultStorage, defaultRam, "OLD", "85", "420"]
			];

			const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Template");
			XLSX.writeFile(wb, "mobora_inventory_import_template.xlsx");
			toast.success("Demo sheet template downloaded!");
		} catch (error) {
			toast.error("Failed to generate demo sheet");
		}
	};

	// Import Excel handler
	const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsImporting(true);
		try {
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data, { type: "array" });
			const sheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[sheetName];
			const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

			if (rows.length === 0) {
				toast.error("Excel sheet is empty");
				setIsImporting(false);
				return;
			}

			let successCount = 0;
			let failCount = 0;
			const firstRow = rows[0].map(c => String(c).toLowerCase());
			const startIndex = firstRow.includes("imei") || firstRow.includes("color") ? 1 : 0;

			for (let i = startIndex; i < rows.length; i++) {
				const row = rows[i];
				if (!row || row.length < 5) continue;

				const csvImei = row[0] ? String(row[0]).trim() : null;
				const csvColor = row[1] ? String(row[1]).trim() : "Space Gray";
				const csvStorageVal = row[2] ? String(row[2]).trim() : "";
				const csvRamVal = row[3] ? String(row[3]).trim() : "";
				const csvCondition = String(row[4] || "NEW").trim().toUpperCase();
				const csvBattery = parseInt(String(row[5])) || 90;
				const csvCost = parseFloat(String(row[6])) || 0;

				const matchedStorage = specs.allStorages.find(s => s.value.toLowerCase() === csvStorageVal.toLowerCase());
				const matchedRam = specs.allRams.find(r => r.value.toLowerCase() === csvRamVal.toLowerCase());
				if (!matchedStorage || !matchedRam) {
					failCount++;
					continue;
				}

				const payload = {
					brand_id: matchedBrandObj?.id,
					model_id: matchedModelObj?.id,
					storage_id: matchedStorage.id,
					ram_id: matchedRam.id,
					color: csvColor,
					imei: csvImei,
					condition: csvCondition === "NEW" ? "NEW" : "OLD",
					battery_health: csvBattery,
					status: "Available",
					purchase_price: csvCost,
					price: Math.round(csvCost * (1 + markupPercent / 100)),
					description: `Imported from Excel ${brand} ${model}.`
				};
				const res = await addDevice(payload);
				if (res.success) successCount++;
				else failCount++;
			}
			toast.success(`Excel Import Done: ${successCount} added, ${failCount} failed.`);
			setIsImportOpen(false);
		} catch (err) {
			toast.error("Error parsing Excel data");
		} finally {
			setIsImporting(false);
		}
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
					purchasePrice: editingDevice ? undefined : (formPurchasePrice ? parseFloat(formPurchasePrice) : undefined),
					description: formDescription || null,
					repairingCost: formRepairingCost ? parseFloat(formRepairingCost) : undefined,
					customerId: formCustomerId || null,
				},
				{
					abortEarly: false,
					context: { isEdit: !!editingDevice }
				},
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

		const payload: any = {
			brand_id: Number(formBrand),
			model_id: Number(formModel),
			storage_id: Number(formStorage),
			ram_id: Number(formRam),
			color: formColor || "Space Gray",
			imei: formImei || null,
			condition: formCondition,
			battery_health: formBatteryHealth,
			status: editingDevice ? editingDevice.status : "Available",
			description: formDescription || `Registered ${selectedBrandName} ${selectedModelName}.`,
			repairing_cost: formRepairingCost ? parseFloat(formRepairingCost) : 0,
		};

		if (!editingDevice) {
			const purchasePriceNum = parseFloat(formPurchasePrice);
			payload.purchase_price = purchasePriceNum;
			payload.price = Math.round(purchasePriceNum * (1 + markupPercent / 100));
			payload.customer_id = formCustomerId || null;
		}

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
				if (res.conflict) {
					setConflictInfo(res.conflict);
				} else if (res.errors) {
					setFieldErrors(res.errors);
				} else {
					setFormError(res.message || "Failed to add device.");
				}
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

	const modelDevices = useMemo(() => {
		return devices.filter(
			(d) =>
				slugify(d.brand) === slugify(brandSlug) &&
				slugify(d.model) === slugify(modelSlug),
		);
	}, [devices, brandSlug, modelSlug]);

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
							variant={expandedIds.has(d.id) ? "gradient" : "outline"}
							onClick={() => toggleExpand(d.id)}
							className="px-2.5 py-1 text-[11px] font-semibold hover:!bg-primary hover:!text-white transition-colors cursor-pointer"
						>
							{expandedIds.has(d.id) ? "Hide History" : "Show History"}
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

	const renderImeiHistory = (device: Mobile) => {
		if (!device.imei) return null;
		
		const timelineEvents = trades
			.filter((t) => t.imei === device.imei)
			.sort((a, b) => {
				const timeA = new Date(a.date).getTime();
				const timeB = new Date(b.date).getTime();
				if (timeA !== timeB) return timeA - timeB;
				return Number(a.id) - Number(b.id);
			});

		if (timelineEvents.length === 0) {
			return (
				<div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 text-center text-sm text-zinc-500 rounded-b-xl">
					No transaction history found for this IMEI.
				</div>
			);
		}

		return (
			<div className="bg-zinc-50/80 dark:bg-zinc-900/40 p-4 border-t border-zinc-200 dark:border-zinc-800 shadow-inner">
				<div className="flex justify-between items-center mb-3 px-1">
					<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Transaction Ledger</h4>
					<Link href={`/mobiles/${matchedBrandObj?.slug || brandSlug}/${matchedModelObj?.slug || modelSlug}/${device.imei}`} className="text-[11px] text-primary font-bold hover:underline">
						Open Full Details &rarr;
					</Link>
				</div>
				<table className="w-full text-left text-xs border-collapse bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200/60 dark:border-zinc-800/60">
					<thead>
						<tr className="bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
							<th className="py-2.5 px-4">Date</th>
							<th className="py-2.5 px-4">Type</th>
							<th className="py-2.5 px-4">Partner</th>
							<th className="py-2.5 px-4">Notes</th>
							<th className="py-2.5 px-4 text-right">Value (₹)</th>
						</tr>
					</thead>
					<tbody>
						{[...timelineEvents].reverse().map((event) => {
							const isPurchase = event.type === "Purchase";
							return (
								<tr key={event.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
									<td className="py-2.5 px-4 font-mono font-medium text-zinc-600 dark:text-zinc-400">{event.date}</td>
									<td className="py-2.5 px-4">
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
												isPurchase
													? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
													: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											}`}
										>
											{isPurchase ? "Buy" : "Sale"}
										</span>
									</td>
									<td className="py-2.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
										{event.customerName}
									</td>
									<td className="py-2.5 px-4 text-zinc-500 max-w-[200px] truncate" title={event.notes}>
										{event.notes || "-"}
									</td>
									<td className="py-2.5 px-4 text-right font-black text-zinc-900 dark:text-white">
										{event.amount.toLocaleString()}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		);
	};

	const stockMetrics = useMemo(() => {
		const totalCount = modelDevices.length;
		const availableCount = modelDevices.filter(d => d.status === "Available").length;
		const soldCount = totalCount - availableCount;
		
		let totalInvestment = 0;
		let totalEstimatedSelling = 0;
		modelDevices.forEach(d => {
			if (d.status === "Available") {
				totalInvestment += (d.purchasePrice || 0) + (d.repairingCost || 0);
				totalEstimatedSelling += d.price;
			}
		});
		
		const estProfitMargin = totalEstimatedSelling - totalInvestment;
		
		return {
			totalCount,
			availableCount,
			soldCount,
			totalInvestment,
			estProfitMargin,
			avgSellingPrice: availableCount > 0 ? Math.round(totalEstimatedSelling / availableCount) : 0
		};
	}, [modelDevices]);

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

			{/* STOCK METRICS CARDS */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col justify-between">
					<span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Stock</span>
					<div className="flex items-baseline justify-between mt-2">
						<span className="text-2xl font-black text-zinc-900 dark:text-white">{stockMetrics.totalCount}</span>
						<span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
							{stockMetrics.availableCount} Active
						</span>
					</div>
				</div>

				<div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col justify-between">
					<span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Investment Value</span>
					<div className="flex items-baseline justify-between mt-2">
						<span className="text-2xl font-black text-zinc-900 dark:text-white">₹{stockMetrics.totalInvestment.toLocaleString()}</span>
						<span className="text-[10px] font-medium text-zinc-400">Available Stock</span>
					</div>
				</div>

				<div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col justify-between">
					<span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Est. Profit Margin</span>
					<div className="flex items-baseline justify-between mt-2">
						<span className="text-2xl font-black text-zinc-900 dark:text-white">₹{stockMetrics.estProfitMargin.toLocaleString()}</span>
						<span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
							Markups
						</span>
					</div>
				</div>

				<div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm flex flex-col justify-between">
					<span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Avg. Selling Price</span>
					<div className="flex items-baseline justify-between mt-2">
						<span className="text-2xl font-black text-zinc-900 dark:text-white">₹{stockMetrics.avgSellingPrice.toLocaleString()}</span>
						<span className="text-[10px] font-medium text-zinc-400">Per Active Device</span>
					</div>
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

				<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
					<Select
						value={level2Condition}
						onChange={(e) => setLevel2Condition(e.target.value)}
						options={[
							{ value: "All", label: "All Conditions" },
							{ value: "NEW", label: "New" },
							{ value: "OLD", label: "Old" },
						]}
						className="w-36"
					/>

					<Button
						variant="outline"
						size="sm"
						onClick={handleShareStock}
						className="px-3 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
						title="Share Stock List"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.632-2.316m0 0a3 3 0 10-2.222-2.476L6.47 8.274m12.18 1.902a3 3 0 11-1.042 5.563l-5.632-2.816m0 0a3 3 0 102.222-2.476l5.632 2.816M19 16a3 3 0 100 6 3 3 0 000-6z" />
						</svg>
						<span>Share</span>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleExportExcel}
						className="px-3 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
						title="Export to Excel/CSV"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						<span>Export Excel</span>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsImportOpen(true)}
						className="px-3 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
						title="Import from Excel/CSV"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
						<span>Import Excel</span>
					</Button>

					<Button
						variant="gradient"
						size="sm"
						onClick={handleOpenAdd}
						className="px-3.5 py-2.5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
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
								d="M12 4v16m8-8H4"
							/>
						</svg>
						<span>Add Device</span>
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
					expandedRowIds={expandedIds}
					renderExpandedRow={renderImeiHistory}
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
				{conflictInfo ? (
					<ImeiConflictWarning
						conflictInfo={conflictInfo}
						onBack={() => setConflictInfo(null)}
						onClose={() => setIsFormOpen(false)}
					/>
				) : (
					<form onSubmit={handleSubmit} noValidate className="space-y-4">
					<MobileRegisterForm
						values={registerFormValues}
						onChange={handleFormChange}
						errors={fieldErrors}
						isEdit={!!editingDevice}
						hideBrandModel={true}
						specs={{
							allBrands: specs.allBrands,
							allModels: specs.allModels,
							allStorages: specs.allStorages,
							allRams: specs.allRams,
							addBrand: specs.addBrand,
							addModel: specs.addModel,
							addStorage: specs.addStorage,
							addRam: specs.addRam,
							refreshAllSpecs: specs.refreshAllSpecs
						}}
					/>

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
				)}
			</Modal>

			{/* DELETE CONFIRMATION MODAL */}
			<ConfirmDeleteModal
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingDevice?.name || ""}
				warningText="Removing this device will delete it permanently from the inventory database."
			/>

			{/* EXCEL IMPORT MODAL */}
			<Modal
				isOpen={isImportOpen}
				onClose={() => setIsImportOpen(false)}
				title="Import Stock from Excel File"
				size="md"
			>
				<div className="space-y-4">
					<div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
						<p className="font-bold text-zinc-700 dark:text-zinc-300">Expected Sheet Column Headers (in order):</p>
						<p className="font-mono bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded select-all text-[11px]">
							IMEI | Color | Storage | RAM | Condition | BatteryHealth | CostPrice
						</p>
						<p className="mt-2 text-[10px]">Note: Storage and RAM values must match existing options in the system.</p>
						<div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
							<span className="text-[10px] text-zinc-400">Need a sample file to get started?</span>
							<button
								type="button"
								onClick={handleDownloadDemoSheet}
								className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
							>
								Download Demo Sheet
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Select Excel File (.xlsx, .xls)
						</label>
						<div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center hover:border-primary hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all relative cursor-pointer">
							<input
								type="file"
								accept=".xlsx, .xls"
								onChange={handleImportExcel}
								disabled={isImporting}
								className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
							/>
							<div className="space-y-2 pointer-events-none">
								<svg className="w-8 h-8 text-zinc-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
								</svg>
								<p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
									{isImporting ? "Processing Excel File..." : "Click or drag your Excel file here to upload"}
								</p>
								<p className="text-[10px] text-zinc-400">Supports Excel workbook formats (.xlsx, .xls)</p>
							</div>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setIsImportOpen(false)}
							disabled={isImporting}
						>
							Cancel
						</Button>
					</div>
				</div>
			</Modal>


		</div>
	);
}
