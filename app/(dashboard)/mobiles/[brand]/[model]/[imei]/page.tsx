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
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { toast as hotToast } from "react-hot-toast";
import * as yup from "yup";
import { streamInvoice, downloadInvoice } from "@/utils/invoice";
import { sellValidationSchema, buybackValidationSchema } from "@/utils/validation";
import { checkBlacklistAction } from "@/actions/blacklist";
import { DeviceSaleModal } from "@/components/vendor/DeviceSaleModal";
import { DeviceBuyModal } from "@/components/vendor/DeviceBuyModal";

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
		vendor,
	} = useDashboard();
	const specs = useSpecifications();

	const device = useMemo(() => {
		return devices.find((d) => d.imei === imei) ?? null;
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

	const gstEnabled = vendor?.gst_enabled !== false;
	const gstRate = vendor?.gst_rate ?? 18;
	const gstFactor = 1 + gstRate / 100;

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

	const lastSale = useMemo(() => {
		const sales = timelineEvents.filter((t) => t.type === "Sale");
		return sales.length > 0 ? sales[sales.length - 1] : null;
	}, [timelineEvents]);

	// Compute profit and specs for visual timeline
	const firstEvent = timelineEvents[0];
	const deviceSpecsStr = useMemo(() => {
		if (!firstEvent) return "";
		return `${firstEvent.deviceBrand} ${firstEvent.deviceModel} (${firstEvent.storage || "128GB"}/${firstEvent.ram || "6GB"}, ${firstEvent.color || "Space Gray"})`;
	}, [firstEvent]);

	// Level 3 Financial Calculations (profit margin)
	const timelineWithCalculations = useMemo(() => {
		let cumulativeProfit = 0;
		const items = timelineEvents.map((event) => {
			const margin = (event as any).margin !== undefined ? (event as any).margin : 0;
			const gstAmount = (event as any).gstAmount !== undefined ? (event as any).gstAmount : 0;
			const netMargin = margin - gstAmount;
			cumulativeProfit += netMargin;
			return { ...event, margin };
		});
		return { items, cumulativeProfit };
	}, [timelineEvents]);

	// Helper status resolution
	const currentStatus = useMemo(() => {
		if (device) return device.status;
		const lastEvent = timelineEvents[timelineEvents.length - 1];
		return lastEvent?.type === "Sale" ? "Sold" : "Available";
	}, [device, timelineEvents]);

	// Helper to find customer profile details
	const findCustomerProfile = (name: string): Customer | undefined => {
		return customers.find(
			(c) => c.name.toLowerCase() === name.toLowerCase(),
		);
	};

	// Modal visibility
	const [isSellOpen, setIsSellOpen] = useState(false);
	const [isBuybackOpen, setIsBuybackOpen] = useState(false);

	// Form values
	const handleOpenSell = () => {
		if (!device) {
			hotToast.error("Device details not loaded yet.");
			return;
		}
		setIsSellOpen(true);
	};

	const handleOpenBuyback = () => {
		if (!device) {
			hotToast.error("Device details not loaded yet.");
			return;
		}
		setIsBuybackOpen(true);
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
							Record Buy
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
									d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Device Sale
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
										? "Sold"
										: "Available"}
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
														? "📥 Buy"
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
														<>
															<div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800/50">
																<span className="text-emerald-500 font-bold">
																	Calculated profit:
																</span>
																<span
																	className="font-extrabold text-emerald-500"
																	suppressHydrationWarning
																>
																	+₹
																	{event.margin.toLocaleString()}
																</span>
															</div>
															{gstEnabled && (event as any).gstAmount > 0 && (
																<div className="text-[10px] text-zinc-400 dark:text-zinc-505 flex flex-col gap-0.5 mt-1 border-t border-zinc-100 dark:border-zinc-850/50 pt-1.5 pl-1.5 space-y-0.5 text-left">
																	<div className="flex justify-between">
																		<span>GST on Margin ({(event as any).gstRate}%):</span>
																		<span className="font-semibold text-zinc-650 dark:text-zinc-350">₹{(event as any).gstAmount.toLocaleString()}</span>
																	</div>
																	<div className="flex justify-between text-[9px] pl-2 text-zinc-400">
																		<span>CGST ({(event as any).gstRate / 2}%):</span>
																		<span>₹{(event as any).cgst.toLocaleString()}</span>
																	</div>
																	<div className="flex justify-between text-[9px] pl-2 text-zinc-400">
																		<span>SGST ({(event as any).gstRate / 2}%):</span>
																		<span>₹{(event as any).sgst.toLocaleString()}</span>
																	</div>
																	<div className="flex justify-between text-[9px] pl-2 text-zinc-400">
																		<span>Taxable Value:</span>
																		<span>₹{(event as any).taxableValue.toLocaleString()}</span>
																	</div>
																	<div className="flex justify-between text-emerald-500 font-bold border-t border-dashed border-zinc-150 dark:border-zinc-800/60 pt-1.5 mt-1">
																		<span>Net Profit (after tax):</span>
																		<span suppressHydrationWarning>+₹{(event.margin - (event as any).gstAmount).toLocaleString()}</span>
																	</div>
																</div>
															)}
														</>
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

													{event.partnerType === "Vendor" ? (
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
															<div className="space-y-2">
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Wholesale Partner
																	</span>
																	<span className="font-semibold text-zinc-700 dark:text-zinc-300">
																		🏢 B2B Trade Dealer
																	</span>
																</div>
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Entity Status
																	</span>
																	<span className="font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] inline-block mt-0.5 uppercase tracking-wider">
																		Verified Merchant
																	</span>
																</div>
															</div>
															<div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800/80 pt-2 md:pt-0 md:pl-4">
																<div>
																	<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
																		Trade Channel
																	</span>
																	<p className="text-zinc-550 dark:text-zinc-400 italic leading-relaxed">
																		This transaction was compiled under the B2B Dealer Trade network protocol.
																	</p>
																</div>
															</div>
														</div>
													) : clientProfile ? (
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
																	<p className="text-zinc-550 dark:text-zinc-400 italic leading-relaxed">
																		{clientProfile.notes ||
																			"No extra profile notes logged."}
																	</p>
																</div>
															</div>
														</div>
													) : (
														<div className="text-xs text-zinc-450 italic py-4">
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

			<DeviceSaleModal
				isOpen={isSellOpen}
				onClose={() => setIsSellOpen(false)}
				device={device}
			/>

			<DeviceBuyModal
				isOpen={isBuybackOpen}
				onClose={() => setIsBuybackOpen(false)}
				device={device}
			/>

		</div>
	);
}
