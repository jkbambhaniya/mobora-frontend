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
	label = "Customer / Vendor *",
	placeholder = "-- Choose Partner --",
	required = false,
	valueType = "name",
	error,
}: PartnerSelectorProps) {
	const { customers, addCustomer, fetchVendors, refreshCustomers } = useDashboard();
	const [systemVendors, setSystemVendors] = useState<any[]>([]);
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Quick Add Form States
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");
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

	// Build dropdown options dynamically
	const selectOptions = useMemo(() => {
		let merged: Array<{ value: string; label: string }> = [];

		if (valueType === "id") {
			const customerOptions = customers.map((c) => ({
				value: `Customer:${c.id}`,
				label: `👤 ${c.name} (${c.phone || "No Phone"}) — Customer`,
			}));
			const vendorOptions = systemVendors.map((v) => ({
				value: `Vendor:${v.id}`,
				label: `🏬 ${v.shop_name ? `${v.shop_name} (${v.name})` : v.name} — Vendor`,
			}));
			merged = [...customerOptions, ...vendorOptions];
		} else {
			const customerOptions = customers.map((c) => ({
				value: `Customer:${c.name}`,
				label: `👤 ${c.name} (${c.phone || "No Phone"}) — Customer`,
			}));
			const vendorOptions = systemVendors.map((v) => ({
				value: `Vendor:${v.name}`,
				label: `🏬 ${v.shop_name ? `${v.shop_name} (${v.name})` : v.name} — Vendor`,
			}));
			merged = [...customerOptions, ...vendorOptions];
		}

		// Filter unique options by value to prevent duplicate keys in React Select
		const unique: Array<{ value: string; label: string }> = [];
		const seen = new Set<string>();
		for (const opt of merged) {
			if (!seen.has(opt.value)) {
				seen.add(opt.value);
				unique.push(opt);
			}
		}

		// Inject the current value as an option if it doesn't exist
		if (value) {
			const hasValue = unique.some(opt => {
				const [_, val] = opt.value.split(":");
				return val?.toLowerCase() === value.toLowerCase() || opt.value.toLowerCase() === value.toLowerCase();
			});
			if (!hasValue) {
				const [pType, pName] = value.includes(":") ? value.split(":") : ["Customer", value];
				unique.push({
					value: `${pType}:${pName}`,
					label: `👤 ${pName} (Past Transaction) — ${pType}`
				});
			}
		}

		return unique;
	}, [customers, systemVendors, valueType, value]);

	// Map current prop value to a compound option value if passed as plain value
	const selectedValue = useMemo(() => {
		if (!value) return "";
		if (value.startsWith("Customer:") || value.startsWith("Vendor:")) {
			return value;
		}
		// Match by ID or Name
		const matchedOption = selectOptions.find((opt) => {
			const [_, val] = opt.value.split(":");
			return val?.toLowerCase() === value.toLowerCase();
		});
		return matchedOption ? matchedOption.value : value;
	}, [value, selectOptions]);

	// Handle selection change
	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const val = e.target.value;
		onChange(val);
	};

	// Save Quick Customer Helper
	const handleCreateCustomer = async () => {
		setCustErrors({});
		setCustFormError("");
		try {
			await quickCustomerSchema.validate(
				{
					name: newCustName,
					phone: newCustPhone,
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
				phone: newCustPhone,
				email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
				status: "Active",
				address: newCustAddress || "Quick Registration",
				notes: "Quick registered during transaction workflow.",
				idType: newCustIdType || null,
				idNumber: newCustIdNumber || null,
				kycDocumentImg: newCustKycDocImg || null,
			});

			if (res.success && res.customer) {
				setIsAddingCust(false);
				setNewCustName("");
				setNewCustPhone("");
				setNewCustAddress("");
				setNewCustIdType("");
				setNewCustIdNumber("");
				setNewCustKycDocImg(null);
				setCustErrors({});
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
		<div className="space-y-2 w-full text-left">
			<div className="flex justify-between items-center">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
					{label}
				</label>
				<button
					type="button"
					disabled={isSubmitting}
					onClick={() => {
						setIsAddingCust(!isAddingCust);
						setCustErrors({});
						setCustFormError("");
					}}
					className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50"
				>
					{isAddingCust ? "Cancel" : "+ Quick Add"}
				</button>
			</div>

			{isAddingCust ? (
				<div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 animate-scaleUp">
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
							className={`w-full px-3 py-2 border rounded-xl text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50
								${custErrors.address ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-800"}`}
						/>
						{custErrors.address && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{custErrors.address}
							</p>
						)}
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
								<svg
									className="animate-spin h-3.5 w-3.5 text-white"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
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
			) : (
				<div className="relative w-full">
					<Select
						value={selectedValue}
						onChange={handleSelectChange}
						required={required}
						placeholder={placeholder}
						showSearch={true}
						options={selectOptions}
						error={error}
					/>
				</div>
			)}
		</div>
	);
}
