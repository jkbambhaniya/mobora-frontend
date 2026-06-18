"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
import { Select } from "@/components/ui/select";
import Pagination from "@/components/ui/Pagination";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import * as yup from "yup";
import { mobileValidationSchema } from "@/utils/validation";
import {
	useDashboard,
	Mobile,
	Customer,
	slugify,
} from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { useInventory } from "@/context/vendor/inventory-context";
import { MobileFilters } from "@/actions/mobiles";
import { isValidPhoneNumber } from "libphonenumber-js";

const quickCustomerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name is required."),
	phone: yup
		.string()
		.trim()
		.required("Phone Number is required.")
		.test(
			"is-valid-phone",
			"Please enter a valid international phone number.",
			(value) => !!value && isValidPhoneNumber(value),
		),
	address: yup.string().trim().nullable().notRequired(),
});

export default function InventoryPage() {
	const {
		devices,
		isLoading,
		total,
		refreshDevices,
		addDevice,
		editDevice,
		removeDevice,
		customers,
		setCustomers,
		handleAddTradeTransaction,
		trades,
		orders,
		triggerToast,
		addCustomer,
	} = useDashboard();

	const specs = useSpecifications();
	const { metrics, refreshMetrics } = useInventory();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [brandFilter, setBrandFilter] = useState("All");
	const [conditionFilter, setConditionFilter] = useState("All");
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState<Mobile | null>(null);

	// Delete Modal State
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingDevice, setDeletingDevice] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Sell Modal State
	const [isSellFormOpen, setIsSellFormOpen] = useState(false);
	const [sellingDevice, setSellingDevice] = useState<Mobile | null>(null);
	const [sellPrice, setSellPrice] = useState("");
	const [sellCustomer, setSellCustomer] = useState("");
	const [sellDate, setSellDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [sellNotes, setSellNotes] = useState("");

	// Buyback Modal State
	const [isBuybackFormOpen, setIsBuybackFormOpen] = useState(false);
	const [buybackDevice, setBuybackDevice] = useState<Mobile | null>(null);
	const [buybackPrice, setBuybackPrice] = useState("");
	const [buybackCustomer, setBuybackCustomer] = useState("");
	const [buybackCondition, setBuybackCondition] = useState<
		"Mint" | "Excellent" | "Good" | "Fair"
	>("Excellent");
	const [buybackBatteryHealth, setBuybackBatteryHealth] = useState(90);
	const [buybackDate, setBuybackDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [buybackNotes, setBuybackNotes] = useState("");

	// Quick Add Customer States
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});

	// Form Fields
	const [formImei, setFormImei] = useState("");
	const [formBrand, setFormBrand] = useState("");
	const [formModel, setFormModel] = useState("");
	const [formStorage, setFormStorage] = useState("");
	const [formRam, setFormRam] = useState("");
	const [formColor, setFormColor] = useState("");
	const [formCondition, setFormCondition] = useState<
		"Mint" | "Excellent" | "Good" | "Fair"
	>("Excellent");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formPurchasePrice, setFormPurchasePrice] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formCustomerId, setFormCustomerId] = useState("");

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

	// Field Validation Errors
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const clearFieldError = (field: string) =>
		setFieldErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});

	// Fetch dynamic items on filter changes
	useEffect(() => {
		const filters: MobileFilters = {
			search: searchTerm.trim() || undefined,
			brand: brandFilter !== "All" ? brandFilter : undefined,
			condition: conditionFilter !== "All" ? conditionFilter : undefined,
			status: statusFilter !== "All" ? statusFilter : undefined,
			sortBy: sortBy || undefined,
			sortOrder: sortOrder || undefined,
			page,
			limit,
		};
		refreshDevices(filters, true);
	}, [searchTerm, brandFilter, conditionFilter, statusFilter, sortBy, sortOrder, page, limit, refreshDevices]);

	// Fetch metrics on mount
	useEffect(() => {
		refreshMetrics();
	}, [refreshMetrics]);

	// Reset page when filters change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, brandFilter, statusFilter, conditionFilter, sortBy, sortOrder]);

	const isAppleSelected = useMemo(() => {
		const brandObj = specs.allBrands.find((b) => b.id.toString() === formBrand);
		return brandObj?.name.toLowerCase() === "apple";
	}, [formBrand, specs.allBrands]);

	// Spec resolvers for fallbacks
	const getBrandIdByName = (name: string) => {
		return specs.allBrands.find((b) => b.name.toLowerCase() === name.toLowerCase())?.id.toString() || "";
	};
	const getModelIdByName = (name: string, brandIdStr: string) => {
		return specs.allModels.find(
			(m) =>
				m.name.toLowerCase() === name.toLowerCase() &&
				m.brand_id.toString() === brandIdStr
		)?.id.toString() || "";
	};
	const getStorageIdByValue = (val: string) => {
		return specs.allStorages.find((s) => s.value.toLowerCase() === val.toLowerCase())?.id.toString() || "";
	};
	const getRamIdByValue = (val: string) => {
		return specs.allRams.find((r) => r.value.toLowerCase() === val.toLowerCase())?.id.toString() || "";
	};

	// Open Handlers
	const handleOpenAdd = () => {
		setEditingDevice(null);
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("Excellent");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormDescription("");
		setFormCustomerId("");
		setFieldErrors({});
		setIsFormOpen(true);
	};

	const handleOpenEdit = (device: Mobile) => {
		setEditingDevice(device);
		setFormImei(device.imei || "");

		const bId = device.brandId?.toString() || getBrandIdByName(device.brand);
		setFormBrand(bId);
		setFormModel(device.modelId?.toString() || getModelIdByName(device.model, bId));
		setFormStorage(device.storageId?.toString() || getStorageIdByValue(device.storage));
		setFormRam(device.ramId?.toString() || getRamIdByValue(device.ram));

		setFormColor(device.color);
		setFormCondition(device.condition);
		setFormBatteryHealth(device.batteryHealth || 90);
		setFormPurchasePrice(
			device.purchasePrice ? device.purchasePrice.toString() : "",
		);
		setFormDescription(device.description || "");
		setFormCustomerId("");
		setFieldErrors({});
		setIsFormOpen(true);
	};

	const handleOpenSell = (device: Mobile) => {
		setSellingDevice(device);
		setSellPrice(device.price.toString());
		setSellCustomer(customers[0]?.name || "");
		setSellDate(new Date().toISOString().split("T")[0]);
		setSellNotes(`Sold from inventory catalog.`);
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setNewCustAddress("");
		setCustErrors({});
		setIsSellFormOpen(true);
	};

	const handleSellSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sellingDevice) return;
		if (!sellCustomer) {
			triggerToast("Please select a customer or quick-add a new one.");
			return;
		}
		if (!sellPrice) {
			triggerToast("Please specify the selling price.");
			return;
		}

		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(sellPrice);

			const result = await editDevice(sellingDevice.id, {
				status: "Sold",
				price: priceNum,
				description: sellNotes || `Sold to ${sellCustomer}.`
			});

			if (result.success) {
				handleAddTradeTransaction({
					imei: sellingDevice.imei || "N/A",
					deviceBrand: sellingDevice.brand,
					deviceModel: sellingDevice.model,
					type: "Sale",
					customerName: sellCustomer,
					amount: priceNum,
					date: sellDate,
					notes: sellNotes || `Sold from inventory catalog.`,
					storage: sellingDevice.storage,
					ram: sellingDevice.ram,
					color: sellingDevice.color,
					condition: sellingDevice.condition,
					batteryHealth: sellingDevice.batteryHealth,
				});

				setIsSellFormOpen(false);
				triggerToast(
					`Recorded sale of ${sellingDevice.brand} ${sellingDevice.model} to ${sellCustomer}.`,
				);
			} else {
				triggerToast(result.message || "Failed to record sale.");
			}
		} catch (err) {
			triggerToast("An unexpected error occurred while recording sale.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOpenBuyback = (device: Mobile) => {
		setBuybackDevice(device);
		setBuybackPrice(
			device.purchasePrice
				? Math.round(device.purchasePrice * 0.9).toString()
				: "",
		);

		let originalBuyer = "";
		if (device.imei) {
			const saleTrade = trades
				.filter((t) => t.imei === device.imei && t.type === "Sale")
				.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];
			if (saleTrade) originalBuyer = saleTrade.customerName;
		}
		if (!originalBuyer) {
			const saleTrade = trades
				.filter(
					(t) =>
						t.deviceBrand.toLowerCase() ===
							device.brand.toLowerCase() &&
						t.deviceModel.toLowerCase() ===
							device.model.toLowerCase() &&
						t.type === "Sale",
				)
				.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];
			if (saleTrade) originalBuyer = saleTrade.customerName;
		}

		if (originalBuyer) {
			setBuybackCustomer(originalBuyer);
		} else {
			setBuybackCustomer(customers[0]?.name || "");
		}

		setBuybackCondition(device.condition);
		setBuybackBatteryHealth(device.batteryHealth || 90);
		setBuybackDate(new Date().toISOString().split("T")[0]);
		setBuybackNotes(`Re-acquired device from customer.`);
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setNewCustAddress("");
		setCustErrors({});
		setIsBuybackFormOpen(true);
	};

	const handleBuybackSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!buybackDevice) return;
		if (!buybackCustomer) {
			triggerToast("Please select a customer or quick-add a new one.");
			return;
		}
		if (!buybackPrice) {
			triggerToast("Please specify the buyback price.");
			return;
		}

		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(buybackPrice);

			const result = await editDevice(buybackDevice.id, {
				status: "Active",
				purchase_price: priceNum,
				price: Math.round(priceNum * 1.2), // Auto markup price by 20%
				condition: buybackCondition,
				battery_health: buybackBatteryHealth,
				description: buybackNotes || `Re-acquired via buyback from ${buybackCustomer}.`,
			});

			if (result.success) {
				handleAddTradeTransaction({
					imei: buybackDevice.imei || "N/A",
					deviceBrand: buybackDevice.brand,
					deviceModel: buybackDevice.model,
					type: "Purchase",
					customerName: buybackCustomer,
					amount: priceNum,
					date: buybackDate,
					notes:
						buybackNotes ||
						`Re-acquired via buyback from ${buybackCustomer}.`,
					storage: buybackDevice.storage,
					ram: buybackDevice.ram,
					color: buybackDevice.color,
					condition: buybackCondition,
					batteryHealth: buybackBatteryHealth,
				});

				setIsBuybackFormOpen(false);
				triggerToast(
					`Recorded buyback of ${buybackDevice.brand} ${buybackDevice.model} from ${buybackCustomer}.`,
				);
			} else {
				triggerToast(result.message || "Failed to record buyback.");
			}
		} catch (err) {
			triggerToast("An unexpected error occurred while recording buyback.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateCustomer = async () => {
		setCustErrors({});
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
				triggerToast("Validation failed.");
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
				if (isSellFormOpen) {
					setSellCustomer(newCustName);
				} else if (isBuybackFormOpen) {
					setBuybackCustomer(newCustName);
				} else if (isFormOpen) {
					// @ts-ignore
					setFormCustomerId(res.customer?.id?.toString() || "");
				}
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setCustErrors({});
				triggerToast(`Customer ${newCustName} registered.`);
			} else {
				triggerToast(res.message || "Failed to register customer.");
			}
		} catch (err) {
			triggerToast("An unexpected error occurred registering customer.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = (id: string, name: string) => {
		setDeletingDevice({ id, name });
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!deletingDevice) return;
		setIsSubmitting(true);
		try {
			const success = await removeDevice(deletingDevice.id);
			if (success) {
				triggerToast(`Deleted ${deletingDevice.name} listing.`);
				await refreshMetrics();
			} else {
				triggerToast("Failed to delete listing.");
			}
		} catch (err) {
			triggerToast("Failed to delete listing.");
		} finally {
			setIsSubmitting(false);
			setDeleteConfirmOpen(false);
			setDeletingDevice(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});
		setIsSubmitting(true);

		try {
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
					batteryHealth: selectedBrandName.toLowerCase() === "apple" ? formBatteryHealth : null,
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
				triggerToast("Form validation failed.");
			}
			return;
		}

		try {
			const purchasePriceNum = parseFloat(formPurchasePrice);
			const priceNum = Math.round(purchasePriceNum * 1.2);

			const data = {
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
				status: editingDevice ? editingDevice.status : "Active",
				description: formDescription || null,
				customer_id: formCustomerId ? Number(formCustomerId) : null,
			};

			let res;
			if (editingDevice) {
				res = await editDevice(editingDevice.id, data);
			} else {
				res = await addDevice(data);
			}

			if (res.success) {
				triggerToast(editingDevice ? "Stock listing updated." : "Stock device registered.");
				setIsFormOpen(false);
				await refreshMetrics();
			} else {
				triggerToast(res.message || "Failed to save device details.");
			}
		} catch (err) {
			triggerToast("An unexpected error occurred while saving device.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateBrand = async () => {
		if (newBrandVal.trim()) {
			setIsSubmittingBrand(true);
			try {
				const res = await specs.addBrand(newBrandVal.trim());
				if (res.success) {
					triggerToast("Brand request submitted and is pending approval.");
					await specs.refreshAllSpecs();
					setNewBrandVal("");
					setIsAddingBrand(false);
				} else {
					triggerToast(res.message || "Failed to submit brand request.");
				}
			} catch (err) {
				triggerToast("Failed to submit brand request.");
			} finally {
				setIsSubmittingBrand(false);
			}
		}
	};

	const handleCreateModel = async () => {
		if (!formBrand) {
			triggerToast("Please choose a brand first.");
			return;
		}
		if (newModelVal.trim()) {
			setIsSubmittingModel(true);
			try {
				const res = await specs.addModel(newModelVal.trim(), Number(formBrand));
				if (res.success) {
					triggerToast("Model created successfully.");
					await specs.refreshAllSpecs();
					setNewModelVal("");
					setIsAddingModel(false);
					clearFieldError("model");
				} else {
					triggerToast(res.message || "Failed to add model.");
				}
			} catch (err) {
				triggerToast("Failed to add model.");
			} finally {
				setIsSubmittingModel(false);
			}
		}
	};

	const handleCreateStorage = async () => {
		if (newStorageVal.trim()) {
			setIsSubmittingStorage(true);
			try {
				const res = await specs.addStorage(newStorageVal.trim());
				if (res.success) {
					triggerToast("Storage capacity request submitted.");
					await specs.refreshAllSpecs();
					setNewStorageVal("");
					setIsAddingStorage(false);
					clearFieldError("storage");
				} else {
					triggerToast(res.message || "Failed to add storage.");
				}
			} catch (err) {
				triggerToast("Failed to add storage.");
			} finally {
				setIsSubmittingStorage(false);
			}
		}
	};

	const handleCreateRam = async () => {
		if (newRamVal.trim()) {
			setIsSubmittingRam(true);
			try {
				const res = await specs.addRam(newRamVal.trim());
				if (res.success) {
					triggerToast("RAM capacity request submitted.");
					await specs.refreshAllSpecs();
					setNewRamVal("");
					setIsAddingRam(false);
					clearFieldError("ram");
				} else {
					triggerToast(res.message || "Failed to add RAM.");
				}
			} catch (err) {
				triggerToast("Failed to add RAM.");
			} finally {
				setIsSubmittingRam(false);
			}
		}
	};

	const handleSortClick = (field: string) => {
		if (sortBy === field) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
		setPage(1);
	};

	const renderSortableHeader = (field: string, label: string, align: "left" | "center" | "right" = "left") => {
		const isSorted = sortBy === field;
		const alignClasses = {
			left: "justify-start",
			center: "justify-center text-center",
			right: "justify-end text-right",
		};
		return (
			<th
				onClick={() => handleSortClick(field)}
				className={`py-4 px-6 cursor-pointer select-none hover:text-zinc-750 dark:hover:text-zinc-200 transition-colors uppercase font-bold text-xs ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
			>
				<div className={`flex items-center gap-1.5 ${alignClasses[align]}`}>
					<span>{label}</span>
					{isSorted ? (
						sortOrder === "asc" ? (
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
						) : (
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
						)
					) : (
						<svg className="w-3.5 h-3.5 opacity-20 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
					)}
				</div>
			</th>
		);
	};

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRICS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
						Available Stock
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.activeStock}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Units in hand
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
						Total Sold
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalSold}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Completed sales
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
						Unique Models
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalUniqueModels}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Specs cataloged
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
						Tracked Lifecycles
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalTracedDevices}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							IMEI Logged
						</span>
					</div>
				</div>
			</div>

			{/* FILTER CONTROL BAR */}
			<div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
				<div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
					<div className="relative w-full lg:w-96">
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
							placeholder="Search by color, IMEI..."
							className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
						<Select
							value={brandFilter}
							onChange={(e) => setBrandFilter(e.target.value)}
							options={[
								{ value: "All", label: "All Brands" },
								...specs.allBrands.map((b) => ({ value: b.id.toString(), label: b.name })),
							]}
							className="w-40"
						/>

						<Select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							options={[
								{ value: "All", label: "All Statuses" },
								{ value: "Active", label: "Active Stock" },
								{ value: "Sold", label: "Sold" },
							]}
							className="w-40"
						/>

						<Select
							value={conditionFilter}
							onChange={(e) => {
								setPage(1);
								setConditionFilter(e.target.value);
							}}
							options={[
								{ value: "All", label: "All Conditions" },
								{ value: "Mint", label: "Mint" },
								{ value: "Excellent", label: "Excellent" },
								{ value: "Good", label: "Good" },
								{ value: "Fair", label: "Fair" },
							]}
							className="w-40"
						/>

						<Button
							variant="gradient"
							size="sm"
							onClick={handleOpenAdd}
							className="cursor-pointer"
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
								Register Stock
							</span>
						</Button>
					</div>
				</div>
			</div>

			{/* CATALOG DATA TABLE */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm border-collapse">
						<thead>
							<tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-455 font-semibold border-b border-zinc-200/40 dark:border-zinc-800/40">
								{renderSortableHeader("id", "ID", "left")}
								{renderSortableHeader("model", "Inventory Specifications", "left")}
								{renderSortableHeader("imei", "IMEI", "left")}
								{renderSortableHeader("condition", "Condition", "center")}
								{renderSortableHeader("batteryHealth", "Battery", "center")}
								{renderSortableHeader("purchasePrice", "Cost Price", "right")}
								{renderSortableHeader("price", "Sell Price", "right")}
								{renderSortableHeader("status", "Status", "center")}
								<th className="py-4 px-6 text-center uppercase font-bold text-xs text-zinc-400">Actions</th>
							</tr>
						</thead>
						{isLoading ? (
							<tbody>
								{[...Array(limit)].map((_, idx) => (
									<tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850/40 animate-pulse">
										<td className="py-4 px-6"><div className="h-4 w-12 bg-zinc-250 dark:bg-zinc-800 rounded" /></td>
										<td className="py-4 px-6">
											<div className="h-4 w-36 bg-zinc-250 dark:bg-zinc-800 rounded mb-2" />
											<div className="h-3 w-28 bg-zinc-150 dark:bg-zinc-850 rounded" />
										</td>
										<td className="py-4 px-6"><div className="h-4 w-28 bg-zinc-250 dark:bg-zinc-800 rounded" /></td>
										<td className="py-4 px-6 text-center"><div className="h-4 w-16 bg-zinc-250 dark:bg-zinc-800 rounded mx-auto" /></td>
										<td className="py-4 px-6 text-center"><div className="h-4 w-8 bg-zinc-250 dark:bg-zinc-800 rounded mx-auto" /></td>
										<td className="py-4 px-6 text-right"><div className="h-4 w-16 bg-zinc-250 dark:bg-zinc-800 rounded ml-auto" /></td>
										<td className="py-4 px-6 text-right"><div className="h-4 w-16 bg-zinc-250 dark:bg-zinc-800 rounded ml-auto" /></td>
										<td className="py-4 px-6 text-center"><div className="h-6 w-16 bg-zinc-250 dark:bg-zinc-800 rounded-full mx-auto" /></td>
										<td className="py-4 px-6 text-center"><div className="h-8 w-24 bg-zinc-250 dark:bg-zinc-800 rounded-xl mx-auto" /></td>
									</tr>
								))}
							</tbody>
						) : devices.length > 0 ? (
							<tbody>
								{devices.map((d) => (
									<tr
										key={d.id}
										className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
									>
										<td className="py-4 px-6 font-mono font-bold text-zinc-400 text-xs">
											{d.id}
										</td>
										<td className="py-4 px-6">
											<div>
												<div className="font-bold text-zinc-900 dark:text-white leading-tight">
													{d.brand} {d.model}
												</div>
												<div className="text-[11px] text-zinc-400 mt-1">
													{d.storage} / {d.ram} RAM
													&bull; {d.color}
												</div>
											</div>
										</td>
										<td className="py-4 px-6 font-mono text-xs text-zinc-650 dark:text-zinc-300">
											{d.imei ? (
												<Link
													href={`/mobiles/${specs.allBrands.find(b => b.id === d.brandId)?.slug || slugify(d.brand)}/${specs.allModels.find(m => m.id === d.modelId)?.slug || slugify(d.model)}/${d.imei}`}
													className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors cursor-pointer"
												>
													{d.imei}
												</Link>
											) : (
												"N/A"
											)}
										</td>
										<td className="py-4 px-6 text-center">
											<span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
												{d.condition}
											</span>
										</td>
										<td className="py-4 px-6 text-center font-semibold text-zinc-700 dark:text-zinc-300">
											{d.batteryHealth ? `${d.batteryHealth}%` : "-"}
										</td>
										<td
											className="py-4 px-6 text-right text-zinc-500 font-medium"
											suppressHydrationWarning
										>
											{d.purchasePrice
												? `₹${d.purchasePrice.toLocaleString()}`
												: "-"}
										</td>
										<td
											className="py-4 px-6 text-right font-extrabold text-zinc-900 dark:text-zinc-100"
											suppressHydrationWarning
										>
											₹{d.price.toLocaleString()}
										</td>
										<td className="py-4 px-6 text-center">
											<span
												className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
													d.status === "Active"
														? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
														: "bg-zinc-500/15 text-zinc-550 dark:text-zinc-400"
												}`}
											>
												{d.status === "Active"
													? "In Hand"
													: "Sold"}
											</span>
										</td>
										<td className="py-4 px-6 text-center">
											<div className="flex items-center justify-center gap-2">
												{d.status === "Active" && (
													<button
														disabled={isSubmitting}
														onClick={() =>
															handleOpenSell(d)
														}
														title="Record Outgoing Sale"
														className="p-1.5 rounded-lg border border-emerald-250 dark:border-emerald-900/50 bg-emerald-500/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all cursor-pointer shadow-sm animate-fadeIn disabled:opacity-50"
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
																d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button>
												)}
												{d.status === "Sold" && (
													<button
														disabled={isSubmitting}
														onClick={() =>
															handleOpenBuyback(d)
														}
														title="Record Buyback (Re-acquire)"
														className="p-1.5 rounded-lg border border-indigo-250 dark:border-indigo-900/50 bg-indigo-500/5 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all cursor-pointer shadow-sm animate-fadeIn disabled:opacity-50"
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
																d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
															/>
														</svg>
													</button>
												)}
												<button
													disabled={isSubmitting}
													onClick={() =>
														handleOpenEdit(d)
													}
													title="Edit Device"
													className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
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
												<button
													disabled={isSubmitting}
													onClick={() =>
														handleDelete(
															d.id,
															d.brand +
																" " +
																d.model,
														)
													}
													title="Delete Device"
													className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-855 text-zinc-650 dark:text-zinc-400 hover:text-red-500 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
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
										</td>
									</tr>
								))}
							</tbody>
						) : (
							<tbody>
								<tr>
									<td colSpan={9} className="text-center py-16 space-y-3">
										<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
											No Inventory Items Listed
										</h4>
										<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
											We couldn&apos;t find any inventory items matching
											your filters. Try clearing search query.
										</p>
									</td>
								</tr>
							</tbody>
						)}
					</table>
				</div>
				{!isLoading && total > 0 && (
					<Pagination
						page={page}
						total={total}
						limit={limit}
						onPageChange={setPage}
						onLimitChange={(l) => { setLimit(l); setPage(1); }}
					/>
				)}
			</div>

			{/* MODAL FORM WITH INLINE CREATION */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => !isSubmitting && setIsFormOpen(false)}
				title={
					editingDevice
						? `Edit Inventory Item: ${editingDevice.brand} ${editingDevice.model}`
						: "Register Stock Item"
				}
				size="lg"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						{/* IMEI */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
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
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono disabled:opacity-50 disabled:cursor-not-allowed
									${fieldErrors.imei ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
							/>
							{fieldErrors.imei && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.imei}
								</p>
							)}
						</div>

						{/* Color */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
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
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
									${fieldErrors.color ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
							/>
							{fieldErrors.color && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{fieldErrors.color}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						{/* BRAND SELECTION & INLINE CREATOR */}
						<div className="space-y-1 relative">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Brand *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingBrand}
									onClick={() => setIsAddingBrand(!isAddingBrand)}
									className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
								>
									{isAddingBrand ? "Cancel" : "Request Brand"}
								</button>
							</div>

							{isAddingBrand ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										disabled={isSubmittingBrand || isSubmitting}
										value={newBrandVal}
										onChange={(e) => setNewBrandVal(e.target.value)}
										placeholder="New Brand Name"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<button
										type="button"
										disabled={isSubmittingBrand || isSubmitting}
										onClick={handleCreateBrand}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9 cursor-pointer"
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
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Model *
								</label>
								<button
									type="button"
									disabled={!formBrand || isSubmitting || isSubmittingModel}
									onClick={() => setIsAddingModel(!isAddingModel)}
									className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
								>
									{isAddingModel ? "Cancel" : "+ Add Model"}
								</button>
							</div>

							{isAddingModel ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										disabled={isSubmittingModel || isSubmitting}
										value={newModelVal}
										onChange={(e) => setNewModelVal(e.target.value)}
										placeholder="Model Name"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<button
										type="button"
										disabled={isSubmittingModel || isSubmitting}
										onClick={handleCreateModel}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9 cursor-pointer"
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
							) : (
								<Select
									value={formModel}
									disabled={!formBrand || isSubmitting}
									onChange={(e) => {
										setFormModel(e.target.value);
										clearFieldError("model");
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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						{/* STORAGE */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Storage Capacity *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingStorage}
									onClick={() => setIsAddingStorage(!isAddingStorage)}
									className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
								>
									{isAddingStorage
										? "Cancel"
										: "Request Storage"}
								</button>
							</div>

							{isAddingStorage ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										disabled={isSubmittingStorage || isSubmitting}
										value={newStorageVal}
										onChange={(e) => setNewStorageVal(e.target.value)}
										placeholder="e.g. 512GB"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<button
										type="button"
										disabled={isSubmittingStorage || isSubmitting}
										onClick={handleCreateStorage}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9 cursor-pointer"
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
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									RAM Size *
								</label>
								<button
									type="button"
									disabled={isSubmitting || isSubmittingRam}
									onClick={() => setIsAddingRam(!isAddingRam)}
									className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
								>
									{isAddingRam ? "Cancel" : "Request RAM"}
								</button>
							</div>

							{isAddingRam ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										disabled={isSubmittingRam || isSubmitting}
										value={newRamVal}
										onChange={(e) => setNewRamVal(e.target.value)}
										placeholder="e.g. 16GB"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<button
										type="button"
										disabled={isSubmittingRam || isSubmitting}
										onClick={handleCreateRam}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-9 cursor-pointer"
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

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						{/* Condition */}
						<div className="space-y-1">
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
									{ value: "Mint", label: "Mint" },
									{ value: "Excellent", label: "Excellent" },
									{ value: "Good", label: "Good" },
									{ value: "Fair", label: "Fair" },
								]}
								error={fieldErrors.condition}
							/>
						</div>

						{/* Battery Health */}
						{isAppleSelected && (
							<div className="space-y-1">
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
									className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
										${fieldErrors.batteryHealth ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
								/>
								{fieldErrors.batteryHealth && (
									<p className="text-xs text-red-500 font-medium mt-1">
										{fieldErrors.batteryHealth}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Customer Selection */}
					{!editingDevice && (
						<div className="space-y-1.5 text-left animate-fadeIn">
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
								<div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-scaleUp">
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
												<span>Saving Client...</span>
											</>
										) : (
											"Save and Select Customer"
										)}
									</button>
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
					<div className="space-y-1 text-left">
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
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
								${fieldErrors.purchasePrice ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
						/>
						{fieldErrors.purchasePrice && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{fieldErrors.purchasePrice}
							</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-1 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Listing Description
						</label>
						<textarea
							disabled={isSubmitting}
							value={formDescription}
							onChange={(e) => {
								setFormDescription(e.target.value);
								clearFieldError("description");
							}}
							placeholder="e.g. Mint condition. Minor scratch on screen protector, box and original cable available..."
							rows={3}
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
								${fieldErrors.description ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
						/>
						{fieldErrors.description && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{fieldErrors.description}
							</p>
						)}
					</div>

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
						<Button type="submit" variant="gradient" size="sm" disabled={isSubmitting} className="cursor-pointer flex items-center gap-1.5 min-w-[120px] justify-center">
							{isSubmitting ? (
								<>
									<svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span>Saving...</span>
								</>
							) : editingDevice ? (
								"Save Changes"
							) : (
								"Register Stock Item"
							)}
						</Button>
					</div>
				</form>
			</Modal>

			{/* SELL MODAL */}
			<Modal
				isOpen={isSellFormOpen}
				onClose={() => !isSubmitting && setIsSellFormOpen(false)}
				title={
					<div className="flex items-center gap-3 text-left">
						<span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</span>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
								Record Device Sale
							</h3>
							<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
								Complete outgoing transaction details for this unit.
							</p>
						</div>
					</div>
				}
				size="lg"
			>
				{sellingDevice && (
					<form onSubmit={handleSellSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner text-left">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{sellingDevice.brand} {sellingDevice.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{sellingDevice.storage} / {sellingDevice.ram} RAM &bull; {sellingDevice.color} &bull; {sellingDevice.condition} Condition
									</p>
								</div>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
									Active in Hand
								</span>
							</div>
							<div className="grid grid-cols-3 gap-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2.5 mt-1 text-[11px]">
								<div>
									<span className="text-zinc-400 block">
										IMEI:
									</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
										{sellingDevice.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{sellingDevice.purchasePrice ? `₹${sellingDevice.purchasePrice.toLocaleString()}` : "-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Listed Price:
									</span>
									<span className="font-extrabold text-primary">
										₹{sellingDevice.price.toLocaleString()}
									</span>
								</div>
							</div>
						</div>

						{/* Form inputs */}
						<div className="space-y-4 text-left">
							{/* Customer selection */}
							<div className="space-y-1.5 relative">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Customer *
									</label>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={() =>
											setIsAddingCust(!isAddingCust)
										}
										className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline cursor-pointer"
									>
										{isAddingCust
											? "Cancel"
											: "+ Quick Add"}
									</button>
								</div>

								{isAddingCust ? (
									<div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl space-y-3 animate-scaleUp">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Full Name
												</label>
												<input
													type="text"
													disabled={isSubmitting}
													value={newCustName}
													onChange={(e) => {
														setNewCustName(e.target.value);
														setCustErrors((prev) => ({ ...prev, name: "" }));
													}}
													placeholder="e.g. John Doe"
													className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
														${custErrors.name ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
												/>
												{custErrors.name && (
													<p className="text-xs text-red-500 font-medium mt-1">
														{custErrors.name}
													</p>
												)}
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Phone Number
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
													<span>Saving Client...</span>
												</>
											) : (
												"Save and Select Customer"
											)}
										</button>
									</div>
								) : (
									<Select
										value={sellCustomer}
										disabled={isSubmitting}
										onChange={(e) =>
											setSellCustomer(e.target.value)
										}
										required
										placeholder="-- Choose Client --"
										options={customers.map((c) => ({ value: c.name, label: `${c.name} (${c.phone})` }))}
									/>
								)}
							</div>

							{/* Price & Date */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Actual Selling Price (₹) *
									</label>
									<input
										type="number"
										required
										disabled={isSubmitting}
										value={sellPrice}
										onChange={(e) =>
											setSellPrice(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white disabled:opacity-50"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Sale Date *
									</label>
									<input
										type="date"
										required
										disabled={isSubmitting}
										value={sellDate}
										onChange={(e) =>
											setSellDate(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
									/>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Transaction Notes
								</label>
								<textarea
									disabled={isSubmitting}
									value={sellNotes}
									onChange={(e) =>
										setSellNotes(e.target.value)
									}
									placeholder="e.g. Screen and device inspected by buyer. Paid full via UPI."
									rows={2}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={isSubmitting}
								onClick={() => setIsSellFormOpen(false)}
								className="cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="gradient"
								size="sm"
								disabled={isSubmitting}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px] h-9"
							>
								{isSubmitting ? (
									<>
										<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										<span>Recording...</span>
									</>
								) : (
									"Confirm Sale"
								)}
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* BUYBACK MODAL */}
			<Modal
				isOpen={isBuybackFormOpen}
				onClose={() => !isSubmitting && setIsBuybackFormOpen(false)}
				title={
					<div className="flex items-center gap-3 text-left">
						<span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
								/>
							</svg>
						</span>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
								Record Device Buyback
							</h3>
							<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
								Re-acquire a previously sold unit back into active inventory.
							</p>
						</div>
					</div>
				}
				size="lg"
			>
				{buybackDevice && (
					<form onSubmit={handleBuybackSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner text-left">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{buybackDevice.brand} {buybackDevice.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{buybackDevice.storage} / {buybackDevice.ram} RAM &bull; {buybackDevice.color}
									</p>
								</div>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 uppercase tracking-wide">
									Currently Sold
								</span>
							</div>
							<div className="grid grid-cols-3 gap-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2.5 mt-1 text-[11px]">
								<div>
									<span className="text-zinc-400 block">
										IMEI:
									</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
										{buybackDevice.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{buybackDevice.purchasePrice ? `₹${buybackDevice.purchasePrice.toLocaleString()}` : "-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Sell Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										₹{buybackDevice.price.toLocaleString()}
									</span>
								</div>
							</div>
						</div>

						{/* Form inputs */}
						<div className="space-y-4 text-left">
							{/* Customer selection */}
							<div className="space-y-1.5 relative">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Customer (Selling back to store) *
									</label>
									<button
										type="button"
										disabled={isSubmitting}
										onClick={() =>
											setIsAddingCust(!isAddingCust)
										}
										className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline cursor-pointer"
									>
										{isAddingCust
											? "Cancel"
											: "+ Quick Add"}
									</button>
								</div>

								{isAddingCust ? (
									<div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl space-y-3 animate-scaleUp">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Full Name
												</label>
												<input
													type="text"
													disabled={isSubmitting}
													value={newCustName}
													onChange={(e) => {
														setNewCustName(e.target.value);
														setCustErrors((prev) => ({ ...prev, name: "" }));
													}}
													placeholder="e.g. John Doe"
													className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
														${custErrors.name ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
												/>
												{custErrors.name && (
													<p className="text-xs text-red-500 font-medium mt-1">
														{custErrors.name}
													</p>
												)}
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Phone Number
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
													<span>Saving Client...</span>
												</>
											) : (
												"Save and Select Customer"
											)}
										</button>
									</div>
								) : (
									<Select
										value={buybackCustomer}
										disabled={isSubmitting}
										onChange={(e) =>
											setBuybackCustomer(e.target.value)
										}
										required
										placeholder="-- Choose Client --"
										options={customers.map((c) => ({ value: c.name, label: `${c.name} (${c.phone})` }))}
									/>
								)}
							</div>

							{/* Price, Date, and specs updates */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Amount Paid (₹) *
									</label>
									<input
										type="number"
										required
										disabled={isSubmitting}
										value={buybackPrice}
										onChange={(e) =>
											setBuybackPrice(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white disabled:opacity-50"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Date *
									</label>
									<input
										type="date"
										required
										disabled={isSubmitting}
										value={buybackDate}
										onChange={(e) =>
											setBuybackDate(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
									/>
								</div>
							</div>

							{/* Condition & Battery (Buyback inspection updates) */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Condition *
									</label>
									<Select
										value={buybackCondition}
										disabled={isSubmitting}
										onChange={(e) =>
											setBuybackCondition(
												e.target.value as any,
											)
										}
										options={[
											{ value: "Mint", label: "Mint" },
											{ value: "Excellent", label: "Excellent" },
											{ value: "Good", label: "Good" },
											{ value: "Fair", label: "Fair" },
										]}
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Current Battery Health (%) *
									</label>
									<input
										type="number"
										min={50}
										max={100}
										required
										disabled={isSubmitting}
										value={buybackBatteryHealth}
										onChange={(e) =>
											setBuybackBatteryHealth(
												parseInt(e.target.value) || 0,
											)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
									/>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Buyback Notes
								</label>
								<textarea
									disabled={isSubmitting}
									value={buybackNotes}
									onChange={(e) =>
										setBuybackNotes(e.target.value)
									}
									placeholder="e.g. Device remains in excellent condition. Battery health is at 90%. Paid via Bank Transfer."
									rows={2}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={isSubmitting}
								onClick={() => setIsBuybackFormOpen(false)}
								className="cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="gradient"
								size="sm"
								disabled={isSubmitting}
								className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px] h-9"
							>
								{isSubmitting ? (
									<>
										<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										<span>Recording...</span>
									</>
								) : (
									"Confirm Buyback"
								)}
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={deleteConfirmOpen}
				onClose={() => !isSubmitting && setDeleteConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingDevice?.name || ""}
				loading={isSubmitting}
			/>
		</div>
	);
}
