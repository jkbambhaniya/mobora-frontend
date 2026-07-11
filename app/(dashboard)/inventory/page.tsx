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
import { mobileValidationSchema, sellValidationSchema, buybackValidationSchema } from "@/utils/validation";
import { useDashboard, Mobile, slugify } from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { useInventory } from "@/context/vendor/inventory-context";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { ImeiConflictWarning } from "@/components/vendor/imei-conflict-warning";
import { MobileFilters } from "@/actions/mobiles";
import { checkBlacklistAction } from "@/actions/blacklist";
import { ImeiInput } from "@/components/ui/imei-input";
import { RamSelector } from "@/components/ui/ram-selector";
import { StorageSelector } from "@/components/ui/storage-selector";
import { createCourierOrderAction } from "@/actions/courier";
import { DeviceSaleModal } from "@/components/vendor/DeviceSaleModal";
import { DeviceBuyModal } from "@/components/vendor/DeviceBuyModal";
import { MobileRegisterForm } from "@/components/vendor/MobileRegisterForm";


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
		handleAddTradeTransaction,
		handleUpdateTradeTransaction,
		trades,
		triggerToast,
		fetchVendors,
		refreshTrades,
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

	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState<Mobile | null>(null);
	const [conflictInfo, setConflictInfo] = useState<any | null>(null);

	// Delete Modal State
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingDevice, setDeletingDevice] = useState<{
		id: string;
		name: string;
	} | null>(null);

		// Sell Modal State
	const [isSellFormOpen, setIsSellFormOpen] = useState(false);
	const [sellingDevice, setSellingDevice] = useState<Mobile | null>(null);

	// Buyback Modal State
	const [isBuybackFormOpen, setIsBuybackFormOpen] = useState(false);
	const [buybackDevice, setBuybackDevice] = useState<Mobile | null>(null);

	const [brandInlineError, setBrandInlineError] = useState("");
	const [modelInlineError, setModelInlineError] = useState("");
	const [storageInlineError, setStorageInlineError] = useState("");
	const [ramInlineError, setRamInlineError] = useState("");
	const [custFormError, setCustFormError] = useState("");
	const [formError, setFormError] = useState("");

	// Edit Transaction Modal State
	const [isEditTxOpen, setIsEditTxOpen] = useState(false);
	const [editingTx, setEditingTx] = useState<any>(null);
	const [txAmount, setTxAmount] = useState("");
	const [txDate, setTxDate] = useState("");
	const [txNotes, setTxNotes] = useState("");
	const [txPartnerName, setTxPartnerName] = useState("");
	const [isSubmittingTx, setIsSubmittingTx] = useState(false);

	const handleOpenEditTransaction = (tx: any) => {
		setEditingTx(tx);
		setTxAmount(tx.amount.toString());
		setTxDate(tx.date);
		setTxNotes(tx.notes || "");
		setTxPartnerName(tx.customerName || "");
		setIsEditTxOpen(true);
	};

	const handleSaveEditTransaction = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTx) return;
		setIsSubmittingTx(true);
		try {
			await handleUpdateTradeTransaction(editingTx.id, {
				amount: Number(txAmount),
				date: txDate,
				notes: txNotes,
				customerName: txPartnerName,
				partnerType: editingTx.partnerType,
				partnerId: editingTx.partnerId,
			});
			setIsEditTxOpen(false);
			setEditingTx(null);
		} catch (error) {
			console.error("Error saving transaction:", error);
		} finally {
			setIsSubmittingTx(false);
		}
	};



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
	const [formDescription, setFormDescription] = useState("");
	const [formCustomerId, setFormCustomerId] = useState("");

	// Dynamic Add Dialog States
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [newBrandVal, setNewBrandVal] = useState("");
	const [isAddingModel, setIsAddingModel] = useState(false);
	const [newModelVal, setNewModelVal] = useState("");


	// Submission States
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
	const [isSubmittingModel, setIsSubmittingModel] = useState(false);

	const [blacklistWarning, setBlacklistWarning] = useState<{
		isBlacklisted: boolean;
		imei: string;
		reason?: string;
		blacklistedBy?: string;
		createdAt?: string;
		isBuyback?: boolean;
	} | null>(null);


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

	// Form state helpers for MobileRegisterForm component compatibility
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
		repairingCost: "", // not needed in register modal but schema expects it
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
		else if (field === "description") setFormDescription(value);
		else if (field === "customerId") setFormCustomerId(value);
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
		setFormCondition("OLD");
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
		setCustFormError("");
		setConflictInfo(null);
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
		setFormError("");
		setBrandInlineError("");
		setModelInlineError("");
		setStorageInlineError("");
		setRamInlineError("");
		setCustFormError("");
		setConflictInfo(null);
		setIsFormOpen(true);
	};

	const handleOpenSell = (device: Mobile) => {
		setSellingDevice(device);
		setIsSellFormOpen(true);
	};

	const handleOpenBuyback = (device: Mobile) => {
		setBuybackDevice(device);
		setIsBuybackFormOpen(true);
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
				await refreshTrades();
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

	const handleSubmit = async (e: React.FormEvent | null, forceBypass = false) => {
		if (e) e.preventDefault();
		setFieldErrors({});
		setFormError("");
		setIsSubmitting(true);

		// If IMEI is provided, check if it's blacklisted
		if (formImei && !forceBypass && (!editingDevice || formImei !== editingDevice.imei)) {
			try {
				const blacklistRes = await checkBlacklistAction(formImei);
				if (blacklistRes.success && blacklistRes.data?.isBlacklisted) {
					setBlacklistWarning({
						isBlacklisted: true,
						imei: formImei,
						reason: blacklistRes.data.reason,
						blacklistedBy: blacklistRes.data.blacklistedBy,
						createdAt: blacklistRes.data.createdAt,
						isBuyback: false,
					});
					setIsSubmitting(false);
					return;
				}
			} catch (err) {
				console.error("Blacklist check failed:", err);
			}
		}

		try {
			const selectedBrandName = specs.allBrands.find((b: { id: number; name: string; slug: string }) => b.id.toString() === formBrand)?.name || "";
			const selectedModelName = specs.allModels.find((m: { id: number; name: string; slug: string; brand_id: number; brand_name: string }) => m.id.toString() === formModel)?.name || "";
			const selectedStorageValue = specs.allStorages.find((s: { id: number; value: string }) => s.id.toString() === formStorage)?.value || "";
			const selectedRamValue = specs.allRams.find((r: { id: number; value: string }) => r.id.toString() === formRam)?.value || "";

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
					purchasePrice: editingDevice ? undefined : (formPurchasePrice ? parseFloat(formPurchasePrice) : undefined),
					description: formDescription || null,
					customerId: formCustomerId || null,
				},
				{
					abortEarly: false,
					context: { isEdit: !!editingDevice }
				},
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
			const data: any = {
				brand_id: Number(formBrand),
				model_id: Number(formModel),
				storage_id: Number(formStorage),
				ram_id: Number(formRam),
				color: formColor || "Space Gray",
				imei: formImei || null,
				condition: formCondition,
				battery_health: isAppleSelected ? formBatteryHealth : null,
				status: editingDevice ? editingDevice.status : "Available",
				description: formDescription || null,
			};

			if (!editingDevice) {
				const purchasePriceNum = parseFloat(formPurchasePrice);
				data.purchase_price = purchasePriceNum;
				data.price = Math.round(purchasePriceNum * 1.2);
				data.customer_id = formCustomerId || null;
			}

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
				await refreshTrades();
			} else {
				if (res.conflict) {
					setConflictInfo(res.conflict);
				} else if (res.errors) {
					setFieldErrors(res.errors);
				} else {
					setFormError(res.message || "Failed to save device details.");
				}
			}
		} catch (err) {
			setFormError("An unexpected error occurred while saving device.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCreateBrand = async () => {
		if (newBrandVal.trim()) {
			setIsSubmittingBrand(true);
			setBrandInlineError("");
			try {
				const res = await specs.addBrand(newBrandVal.trim());
				if (res.success) {
					triggerToast("Brand request submitted and is pending approval.");
					await specs.refreshAllSpecs();
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
				const res = await specs.addModel(newModelVal.trim(), Number(formBrand));
				if (res.success) {
					triggerToast("Model request submitted.");
					await specs.refreshAllSpecs();
					setNewModelVal("");
					setIsAddingModel(false);
					clearFieldError("model");
				} else {
					setModelInlineError(res.message || "Failed to request model.");
				}
			} catch (err) {
				setModelInlineError("Failed to request model.");
			} finally {
				setIsSubmittingModel(false);
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

		const brandSlug = specs.allBrands.find((b: any) => b.id === device.brandId)?.slug || slugify(device.brand);
		const modelSlug = specs.allModels.find((m: any) => m.id === device.modelId)?.slug || slugify(device.model);

		return (
			<div className="bg-zinc-50/80 dark:bg-zinc-900/40 p-4 border-t border-zinc-200 dark:border-zinc-800 shadow-inner">
				<div className="flex justify-between items-center mb-3 px-1">
					<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Transaction Ledger</h4>
					<Link href={`/mobiles/${brandSlug}/${modelSlug}/${device.imei}`} className="text-[11px] text-primary font-bold hover:underline">
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
							<th className="py-2.5 px-4 text-center">Actions</th>
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
									<td className="py-2.5 px-4 text-center">
										<button
											onClick={() => handleOpenEditTransaction(event)}
											className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary hover:scale-105 transition-all cursor-pointer"
											title="Edit Transaction"
										>
											<svg
												className="w-3.5 h-3.5"
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
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
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
							Units available
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
								{ value: "Available", label: "Available Stock" },
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
								{ value: "NEW", label: "New" },
								{ value: "OLD", label: "Old" },
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
							<tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200/40 dark:border-zinc-800/40">
								{renderSortableHeader("id", "ID", "left")}
								{renderSortableHeader("model", "Inventory Specifications", "left")}
								{renderSortableHeader("imei", "IMEI", "left")}
								{renderSortableHeader("condition", "Condition", "center")}
								{renderSortableHeader("batteryHealth", "Battery", "center")}
								{renderSortableHeader("purchasePrice", "Cost Price", "right")}
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
										<td className="py-4 px-6 text-center"><div className="h-6 w-16 bg-zinc-250 dark:bg-zinc-800 rounded-full mx-auto" /></td>
										<td className="py-4 px-6 text-center"><div className="h-8 w-24 bg-zinc-250 dark:bg-zinc-800 rounded-xl mx-auto" /></td>
									</tr>
								))}
							</tbody>
						) : devices.length > 0 ? (
							<tbody>
								{devices.map((d) => (
									<React.Fragment key={d.id}>
									<tr
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
													href={`/mobiles/${specs.allBrands.find((b: { id: number; name: string; slug: string }) => b.id === d.brandId)?.slug || slugify(d.brand)}/${specs.allModels.find((m: { id: number; name: string; slug: string; brand_id: number; brand_name: string }) => m.id === d.modelId)?.slug || slugify(d.model)}/${d.imei}`}
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
										<td className="py-4 px-6 text-center">
											{(() => {
												let statusClass = "bg-zinc-500/15 text-zinc-550 dark:text-zinc-400";
												let label = d.status;
												if (d.status === "Available") {
													statusClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
													label = "Available";
												} else if (d.status === "Pending") {
													statusClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
													label = "Courier Pending";
												} else if (d.status === "Shipped") {
													statusClass = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
													label = "Shipped";
												}
												return (
													<span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${statusClass}`}>
														{label}
													</span>
												);
											})()}
										</td>
										<td className="py-4 px-6 text-center">
											<div className="flex items-center justify-center gap-2">
												{d.imei && (
													<button
														disabled={isSubmitting}
														onClick={() => toggleExpand(d.id)}
														title={expandedIds.has(d.id) ? "Hide History" : "View History"}
														className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-primary hover:scale-105 transition-all cursor-pointer disabled:opacity-50 ${expandedIds.has(d.id) ? "bg-zinc-100 dark:bg-zinc-850 text-primary" : "text-zinc-600 dark:text-zinc-400"}`}
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
															<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
													</button>
												)}
												{d.status === "Available" && (
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
																d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
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
														title="Record Buy (Re-acquire)"
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
												{(d.status === "Pending" || d.status === "Shipped") && (
													<Link href="/courier">
														<button
															disabled={isSubmitting}
															title="Manage Courier Order"
															className="p-1.5 rounded-lg border border-amber-250 dark:border-amber-900/50 bg-amber-500/5 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:scale-105 transition-all cursor-pointer shadow-sm animate-fadeIn disabled:opacity-50"
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
																	d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
																/>
															</svg>
														</button>
													</Link>
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
									<tr className="p-0 m-0 border-0">
										<td colSpan={8} className="p-0 m-0 border-0">
											<div 
												className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expandedIds.has(d.id) ? 'grid-rows-[1fr] opacity-100 bg-zinc-50/30 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-850/40' : 'grid-rows-[0fr] opacity-0 border-transparent'}`}
											>
												<div className="overflow-hidden">
													{renderImeiHistory(d)}
												</div>
											</div>
										</td>
									</tr>
									</React.Fragment>
								))}
							</tbody>
						) : (
							<tbody>
								<tr>
									<td colSpan={8} className="text-center py-16 space-y-3">
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
								disabled={isSubmitting}
								onClick={() => setIsFormOpen(false)}
								className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
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
				)}
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

			<DeviceSaleModal
				isOpen={isSellFormOpen}
				onClose={() => setIsSellFormOpen(false)}
				device={sellingDevice}
			/>

			<DeviceBuyModal
				isOpen={isBuybackFormOpen}
				onClose={() => setIsBuybackFormOpen(false)}
				device={buybackDevice}
			/>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={deleteConfirmOpen}
				onClose={() => !isSubmitting && setDeleteConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingDevice?.name || ""}
				loading={isSubmitting}
			/>

			{/* Edit Transaction Modal */}
			<Modal
				isOpen={isEditTxOpen}
				onClose={() => !isSubmittingTx && setIsEditTxOpen(false)}
				title="Edit Transaction Details"
				size="md"
			>
				<form onSubmit={handleSaveEditTransaction} className="space-y-5">
					<div className="space-y-4 text-left">
						{/* Partner / Customer selection */}
						<PartnerSelector
							value={txPartnerName}
							onChange={(val) => {
								setTxPartnerName(val);
							}}
							label="Partner / Customer *"
							placeholder="-- Choose Partner --"
							required={true}
							valueType="name"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Value / Amount */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Transaction Amount (₹) *
								</label>
								<input
									type="number"
									required
									disabled={isSubmittingTx}
									value={txAmount}
									onChange={(e) => setTxAmount(e.target.value)}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white"
								/>
							</div>

							{/* Date */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Transaction Date *
								</label>
								<input
									type="date"
									required
									disabled={isSubmittingTx}
									value={txDate}
									onChange={(e) => setTxDate(e.target.value)}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								/>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Notes
							</label>
							<textarea
								disabled={isSubmittingTx}
								value={txNotes}
								onChange={(e) => setTxNotes(e.target.value)}
								placeholder="Transaction notes..."
								rows={3}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={isSubmittingTx}
							onClick={() => setIsEditTxOpen(false)}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="gradient"
							size="sm"
							disabled={isSubmittingTx}
							className="bg-primary hover:bg-primary/95 text-white font-bold cursor-pointer flex items-center justify-center gap-1.5 min-w-[120px] h-9"
						>
							{isSubmittingTx ? (
								<>
									<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span>Saving...</span>
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</form>
			</Modal>

		</div>
	);
}
