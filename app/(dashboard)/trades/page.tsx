"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
	useDashboard,
	TradeTransaction,
	Customer,
} from "@/context/vendor/dashboard-context";

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
		"Mint" | "Excellent" | "Good" | "Fair"
	>("Excellent");
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
		setFormCondition("Excellent");
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
	const handleCreateCustomer = () => {
		if (!newCustName || !newCustPhone) {
			alert("Customer name and phone number are required.");
			return;
		}
		const newCust: Customer = {
			id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
			name: newCustName,
			phone: newCustPhone,
			email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
			status: "Active",
			totalOrders: 0,
			totalSpent: 0,
			joinedDate: new Date().toISOString().split("T")[0],
			address: "Store Walk-in Registration",
			notes: "Quick registered during trade transaction.",
			purchases: [],
		};
		setCustomers((prev) => [newCust, ...prev]);
		setFormCustomerName(newCustName);
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		triggerToast(`Customer ${newCustName} quick-registered.`);
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
										<select
											value={formBrand}
											disabled={autofillDetected}
											onChange={(e) => {
												setFormBrand(e.target.value);
												setFormModel("");
											}}
											required
											className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary disabled:opacity-75 disabled:bg-zinc-100/30"
										>
											<option value="">
												-- Select Brand --
											</option>
											{brands.map((b) => (
												<option key={b} value={b}>
													{b}
												</option>
											))}
										</select>
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
										<select
											value={formModel}
											disabled={
												autofillDetected || !formBrand
											}
											onChange={(e) =>
												setFormModel(e.target.value)
											}
											required
											className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary disabled:opacity-75 disabled:bg-zinc-100/30"
										>
											<option value="">
												-- Select Model --
											</option>
											{models
												.filter(
													(m) =>
														m.brand === formBrand,
												)
												.map((m) => (
													<option
														key={m.name}
														value={m.name}
													>
														{m.name}
													</option>
												))}
										</select>
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
										<select
											value={formStorage}
											disabled={autofillDetected}
											onChange={(e) =>
												setFormStorage(e.target.value)
											}
											required
											className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:ring-2 focus:ring-primary disabled:opacity-75 disabled:bg-zinc-100/30"
										>
											<option value="">
												-- Capacity --
											</option>
											{storages.map((s) => (
												<option key={s} value={s}>
													{s}
												</option>
											))}
										</select>
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
										<select
											value={formRam}
											disabled={autofillDetected}
											onChange={(e) =>
												setFormRam(e.target.value)
											}
											required
											className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:ring-2 focus:ring-primary disabled:opacity-75 disabled:bg-zinc-100/30"
										>
											<option value="">-- Size --</option>
											{rams.map((r) => (
												<option key={r} value={r}>
													{r}
												</option>
											))}
										</select>
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
									<select
										value={formCondition}
										onChange={(e) =>
											setFormCondition(
												e.target.value as any,
											)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									>
										<option value="Mint">Mint</option>
										<option value="Excellent">
											Excellent
										</option>
										<option value="Good">Good</option>
										<option value="Fair">Fair</option>
									</select>
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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Customer */}
								<div className="space-y-1 relative">
									<div className="flex justify-between items-center">
										<label className="text-xs font-semibold text-zinc-400 uppercase">
											Customer *
										</label>
										<button
											type="button"
											onClick={() =>
												setIsAddingCust(!isAddingCust)
											}
											className="text-[10px] text-primary hover:underline font-bold"
										>
											{isAddingCust
												? "Cancel"
												: "+ Quick Add"}
										</button>
									</div>

									{isAddingCust ? (
										<div className="p-3 border border-primary/20 bg-primary/5 rounded-xl space-y-2 animate-scaleUp">
											<input
												type="text"
												value={newCustName}
												onChange={(e) =>
													setNewCustName(
														e.target.value,
													)
												}
												placeholder="Client Full Name"
												className="w-full px-2 py-1 border border-zinc-300 rounded text-xs bg-transparent focus:outline-none"
											/>
											<input
												type="text"
												value={newCustPhone}
												onChange={(e) =>
													setNewCustPhone(
														e.target.value,
													)
												}
												placeholder="Phone Number"
												className="w-full px-2 py-1 border border-zinc-300 rounded text-xs bg-transparent focus:outline-none"
											/>
											<button
												type="button"
												onClick={handleCreateCustomer}
												className="w-full py-1 bg-primary text-white text-xs font-bold rounded hover:bg-primary/95"
											>
												Register Client
											</button>
										</div>
									) : (
										<select
											value={formCustomerName}
											onChange={(e) =>
												setFormCustomerName(
													e.target.value,
												)
											}
											required
											className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary"
										>
											<option value="">
												-- Choose Client --
											</option>
											{customers.map((c) => (
												<option
													key={c.id}
													value={c.name}
												>
													{c.name} ({c.phone})
												</option>
											))}
										</select>
									)}
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
