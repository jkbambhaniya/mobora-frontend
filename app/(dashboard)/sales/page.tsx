"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useDashboard, Customer, TradeTransaction, Mobile } from "@/context/vendor/dashboard-context";
import { getTransactionsAction } from "@/actions/transactions";
import { getMobilesAction } from "@/actions/mobiles";
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

export default function SalesPage() {
	const {
		customers,
		addCustomer,
		handleAddTradeTransaction,
		editDevice,
		refreshTrades,
		refreshDevices,
		refreshMetrics,
	} = useDashboard();

	// Page & Filter States
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	const [sales, setSales] = useState<TradeTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Modals State
	const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<Mobile[]>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);

	// Quick Add Customer States
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});
	const [custFormError, setCustFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Sale Form States
	const [selectedDeviceId, setSelectedDeviceId] = useState("");
	const [formCustomerName, setFormCustomerName] = useState("");
	const [formAmount, setFormAmount] = useState("");
	const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
	const [formNotes, setFormNotes] = useState("");

	// Debounce Search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(searchTerm);
			setPage(1);
		}, 300);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Fetch sales log
	const fetchSales = async () => {
		setIsLoading(true);
		try {
			const res = await getTransactionsAction({
				type: "Sale",
				search: debouncedSearch.trim() || undefined,
				sortBy,
				sortOrder,
				page,
				limit,
			});
			if (res.success && res.data && res.data.success) {
				setSales(res.data.transactions || []);
				setTotal(res.data.total || 0);
			}
		} catch (err) {
			console.error("Error loading sales:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchSales();
	}, [debouncedSearch, sortBy, sortOrder, page, limit]);

	// Load Available Devices in Stock
	const loadAvailableDevices = async () => {
		setIsLoadingDevices(true);
		try {
			const res = await getMobilesAction({ status: "Available", limit: 100 });
			if (res.success && res.data && res.data.success) {
				setAvailableDevices(res.data.mobiles || []);
			}
		} catch (err) {
			console.error("Error fetching available devices:", err);
		} finally {
			setIsLoadingDevices(false);
		}
	};

	// Open Sale Handler
	const handleOpenSale = () => {
		setSelectedDeviceId("");
		setFormCustomerName(customers[0]?.name || "");
		setFormAmount("");
		setFormNotes("");
		setFormDate(new Date().toISOString().split("T")[0]);
		setIsAddingCust(false);
		loadAvailableDevices();
		setIsSaleModalOpen(true);
	};

	// Selected device specs & details
	const selectedDevice = useMemo(() => {
		return availableDevices.find((d) => d.id.toString() === selectedDeviceId);
	}, [selectedDeviceId, availableDevices]);

	// Real-time Margin Calculator
	const calculatedMargin = useMemo(() => {
		if (!selectedDevice) return null;
		const cost = selectedDevice.purchasePrice || 0;
		const sellPrice = parseFloat(formAmount) || 0;
		return sellPrice - cost;
	}, [selectedDevice, formAmount]);

	// Summary stats
	const summaryStats = useMemo(() => {
		const totalCount = total;
		const totalInflow = sales.reduce((sum, s) => sum + s.amount, 0);
		// Total profit = sum of (sale price - purchase price)
		const totalProfit = sales.reduce((sum, s) => {
			const cost = (s as any).purchasePrice || 0;
			return sum + (s.amount - cost);
		}, 0);
		const avgTicket = totalCount > 0 ? Math.round(totalInflow / sales.length || 0) : 0;
		return { totalCount, totalInflow, totalProfit, avgTicket };
	}, [sales, total]);

	// Quick Register Customer
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
				address: newCustAddress || "Registered in Sales desk",
				notes: "Quick registered from sales ledger.",
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

	// Record Sale Handler
	const handleSubmitSale = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedDeviceId) {
			toast.error("Please select a device from inventory to sell.");
			return;
		}
		if (!formCustomerName || !formAmount) {
			toast.error("Please fill in Customer and Sale Price.");
			return;
		}

		const priceNum = parseFloat(formAmount);
		if (isNaN(priceNum) || priceNum <= 0) {
			toast.error("Sale price must be a valid positive number.");
			return;
		}

		if (!selectedDevice) return;

		// 1. Edit mobile status in inventory to Sold
		const result = await editDevice(selectedDevice.id, {
			status: "Sold",
			price: priceNum,
			description: formNotes || `Sold to ${formCustomerName}.`,
		});

		if (result.success) {
			// 2. Add Sale Transaction Record
			const tx = await handleAddTradeTransaction({
				imei: selectedDevice.imei || "N/A",
				deviceBrand: selectedDevice.brand,
				deviceModel: selectedDevice.model,
				type: "Sale",
				customerName: formCustomerName,
				amount: priceNum,
				date: formDate,
				notes: formNotes || `Sold from inventory catalog to ${formCustomerName}.`,
				storage: selectedDevice.storage,
				ram: selectedDevice.ram,
				color: selectedDevice.color,
				condition: selectedDevice.condition,
				batteryHealth: selectedDevice.batteryHealth,
			}, true);

			setIsSaleModalOpen(false);
			toast.success(`Recorded sale of ${selectedDevice.brand} ${selectedDevice.model} to ${formCustomerName}!`);
			fetchSales();
			refreshDevices(undefined, true);
			refreshMetrics();
			refreshTrades();

			// Auto open/stream PDF invoice
			if (tx && tx.id) {
				streamInvoice(tx.id);
			}
		} else {
			toast.error(result.message || "Failed to update device status to Sold.");
		}
	};

	// Table columns config
	const columns: Column<TradeTransaction>[] = [
		{
			key: "date",
			title: "Sale Date",
			sortable: true,
			render: (s) => (
				<span className="font-semibold text-xs text-zinc-500 dark:text-zinc-400">
					{s.date}
				</span>
			),
		},
		{
			key: "device",
			title: "Sold Device",
			render: (s) => (
				<div>
					<div className="font-bold text-zinc-900 dark:text-white leading-tight">
						{s.deviceBrand} {s.deviceModel}
					</div>
					<div className="text-[10px] text-zinc-450 mt-1 flex flex-wrap gap-1.5 items-center">
						<span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
							{s.imei}
						</span>
						<span>•</span>
						<span>{s.storage || "128GB"}</span>
						<span>•</span>
						<span>{s.ram || "6GB"}</span>
						<span>•</span>
						<span>{s.color || "Space Gray"}</span>
					</div>
				</div>
			),
		},
		{
			key: "partner",
			title: "Buyer Contact",
			render: (s) => {
				return (
					<div className="font-semibold text-zinc-800 dark:text-zinc-200">
						{s.customerName}
					</div>
				);
			},
		},
		{
			key: "purchasePrice",
			title: "Original Cost",
			headerClassName: "text-right",
			className: "text-right font-bold text-zinc-500",
			render: (s) => {
				const cost = (s as any).purchasePrice;
				return (
					<span suppressHydrationWarning>
						{cost ? `₹${cost.toLocaleString()}` : "—"}
					</span>
				);
			},
		},
		{
			key: "amount",
			title: "Sale Price",
			sortable: true,
			headerClassName: "text-right",
			className: "text-right font-extrabold text-zinc-900 dark:text-zinc-100",
			render: (s) => (
				<span suppressHydrationWarning className="text-sm font-black text-emerald-500">
					₹{s.amount.toLocaleString()}
				</span>
			),
		},
		{
			key: "margin",
			title: "Realized Profit",
			headerClassName: "text-right",
			className: "text-right font-extrabold",
			render: (s) => {
				const cost = (s as any).purchasePrice;
				if (!cost) return <span className="text-zinc-400">—</span>;
				const profit = s.amount - cost;
				return (
					<span
						suppressHydrationWarning
						className={`px-2.5 py-1 rounded-xl text-xs font-black ${
							profit >= 0
								? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
								: "bg-red-500/10 text-red-600 dark:text-red-400"
						}`}
					>
						{profit >= 0 ? "+" : ""}₹{profit.toLocaleString()}
					</span>
				);
			},
		},
		{
			key: "actions",
			title: "Invoice Actions",
			headerClassName: "text-center",
			className: "text-center",
			render: (s) => (
				<div className="flex items-center justify-center gap-1.5">
					<button
						type="button"
						onClick={() => streamInvoice(s.id)}
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
						onClick={() => downloadInvoice(s.id, `${s.deviceBrand} ${s.deviceModel}`)}
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
						Sales Ledger
					</h1>
					<p className="text-xs text-zinc-400 mt-1">
						Log device sales, monitor profit margins, and stream digital invoices.
					</p>
				</div>
				<Button variant="gradient" className="font-bold cursor-pointer animate-pulse hover:animate-none" onClick={handleOpenSale}>
					<span className="flex items-center gap-2">
						📤 Record Device Sale
					</span>
				</Button>
			</div>

			{/* METRICS PANEL */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{/* Card 1 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Total Sales Count
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white">
						{summaryStats.totalCount}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Units dispatched from stock</span>
				</div>

				{/* Card 2 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Total Sales Volume
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white" suppressHydrationWarning>
						₹{summaryStats.totalInflow.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Revenue generated in log</span>
				</div>

				{/* Card 3 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Net Profit Margin
					</span>
					<span
						className={`text-3xl font-black block mt-2 ${
							summaryStats.totalProfit >= 0 ? "text-emerald-500" : "text-red-500"
						}`}
						suppressHydrationWarning
					>
						₹{summaryStats.totalProfit.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Realized earnings margin</span>
				</div>

				{/* Card 4 */}
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Average Ticket Size
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white" suppressHydrationWarning>
						₹{summaryStats.avgTicket.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Average checkout value</span>
				</div>
			</div>

			{/* FILTERS */}
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
						placeholder="Search sales by IMEI, model, customer name..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
					/>
				</div>

				<div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
					<Select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						options={[
							{ value: "createdAt", label: "Sort: Sale Date" },
							{ value: "amount", label: "Sort: Sale Amount" },
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

			{/* TABLE LOG */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				<DataTable
					columns={columns}
					data={sales}
					loading={isLoading}
					emptyMessage={
						<div className="text-center py-16 space-y-3">
							<h4 className="font-bold text-zinc-900 dark:text-zinc-200">No Sales Transactions</h4>
							<p className="text-xs text-zinc-500 max-w-sm mx-auto">
								We couldn&apos;t find any sales matching your search query. Select another filter or record a sale.
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

			{/* RECORD SALE FORM MODAL */}
			<Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="Record Device Sale Outflow" size="lg">
				<form onSubmit={handleSubmitSale} className="space-y-4">
					{/* Target Device Selector */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Select Device from Stock *
						</label>
						{isLoadingDevices ? (
							<div className="text-xs text-zinc-450 py-2.5 animate-pulse">Loading stock list...</div>
						) : (
							<Select
								value={selectedDeviceId}
								onChange={(e) => setSelectedDeviceId(e.target.value)}
								required
								placeholder="-- Choose Available Device --"
								options={availableDevices.map((d) => ({
									value: d.id.toString(),
									label: `${d.brand} ${d.model} (${d.storage}/${d.ram}, ${d.color}) — Cost: ₹${(
										d.purchasePrice || 0
									).toLocaleString()} | IMEI: ${d.imei || "N/A"}`,
								}))}
							/>
						)}
					</div>

					{/* Device Info Panel */}
					{selectedDevice && (
						<div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs space-y-2 animate-scaleUp">
							<div className="flex justify-between items-center text-zinc-450">
								<span>IMEI Number:</span>
								<span className="font-mono font-bold text-zinc-800 dark:text-zinc-250">
									{selectedDevice.imei || "N/A"}
								</span>
							</div>
							<div className="flex justify-between items-center text-zinc-450">
								<span>Current Condition:</span>
								<span className="font-bold text-zinc-800 dark:text-zinc-250">{selectedDevice.condition}</span>
							</div>
							<div className="flex justify-between items-center text-zinc-450">
								<span>Purchase / Cost price:</span>
								<span className="font-bold text-zinc-800 dark:text-zinc-250" suppressHydrationWarning>
									₹{(selectedDevice.purchasePrice || 0).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between items-center text-zinc-450">
								<span>Suggested Markup Price (20%):</span>
								<span className="font-black text-primary" suppressHydrationWarning>
									₹{Math.round((selectedDevice.purchasePrice || 0) * 1.2).toLocaleString()}
								</span>
							</div>
						</div>
					)}

					{/* Customer Select / Register Customer */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Target Customer *</label>
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

								{/* Sale Price */}
								<div className="space-y-1">
									<input
										type="number"
										required
										value={formAmount}
										onChange={(e) => setFormAmount(e.target.value)}
										placeholder="e.g. 52000"
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>

								{/* Date */}
								<div className="space-y-1">
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

					{/* Real-time Profit Margin Indicator Banner */}
					{selectedDevice && calculatedMargin !== null && (
						<div
							className={`p-3.5 rounded-xl border text-xs font-bold text-center animate-scaleUp flex justify-between items-center ${
								calculatedMargin >= 0
									? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
									: "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
							}`}
						>
							<span>Estimated Profit Margin:</span>
							<span suppressHydrationWarning className="text-sm font-black">
								{calculatedMargin >= 0 ? "+" : ""}₹{calculatedMargin.toLocaleString()}
							</span>
						</div>
					)}

					{/* Notes */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase">Outflow Sale Notes</label>
						<textarea
							value={formNotes}
							onChange={(e) => setFormNotes(e.target.value)}
							placeholder="e.g. Sold with box and original charger. Warranty terms explained. Payment received via online UPI..."
							rows={2.5}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<Button type="submit" variant="gradient" className="w-full py-3 rounded-xl font-bold cursor-pointer">
						📤 Record Sale Outflow
					</Button>
				</form>
			</Modal>
		</div>
	);
}
