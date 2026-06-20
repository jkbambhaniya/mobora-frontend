"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useDashboard, Customer, TradeTransaction } from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { getTransactionsAction } from "@/actions/transactions";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";
import Pagination from "@/components/ui/Pagination";
import { DataTable, Column } from "@/components/ui/DataTable";
import { toast } from "react-hot-toast";
import * as yup from "yup";

const quickPartnerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name/Business Name is required."),
	phone: yup.string().trim().required("Phone Number is required."),
	address: yup.string().trim().nullable().notRequired(),
});

export default function PurchasesPage() {
	const {
		customers,
		setCustomers,
		addCustomer,
		handleAddTradeTransaction,
		refreshTrades,
		refreshDevices,
		refreshMetrics,
	} = useDashboard();

	const specs = useSpecifications();

	// Page & Filter States
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	const [purchases, setPurchases] = useState<TradeTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Summary stats
	const summaryStats = useMemo(() => {
		const totalCount = total;
		const totalOutflow = purchases.reduce((sum, p) => sum + p.amount, 0);
		const avgCost = totalCount > 0 ? Math.round(totalOutflow / purchases.length || 0) : 0;
		return { totalCount, totalOutflow, avgCost };
	}, [purchases, total]);

	// Modals State
	const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [isAddingModel, setIsAddingModel] = useState(false);
	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [isAddingRam, setIsAddingRam] = useState(false);

	// Quick Add Spec Input States
	const [newBrandVal, setNewBrandVal] = useState("");
	const [newModelVal, setNewModelVal] = useState("");
	const [newStorageVal, setNewStorageVal] = useState("");
	const [newRamVal, setNewRamVal] = useState("");

	// Quick Add Customer States
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});
	const [custFormError, setCustFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Purchase Form States
	const [formImei, setFormImei] = useState("");
	const [formBrand, setFormBrand] = useState("");
	const [formModel, setFormModel] = useState("");
	const [formStorage, setFormStorage] = useState("");
	const [formRam, setFormRam] = useState("");
	const [formColor, setFormColor] = useState("");
	const [formCondition, setFormCondition] = useState<"NEW" | "OLD">("NEW");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formCustomerName, setFormCustomerName] = useState("");
	const [formAmount, setFormAmount] = useState("");
	const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
	const [formNotes, setFormNotes] = useState("");

	// Autofill States
	const [autofillDetected, setAutofillDetected] = useState(false);
	const [autofillMessage, setAutofillMessage] = useState("");

	// Debounce Search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(searchTerm);
			setPage(1);
		}, 300);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Fetch purchases log
	const fetchPurchases = async () => {
		setIsLoading(true);
		try {
			const res = await getTransactionsAction({
				type: "Purchase",
				search: debouncedSearch.trim() || undefined,
				sortBy,
				sortOrder,
				page,
				limit,
			});
			if (res.success && res.data && res.data.success) {
				setPurchases(res.data.transactions || []);
				setTotal(res.data.total || 0);
			}
		} catch (err) {
			console.error("Error loading purchases:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPurchases();
	}, [debouncedSearch, sortBy, sortOrder, page, limit]);

	// Resolve specifications helper for dropdowns
	const brandsList = useMemo(() => specs.allBrands.map((b) => b.name), [specs.allBrands]);
	const modelsList = useMemo(() => specs.allModels.map((m) => ({ brand: m.brand_name, name: m.name })), [specs.allModels]);
	const storagesList = useMemo(() => specs.allStorages.map((s) => s.value), [specs.allStorages]);
	const ramsList = useMemo(() => specs.allRams.map((r) => r.value), [specs.allRams]);

	// Resolve Apple Brand Check
	const isAppleSelected = useMemo(() => {
		return formBrand.toLowerCase() === "apple";
	}, [formBrand]);

	// Monitor IMEI input for auto-fill logic (similar to trades tracker page)
	useEffect(() => {
		const verifyImeiAutofill = async () => {
			if (formImei.length === 15) {
				// Query trades log in database
				try {
					const response = await getTransactionsAction({ search: formImei, limit: 1 });
					if (response.success && response.data && response.data.success && response.data.transactions?.length > 0) {
						const latestTrade = response.data.transactions[0];
						setFormBrand(latestTrade.deviceBrand);
						setFormModel(latestTrade.deviceModel);
						setFormStorage(latestTrade.storage || "128GB");
						setFormRam(latestTrade.ram || "6GB");
						setFormColor(latestTrade.color || "Space Gray");
						if (latestTrade.condition) setFormCondition(latestTrade.condition);
						if (latestTrade.batteryHealth) setFormBatteryHealth(latestTrade.batteryHealth);

						setAutofillDetected(true);
						setAutofillMessage(
							`🔄 Specs loaded from IMEI history. Last Tx: ${latestTrade.type} (₹${latestTrade.amount.toLocaleString()}) on ${latestTrade.date}.`
						);
						toast.success("Device specs loaded from history.");
					} else {
						setAutofillDetected(false);
						setAutofillMessage("🆕 New IMEI. Please fill specs manually.");
					}
				} catch (err) {
					console.error("Autofill lookup failed:", err);
				}
			} else {
				setAutofillDetected(false);
				setAutofillMessage("");
			}
		};
		verifyImeiAutofill();
	}, [formImei]);

	// Actions
	const handleOpenPurchase = () => {
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("NEW");
		setFormBatteryHealth(90);
		setFormCustomerName(customers[0]?.name || "");
		setFormAmount("");
		setFormNotes("");
		setFormDate(new Date().toISOString().split("T")[0]);
		setAutofillDetected(false);
		setAutofillMessage("");
		setIsAddingCust(false);
		setIsPurchaseModalOpen(true);
	};

	// Save Inline Specs Helpers
	const handleCreateBrand = async () => {
		if (newBrandVal.trim()) {
			const res = await specs.addBrand(newBrandVal.trim());
			if (res.success) {
				await specs.refreshAllSpecs();
				setFormBrand(newBrandVal.trim());
				setNewBrandVal("");
				setIsAddingBrand(false);
				toast.success("Brand added!");
			} else {
				toast.error(res.message || "Failed to add brand.");
			}
		}
	};

	const handleCreateModel = async () => {
		if (!formBrand) return toast.error("Choose brand first.");
		const matchedBrand = specs.allBrands.find((b) => b.name.toLowerCase() === formBrand.toLowerCase());
		if (!matchedBrand) return toast.error("Please choose a valid brand.");
		if (newModelVal.trim()) {
			const res = await specs.addModel(newModelVal.trim(), matchedBrand.id);
			if (res.success) {
				await specs.refreshAllSpecs();
				setFormModel(newModelVal.trim());
				setNewModelVal("");
				setIsAddingModel(false);
				toast.success("Model added!");
			} else {
				toast.error(res.message || "Failed to add model.");
			}
		}
	};

	const handleCreateStorage = async () => {
		if (newStorageVal.trim()) {
			const res = await specs.addStorage(newStorageVal.trim());
			if (res.success) {
				await specs.refreshAllSpecs();
				setFormStorage(newStorageVal.trim());
				setNewStorageVal("");
				setIsAddingStorage(false);
				toast.success("Storage added!");
			} else {
				toast.error(res.message || "Failed to add storage.");
			}
		}
	};

	const handleCreateRam = async () => {
		if (newRamVal.trim()) {
			const res = await specs.addRam(newRamVal.trim());
			if (res.success) {
				await specs.refreshAllSpecs();
				setFormRam(newRamVal.trim());
				setNewRamVal("");
				setIsAddingRam(false);
				toast.success("RAM added!");
			} else {
				toast.error(res.message || "Failed to add RAM.");
			}
		}
	};

	// Save Quick Customer Helper
	const handleCreateCustomer = async () => {
		setCustErrors({});
		setCustFormError("");
		try {
			await quickPartnerSchema.validate(
				{
					name: newCustName,
					phone: newCustPhone,
					address: newCustAddress || null,
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
				address: newCustAddress || "Registered in Purchases desk",
				notes: "Quick registered from purchases ledger.",
			});

			if (res.success) {
				setFormCustomerName(newCustName);
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setCustErrors({});
				toast.success(`Registered Customer: ${newCustName}`);
			} else {
				if (res.errors) {
					setCustErrors(res.errors);
				} else {
					setCustFormError(res.message || "Registration failed.");
				}
			}
		} catch (err) {
			setCustFormError("Error saving customer details.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Record Purchase Handler
	const handleSubmitPurchase = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formImei || formImei.length !== 15) {
			toast.error("Please enter a valid 15-digit IMEI number.");
			return;
		}
		if (!formBrand || !formModel || !formCustomerName || !formAmount) {
			toast.error("Please fill in Brand, Model, Partner, and Amount.");
			return;
		}

		const priceNum = parseFloat(formAmount);
		if (isNaN(priceNum) || priceNum <= 0) {
			toast.error("Amount must be a valid positive number.");
			return;
		}

		const result = await handleAddTradeTransaction({
			imei: formImei,
			deviceBrand: formBrand,
			deviceModel: formModel,
			type: "Purchase",
			customerName: formCustomerName,
			amount: priceNum,
			date: formDate,
			notes: formNotes || `Device purchased from ${formCustomerName}.`,
			storage: formStorage,
			ram: formRam,
			color: formColor || "Space Gray",
			condition: formCondition,
			batteryHealth: formBatteryHealth,
		});

		if (result) {
			setIsPurchaseModalOpen(false);
			fetchPurchases();
			refreshDevices(undefined, true);
			refreshMetrics();
			refreshTrades();
		}
	};

	// Table columns configuration
	const columns: Column<TradeTransaction>[] = [
		{
			key: "date",
			title: "Purchase Date",
			sortable: true,
			render: (p) => (
				<span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
					{p.date}
				</span>
			),
		},
		{
			key: "device",
			title: "Device Specs",
			render: (p) => (
				<div>
					<div className="font-bold text-zinc-900 dark:text-white leading-tight">
						{p.deviceBrand} {p.deviceModel}
					</div>
					<div className="text-[10px] text-zinc-450 mt-1 flex flex-wrap gap-1.5 items-center">
						<span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
							{p.imei}
						</span>
						<span>•</span>
						<span>{p.storage || "128GB"}</span>
						<span>•</span>
						<span>{p.ram || "6GB"}</span>
						<span>•</span>
						<span>{p.color || "Space Gray"}</span>
					</div>
				</div>
			),
		},
		{
			key: "condition",
			title: "Cond / BH",
			render: (p) => (
				<div className="space-y-1 text-xs">
					<div>
						<span
							className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
								p.condition === "NEW"
									? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
									: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
							}`}
						>
							{p.condition}
						</span>
					</div>
					{p.deviceBrand.toLowerCase() === "apple" && p.batteryHealth && (
						<div className="text-[10px] text-zinc-400">BH: {p.batteryHealth}%</div>
					)}
				</div>
			),
		},
		{
			key: "partner",
			title: "Purchased From",
			render: (p) => {
				return (
					<div className="font-semibold text-zinc-800 dark:text-zinc-200">
						{p.customerName}
					</div>
				);
			},
		},
		{
			key: "amount",
			title: "Purchase Price",
			sortable: true,
			headerClassName: "text-right",
			className: "text-right font-extrabold text-zinc-900 dark:text-zinc-100",
			render: (p) => (
				<span suppressHydrationWarning className="text-sm font-black">
					₹{p.amount.toLocaleString()}
				</span>
			),
		},
		{
			key: "actions",
			title: "Invoice Actions",
			headerClassName: "text-center",
			className: "text-center",
			render: (p) => (
				<div className="flex items-center justify-center gap-1.5">
					<button
						type="button"
						onClick={() => streamInvoice(p.id)}
						title="View Invoice"
						className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
					</button>
					<button
						type="button"
						onClick={() => downloadInvoice(p.id, `${p.deviceBrand} ${p.deviceModel}`)}
						title="Download Invoice"
						className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* HEADER PANEL */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
						Purchases Ledger
					</h1>
					<p className="text-xs text-zinc-400 mt-1">
						Log and trace all device purchase and customer buyback acquisitions.
					</p>
				</div>
				<Button variant="gradient" className="font-bold cursor-pointer" onClick={handleOpenPurchase}>
					<span className="flex items-center gap-2">
						📥 Record Device Purchase
					</span>
				</Button>
			</div>

			{/* METRICS ROW */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
				{/* Stat 1 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Total Purchases
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white">
						{summaryStats.totalCount}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Units acquired in log</span>
				</div>

				{/* Stat 2 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Total Outflow
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white" suppressHydrationWarning>
						₹{summaryStats.totalOutflow.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Capital invested in stock</span>
				</div>

				{/* Stat 3 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Average Cost / Unit
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white" suppressHydrationWarning>
						₹{summaryStats.avgCost.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Average value of acquisitions</span>
				</div>
			</div>

			{/* SEARCH AND FILTERS */}
			<div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 items-center justify-between">
				<div className="relative w-full md:w-96">
					<span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search purchases by IMEI, specs, customer..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
					/>
				</div>

				<div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
					<Select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						options={[
							{ value: "createdAt", label: "Sort: Log Date" },
							{ value: "amount", label: "Sort: Price Value" },
						]}
						className="w-44"
					/>
					<Select
						value={sortOrder}
						onChange={(e) => setSortOrder(e.target.value as any)}
						options={[
							{ value: "desc", label: "Order: High-Low" },
							{ value: "asc", label: "Order: Low-High" },
						]}
						className="w-44"
					/>
				</div>
			</div>

			{/* DATA TABLE */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				<DataTable
					columns={columns}
					data={purchases}
					loading={isLoading}
					emptyMessage={
						<div className="text-center py-16 space-y-3">
							<h4 className="font-bold text-zinc-900 dark:text-zinc-200">No Purchases Found</h4>
							<p className="text-xs text-zinc-500 max-w-sm mx-auto">
								We couldn&apos;t find any purchases matching your criteria. Make sure details are typed correctly.
							</p>
						</div>
					}
				/>
				<Pagination
					page={page}
					total={total}
					limit={limit}
					onPageChange={setPage}
					onLimitChange={(l) => {
						setLimit(l);
						setPage(1);
					}}
				/>
			</div>

			{/* RECORD PURCHASE FORM MODAL */}
			<Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Record Stock Purchase" size="lg">
				<form onSubmit={handleSubmitPurchase} className="space-y-4">
					{/* IMEI Input */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							15-Digit IMEI *
						</label>
						<input
							type="text"
							maxLength={15}
							value={formImei}
							onChange={(e) => setFormImei(e.target.value.replace(/\D/g, ""))}
							placeholder="e.g. 359283748291827"
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
							required
						/>
						{autofillMessage && (
							<div
								className={`p-3 rounded-xl border text-xs font-semibold animate-scaleUp ${
									autofillDetected
										? "bg-primary/5 border-primary/20 text-primary dark:text-secondary"
										: "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
								}`}
							>
								{autofillMessage}
							</div>
						)}
					</div>

					{/* Specs Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Brand */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase">Brand *</label>
								{!autofillDetected && (
									<button
										type="button"
										onClick={() => setIsAddingBrand(!isAddingBrand)}
										className="text-[10px] text-primary hover:underline font-bold"
									>
										{isAddingBrand ? "Cancel" : "+ Add"}
									</button>
								)}
							</div>
							{isAddingBrand ? (
								<div className="flex gap-2">
									<input
										type="text"
										value={newBrandVal}
										onChange={(e) => setNewBrandVal(e.target.value)}
										placeholder="Brand Name"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateBrand}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<Select
									value={formBrand}
									disabled={autofillDetected}
									onChange={(e) => {
										setFormBrand(e.target.value);
										setFormModel("");
									}}
									required
									placeholder="-- Select Brand --"
									options={brandsList.map((b) => ({ value: b, label: b }))}
								/>
							)}
						</div>

						{/* Model */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase">Model *</label>
								{!autofillDetected && (
									<button
										type="button"
										disabled={!formBrand}
										onClick={() => setIsAddingModel(!isAddingModel)}
										className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50"
									>
										{isAddingModel ? "Cancel" : "+ Add"}
									</button>
								)}
							</div>
							{isAddingModel ? (
								<div className="flex gap-2">
									<input
										type="text"
										value={newModelVal}
										onChange={(e) => setNewModelVal(e.target.value)}
										placeholder={`Model for ${formBrand}`}
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateModel}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<Select
									value={formModel}
									disabled={autofillDetected || !formBrand}
									onChange={(e) => setFormModel(e.target.value)}
									required
									placeholder="-- Select Model --"
									options={modelsList
										.filter((m) => m.brand.toLowerCase() === formBrand.toLowerCase())
										.map((m) => ({ value: m.name, label: m.name }))}
								/>
							)}
						</div>
					</div>

					{/* Storages, RAMs, and Color */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Storage */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase">Storage *</label>
								{!autofillDetected && (
									<button
										type="button"
										onClick={() => setIsAddingStorage(!isAddingStorage)}
										className="text-[10px] text-primary hover:underline font-bold"
									>
										{isAddingStorage ? "Cancel" : "+ Add"}
									</button>
								)}
							</div>
							{isAddingStorage ? (
								<div className="flex gap-2">
									<input
										type="text"
										value={newStorageVal}
										onChange={(e) => setNewStorageVal(e.target.value)}
										placeholder="Capacity"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateStorage}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<Select
									value={formStorage}
									disabled={autofillDetected}
									onChange={(e) => setFormStorage(e.target.value)}
									required
									placeholder="-- Size --"
									options={storagesList.map((s) => ({ value: s, label: s }))}
								/>
							)}
						</div>

						{/* RAM */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-400 uppercase">RAM *</label>
								{!autofillDetected && (
									<button
										type="button"
										onClick={() => setIsAddingRam(!isAddingRam)}
										className="text-[10px] text-primary hover:underline font-bold"
									>
										{isAddingRam ? "Cancel" : "+ Add"}
									</button>
								)}
							</div>
							{isAddingRam ? (
								<div className="flex gap-2">
									<input
										type="text"
										value={newRamVal}
										onChange={(e) => setNewRamVal(e.target.value)}
										placeholder="Size"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateRam}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<Select
									value={formRam}
									disabled={autofillDetected}
									onChange={(e) => setFormRam(e.target.value)}
									required
									placeholder="-- RAM --"
									options={ramsList.map((r) => ({ value: r, label: r }))}
								/>
							)}
						</div>

						{/* Color */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Color</label>
							<input
								type="text"
								value={formColor}
								disabled={autofillDetected}
								onChange={(e) => setFormColor(e.target.value)}
								placeholder="e.g. Space Gray"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					{/* Condition / Battery */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Condition *</label>
							<Select
								value={formCondition}
								onChange={(e) => setFormCondition(e.target.value as any)}
								options={[
									{ value: "NEW", label: "New Condition" },
									{ value: "OLD", label: "Old / Used Condition" },
								]}
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Battery Health (%)</label>
							<input
								type="number"
								min={50}
								max={100}
								value={formBatteryHealth}
								onChange={(e) => setFormBatteryHealth(parseInt(e.target.value) || 90)}
								disabled={!isAppleSelected}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
							/>
						</div>
					</div>

					{/* Customer Select / Register Customer */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Source Customer *</label>
							<button
								type="button"
								onClick={() => {
									setIsAddingCust(!isAddingCust);
									setCustErrors({});
									setCustFormError("");
								}}
								className="text-[10px] text-primary hover:underline font-bold"
							>
								{isAddingCust ? "Cancel" : "+ Quick Add"}
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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
								{/* Customer Choose */}
								<div className="space-y-1 relative md:col-span-1">
									<Select
										value={formCustomerName}
										onChange={(e) => setFormCustomerName(e.target.value)}
										required
										placeholder="-- Choose Customer --"
										options={customers.map((c) => ({
											value: c.name,
											label: `${c.name} (${c.phone})`,
										}))}
									/>
								</div>

								{/* Purchase Price */}
								<div className="space-y-1">
									<label className="text-xs font-semibold text-zinc-400 uppercase">Purchase Price (₹) *</label>
									<input
										type="number"
										required
										value={formAmount}
										onChange={(e) => setFormAmount(e.target.value)}
										placeholder="e.g. 45000"
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>

								{/* Date */}
								<div className="space-y-1">
									<label className="text-xs font-semibold text-zinc-400 uppercase">Purchase Date *</label>
									<input
										type="date"
										required
										value={formDate}
										onChange={(e) => setFormDate(e.target.value)}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>
							</div>
						)}
					</div>

					{/* Notes */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase">Acquisition Notes</label>
						<textarea
							value={formNotes}
							onChange={(e) => setFormNotes(e.target.value)}
							placeholder="e.g. Minor scratches, battery health verified, UPI transfer completed..."
							rows={2.5}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<Button type="submit" variant="gradient" className="w-full py-3 rounded-xl font-bold cursor-pointer">
						📥 Record Purchase Inflow
					</Button>
				</form>
			</Modal>
		</div>
	);
}
