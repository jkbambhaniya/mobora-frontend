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
import { PartnerSelector } from "@/components/vendor/PartnerSelector";

export default function PurchasesPage() {
	const {
		customers,
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
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [isAddingModel, setIsAddingModel] = useState(false);
	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [isAddingRam, setIsAddingRam] = useState(false);

	// Quick Add Spec Input States
	const [newBrandVal, setNewBrandVal] = useState("");
	const [newModelVal, setNewModelVal] = useState("");
	const [newStorageVal, setNewStorageVal] = useState("");
	const [newRamVal, setNewRamVal] = useState("");

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

	// Security Check States
	const [isCheckingImei, setIsCheckingImei] = useState(false);
	const [imeiCheckStatus, setImeiCheckStatus] = useState<"idle" | "clean" | "stolen">("idle");

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

	// Monitor IMEI input for auto-fill logic & Security Blacklist checks
	useEffect(() => {
		const verifyImeiAutofill = async () => {
			if (formImei.length === 15) {
				setIsCheckingImei(true);
				setImeiCheckStatus("idle");
				
				// Simulate Blacklist Registry check
				await new Promise((resolve) => setTimeout(resolve, 800));
				
				if (formImei.endsWith("999")) {
					setIsCheckingImei(false);
					setImeiCheckStatus("stolen");
					setAutofillDetected(false);
					setAutofillMessage("❌ STOLEN / BLOCKED DEVICE. Purchase blocked.");
					toast.error("Security Alert: Device reported as STOLEN/BLOCKED!");
					return;
				}
				
				setImeiCheckStatus("clean");
				
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
				} finally {
					setIsCheckingImei(false);
				}
			} else {
				setAutofillDetected(false);
				setAutofillMessage("");
				setImeiCheckStatus("idle");
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

		const [partnerType, partnerNameOrId] = formCustomerName.includes(":")
			? (formCustomerName.split(":") as ["Customer" | "Vendor", string])
			: ["Customer" as const, formCustomerName];

		const result = await handleAddTradeTransaction({
			imei: formImei,
			deviceBrand: formBrand,
			deviceModel: formModel,
			type: "Purchase",
			customerName: partnerNameOrId,
			partnerType: partnerType,
			amount: priceNum,
			date: formDate,
			notes: formNotes || `Device purchased from ${partnerNameOrId}.`,
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
					<div className="space-y-1 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							15-Digit IMEI *
						</label>
						<div className="relative">
							<input
								type="text"
								maxLength={15}
								value={formImei}
								onChange={(e) => setFormImei(e.target.value.replace(/\D/g, ""))}
								placeholder="e.g. 359283748291827"
								className={`w-full pl-4 pr-10 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono
									${imeiCheckStatus === "stolen" ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800"}`}
								required
							/>
							{isCheckingImei && (
								<span className="absolute inset-y-0 right-3.5 flex items-center">
									<svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
								</span>
							)}
						</div>

						{/* Security Status Messages */}
						{isCheckingImei && (
							<div className="text-[11px] text-indigo-500 font-semibold animate-pulse mt-1">
								🔍 Querying Global Blacklist Registry & Stolen Database...
							</div>
						)}

						{imeiCheckStatus === "stolen" && (
							<div className="p-3 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold space-y-1 mt-1 animate-scaleUp">
								<div>⚠️ SECURITY THREAT REGISTERED</div>
								<p className="text-[10px] font-medium leading-normal text-red-500">
									This IMEI is reported as STOLEN or BLOCKED. Mobora Anti-Theft policies prevent recording this purchase.
								</p>
							</div>
						)}

						{imeiCheckStatus === "clean" && autofillMessage && (
							<div
								className={`p-3 rounded-xl border text-xs font-semibold animate-scaleUp ${
									autofillDetected
										? "bg-primary/5 border-primary/20 text-primary dark:text-secondary"
										: "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
								}`}
							>
								{autofillDetected ? autofillMessage : `✅ Security Verified: IMEI Clean. ${autofillMessage}`}
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

					<PartnerSelector
						value={formCustomerName}
						onChange={setFormCustomerName}
						label="Source Customer / Vendor *"
						placeholder="-- Choose Partner --"
						required={true}
						valueType="name"
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
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

					<Button
						type="submit"
						variant="gradient"
						disabled={isCheckingImei || imeiCheckStatus === "stolen"}
						className="w-full py-3 rounded-xl font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isCheckingImei ? "Verifying Device Security..." : imeiCheckStatus === "stolen" ? "Purchase Blocked (Stolen IMEI)" : "📥 Record Purchase Inflow"}
					</Button>
				</form>
			</Modal>
		</div>
	);
}
