"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Select } from "@/components/ui/select";
import { PhoneInputField } from "@/components/ui/PhoneInputField";
import { useDashboard } from "@/context/vendor/dashboard-context";
import * as yup from "yup";
import { isValidPhoneNumber } from "libphonenumber-js";
import { toast } from "react-hot-toast";

import { KycDocumentUpload } from "@/components/vendor/profile/KycDocumentUpload";

const quickCustomerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name is required."),
	phone: yup
		.string()
		.trim()
		.required("Phone Number is required.")
		.test(
			"is-valid-phone",
			"Please enter a valid international phone number.",
			(value) => !!value && isValidPhoneNumber(value),
		),
	address: yup.string().trim().nullable().notRequired(),
	idType: yup.string().trim().nullable().notRequired(),
	idNumber: yup.string().trim().nullable().notRequired(),
	kycDocumentImg: yup.string().trim().nullable().notRequired(),
});

interface PartnerSelectorProps {
	value: string;
	onChange: (value: string) => void;
	label?: string;
	placeholder?: string;
	required?: boolean;
	valueType?: "name" | "id"; // "name" returns customer/vendor name, "id" returns customer ID
	error?: string;
}

export function PartnerSelector({
	value,
	onChange,
	label = "Select Customer / Dealer *",
	placeholder = "-- Choose Partner --",
	required = false,
	valueType = "name",
	error,
}: PartnerSelectorProps) {
	const { customers, addCustomer, fetchVendors, refreshCustomers } = useDashboard();
	const [systemVendors, setSystemVendors] = useState<any[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Phone Input Search State
	const [inputPhone, setInputPhone] = useState("");

	// Quick Add Form States
	const [newCustName, setNewCustName] = useState("");
	const [newCustAddress, setNewCustAddress] = useState("");
	const [newCustIdType, setNewCustIdType] = useState("");
	const [newCustIdNumber, setNewCustIdNumber] = useState("");
	const [newCustKycDocImg, setNewCustKycDocImg] = useState<string | null>(null);
	const [custErrors, setCustErrors] = useState<Record<string, string>>({});
	const [custFormError, setCustFormError] = useState("");

	useEffect(() => {
		const loadData = async () => {
			try {
				if (typeof fetchVendors === "function") {
					const list = await fetchVendors();
					setSystemVendors(list || []);
				}
				if (typeof refreshCustomers === "function") {
					await refreshCustomers({ limit: 1000 });
				}
			} catch (err) {
				console.error("Failed to load partner options:", err);
			}
		};
		loadData();
	}, [fetchVendors, refreshCustomers]);

	// Clean input phone for comparison
	const cleanInput = useMemo(() => inputPhone.replace(/[\s\-\+\(\)]/g, ""), [inputPhone]);

	// Check if any customer matches the current typed phone number
	const matchedCustomer = useMemo(() => {
		if (cleanInput.length < 9) return null;
		return customers.find((c) => {
			const cleanPhone = (c.phone || "").replace(/[\s\-\+\(\)]/g, "");
			return cleanPhone && (cleanPhone === cleanInput || cleanPhone.endsWith(cleanInput) || cleanInput.endsWith(cleanPhone));
		});
	}, [cleanInput, customers]);

	// Check if any vendor matches the current typed phone number
	const matchedVendor = useMemo(() => {
		if (cleanInput.length < 9) return null;
		return systemVendors.find((v) => {
			const cleanPhone = (v.phone || "").replace(/[\s\-\+\(\)]/g, "");
			return cleanPhone && (cleanPhone === cleanInput || cleanPhone.endsWith(cleanInput) || cleanInput.endsWith(cleanPhone));
		});
	}, [cleanInput, systemVendors]);

	// Auto-select if matching customer or vendor is found
	useEffect(() => {
		if (matchedCustomer) {
			if (valueType === "id") {
				onChange(`Customer:${matchedCustomer.id}`);
			} else {
				onChange(`Customer:${matchedCustomer.name}`);
			}
			setInputPhone("");
		} else if (matchedVendor) {
			if (valueType === "id") {
				onChange(`Vendor:${matchedVendor.id}`);
			} else {
				onChange(`Vendor:${matchedVendor.name}`);
			}
			setInputPhone("");
		}
	}, [matchedCustomer, matchedVendor, valueType, onChange]);

	// Show registration form if phone is entered but no matching customer or vendor is found
	const showCreateForm = cleanInput.length >= 9 && !matchedCustomer && !matchedVendor;

	// Find the details of the currently selected partner
	const selectedPartnerInfo = useMemo(() => {
		if (!value) return null;
		const [type, key] = value.includes(":") ? value.split(":") : ["Customer", value];
		if (type === "Customer") {
			const cust = customers.find(c => String(c.id) === key || c.name === key);
			if (cust) {
				return {
					name: cust.name,
					phone: cust.phone,
					type: "Customer",
				};
			}
		} else if (type === "Vendor") {
			const vend = systemVendors.find(v => String(v.id) === key || v.name === key);
			if (vend) {
				return {
					name: vend.name,
					shopName: vend.shop_name,
					type: "Vendor",
				};
			}
		}
		return {
			name: key,
			type: type,
		};
	}, [value, customers, systemVendors]);

	// Save Quick Customer
	const handleCreateCustomer = async () => {
		setCustErrors({});
		setCustFormError("");
		try {
			await quickCustomerSchema.validate(
				{
					name: newCustName,
					phone: inputPhone,
					address: newCustAddress || null,
					idType: newCustIdType || null,
					idNumber: newCustIdNumber || null,
					kycDocumentImg: newCustKycDocImg || null,
				},
				{ abortEarly: false },
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
				phone: inputPhone,
				email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
				status: "Active",
				address: newCustAddress || "Quick Registration",
				notes: "Quick registered during transaction workflow.",
				idType: newCustIdType || null,
				idNumber: newCustIdNumber || null,
				kycDocumentImg: newCustKycDocImg || null,
			});

			if (res.success && res.customer) {
				setNewCustName("");
				setNewCustAddress("");
				setNewCustIdType("");
				setNewCustIdNumber("");
				setNewCustKycDocImg(null);
				setCustErrors({});
				setInputPhone("");
				toast.success(`Customer ${newCustName} registered.`);
				if (valueType === "id") {
					onChange(`Customer:${res.customer.id}`);
				} else {
					onChange(`Customer:${res.customer.name}`);
				}
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

	return (
		<div className="space-y-3 w-full text-left">
			{selectedPartnerInfo ? (
				<div className="space-y-1.5">
					<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block">
						{label}
					</label>
					<div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between animate-scaleUp">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
								{selectedPartnerInfo.type === "Customer" ? "👤" : "🏬"}
							</div>
							<div>
								<h4 className="font-bold text-zinc-900 dark:text-white text-sm">
									{selectedPartnerInfo.shopName ? `${selectedPartnerInfo.shopName} (${selectedPartnerInfo.name})` : selectedPartnerInfo.name}
								</h4>
								<p className="text-zinc-500 text-xs mt-0.5">
									{selectedPartnerInfo.phone ? `${selectedPartnerInfo.phone} • ` : ""}{selectedPartnerInfo.type}
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => {
								onChange("");
								setInputPhone("");
								setNewCustName("");
								setNewCustAddress("");
								setNewCustIdType("");
								setNewCustIdNumber("");
								setNewCustKycDocImg(null);
							}}
							className="text-xs text-red-500 hover:text-red-600 font-bold hover:underline cursor-pointer"
						>
							Change Partner
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-3">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block">
							Select Customer / Dealer by Phone *
						</label>
						<PhoneInputField
							value={inputPhone}
							onChange={setInputPhone}
							error={error}
						/>
					</div>

					{showCreateForm && (
						<div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-scaleUp">
							<div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-[11px] text-primary font-semibold">
								ℹ️ This phone number is not registered. Please fill in the details below to quick-register this customer.
							</div>
							
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
										placeholder="e.g. John Doe"
										className={`w-full px-3 py-[7px] border rounded-lg text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
											${custErrors.name ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
									/>
									{custErrors.name && (
										<p className="text-[10px] text-red-500 font-semibold mt-1">
											{custErrors.name}
										</p>
									)}
								</div>
								
								<div className="space-y-1">
									<label className="text-[10px] font-semibold text-zinc-400 uppercase">
										Address
									</label>
									<input
										type="text"
										disabled={isSubmitting}
										value={newCustAddress}
										onChange={(e) => setNewCustAddress(e.target.value)}
										placeholder="Enter customer address..."
										className="w-full px-3 py-[7px] border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
									/>
								</div>
							</div>

							{/* GOVERNMENT ID KYC DETAILS (OPTIONAL) */}
							<div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-1 space-y-3">
								<h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
									Government ID KYC Details (Optional)
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-zinc-400 uppercase">
											ID Proof Type
										</label>
										<Select
											value={newCustIdType}
											onChange={(e) => setNewCustIdType(e.target.value)}
											placeholder="Select ID Type"
											size="sm"
											options={[
												{ value: "Aadhaar Card", label: "Aadhaar Card" },
												{ value: "PAN Card", label: "PAN Card" },
												{ value: "Voter ID", label: "Voter ID" },
												{ value: "Driving License", label: "Driving License" },
											]}
										/>
									</div>
									<div className="space-y-1">
										<label className="text-[10px] font-semibold text-zinc-400 uppercase">
											ID Document Number
										</label>
										<input
											type="text"
											disabled={isSubmitting}
											value={newCustIdNumber}
											onChange={(e) => setNewCustIdNumber(e.target.value)}
											placeholder="e.g. 12-digit Aadhaar / 10-digit PAN"
											className="w-full px-3 py-[7px] border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
										/>
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-[10px] font-semibold text-zinc-400 uppercase">
										Upload ID Document Copy (Front/Back Image)
									</label>
									<KycDocumentUpload
										name="quick-add-kyc"
										value={newCustKycDocImg || undefined}
										onChange={(val) => setNewCustKycDocImg(val)}
									/>
								</div>
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
									"Save and Select"
								)}
							</button>
							{custFormError && (
								<p className="text-xs text-red-500 font-semibold text-center mt-2">
									{custFormError}
								</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
