"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	useDashboard,
	Customer,
	slugify,
} from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { toast as hotToast } from "react-hot-toast";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";

export default function ImeiDetailsPage() {
	const router = useRouter();
	const params = useParams();

	const rawBrand = params.brand as string;
	const rawModel = params.model as string;
	const imei = params.imei as string;

	const brandSlug = decodeURIComponent(rawBrand);
	const modelSlug = decodeURIComponent(rawModel);

	const {
		trades,
		customers,
		devices,
		editDevice,
		handleAddTradeTransaction,
		addCustomer,
		refreshTrades,
		refreshDevices,
		refreshMetrics,
	} = useDashboard();
	const specs = useSpecifications();

	const device = useMemo(() => {
		return devices.find((d) => d.imei === imei);
	}, [devices, imei]);

	// Resolve brand name and model name using stored slugs from allBrands/allModels
	const matchedBrandObj = useMemo(() => {
		return specs.allBrands.find((b) => b.slug === brandSlug);
	}, [specs.allBrands, brandSlug]);

	const matchedModelObj = useMemo(() => {
		if (!matchedBrandObj) return null;
		return specs.allModels.find(
			(m) => m.brand_id === matchedBrandObj.id && m.slug === modelSlug,
		);
	}, [specs.allModels, matchedBrandObj, modelSlug]);

	const brand = matchedBrandObj ? matchedBrandObj.name : brandSlug;
	const model = matchedModelObj ? matchedModelObj.name : modelSlug;

	// Find chronological timeline events for this IMEI
	const timelineEvents = useMemo(() => {
		if (!imei) return [];
		const matching = trades.filter((t) => t.imei === imei);
		// Sort chronologically (oldest first)
		return matching.sort((a, b) => {
			const timeA = new Date(a.date).getTime();
			const timeB = new Date(b.date).getTime();
			if (timeA !== timeB) {
				return timeA - timeB;
			}
			return Number(a.id) - Number(b.id);
		});
	}, [trades, imei]);

	// Compute profit and specs for visual timeline
	const firstEvent = timelineEvents[0];
	const deviceSpecsStr = useMemo(() => {
		if (!firstEvent) return "";
		return `${firstEvent.deviceBrand} ${firstEvent.deviceModel} (${firstEvent.storage || "128GB"}/${firstEvent.ram || "6GB"}, ${firstEvent.color || "Space Gray"})`;
	}, [firstEvent]);

	// Level 3 Financial Calculations (profit margin)
	const timelineWithCalculations = useMemo(() => {
		let cumulativeProfit = 0;
		const items = timelineEvents.map((event, idx) => {
			let margin = 0;
			if (event.type === "Sale") {
				// Find preceding purchase transaction of the same IMEI
				const precedingPurchases = timelineEvents
					.slice(0, idx)
					.filter((t) => t.type === "Purchase");
				if (precedingPurchases.length > 0) {
					const lastPurchase =
						precedingPurchases[precedingPurchases.length - 1];
					margin = event.amount - lastPurchase.amount;
					cumulativeProfit += margin;
				}
			}
			return { ...event, margin };
		});
		return { items, cumulativeProfit };
	}, [timelineEvents]);

	// Helper to find customer profile details
	const findCustomerProfile = (name: string): Customer | undefined => {
		return customers.find(
			(c) => c.name.toLowerCase() === name.toLowerCase(),
		);
	};

	// Modal visibility
	const [isSellOpen, setIsSellOpen] = useState(false);
	const [isBuybackOpen, setIsBuybackOpen] = useState(false);

	// Customer quick-add states
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});

	// Form values
	const [sellCustomer, setSellCustomer] = useState("");
	const [sellPrice, setSellPrice] = useState("");
	const [sellDate, setSellDate] = useState(new Date().toISOString().split("T")[0]);
	const [sellNotes, setSellNotes] = useState("");

	const [buybackCustomer, setBuybackCustomer] = useState("");
	const [buybackPrice, setBuybackPrice] = useState("");
	const [buybackDate, setBuybackDate] = useState(new Date().toISOString().split("T")[0]);
	const [buybackCondition, setBuybackCondition] = useState<"Mint" | "Excellent" | "Good" | "Fair">("Excellent");
	const [buybackBattery, setBuybackBattery] = useState("90");
	const [buybackNotes, setBuybackNotes] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);

	// Helper status resolution
	const currentStatus = useMemo(() => {
		if (device) return device.status;
		const lastEvent = timelineEvents[timelineEvents.length - 1];
		return lastEvent?.type === "Sale" ? "Sold" : "Active";
	}, [device, timelineEvents]);

	const handleOpenSell = () => {
		if (!device) {
			hotToast.error("Device details not loaded yet.");
			return;
		}
		setSellPrice(device.price.toString());
		setSellCustomer(customers[0]?.name || "");
		setSellNotes("");
		setSellDate(new Date().toISOString().split("T")[0]);
		setIsAddingCust(false);
		setIsSellOpen(true);
	};

	const handleOpenBuyback = () => {
		if (!device) {
			hotToast.error("Device details not loaded yet.");
			return;
		}
		setBuybackPrice(
			device.purchasePrice
				? Math.round(device.purchasePrice * 0.9).toString()
				: "",
		);
		const lastSale = [...timelineEvents].reverse().find((t) => t.type === "Sale");
		setBuybackCustomer(lastSale ? lastSale.customerName : (customers[0]?.name || ""));
		setBuybackCondition(device.condition);
		setBuybackBattery(device.batteryHealth ? device.batteryHealth.toString() : "90");
		setBuybackNotes(`Re-acquired device from customer.`);
		setIsAddingCust(false);
		setIsBuybackOpen(true);
	};

	const handleCreateCustomer = async () => {
		if (!newCustName.trim()) {
			setCustErrors({ name: "Full Name is required." });
			return;
		}
		if (!newCustPhone.trim()) {
			setCustErrors({ phone: "Phone is required." });
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
				notes: "Quick registered during transaction from device history.",
			});
			if (res.success) {
				if (isSellOpen) {
					setSellCustomer(newCustName);
				} else if (isBuybackOpen) {
					setBuybackCustomer(newCustName);
				}
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setCustErrors({});
				hotToast.success(`Customer ${newCustName} registered.`);
			} else {
				hotToast.error(res.message || "Failed to register customer.");
			}
		} catch (err) {
			hotToast.error("Failed to add customer.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSellSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!device) return;
		if (!sellCustomer) {
			hotToast.error("Please select a customer.");
			return;
		}
		if (!sellPrice) {
			hotToast.error("Please specify sell price.");
			return;
		}
		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(sellPrice);
			const result = await editDevice(device.id, {
				status: "Sold",
				price: priceNum,
				description: sellNotes || `Sold to ${sellCustomer}.`
			});
			if (result.success) {
				await handleAddTradeTransaction({
					imei: device.imei || "N/A",
					deviceBrand: device.brand,
					deviceModel: device.model,
					type: "Sale",
					customerName: sellCustomer,
					amount: priceNum,
					date: sellDate,
					notes: sellNotes || `Sold from inventory catalog.`,
					storage: device.storage,
					ram: device.ram,
					color: device.color,
					condition: device.condition,
					batteryHealth: device.batteryHealth,
				});
				setIsSellOpen(false);
				hotToast.success("Device sale recorded successfully.");
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();
			} else {
				hotToast.error(result.message || "Failed to record sale.");
			}
		} catch (err) {
			hotToast.error("Error submitting transaction.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBuybackSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!device) return;
		if (!buybackCustomer) {
			hotToast.error("Please select a customer.");
			return;
		}
		if (!buybackPrice) {
			hotToast.error("Please specify buyback price.");
			return;
		}
		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(buybackPrice);
			const result = await editDevice(device.id, {
				status: "Active",
				purchase_price: priceNum,
				price: Math.round(priceNum * 1.2),
				condition: buybackCondition,
				battery_health: parseInt(buybackBattery) || 90,
				description: buybackNotes || `Re-acquired from ${buybackCustomer}.`
			});
			if (result.success) {
				await handleAddTradeTransaction({
					imei: device.imei || "N/A",
					deviceBrand: device.brand,
					deviceModel: device.model,
					type: "Purchase",
					customerName: buybackCustomer,
					amount: priceNum,
					date: buybackDate,
					notes: buybackNotes || `Acquired via buyback.`,
					storage: device.storage,
					ram: device.ram,
					color: device.color,
					condition: buybackCondition,
					batteryHealth: parseInt(buybackBattery) || 90,
				});
				setIsBuybackOpen(false);
				hotToast.success("Device buyback recorded successfully.");
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();
			} else {
				hotToast.error(result.message || "Failed to record buyback.");
			}
		} catch (err) {
			hotToast.error("Error submitting transaction.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* Back Button */}
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						router.push(
							`/mobiles/${matchedBrandObj?.slug || brandSlug}/${matchedModelObj?.slug || modelSlug}`,
						)
					}
					className="flex items-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer"
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
					Back to Configurations
				</Button>

				{device && (
					currentStatus === "Sold" ? (
						<Button
							variant="gradient"
							size="sm"
							onClick={handleOpenBuyback}
							className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold cursor-pointer flex items-center gap-1.5 rounded-xl text-xs py-2 px-4 shadow-sm"
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
									d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
								/>
							</svg>
							Record Buyback
						</Button>
					) : (
						<Button
							variant="gradient"
							size="sm"
							onClick={handleOpenSell}
							className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold cursor-pointer flex items-center gap-1.5 rounded-xl text-xs py-2 px-4 shadow-sm"
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
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Record Device Sale
						</Button>
					)
				)}
			</div>

			{/* LEDGER OVERVIEW ACCENT CARD */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 p-6 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between">
					<div className="absolute top-0 left-0 w-1 h-full bg-primary" />
					<div className="space-y-4">
						<div>
							<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
								Traced Device Specs
							</span>
							<h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight mt-1">
								{deviceSpecsStr || `${brand} ${model}`}
							</h2>
						</div>

						<div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
							<div>
								<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
									IMEI
								</span>
								<span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-200">
									{imei}
								</span>
							</div>
							<div>
								<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
									Total Cycles
								</span>
								<span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
									{Math.ceil(timelineEvents.length / 2)}{" "}
									(In/Out)
								</span>
							</div>
							<div>
								<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
									Current Status
								</span>
								<span
									className={`text-xs font-bold ${
										currentStatus === "Sold"
											? "text-zinc-550"
											: "text-emerald-500"
									}`}
								>
									{currentStatus === "Sold"
										? "Sold Outflow"
										: "In Catalog"}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="p-6 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between">
					<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
					<div>
						<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
							Net Trade Margin
						</span>
						<div className="flex items-baseline gap-2 mt-2">
							<span
								className={`text-3xl font-black tracking-tight ${
									timelineWithCalculations.cumulativeProfit >=
									0
										? "text-emerald-500"
										: "text-red-500"
								}`}
								suppressHydrationWarning
							>
								₹
								{timelineWithCalculations.cumulativeProfit.toLocaleString()}
							</span>
						</div>
						<p className="text-[11px] text-zinc-400 mt-2 font-medium">
							Cumulative returns generated by buybacks and resell
							loops of this specific unit.
						</p>
					</div>
				</div>
			</div>

			{/* TIMELINE SECTION AND CUSTOMER DETAIL SHEETS */}
			<div className="space-y-8">
				<h3 className="text-base font-extrabold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-2">
					Chronological Audit Trail ({timelineEvents.length} Events)
				</h3>

				{timelineEvents.length > 0 ? (
					<div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-12 ml-2">
						{[...timelineWithCalculations.items].reverse().map((event, index) => {
							const isPurchase = event.type === "Purchase";
							const clientProfile = findCustomerProfile(
								event.customerName,
							);

							return (
								<div key={event.id} className="relative">
									{/* Timeline Dot */}
									<span
										className={`absolute -left-[35px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white dark:bg-zinc-900 shadow-sm ${
											isPurchase
												? "border-cyan-500 text-cyan-500"
												: "border-emerald-500 text-emerald-500"
										}`}
									>
										<span
											className={`h-2 w-2 rounded-full ${isPurchase ? "bg-cyan-500" : "bg-emerald-500"}`}
										/>
									</span>

									{/* Timeline Event Card */}
									<div className="space-y-4">
										{/* Event Header info */}
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-3">
												<span className="text-xs font-mono font-bold text-zinc-400">
													{event.date}
												</span>
												<span
													className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
														isPurchase
															? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
															: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													}`}
												>
													{isPurchase
														? "📥 Buyback / Purchase"
														: "📤 Sold Outflow"}
												</span>
											</div>
											<div className="flex items-center gap-3 text-xs text-zinc-400 font-mono font-bold">
												<span>Ref: {event.id}</span>
												<span className="text-zinc-300 dark:text-zinc-800 font-normal">|</span>
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => streamInvoice(event.id)}
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
														onClick={() => downloadInvoice(event.id, `${event.deviceBrand} ${event.deviceModel}`)}
														title="Download Invoice"
														className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
															<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
														</svg>
													</button>
												</div>
											</div>
										</div>

										{/* Transaction Card details */}
										<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
											{/* Financials & specs */}
											<div className="lg:col-span-1 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between gap-4">
												<div>
													<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
														Transaction Price
													</span>
													<span
														className="text-xl font-black text-zinc-950 dark:text-white"
														suppressHydrationWarning
													>
														₹
														{event.amount.toLocaleString()}
													</span>
												</div>

												{/* Additional metadata specs during this state */}
												<div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
													{event.condition && (
														<div className="flex justify-between">
															<span>
																Logged
																Condition:
															</span>
															<span className="font-semibold text-zinc-700 dark:text-zinc-300">
																{
																	event.condition
																}
															</span>
														</div>
													)}
													{event.batteryHealth && (
														<div className="flex justify-between">
															<span>
																Logged Battery:
															</span>
															<span className="font-semibold text-zinc-700 dark:text-zinc-300">
																{
																	event.batteryHealth
																}
																%
															</span>
														</div>
													)}
													{event.margin > 0 && (
														<div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800/50">
															<span className="text-emerald-500 font-bold">
																Calculated
																profit:
															</span>
															<span
																className="font-extrabold text-emerald-500"
																suppressHydrationWarning
															>
																+₹
																{event.margin.toLocaleString()}
															</span>
														</div>
													)}
												</div>

												{event.notes && (
													<div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-850/50 text-[11px] text-zinc-550 dark:text-zinc-400 italic">
														"{event.notes}"
													</div>
												)}
											</div>

											{/* Customer Profile Details Card */}
											<div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 shadow-sm flex flex-col justify-between">
												<div className="space-y-4">
													<div className="flex items-center gap-3">
														{/* Initials Avatar */}
														<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border border-primary/20 flex items-center justify-center font-bold text-primary dark:text-secondary text-sm">
															{event.customerName
																.split(" ")
																.map(
																	(n) => n[0],
																)
																.join("")
																.slice(0, 2)}
														</div>
														<div>
															<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																{isPurchase
																	? "Acquired From"
																	: "Transferred To"}
															</span>
															<h4 className="font-black text-sm text-zinc-900 dark:text-white leading-tight">
																{
																	event.customerName
																}
															</h4>
														</div>
													</div>

													{clientProfile ? (
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
															<div className="space-y-2">
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Phone
																	</span>
																	<a
																		href={`tel:${clientProfile.phone}`}
																		className="font-semibold text-primary dark:text-secondary hover:underline"
																	>
																		{
																			clientProfile.phone
																		}
																	</a>
																</div>
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Email
																	</span>
																	<a
																		href={`mailto:${clientProfile.email}`}
																		className="font-semibold text-zinc-650 dark:text-zinc-300 hover:text-primary transition-colors"
																	>
																		{
																			clientProfile.email
																		}
																	</a>
																</div>
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Billing
																		Address
																	</span>
																	<span className="text-zinc-600 dark:text-zinc-400 leading-snug">
																		{clientProfile.address ||
																			"N/A"}
																	</span>
																</div>
															</div>

															<div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/80 pt-2 md:pt-0 md:pl-4">
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Account
																		History
																	</span>
																	<span className="font-semibold text-zinc-700 dark:text-zinc-300">
																		Joined{" "}
																		{
																			clientProfile.joinedDate
																		}{" "}
																		&bull;{" "}
																		{
																			clientProfile.totalOrders
																		}{" "}
																		total
																		purchases
																	</span>
																</div>
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Client
																		Profile
																		Notes
																	</span>
																	<p className="text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
																		{clientProfile.notes ||
																			"No extra profile notes logged."}
																	</p>
																</div>
															</div>
														</div>
													) : (
														<div className="text-xs text-zinc-400 italic py-4">
															No matches found for
															customer profile in
															store database.
															Quick transaction
															registration
															occurred.
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="text-center py-12 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
						<h4 className="font-bold text-zinc-900 dark:text-zinc-300">
							No Transaction Ledger Found
						</h4>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							This device has not been logged inside any recorded
							buyback or sales outflows yet.
						</p>
					</div>
				)}
			</div>

			{/* SELL MODAL */}
			<Modal
				isOpen={isSellOpen}
				onClose={() => !isSubmitting && setIsSellOpen(false)}
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
				{device && (
					<form onSubmit={handleSellSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner text-left">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{device.brand} {device.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{device.storage} / {device.ram} RAM &bull; {device.color} &bull; {device.condition} Condition
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
										{device.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{device.purchasePrice ? `₹${device.purchasePrice.toLocaleString()}` : "-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Listed Price:
									</span>
									<span className="font-extrabold text-primary">
										₹{device.price.toLocaleString()}
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
								onClick={() => setIsSellOpen(false)}
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
				isOpen={isBuybackOpen}
				onClose={() => !isSubmitting && setIsBuybackOpen(false)}
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
				{device && (
					<form onSubmit={handleBuybackSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner text-left">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{device.brand} {device.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{device.storage} / {device.ram} RAM &bull; {device.color}
									</p>
								</div>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-655 dark:text-zinc-400 uppercase tracking-wide">
									Currently Sold
								</span>
							</div>
							<div className="grid grid-cols-3 gap-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2.5 mt-1 text-[11px]">
								<div>
									<span className="text-zinc-400 block">
										IMEI:
									</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
										{device.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										{device.purchasePrice ? `₹${device.purchasePrice.toLocaleString()}` : "-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Sell Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										₹{device.price.toLocaleString()}
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

							{/* Condition & Battery Health */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Current Condition *
									</label>
									<Select
										value={buybackCondition}
										disabled={isSubmitting}
										onChange={(e) =>
											setBuybackCondition(e.target.value as any)
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
										Battery Health (%)
									</label>
									<input
										type="number"
										min={50}
										max={100}
										disabled={isSubmitting}
										value={buybackBattery}
										onChange={(e) =>
											setBuybackBattery(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none text-zinc-900 dark:text-white disabled:opacity-50"
									/>
								</div>
							</div>

							{/* Price & Date */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Price (₹) *
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

							{/* Notes */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Transaction Notes
								</label>
								<textarea
									disabled={isSubmitting}
									value={buybackNotes}
									onChange={(e) =>
										setBuybackNotes(e.target.value)
									}
									placeholder="e.g. Device trade-in and buyback recorded."
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
								onClick={() => setIsBuybackOpen(false)}
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
		</div>
	);
}
