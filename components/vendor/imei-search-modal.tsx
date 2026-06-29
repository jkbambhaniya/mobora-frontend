"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useDashboard, Mobile, slugify } from "@/context/vendor/dashboard-context";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { MobileRegisterForm } from "@/components/vendor/MobileRegisterForm";
import { getMobilesAction } from "@/actions/mobiles";
import { mobileValidationSchema, sellValidationSchema, buybackValidationSchema } from "@/utils/validation";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";
import { streamInvoice } from "@/utils/invoice";

interface ImeiSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	initialImei?: string;
}

export function ImeiSearchModal({ isOpen, onClose, initialImei = "" }: ImeiSearchModalProps) {
	const router = useRouter();
	const {
		addDevice,
		vendor,
		trades,
		editDevice,
		handleAddTradeTransaction,
		refreshDevices,
		refreshMetrics,
		refreshTrades
	} = useDashboard();
	const specs = useSpecifications();
	const markupPercent = vendor?.markup !== undefined ? Number(vendor.markup) : 20;

	// Action mode: 'view' | 'sell' | 'buyback'
	const [activeAction, setActiveAction] = useState<"view" | "sell" | "buyback">("view");

	// Sell Form State
	const [sellCustomer, setSellCustomer] = useState("");
	const [sellPrice, setSellPrice] = useState("");
	const [sellDate, setSellDate] = useState(new Date().toISOString().split("T")[0]);
	const [sellNotes, setSellNotes] = useState("");
	const [sellErrors, setSellErrors] = useState<Record<string, string>>({});
	const [sellFormError, setSellFormError] = useState("");

	// Buyback Form State
	const [buybackCustomer, setBuybackCustomer] = useState("");
	const [buybackPrice, setBuybackPrice] = useState("");
	const [buybackDate, setBuybackDate] = useState(new Date().toISOString().split("T")[0]);
	const [buybackCondition, setBuybackCondition] = useState<"NEW" | "OLD">("NEW");
	const [buybackBattery, setBuybackBattery] = useState("90");
	const [buybackNotes, setBuybackNotes] = useState("");
	const [buybackErrors, setBuybackErrors] = useState<Record<string, string>>({});
	const [buybackFormError, setBuybackFormError] = useState("");

	const [isSubmittingAction, setIsSubmittingAction] = useState(false);

	const [imei, setImei] = useState(initialImei);
	const [isSearching, setIsSearching] = useState(false);
	const [searchAttempted, setSearchAttempted] = useState(false);
	const [foundDevice, setFoundDevice] = useState<Mobile | null>(null);

	const timelineEvents = useMemo(() => {
		if (!foundDevice || !foundDevice.imei) return [];
		const matching = trades.filter((t) => t.imei === foundDevice.imei);
		return matching.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [trades, foundDevice]);

	// Camera Scanner state
	const [isScanning, setIsScanning] = useState(false);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const [permissionError, setPermissionError] = useState<string | null>(null);

	// Buy Form State
	const [formBrand, setFormBrand] = useState("");
	const [formModel, setFormModel] = useState("");
	const [formStorage, setFormStorage] = useState("");
	const [formRam, setFormRam] = useState("");
	const [formColor, setFormColor] = useState("");
	const [formCondition, setFormCondition] = useState<"NEW" | "OLD">("NEW");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formPurchasePrice, setFormPurchasePrice] = useState("");
	const [formRepairingCost, setFormRepairingCost] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formCustomerId, setFormCustomerId] = useState("");

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setImei(initialImei);
			setSearchAttempted(false);
			setFoundDevice(null);
			setIsScanning(false);
			setPermissionError(null);
			resetForm();
			if (initialImei) {
				handleSearch(initialImei);
			}
		}
	}, [isOpen, initialImei]);

	const resetForm = () => {
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("NEW");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormRepairingCost("");
		setFormDescription("");
		setFormCustomerId("");
		setFieldErrors({});
		setFormError("");
	};

	// Play Beep on scanner success
	const playBeep = () => {
		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(800, ctx.currentTime);
			gain.gain.setValueAtTime(0.08, ctx.currentTime);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start();
			setTimeout(() => {
				osc.stop();
				ctx.close();
			}, 130);
		} catch (e) {
			console.warn(e);
		}
	};

	// Camera scanner initialization and teardown
	useEffect(() => {
		let isMounted = true;
		if (isScanning && isOpen) {
			setPermissionError(null);
			const timer = setTimeout(() => {
				if (!isMounted) return;
				try {
					const html5QrCode = new Html5Qrcode("modal-scanner-reader", {
						formatsToSupport: [
							Html5QrcodeSupportedFormats.CODE_128,
							Html5QrcodeSupportedFormats.EAN_13,
							Html5QrcodeSupportedFormats.EAN_8,
							Html5QrcodeSupportedFormats.CODE_39,
							Html5QrcodeSupportedFormats.UPC_A,
							Html5QrcodeSupportedFormats.UPC_E,
							Html5QrcodeSupportedFormats.QR_CODE
						],
						verbose: false
					});
					scannerRef.current = html5QrCode;
					const config = {
						fps: 30,
						qrbox: { width: 280, height: 140 },
						aspectRatio: 1.777778,
						experimentalFeatures: {
							useBarCodeDetectorIfSupported: true,
						},
						videoConstraints: {
							facingMode: "environment",
							width: { min: 640, ideal: 1280 },
							height: { min: 480, ideal: 720 },
						}
					};
					html5QrCode
						.start(
							{ facingMode: "environment" },
							config,
							(decodedText) => {
								playBeep();
								html5QrCode
									.stop()
									.then(() => {
										setImei(decodedText);
										setIsScanning(false);
										handleSearch(decodedText);
									})
									.catch((err) => {
										console.error("Failed to stop scanner", err);
										setImei(decodedText);
										setIsScanning(false);
										handleSearch(decodedText);
									});
							},
							() => {}
						)
						.catch((err) => {
							console.error("Scanner start error", err);
							const errMsg = err?.toString() || "";
							if (
								errMsg.includes("NotAllowedError") ||
								errMsg.includes("Permission denied")
							) {
								setPermissionError(
									"Camera permission was denied. Please allow camera access."
								);
							} else {
								setPermissionError(
									"Could not start the camera scanner."
								);
							}
						});
				} catch (e) {
					console.error("Scanner init error", e);
					setPermissionError("Failed to initialize camera scanner.");
				}
			}, 300);

			return () => {
				isMounted = false;
				clearTimeout(timer);
				if (scannerRef.current) {
					const scanner = scannerRef.current;
					if (scanner.isScanning) {
						scanner
							.stop()
							.catch((err) => console.error("Scanner cleanup stop failed", err));
					}
				}
			};
		}
	}, [isScanning, isOpen]);

	const handleSearch = async (imeiToSearch: string) => {
		if (!imeiToSearch.trim()) {
			toast.error("Please enter a valid IMEI number");
			return;
		}
		setIsSearching(true);
		setSearchAttempted(false);
		setFoundDevice(null);
		resetForm();

		try {
			// Query the backend directly to see if this IMEI exists for the vendor
			const res = await getMobilesAction({ search: imeiToSearch.trim() });
			if (res.success && res.data?.mobiles?.length > 0) {
				const matched = res.data.mobiles.find(
					(d: any) => d.imei?.toLowerCase() === imeiToSearch.trim().toLowerCase()
				);
				if (matched) {
					setFoundDevice(matched);
					toast.success("Device found!");
				}
			}
			setSearchAttempted(true);
		} catch (error) {
			console.error("Error checking IMEI:", error);
			toast.error("Failed to check IMEI");
		} finally {
			setIsSearching(false);
		}
	};

	const handleSellSubmitInline = async (e: React.FormEvent) => {
		e.preventDefault();
		setSellErrors({});
		setSellFormError("");

		if (!foundDevice) return;

		try {
			await sellValidationSchema.validate(
				{
					sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
					sellCustomer,
					sellDate,
					sellNotes,
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
				setSellErrors(errors);
			} else {
				setSellFormError("Validation failed.");
			}
			return;
		}

		setIsSubmittingAction(true);
		try {
			const priceNum = parseFloat(sellPrice);
			const result = await editDevice(foundDevice.id, {
				status: "Sold",
				price: priceNum,
				description: sellNotes || `Sold to ${sellCustomer}.`
			});
			if (result.success) {
				const [partnerType, partnerNameOrId] = sellCustomer.includes(":")
					? (sellCustomer.split(":") as ["Customer" | "Vendor", string])
					: ["Customer" as const, sellCustomer];

				const tx = await handleAddTradeTransaction({
					imei: foundDevice.imei || "N/A",
					deviceBrand: foundDevice.brand,
					deviceModel: foundDevice.model,
					type: "Sale",
					customerName: partnerNameOrId,
					partnerType: partnerType,
					amount: priceNum,
					date: sellDate,
					notes: sellNotes || `Sold from inventory catalog.`,
					storage: foundDevice.storage,
					ram: foundDevice.ram,
					color: foundDevice.color,
					condition: foundDevice.condition,
					batteryHealth: foundDevice.batteryHealth,
				}, true);

				toast.success(`Device sold successfully to ${partnerNameOrId}!`);
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();

				setFoundDevice({
					...foundDevice,
					status: "Sold",
					price: priceNum,
				});

				setActiveAction("view");
				setSellCustomer("");
				setSellPrice("");
				setSellNotes("");

				if (tx && tx.id) {
					streamInvoice(tx.id);
				}
			} else {
				setSellFormError(result.message || "Failed to record sale.");
			}
		} catch (err) {
			setSellFormError("Error submitting transaction.");
		} finally {
			setIsSubmittingAction(false);
		}
	};

	const handleBuybackSubmitInline = async (e: React.FormEvent) => {
		e.preventDefault();
		setBuybackErrors({});
		setBuybackFormError("");

		if (!foundDevice) return;

		try {
			await buybackValidationSchema.validate(
				{
					buybackPrice: buybackPrice ? parseFloat(buybackPrice) : undefined,
					buybackCustomer,
					buybackDate,
					buybackCondition,
					buybackBattery,
					buybackNotes,
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
				setBuybackErrors(errors);
			} else {
				setBuybackFormError("Validation failed.");
			}
			return;
		}

		setIsSubmittingAction(true);
		try {
			const priceNum = parseFloat(buybackPrice);
			const result = await editDevice(foundDevice.id, {
				status: "Available",
				purchase_price: priceNum,
				price: Math.round(priceNum * (1 + markupPercent / 100)),
				condition: buybackCondition,
				battery_health: parseInt(buybackBattery) || 90,
				description: buybackNotes || `Re-acquired from ${buybackCustomer}.`
			});
			if (result.success) {
				const [partnerType, partnerNameOrId] = buybackCustomer.includes(":")
					? (buybackCustomer.split(":") as ["Customer" | "Vendor", string])
					: ["Customer" as const, buybackCustomer];

				await handleAddTradeTransaction({
					imei: foundDevice.imei || "N/A",
					deviceBrand: foundDevice.brand,
					deviceModel: foundDevice.model,
					type: "Purchase",
					customerName: partnerNameOrId,
					partnerType: partnerType,
					amount: priceNum,
					date: buybackDate,
					notes: buybackNotes || `Acquired via buyback.`,
					storage: foundDevice.storage,
					ram: foundDevice.ram,
					color: foundDevice.color,
					condition: buybackCondition,
					batteryHealth: parseInt(buybackBattery) || 90,
				}, true);

				toast.success(`Device re-acquired via buyback successfully from ${partnerNameOrId}!`);
				await refreshDevices();
				await refreshMetrics();
				await refreshTrades();

				setFoundDevice({
					...foundDevice,
					status: "Available",
					purchasePrice: priceNum,
					price: Math.round(priceNum * (1 + markupPercent / 100)),
					condition: buybackCondition,
					batteryHealth: parseInt(buybackBattery) || 90,
				});

				setActiveAction("view");
				setBuybackCustomer("");
				setBuybackPrice("");
				setBuybackNotes("");
			} else {
				setBuybackFormError(result.message || "Failed to record buyback.");
			}
		} catch (err) {
			setBuybackFormError("Error submitting transaction.");
		} finally {
			setIsSubmittingAction(false);
		}
	};

	const handleFormChange = (field: string, value: any) => {
		setFieldErrors((prev) => {
			const next = { ...prev };
			delete next[field];
			return next;
		});

		if (field === "brand") setFormBrand(value);
		else if (field === "model") setFormModel(value);
		else if (field === "storage") setFormStorage(value);
		else if (field === "ram") setFormRam(value);
		else if (field === "color") setFormColor(value);
		else if (field === "condition") setFormCondition(value);
		else if (field === "batteryHealth") setFormBatteryHealth(value);
		else if (field === "purchasePrice") setFormPurchasePrice(value);
		else if (field === "repairingCost") setFormRepairingCost(value);
		else if (field === "description") setFormDescription(value);
		else if (field === "customerId") setFormCustomerId(value);
	};

	const handleBuySubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFieldErrors({});
		setFormError("");
		setIsSubmitting(true);

		const selectedBrandName = specs.allBrands.find(b => b.id.toString() === formBrand)?.name || "";
		const selectedModelName = specs.allModels.find(m => m.id.toString() === formModel)?.name || "";
		const selectedStorageValue = specs.allStorages.find(s => s.id.toString() === formStorage)?.value || "";
		const selectedRamValue = specs.allRams.find(r => r.id.toString() === formRam)?.value || "";

		try {
			await mobileValidationSchema.validate(
				{
					brand: selectedBrandName,
					model: selectedModelName,
					storage: selectedStorageValue,
					ram: selectedRamValue,
					color: formColor,
					imei: imei || null,
					condition: formCondition,
					batteryHealth: formBatteryHealth,
					purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : undefined,
					description: formDescription || null,
					repairingCost: formRepairingCost ? parseFloat(formRepairingCost) : undefined,
				},
				{ abortEarly: false }
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
				setFormError("Validation failed.");
			}
			return;
		}

		const purchasePriceNum = parseFloat(formPurchasePrice);
		const payload = {
			brand_id: Number(formBrand),
			model_id: Number(formModel),
			storage_id: Number(formStorage),
			ram_id: Number(formRam),
			color: formColor || "Space Gray",
			imei: imei || null,
			condition: formCondition,
			battery_health: formBatteryHealth,
			status: "Available",
			description: formDescription || `Purchased ${selectedBrandName} ${selectedModelName}.`,
			repairing_cost: formRepairingCost ? parseFloat(formRepairingCost) : 0,
			purchase_price: purchasePriceNum,
			price: Math.round(purchasePriceNum * (1 + markupPercent / 100)),
			customer_id: formCustomerId || null,
		};

		try {
			const res = await addDevice(payload);
			if (res.success) {
				toast.success("Device purchased and registered successfully!");
				onClose();
			} else {
				if (res.errors) {
					setFieldErrors(res.errors);
				} else {
					setFormError(res.message || "Failed to register device.");
				}
			}
		} catch (err) {
			setFormError("An unexpected error occurred.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const registerFormValues = {
		imei: imei,
		brand: formBrand,
		model: formModel,
		storage: formStorage,
		ram: formRam,
		color: formColor,
		condition: formCondition,
		batteryHealth: formBatteryHealth,
		purchasePrice: formPurchasePrice,
		repairingCost: formRepairingCost,
		description: formDescription,
		customerId: formCustomerId
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={
				<div className="flex items-center gap-2">
					<svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 8h16" />
					</svg>
					<span className="font-extrabold tracking-tight">Check Device IMEI</span>
				</div>
			}
			size={foundDevice || (searchAttempted && !foundDevice) ? "lg" : "md"}
		>
			<div className="space-y-6">
				{/* Top Search bar */}
				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type="text"
							value={imei}
							onChange={(e) => setImei(e.target.value)}
							placeholder="Enter IMEI number..."
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all font-semibold text-zinc-900 dark:text-zinc-100"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSearch(imei);
							}}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setIsScanning(!isScanning)}
						className="flex items-center gap-1.5 shrink-0 px-3.5"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						{isScanning ? "Stop Camera" : "Scan"}
					</Button>
					<Button
						type="button"
						variant="primary"
						size="sm"
						onClick={() => handleSearch(imei)}
						isLoading={isSearching}
						className="shrink-0 px-5"
					>
						Check
					</Button>
				</div>

				{/* Camera Scanning Frame */}
				{isScanning && (
					<div className="relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
						{permissionError ? (
							<div className="p-6 text-center space-y-2">
								<p className="text-xs font-semibold text-zinc-350">Camera Error</p>
								<p className="text-[11px] text-zinc-500 leading-normal">{permissionError}</p>
							</div>
						) : (
							<>
								<div id="modal-scanner-reader" className="w-full min-h-[220px] bg-black"></div>
								<div
									className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_#ef4444] pointer-events-none"
									style={{
										animation: "scanLine 2s ease-in-out infinite",
										top: "50%",
									}}
								/>
								<style
									dangerouslySetInnerHTML={{
										__html: `
									@keyframes scanLine {
										0% { top: 10%; }
										50% { top: 90%; }
										100% { top: 10%; }
									}
								`,
									}}
								/>
							</>
						)}
					</div>
				)}

				{/* Results State */}
				{isSearching && (
					<div className="py-12 flex flex-col items-center justify-center gap-3">
						<span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
						<p className="text-xs text-zinc-400 font-medium">Looking up device records...</p>
					</div>
				)}

				{searchAttempted && !isSearching && (
					<div className="border-t border-zinc-100 dark:border-zinc-900 pt-5">
						{foundDevice ? (
							/* Case 1: Device Exists */
							<div className="space-y-4">
								<div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
									<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
										<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									This mobile belongs to your inventory stock. Details are listed below.
								</div>

								<div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Brand</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.brand}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Model</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.model}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">IMEI</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150 font-mono">{foundDevice.imei || "N/A"}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Storage / RAM</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.storage} / {foundDevice.ram}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Color</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.color}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Condition</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.condition}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Battery Health</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">{foundDevice.batteryHealth ? `${foundDevice.batteryHealth}%` : "N/A"}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Cost Price</span>
										<span className="text-sm font-semibold text-zinc-850 dark:text-zinc-150">₹{(foundDevice.purchasePrice || 0).toLocaleString()}</span>
									</div>
									<div>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Sale Price</span>
										<span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">₹{(foundDevice.price || 0).toLocaleString()}</span>
									</div>
									<div className="col-span-2 md:col-span-3">
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Status</span>
										<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
											foundDevice.status === "Available"
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
												: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
										}`}>
											<span className={`h-1.5 w-1.5 rounded-full ${
												foundDevice.status === "Available" ? "bg-emerald-500" : "bg-amber-500"
											}`} />
											{foundDevice.status}
										</span>
									</div>
								</div>

								{/* Inline Forms & History */}
								{activeAction === "sell" && (
									<form onSubmit={handleSellSubmitInline} className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 text-left">
										<div className="flex justify-between items-center mb-2">
											<h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">Record Sell Transaction</h4>
											<span className="text-[10px] text-zinc-400 font-semibold">Status: Selling</span>
										</div>
										{sellFormError && (
											<div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded-lg font-bold">{sellFormError}</div>
										)}
										<div className="space-y-4">
											<div>
												<PartnerSelector
													value={sellCustomer}
													onChange={setSellCustomer}
													error={sellErrors.sellCustomer}
												/>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Selling Price *</label>
													<input
														type="number"
														value={sellPrice}
														onChange={(e) => setSellPrice(e.target.value)}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
														placeholder="Enter Sale Price"
													/>
													{sellErrors.sellPrice && <p className="text-[10px] text-red-500 mt-1 font-bold">{sellErrors.sellPrice}</p>}
												</div>
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Sale Date *</label>
													<input
														type="date"
														value={sellDate}
														onChange={(e) => setSellDate(e.target.value)}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
													/>
												</div>
											</div>
											<div>
												<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Notes</label>
												<input
													type="text"
													value={sellNotes}
													onChange={(e) => setSellNotes(e.target.value)}
													className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
													placeholder="Optional Notes"
												/>
											</div>
										</div>
										<div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
											<Button type="button" variant="ghost" size="sm" onClick={() => setActiveAction("view")}>Cancel</Button>
											<Button type="submit" variant="primary" size="sm" isLoading={isSubmittingAction}>Submit Sale</Button>
										</div>
									</form>
								)}

								{activeAction === "buyback" && (
									<form onSubmit={handleBuybackSubmitInline} className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 text-left">
										<div className="flex justify-between items-center mb-2">
											<h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">Record Buyback Transaction</h4>
											<span className="text-[10px] text-zinc-400 font-semibold">Status: Buyback</span>
										</div>
										{buybackFormError && (
											<div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded-lg font-bold">{buybackFormError}</div>
										)}
										<div className="space-y-4">
											<div>
												<PartnerSelector
													value={buybackCustomer}
													onChange={setBuybackCustomer}
													error={buybackErrors.buybackCustomer}
												/>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Buyback Price *</label>
													<input
														type="number"
														value={buybackPrice}
														onChange={(e) => setBuybackPrice(e.target.value)}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
														placeholder="Enter Buyback Price"
													/>
													{buybackErrors.buybackPrice && <p className="text-[10px] text-red-500 mt-1 font-bold">{buybackErrors.buybackPrice}</p>}
												</div>
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Buyback Date *</label>
													<input
														type="date"
														value={buybackDate}
														onChange={(e) => setBuybackDate(e.target.value)}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
													/>
												</div>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Condition *</label>
													<select
														value={buybackCondition}
														onChange={(e) => setBuybackCondition(e.target.value as "NEW" | "OLD")}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
													>
														<option value="NEW">New</option>
														<option value="OLD">Old</option>
													</select>
												</div>
												<div>
													<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Battery Health (%) *</label>
													<input
														type="number"
														value={buybackBattery}
														onChange={(e) => setBuybackBattery(e.target.value)}
														className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
														placeholder="Battery Health"
													/>
													{buybackErrors.buybackBattery && <p className="text-[10px] text-red-500 mt-1 font-bold">{buybackErrors.buybackBattery}</p>}
												</div>
											</div>
											<div>
												<label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350 block mb-1">Notes</label>
												<input
													type="text"
													value={buybackNotes}
													onChange={(e) => setBuybackNotes(e.target.value)}
													className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
													placeholder="Optional Notes"
												/>
											</div>
										</div>
										<div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
											<Button type="button" variant="ghost" size="sm" onClick={() => setActiveAction("view")}>Cancel</Button>
											<Button type="submit" variant="primary" size="sm" isLoading={isSubmittingAction}>Submit Buyback</Button>
										</div>
									</form>
								)}

								{activeAction === "view" && (
									<div className="space-y-4">
										<div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4">
											<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Transaction History Ledger</span>
											{foundDevice.status === "Available" ? (
												<Button
													type="button"
													variant="primary"
													size="sm"
													onClick={() => {
														setSellPrice(foundDevice.price?.toString() || "");
														setActiveAction("sell");
													}}
													className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-1.5 rounded-xl text-[10px]"
												>
													<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
														<path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													Sell Device
												</Button>
											) : (
												<Button
													type="button"
													variant="primary"
													size="sm"
													onClick={() => {
														setBuybackPrice(foundDevice.purchasePrice?.toString() || foundDevice.price?.toString() || "");
														setActiveAction("buyback");
													}}
													className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-1.5 rounded-xl text-[10px]"
												>
													<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
														<path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
													</svg>
													Buy Back Device
												</Button>
											)}
										</div>

										<div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 text-left">
											{timelineEvents.length > 0 ? (
												timelineEvents.map((event, idx) => {
													const isPurchase = event.type === "Purchase";
													return (
														<div
															key={event.id || idx}
															className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex items-center justify-between gap-4 text-xs"
														>
															<div className="flex items-center gap-3">
																<span className={`p-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
																	isPurchase
																		? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
																		: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
																}`}>
																	{isPurchase ? "Acquired" : "Sold"}
																</span>
																<div>
																	<span className="font-bold text-zinc-800 dark:text-zinc-200">
																		{event.customerName}
																	</span>
																	<span className="text-[10px] text-zinc-400 block mt-0.5 font-medium">
																		{event.date} {event.notes ? `• "${event.notes}"` : ""}
																	</span>
																</div>
															</div>
															<div className="text-right">
																<span className={`font-black text-xs ${
																	isPurchase ? "text-emerald-500" : "text-rose-500"
																}`}>
																	₹{event.amount.toLocaleString()}
																</span>
															</div>
														</div>
													);
												})
											) : (
												<div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs font-semibold">
													No transaction history found for this device.
												</div>
											)}
										</div>
									</div>
								)}

								<div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900">
									<Button type="button" variant="ghost" size="sm" onClick={onClose}>
										Close
									</Button>
									<Button
										type="button"
										variant="primary"
										size="sm"
										onClick={() => {
											router.push(`/mobiles/${slugify(foundDevice.brand)}/${slugify(foundDevice.model)}/${foundDevice.imei}`);
											onClose();
										}}
									>
										View Full History & Details
									</Button>
								</div>
							</div>
						) : (
							/* Case 2: Device NOT Exists (Show Purchase/Buy Form) */
							<div className="space-y-4">
								<div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold">
									<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
									IMEI Not Found! Fill out the form below to buy/register this device.
								</div>

								{formError && (
									<div className="px-3.5 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-xs font-bold text-red-500">
										{formError}
									</div>
								)}

								<MobileRegisterForm
									values={registerFormValues}
									onChange={handleFormChange}
									errors={fieldErrors}
									isEdit={false}
									specs={specs}
								/>

								<div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-900">
									<Button type="button" variant="ghost" size="sm" onClick={onClose}>
										Cancel
									</Button>
									<Button type="button" variant="primary" size="sm" onClick={handleBuySubmit} isLoading={isSubmitting}>
										Buy & Register Device
									</Button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
