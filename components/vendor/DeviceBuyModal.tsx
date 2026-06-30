"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { buybackValidationSchema } from "@/utils/validation";
import { useDashboard, Mobile } from "@/context/vendor/dashboard-context";
import { checkBlacklistAction } from "@/actions/blacklist";
import { toast } from "react-hot-toast";
import * as yup from "yup";

interface DeviceBuyModalProps {
	isOpen: boolean;
	onClose: () => void;
	device: Mobile | null;
	onSuccess?: () => void;
}

export function DeviceBuyModal({
	isOpen,
	onClose,
	device,
	onSuccess,
}: DeviceBuyModalProps) {
	const {
		editDevice,
		handleAddTradeTransaction,
		customers,
		trades,
		refreshDevices,
		refreshMetrics,
		refreshTrades,
	} = useDashboard();

	const [buybackPrice, setBuybackPrice] = useState("");
	const [buybackCustomer, setBuybackCustomer] = useState("");
	const [buybackDate, setBuybackDate] = useState("");
	const [buybackCondition, setBuybackCondition] = useState<"NEW" | "OLD">("OLD");
	const [buybackBattery, setBuybackBattery] = useState("90");
	const [buybackNotes, setBuybackNotes] = useState("");
	const [repairingCost, setRepairingCost] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [buybackErrors, setBuybackErrors] = useState<Record<string, string>>({});
	const [buybackFormError, setBuybackFormError] = useState("");

	// Blacklist warning state
	const [blacklistWarning, setBlacklistWarning] = useState<{
		isBlacklisted: boolean;
		imei: string;
		reason?: string;
		blacklistedBy?: string;
		createdAt?: string;
	} | null>(null);

	// Find past buyer of this IMEI to prefill customer name if possible
	useEffect(() => {
		if (isOpen && device) {
			let originalBuyer = "";
			if (device.imei) {
				const saleTrade = trades
					.filter(
						(t) =>
							t.deviceBrand.toLowerCase() === device.brand.toLowerCase() &&
							t.deviceModel.toLowerCase() === device.model.toLowerCase() &&
							t.type === "Sale",
					)
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
				if (saleTrade) {
					originalBuyer = saleTrade.customerName;
				}
			}

			setBuybackPrice("");
			setBuybackCustomer(originalBuyer || customers[0]?.name || "");
			setBuybackDate(new Date().toISOString().split("T")[0]);
			setBuybackCondition(device.condition || "OLD");
			setBuybackBattery(device.batteryHealth ? device.batteryHealth.toString() : "90");
			setBuybackNotes(`Re-acquired device from customer.`);
			setRepairingCost(device.repairingCost ? device.repairingCost.toString() : "");

			setBuybackErrors({});
			setBuybackFormError("");
			setBlacklistWarning(null);
		}
	}, [isOpen, device, customers, trades]);

	const clearBuybackError = (field: string) => {
		setBuybackErrors((prev) => {
			const n = { ...prev };
			delete n[field];
			return n;
		});
		setBuybackFormError("");
	};

	const buybackProfit = useMemo(() => {
		if (!device) return 0;
		return (device.price || 0) - (parseFloat(buybackPrice) || 0);
	}, [device, buybackPrice]);

	const handleBuybackSubmit = async (e: React.FormEvent | null, forceBypass = false) => {
		if (e) e.preventDefault();
		if (!device) return;

		setBuybackErrors({});
		setBuybackFormError("");

		// Check blacklist
		if (device.imei && !forceBypass) {
			setIsSubmitting(true);
			try {
				const blacklistRes = await checkBlacklistAction(device.imei);
				if (blacklistRes.success && blacklistRes.data?.isBlacklisted) {
					setBlacklistWarning({
						isBlacklisted: true,
						imei: device.imei,
						reason: blacklistRes.data.reason,
						blacklistedBy: blacklistRes.data.blacklistedBy,
						createdAt: blacklistRes.data.createdAt,
					});
					setIsSubmitting(false);
					return;
				}
			} catch (err) {
				console.error("Blacklist check failed:", err);
			}
			setIsSubmitting(false);
		}

		try {
			await buybackValidationSchema.validate({
				buybackPrice: buybackPrice === "" ? undefined : parseFloat(buybackPrice),
				buybackCustomer,
				buybackDate,
				buybackCondition,
				buybackBattery: buybackBattery === "" ? undefined : parseInt(buybackBattery),
				buybackNotes,
			}, { abortEarly: false });
		} catch (err: any) {
			if (err instanceof yup.ValidationError) {
				const errors: Record<string, string> = {};
				err.inner.forEach((validationError: any) => {
					if (validationError.path && !errors[validationError.path]) {
						errors[validationError.path] = validationError.message;
					}
				});
				setBuybackErrors(errors);
			} else {
				setBuybackFormError("Validation failed.");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const priceNum = parseFloat(buybackPrice);
			const repairCostNum = parseFloat(repairingCost) || 0;
			const result = await editDevice(device.id, {
				status: "Available",
				purchase_price: priceNum,
				repairing_cost: repairCostNum,
				price: Math.round(priceNum * 1.2), // Auto markup price by 20%
				condition: buybackCondition,
				battery_health: parseInt(buybackBattery) || 90,
				description: buybackNotes || `Re-acquired from ${buybackCustomer}.`
			});

			if (result.success) {
				const [partnerType, partnerNameOrId] = buybackCustomer.includes(":")
					? (buybackCustomer.split(":") as ["Customer" | "Vendor", string])
					: ["Customer" as const, buybackCustomer];

				await handleAddTradeTransaction({
					imei: device.imei || "N/A",
					deviceBrand: device.brand,
					deviceModel: device.model,
					type: "Purchase",
					customerName: partnerNameOrId,
					partnerType: partnerType,
					amount: priceNum,
					date: buybackDate,
					notes: buybackNotes || '',
					storage: device.storage,
					ram: device.ram,
					color: device.color,
					condition: buybackCondition,
					batteryHealth: parseInt(buybackBattery) || 90,
				}, true);

				onClose();
				toast.success(`Device buyback recorded successfully! Re-acquired from ${partnerNameOrId} for ₹${priceNum.toLocaleString()}.`);
				
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();

				if (onSuccess) onSuccess();
			} else {
				if (result.errors) {
					setBuybackErrors(result.errors);
				} else {
					setBuybackFormError(result.message || "Failed to record buyback.");
				}
			}
		} catch (err) {
			setBuybackFormError("Error submitting transaction.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!device) return null;

	return (
		<>
			{/* MAIN BUYBACK MODAL */}
			<Modal
				isOpen={isOpen && !blacklistWarning}
				onClose={() => !isSubmitting && onClose()}
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
								Device Buy
							</h3>
							<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
								Re-acquire a previously sold unit back into active inventory.
							</p>
						</div>
					</div>
				}
				size="lg"
			>
				<form onSubmit={(e) => handleBuybackSubmit(e)} className="space-y-5" noValidate>
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
									Last Sell Price:
								</span>
								<span className="font-semibold text-zinc-700 dark:text-zinc-300">
									₹{device.price.toLocaleString()}
								</span>
							</div>
							<div>
								<span className="text-zinc-400 block">
									Profit:
								</span>
								<span className={`font-extrabold ${buybackProfit >= 0 ? "text-emerald-500" : "text-red-500"}`} suppressHydrationWarning>
									{buybackProfit >= 0 ? "+" : "-"}₹{Math.abs(buybackProfit).toLocaleString()}
								</span>
							</div>
						</div>
					</div>

					{/* Form inputs */}
					<div className="space-y-4 text-left">
						<PartnerSelector
							value={buybackCustomer}
							onChange={setBuybackCustomer}
							label="Customer (Selling back to store) *"
							placeholder="-- Choose Partner --"
							required={true}
							valueType="name"
							error={buybackErrors.buybackCustomer}
						/>

						{/* Condition & Battery Health */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Condition *
								</label>
								<Select
									value={buybackCondition}
									onChange={(e) => setBuybackCondition(e.target.value as "NEW" | "OLD")}
									options={[
										{ value: "NEW", label: "NEW" },
										{ value: "OLD", label: "OLD" },
									]}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Battery Health (%) *
								</label>
								<input
									type="number"
									min={50}
									max={100}
									disabled={isSubmitting}
									value={buybackBattery}
									onChange={(e) => {
										setBuybackBattery(e.target.value);
										clearBuybackError("buybackBattery");
									}}
									className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none text-zinc-900 dark:text-white disabled:opacity-50
										${buybackErrors.buybackBattery ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800"}`}
								/>
								{buybackErrors.buybackBattery && (
									<p className="text-xs text-red-500 font-medium mt-1">
										{buybackErrors.buybackBattery}
									</p>
								)}
							</div>
						</div>

						{/* Price, Date & Repairing Cost */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Buy Price (₹) *
								</label>
								<input
									type="number"
									required
									disabled={isSubmitting}
									value={buybackPrice}
									onChange={(e) => {
										setBuybackPrice(e.target.value);
										clearBuybackError("buybackPrice");
									}}
									className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white disabled:opacity-50
										${buybackErrors.buybackPrice ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800"}`}
								/>
								{buybackErrors.buybackPrice && (
									<p className="text-xs text-red-500 font-medium mt-1">
										{buybackErrors.buybackPrice}
									</p>
								)}
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Repairing Cost (₹)
								</label>
								<input
									type="number"
									disabled={isSubmitting}
									value={repairingCost}
									onChange={(e) => {
										setRepairingCost(e.target.value);
										clearBuybackError("repairingCost");
									}}
									placeholder="0"
									className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none text-zinc-900 dark:text-white disabled:opacity-50
										${buybackErrors.repairingCost ? "border-red-500 focus:ring-red-500/10" : "border-zinc-200 dark:border-zinc-800"}`}
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Buy Date *
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
								placeholder="e.g. Screen and device inspected by store representative."
								rows={2}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
							/>
						</div>
					</div>

					{buybackFormError && (
						<p className="text-xs text-red-500 font-semibold text-center mt-2">
							{buybackFormError}
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
								"Confirm Buy"
							)}
						</Button>
					</div>
				</form>
			</Modal>

			{/* BLACKLIST WARNING MODAL */}
			{blacklistWarning && (
				<Modal
					isOpen={!!blacklistWarning}
					onClose={() => setBlacklistWarning(null)}
					title="⚠️ WARNING: Blacklisted Mobile Device"
					size="md"
				>
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
									handleBuybackSubmit(null, true);
								}}
								className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
							>
								Acknowledge & Proceed
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
}
