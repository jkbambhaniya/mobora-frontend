"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import {
	useDashboard,
	TradeTransaction,
	Customer,
} from "@/context/vendor/dashboard-context";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";
import * as yup from "yup";

const quickPartnerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name/Business Name is required."),
	phone: yup.string().trim().required("Phone Number is required."),
	address: yup.string().trim().nullable().notRequired(),
});

export default function TradesTrackerPage() {
	const {
		trades,
		handleAddTradeTransaction,
		brands,
		models,
		storages,
		rams,
		handleAddBrand,
		handleAddModel,
		handleAddStorage,
		handleAddRam,
		customers,
		setCustomers,
		addCustomer,
		triggerToast,
	} = useDashboard();

	// Active transaction type toggle
	const [txType, setTxType] = useState<"Purchase" | "Sale">("Purchase");

	// Form states
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
	const [formCustomerName, setFormCustomerName] = useState("");
	const [formAmount, setFormAmount] = useState("");
	const [formDate, setFormDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [formNotes, setFormNotes] = useState("");

	// Autofill Info Banners
	const [autofillDetected, setAutofillDetected] = useState(false);
	const [autofillMessage, setAutofillMessage] = useState("");

	// Search/Timeline states
	const [searchImei, setSearchImei] = useState("");
	const [tracedImei, setTracedImei] = useState("");
	const [timelineEvents, setTimelineEvents] = useState<TradeTransaction[]>(
		[],
	);

	// Modals for inline additions
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [newBrandVal, setNewBrandVal] = useState("");

	const [isAddingModel, setIsAddingModel] = useState(false);
	const [newModelVal, setNewModelVal] = useState("");

	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [newStorageVal, setNewStorageVal] = useState("");

	const [isAddingRam, setIsAddingRam] = useState(false);
	const [newRamVal, setNewRamVal] = useState("");

	const [isAddingCust, setIsAddingCust] = useState(false);
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});
	const [custFormError, setCustFormError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Monitor IMEI input for auto-fill logic
	useEffect(() => {
		if (formImei.length === 15) {
			// Find the latest trade transaction with this IMEI
			const matchingTrades = trades.filter((t) => t.imei === formImei);
			if (matchingTrades.length > 0) {
				// Sort newest first
				const latestTrade = matchingTrades.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];

				setFormBrand(latestTrade.deviceBrand);
				setFormModel(latestTrade.deviceModel);
				setFormStorage(latestTrade.storage || "128GB");
				setFormRam(latestTrade.ram || "6GB");
				setFormColor(latestTrade.color || "Space Gray");
				if (latestTrade.condition)
					setFormCondition(latestTrade.condition);
				if (latestTrade.batteryHealth)
					setFormBatteryHealth(latestTrade.batteryHealth);

				// Setup autofill notice
				setAutofillDetected(true);
				setAutofillMessage(
					`🔄 Previously active device specs loaded. Last transaction: ${latestTrade.type} of ₹${latestTrade.amount.toLocaleString()} on ${latestTrade.date}.`,
				);
				triggerToast("Device specs loaded from IMEI history.");
			} else {
				setAutofillDetected(false);
				setAutofillMessage(
					"🆕 New IMEI detected. Please specify specifications manually.",
				);
			}
		} else {
			setAutofillDetected(false);
			setAutofillMessage("");
		}
	}, [formImei, trades]);

	// Form submission handler
	const handleRecordTransaction = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formImei || formImei.length !== 15) {
			alert("Please enter a valid 15-digit IMEI number.");
			return;
		}
		if (!formBrand || !formModel || !formCustomerName || !formAmount) {
			alert(
				"Please enter brand, model, customer name, and transaction amount.",
			);
			return;
		}

		const amountNum = parseFloat(formAmount);

		// Call context handler
		handleAddTradeTransaction({
			imei: formImei,
			deviceBrand: formBrand,
			deviceModel: formModel,
			type: txType,
			customerName: formCustomerName,
			amount: amountNum,
			date: formDate,
			notes: formNotes || `${txType} recorded at store.`,
			storage: formStorage,
			ram: formRam,
			color: formColor || "Space Gray",
			condition: formCondition,
			batteryHealth: formBatteryHealth,
		});

		// Reset Form
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("NEW");
		setFormBatteryHealth(90);
		setFormCustomerName("");
		setFormAmount("");
		setFormNotes("");
		setAutofillDetected(false);
	};

	// Perform IMEI Trace search
	const handleTraceSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchImei || searchImei.trim().length === 0) return;

		const matching = trades.filter((t) => t.imei === searchImei.trim());
		// Sort chronologically (oldest first)
		const sorted = matching.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		setTimelineEvents(sorted);
		setTracedImei(searchImei.trim());
	};

	// Inline dynamic specifications saving helpers
	const handleCreateBrand = () => {
		if (newBrandVal.trim()) {
			handleAddBrand(newBrandVal.trim());
			setFormBrand(newBrandVal.trim());
			setNewBrandVal("");
			setIsAddingBrand(false);
		}
	};

	const handleCreateModel = () => {
		if (!formBrand) return alert("Select brand first.");
		if (newModelVal.trim()) {
			handleAddModel(formBrand, newModelVal.trim());
			setFormModel(newModelVal.trim());
			setNewModelVal("");
			setIsAddingModel(false);
		}
	};

	const handleCreateStorage = () => {
		if (newStorageVal.trim()) {
			handleAddStorage(newStorageVal.trim());
			setFormStorage(newStorageVal.trim());
			setNewStorageVal("");
			setIsAddingStorage(false);
		}
	};

	const handleCreateRam = () => {
		if (newRamVal.trim()) {
			handleAddRam(newRamVal.trim());
			setFormRam(newRamVal.trim());
			setNewRamVal("");
			setIsAddingRam(false);
		}
	};

	// Inline Quick Add Customer
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
				address: newCustAddress || "Registered in Trades desk",
				notes: "Quick registered during trade transaction.",
			});

			if (res.success) {
				setFormCustomerName(newCustName);
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setCustErrors({});
				triggerToast(`Customer ${newCustName} quick-registered.`);
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

	// Compute profit and specs for visual timeline
	const firstEvent = timelineEvents[0];
	const deviceSpecsStr = firstEvent
		? `${firstEvent.deviceBrand} ${firstEvent.deviceModel} (${firstEvent.storage || "128GB"}/${firstEvent.ram || "6GB"}, ${firstEvent.color || "Space Gray"})`
		: "";

	// Calculate cumulative profit
	// Logic: For each Sold transaction, search the preceding Purchase transaction to calculate margin
	let totalProfit = 0;
	const computedTimeline = timelineEvents.map((event, idx) => {
		let margin = 0;
		if (event.type === "Sale") {
			// Find preceding purchase transaction of the same IMEI
			const prePurchases = timelineEvents
				.slice(0, idx)
				.filter((t) => t.type === "Purchase");
			if (prePurchases.length > 0) {
				const lastPurchase = prePurchases[prePurchases.length - 1];
				margin = event.amount - lastPurchase.amount;
				totalProfit += margin;
			}
		}
		return { ...event, margin };
	});

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* HEADER SECTION & SEARCH TIMELINE TRACE */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				{/* Left Column: Form component */}
				<div className="lg:col-span-2 space-y-6">
					<div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-6 shadow-sm">
						<div>
							<h2 className="text-lg font-bold text-zinc-900 dark:text-white">
								Record Buyback & Sales Transactions
							</h2>
							<p className="text-xs text-zinc-400 mt-1">
								Enter an IMEI to track. System will auto-fill
								previously logged device specs.
							</p>
						</div>

						{/* Type toggle */}
						<div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl w-64 border border-zinc-200/20">
							<button
								type="button"
								onClick={() => setTxType("Purchase")}
								className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
									txType === "Purchase"
										? "bg-white dark:bg-zinc-700 shadow-sm text-primary dark:text-white"
										: "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
								}`}
							>
								📥 Purchase / Buyback
							</button>
							<button
								type="button"
								onClick={() => setTxType("Sale")}
								className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
									txType === "Sale"
										? "bg-white dark:bg-zinc-700 shadow-sm text-primary dark:text-white"
										: "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
								}`}
							>
								📤 Sales Outflow
							</button>
						</div>

						{/* Main Form */}
						<form
							onSubmit={handleRecordTransaction}
							className="space-y-4"
						>
							{/* IMEI Input */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-zinc-450 uppercase tracking-wide">
									15-Digit IMEI *
								</label>
								<input
									type="text"
									maxLength={15}
									value={formImei}
									onChange={(e) =>
										setFormImei(
											e.target.value.replace(/\D/g, ""),
										)
									}
									placeholder="e.g. 359283748291827"
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
									required
								/>

								{/* Autofill Notice Banner */}
								{autofillMessage && (
									<div
										className={`mt-2 p-3 rounded-xl border text-xs font-semibold animate-scaleUp ${
											autofillDetected
												? "bg-primary/5 border-primary/20 text-primary dark:text-secondary"
												: "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
										}`}
									>
										{autofillMessage}
									</div>
								)}
							</div>

							{/* Specification Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Brand */}
								<div className="space-y-1 relative">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase">
											Brand *
										</label>
										{!autofillDetected && (
											<button
												type="button"
												onClick={() =>
													setIsAddingBrand(
														!isAddingBrand,
													)
												}
												className="text-[10px] text-primary hover:underline font-bold"
											>
												{isAddingBrand
													? "Cancel"
													: "+ Add"}
											</button>
										)}
									</div>

									{isAddingBrand ? (
										<div className="flex gap-2 animate-scaleUp">
											<input
												type="text"
												value={newBrandVal}
												onChange={(e) =>
													setNewBrandVal(
														e.target.value,
													)
												}
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
											options={brands.map((b) => ({ value: b, label: b }))}
										/>
									)}
								</div>

								{/* Model */}
								<div className="space-y-1">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase">
											Model *
										</label>
										{!autofillDetected && (
											<button
												type="button"
												disabled={!formBrand}
												onClick={() =>
													setIsAddingModel(
														!isAddingModel,
													)
												}
												className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50"
											>
												{isAddingModel
													? "Cancel"
													: "+ Add"}
											</button>
										)}
									</div>

									{isAddingModel ? (
										<div className="flex gap-2 animate-scaleUp">
											<input
												type="text"
												value={newModelVal}
												onChange={(e) =>
													setNewModelVal(
														e.target.value,
													)
												}
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
											disabled={
												autofillDetected || !formBrand
											}
											onChange={(e) =>
												setFormModel(e.target.value)
											}
											required
											placeholder="-- Select Model --"
											options={models
												.filter(
													(m) =>
														m.brand === formBrand,
												)
												.map((m) => ({ value: m.name, label: m.name }))}
										/>
									)}
								</div>
							</div>

							{/* Storage, RAM, and Color */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Storage */}
								<div className="space-y-1">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase">
											Storage *
										</label>
										{!autofillDetected && (
											<button
												type="button"
												onClick={() =>
													setIsAddingStorage(
														!isAddingStorage,
													)
												}
												className="text-[10px] text-primary hover:underline font-bold"
											>
												{isAddingStorage
													? "Cancel"
													: "+ Add"}
											</button>
										)}
									</div>

									{isAddingStorage ? (
										<div className="flex gap-2 animate-scaleUp">
											<input
												type="text"
												value={newStorageVal}
												onChange={(e) =>
													setNewStorageVal(
														e.target.value,
													)
												}
												placeholder="e.g. 512GB"
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
											onChange={(e) =>
												setFormStorage(e.target.value)
											}
											required
											placeholder="-- Capacity --"
											options={storages.map((s) => ({ value: s, label: s }))}
										/>
									)}
								</div>

								{/* RAM */}
								<div className="space-y-1">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase">
											RAM *
										</label>
										{!autofillDetected && (
											<button
												type="button"
												onClick={() =>
													setIsAddingRam(!isAddingRam)
												}
												className="text-[10px] text-primary hover:underline font-bold"
											>
												{isAddingRam
													? "Cancel"
													: "+ Add"}
											</button>
										)}
									</div>

									{isAddingRam ? (
										<div className="flex gap-2 animate-scaleUp">
											<input
												type="text"
												value={newRamVal}
												onChange={(e) =>
													setNewRamVal(e.target.value)
												}
												placeholder="e.g. 16GB"
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
											onChange={(e) =>
												setFormRam(e.target.value)
											}
											required
											placeholder="-- Size --"
											options={rams.map((r) => ({ value: r, label: r }))}
										/>
									)}
								</div>

								{/* Color */}
								<div className="space-y-1">
									<label className="text-xs font-semibold text-zinc-400 uppercase">
										Color
									</label>
									<input
										type="text"
										value={formColor}
										disabled={autofillDetected}
										onChange={(e) =>
											setFormColor(e.target.value)
										}
										placeholder="e.g. Space Black"
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-75 disabled:bg-zinc-100/30"
									/>
								</div>
							</div>

							{/* Condition & Battery (For purchase or buyback updates) */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="text-xs font-semibold text-zinc-400 uppercase">
										Current Condition
									</label>
									<Select
										value={formCondition}
										onChange={(e) =>
											setFormCondition(
												e.target.value as any,
											)
										}
										options={[
											{ value: "NEW", label: "New" },
											{ value: "OLD", label: "Old" },
										]}
									/>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-semibold text-zinc-400 uppercase">
										Battery Health (%)
									</label>
									<input
										type="number"
										min={50}
										max={100}
										value={formBatteryHealth}
										onChange={(e) =>
											setFormBatteryHealth(
												parseInt(e.target.value) || 0,
											)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>
							</div>

							{/* Customer, Amount, Date */}
							<div className="space-y-4">
								<div className="space-y-1.5 text-left">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
											Customer *
										</label>
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
													onChange={(e) =>
														setFormCustomerName(
															e.target.value,
														)
													}
													required
													placeholder="-- Choose Customer --"
													options={customers.map((c) => ({ value: c.name, label: `${c.name} (${c.phone})` }))}
												/>
											</div>

											{/* Amount */}
											<div className="space-y-1">
												<label className="text-xs font-semibold text-zinc-400 uppercase">
													{txType === "Purchase"
														? "Purchase Price (₹) *"
														: "Sale price (₹) *"}
												</label>
												<input
													type="number"
													required
													value={formAmount}
													onChange={(e) =>
														setFormAmount(e.target.value)
													}
													placeholder={
														txType === "Purchase"
															? "e.g. 40000"
															: "e.g. 50000"
													}
													className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
												/>
											</div>

											{/* Date */}
											<div className="space-y-1">
												<label className="text-xs font-semibold text-zinc-400 uppercase">
													Tx Date *
												</label>
												<input
													type="date"
													required
													value={formDate}
													onChange={(e) =>
														setFormDate(e.target.value)
													}
													className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
												/>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1">
								<label className="text-xs font-semibold text-zinc-400 uppercase">
									Transaction Notes
								</label>
								<textarea
									value={formNotes}
									onChange={(e) =>
										setFormNotes(e.target.value)
									}
									placeholder="e.g. Battery health check at 88%, minor scratch on bezel. UPI payment received..."
									rows={2}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								/>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								variant="gradient"
								className="w-full py-3 rounded-xl font-bold cursor-pointer"
							>
								{txType === "Purchase"
									? "Record Purchase Buyback"
									: "Record Outgoing Sale"}
							</Button>
						</form>
					</div>
				</div>

				{/* Right Column: Search Lifecycle Trace */}
				<div className="space-y-6">
					<div className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm space-y-6">
						<div>
							<h2 className="text-lg font-bold text-zinc-900 dark:text-white">
								IMEI Lifecycle Trace
							</h2>
							<p className="text-xs text-zinc-400 mt-1">
								Enter an IMEI to view the complete history of
								its ownership changes and cumulative profit.
							</p>
						</div>

						<form
							onSubmit={handleTraceSearch}
							className="flex gap-2"
						>
							<input
								type="text"
								placeholder="Enter IMEI..."
								value={searchImei}
								onChange={(e) =>
									setSearchImei(
										e.target.value.replace(/\D/g, ""),
									)
								}
								className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							/>
							<button
								type="submit"
								className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
							>
								Trace
							</button>
						</form>

						{/* Timeline results */}
						{tracedImei && (
							<div className="space-y-5 animate-scaleUp">
								{timelineEvents.length > 0 ? (
									<div className="space-y-6">
										{/* Specs & Profit Banner */}
										<div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-250/20 space-y-1.5">
											<span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-secondary block">
												Device Profile
											</span>
											<h4 className="font-extrabold text-sm leading-tight text-zinc-900 dark:text-white">
												{deviceSpecsStr}
											</h4>
											<div className="flex items-baseline justify-between mt-2 pt-2 border-t border-zinc-200/40">
												<span className="text-xs text-zinc-400">
													Total Cycles:
												</span>
												<span className="font-bold text-xs">
													{Math.ceil(
														timelineEvents.length /
															2,
													)}
												</span>
											</div>
											<div className="flex items-baseline justify-between">
												<span className="text-xs text-zinc-400 font-semibold">
													Cumulative Profit:
												</span>
												<span
													className={`font-extrabold text-sm ${totalProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}
												>
													₹
													{totalProfit.toLocaleString()}
												</span>
											</div>
										</div>

										{/* Timeline Event Cards */}
										<div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6 ml-2">
											{computedTimeline.map(
												(ev, index) => {
													const isPurchase =
														ev.type === "Purchase";
													return (
														<div
															key={ev.id}
															className="relative"
														>
															{/* Dot indicator */}
															<span
																className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border bg-white dark:bg-zinc-900 ${
																	isPurchase
																		? "border-cyan-500 text-cyan-500"
																		: "border-emerald-500 text-emerald-500"
																}`}
															>
																<span
																	className={`h-1.5 w-1.5 rounded-full ${isPurchase ? "bg-cyan-500" : "bg-emerald-500"}`}
																/>
															</span>

															{/* Card */}
															<div className="space-y-1.5">
																<div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
																	<span>
																		{
																			ev.date
																		}
																	</span>
																	<div className="flex items-center gap-1.5">
																		<span
																			className={`px-2 py-0.5 rounded-full ${
																				isPurchase
																					? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
																					: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
																			}`}
																		>
																			{isPurchase
																				? "BUYBACK"
																				: "SOLD"}
																		</span>
																		<button
																			type="button"
																			onClick={() => streamInvoice(ev.id)}
																			title="View Invoice"
																			className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
																		>
																			<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
																				<path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
																			</svg>
																		</button>
																		<button
																			type="button"
																			onClick={() => downloadInvoice(ev.id, `${ev.deviceBrand} ${ev.deviceModel}`)}
																			title="Download Invoice"
																			className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
																		>
																			<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
																				<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
																			</svg>
																		</button>
																	</div>
																</div>
																<div className="text-xs text-zinc-800 dark:text-zinc-200 leading-normal">
																	{isPurchase ? (
																		<>
																			Purchased
																			from{" "}
																			<strong className="font-bold">
																				{
																					ev.customerName
																				}
																			</strong>{" "}
																			for{" "}
																			<strong className="font-bold">
																				₹
																				{ev.amount.toLocaleString()}
																			</strong>
																			.
																		</>
																	) : (
																		<>
																			Sold
																			to{" "}
																			<strong className="font-bold">
																				{
																					ev.customerName
																				}
																			</strong>{" "}
																			for{" "}
																			<strong className="font-bold">
																				₹
																				{ev.amount.toLocaleString()}
																			</strong>
																			.
																		</>
																	)}
																</div>

																{/* Extra metrics */}
																<div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
																	{ev.condition && (
																		<span>
																			Cond:{" "}
																			{
																				ev.condition
																			}
																		</span>
																	)}
																	{ev.batteryHealth && (
																		<span>
																			Battery:{" "}
																			{
																				ev.batteryHealth
																			}
																			%
																		</span>
																	)}
																	{ev.margin >
																		0 && (
																		<span className="text-emerald-500 font-bold">
																			Margin:
																			+₹
																			{ev.margin.toLocaleString()}
																		</span>
																	)}
																</div>
																{ev.notes && (
																	<p className="text-[10px] text-zinc-500 italic leading-relaxed border-t border-zinc-100 dark:border-zinc-800/40 pt-1 mt-1">
																		&quot;
																		{
																			ev.notes
																		}
																		&quot;
																	</p>
																)}
															</div>
														</div>
													);
												},
											)}
										</div>
									</div>
								) : (
									<div className="text-center py-8 text-zinc-400 space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
										<p className="text-xs">
											No transaction history found for
											IMEI &quot;{tracedImei}&quot;
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
