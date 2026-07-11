"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { sellValidationSchema } from "@/utils/validation";
import { useDashboard, Mobile } from "@/context/vendor/dashboard-context";
import { createCourierOrderAction } from "@/actions/courier";
import { streamInvoice } from "@/utils/invoice";
import { toast } from "react-hot-toast";
import * as yup from "yup";

interface DeviceSaleModalProps {
	isOpen: boolean;
	onClose: () => void;
	device: Mobile | null;
	onSuccess?: () => void;
}

export function DeviceSaleModal({
	isOpen,
	onClose,
	device,
	onSuccess,
}: DeviceSaleModalProps) {
	const {
		editDevice,
		handleAddTradeTransaction,
		customers,
		fetchVendors,
		vendor,
		refreshDevices,
		refreshMetrics,
		refreshTrades,
	} = useDashboard();

	const [sellPrice, setSellPrice] = useState("");
	const [sellCustomer, setSellCustomer] = useState("");
	const [sellDate, setSellDate] = useState("");
	const [sellNotes, setSellNotes] = useState("");
	const [isCourierSale, setIsCourierSale] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [sellErrors, setSellErrors] = useState<Record<string, string>>({});
	const [sellFormError, setSellFormError] = useState("");

	const hasInitializedRef = useRef(false);

	// Initialize form when device changes or modal opens
	useEffect(() => {
		if (isOpen) {
			if (!hasInitializedRef.current && device) {
				setSellPrice("");
				setSellCustomer(customers[0]?.name ? `Customer:${customers[0].name}` : "");
				setSellDate(new Date().toISOString().split("T")[0]);
				setSellNotes(`Sold from inventory catalog.`);
				setIsCourierSale(false);
				setSellErrors({});
				setSellFormError("");
				hasInitializedRef.current = true;
			}
		} else {
			hasInitializedRef.current = false;
		}
	}, [isOpen, device, customers]);

	const clearSellError = (field: string) => {
		setSellErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});
		setSellFormError("");
	};

	const gstEnabled = false;
	const gstRate = 0;
	const gstFactor = 1;

	// Profit & GST Calculations
	const calculatedProfit = useMemo(() => {
		if (!device) return { rawProfit: 0, gstAmount: 0, cgst: 0, sgst: 0, taxableValue: 0, netProfit: 0 };
		const priceNum = parseFloat(sellPrice) || 0;
		const cost = (device.purchasePrice || 0) + (device.repairingCost || 0);
		const rawProfit = priceNum - cost;
		const gstAmount = 0;
		const cgst = 0;
		const sgst = 0;
		const taxableValue = priceNum;
		const netProfit = rawProfit;
		return { rawProfit, gstAmount, cgst, sgst, taxableValue, netProfit };
	}, [device, sellPrice]);

	const handleSellSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!device) return;

		setSellErrors({});
		setSellFormError("");

		try {
			await sellValidationSchema.validate({
				sellPrice: sellPrice === "" ? undefined : parseFloat(sellPrice),
				sellCustomer,
				sellDate,
				sellNotes,
			}, { abortEarly: false });
		} catch (err: any) {
			if (err instanceof yup.ValidationError) {
				const errors: Record<string, string> = {};
				err.inner.forEach((validationError: any) => {
					if (validationError.path && !errors[validationError.path]) {
						errors[validationError.path] = validationError.message;
					}
				});
				setSellErrors(errors);
			} else {
				setSellFormError("Validation failed.");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(sellPrice);

			// Courier Flow
			if (isCourierSale && sellCustomer.startsWith("Vendor:")) {
				const [_, vendorName] = sellCustomer.split(":");
				const vendorsList = await fetchVendors();
				const targetVendor = vendorsList.find((v: any) => v.name === vendorName);

				if (!targetVendor) {
					setSellFormError("Selected vendor not found in the system.");
					setIsSubmitting(false);
					return;
				}

				const res = await createCourierOrderAction({
					buyer_id: targetVendor.id,
					mobile_id: Number(device.id),
					amount: priceNum,
					notes: sellNotes || `Courier sale initiated to ${vendorName}.`
				});

				if (res.success) {
					onClose();
					setIsCourierSale(false);
					await refreshDevices(undefined, true);
					toast.success(`Courier sale initiated to ${vendorName}. Tracking status pending.`);
					if (onSuccess) onSuccess();
				} else {
					setSellFormError(res.message || "Failed to create courier order.");
				}
				setIsSubmitting(false);
				return;
			}

			// Regular Sale Flow
			const result = await editDevice(device.id, {
				status: "Sold",
				price: priceNum,
				description: sellNotes || `Sold to ${sellCustomer}.`
			});

			if (result.success) {
				const [partnerType, partnerNameOrId] = sellCustomer.includes(":")
					? (sellCustomer.split(":") as ["Customer" | "Vendor", string])
					: ["Customer" as const, sellCustomer];

				const tx = await handleAddTradeTransaction({
					imei: device.imei || "N/A",
					deviceBrand: device.brand,
					deviceModel: device.model,
					type: "Sale",
					customerName: partnerNameOrId,
					partnerType: partnerType,
					amount: priceNum,
					date: sellDate,
					notes: sellNotes || `Sold from inventory catalog.`,
					storage: device.storage,
					ram: device.ram,
					color: device.color,
					condition: device.condition,
					batteryHealth: device.batteryHealth,
				}, true);

				onClose();
				toast.success(`Device sale recorded successfully! Sold to ${partnerNameOrId} for ₹${priceNum.toLocaleString()}.`);
				
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();

				if (tx && tx.id) {
					streamInvoice(tx.id);
				}

				if (onSuccess) onSuccess();
			} else {
				if (result.errors) {
					setSellErrors(result.errors);
				} else {
					setSellFormError(result.message || "Failed to record sale.");
				}
			}
		} catch (err) {
			setSellFormError("An unexpected error occurred while recording sale.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!device) return null;

	const { rawProfit, gstAmount, cgst, sgst, taxableValue, netProfit } = calculatedProfit;

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => !isSubmitting && onClose()}
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
								d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</span>
					<div>
						<h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
							Device Sale
						</h3>
						<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
							Complete outgoing transaction details for this unit.
						</p>
					</div>
				</div>
			}
			size="lg"
		>
			<form onSubmit={handleSellSubmit} className="space-y-5" noValidate>
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
							Available
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
								Purchase Price:
							</span>
							<span className="font-semibold text-zinc-700 dark:text-zinc-300">
								{device.purchasePrice ? `₹${device.purchasePrice.toLocaleString()}` : "-"}
							</span>
						</div>
						{device.repairingCost ? (
							<div>
								<span className="text-zinc-400 block">
									Repairing Cost:
								</span>
								<span className="font-semibold text-amber-600 dark:text-amber-400">
									₹{device.repairingCost.toLocaleString()}
								</span>
							</div>
						) : null}
						<div>
							<span className="text-zinc-400 block">
								Profit:
							</span>
							<span className={`font-extrabold ${netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`} suppressHydrationWarning>
								{netProfit >= 0 ? "+" : "-"}₹{Math.abs(netProfit).toLocaleString()}
							</span>
						</div>
					</div>
				</div>

				{/* Form inputs */}
				<div className="space-y-4 text-left">
					{/* Customer selection */}
					<PartnerSelector
						value={sellCustomer}
						onChange={(val) => {
							setSellCustomer(val);
							clearSellError("sellCustomer");
						}}
						label="Customer / Dealer *"
						placeholder="-- Choose Partner --"
						required={true}
						valueType="name"
						error={sellErrors.sellCustomer}
					/>
					{sellCustomer.startsWith("Vendor:") && (
						<div className="flex items-center gap-2 mt-2">
							<input
								type="checkbox"
								id="isCourierSale"
								checked={isCourierSale}
								onChange={(e) => setIsCourierSale(e.target.checked)}
								className="rounded border-zinc-200 dark:border-zinc-800 text-primary focus:ring-primary h-4 w-4"
							/>
							<label htmlFor="isCourierSale" className="text-xs text-zinc-600 dark:text-zinc-400 font-bold select-none cursor-pointer">
								Ship via Courier (2-3 days delivery)
							</label>
						</div>
					)}

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
								onChange={(e) => {
									setSellPrice(e.target.value);
									clearSellError("sellPrice");
								}}
								className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white disabled:opacity-50
									${sellErrors.sellPrice ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800"}`}
							/>
							{sellErrors.sellPrice && (
								<p className="text-xs text-red-500 font-medium mt-1">
									{sellErrors.sellPrice}
								</p>
							)}
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

					{/* Real-time Profit Margin & GST Scheme Indicator */}
					{sellPrice && (
						<div className="space-y-2 text-left">
							<div
								className={`p-3.5 rounded-xl border text-xs font-bold text-center animate-scaleUp flex justify-between items-center ${
									netProfit > 0
										? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
										: netProfit === 0
										? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
										: "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
								}`}
							>
								<span>
									{netProfit < 0 ? "⚠️ Warning: Selling Below Cost Price" : "Estimated Profit Margin:"}
								</span>
								<span suppressHydrationWarning className="text-sm font-black">
									{netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString()}
								</span>
							</div>
							<div className="p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[11px] text-zinc-550 dark:text-zinc-400 space-y-1 animate-scaleUp">
								<div className="flex justify-between font-semibold">
									<span>Transaction Breakdown:</span>
									<span className="text-zinc-700 dark:text-zinc-300">Cost & Margin</span>
								</div>
								<div className="flex justify-between">
									<span>Purchase Price:</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300" suppressHydrationWarning>
										₹{(device.purchasePrice || 0).toLocaleString()}
									</span>
								</div>
								{device.repairingCost ? (
									<div className="flex justify-between">
										<span>Repairing Cost:</span>
										<span className="font-mono text-zinc-700 dark:text-zinc-300" suppressHydrationWarning>
											₹{device.repairingCost.toLocaleString()}
										</span>
									</div>
								) : null}
								<div className="flex justify-between border-t border-zinc-150 dark:border-zinc-850 pt-1 mt-1 font-semibold">
									<span>Total Cost (Cost Price):</span>
									<span className="font-mono text-zinc-750 dark:text-zinc-250" suppressHydrationWarning>
										₹{((device.purchasePrice || 0) + (device.repairingCost || 0)).toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between text-emerald-500 font-bold border-t border-dashed border-zinc-150 dark:border-zinc-850 pt-1 mt-1">
									<span>Net Profit:</span>
									<span suppressHydrationWarning>
										{netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{sellFormError && (
					<p className="text-xs text-red-500 font-semibold text-center mt-2">
						{sellFormError}
					</p>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={isSubmitting}
						onClick={onClose}
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
		</Modal>
	);
}
