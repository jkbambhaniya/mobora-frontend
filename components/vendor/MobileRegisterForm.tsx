"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { Select } from "@/components/ui/select";
import { PartnerSelector } from "./PartnerSelector";
import { ImeiInput } from "@/components/ui/imei-input";
import { RamSelector } from "@/components/ui/ram-selector";
import { StorageSelector } from "@/components/ui/storage-selector";

interface MobileRegisterFormProps {
	values: {
		imei: string;
		brand: string;
		model: string;
		storage: string;
		ram: string;
		color: string;
		condition: "NEW" | "OLD";
		batteryHealth: number;
		purchasePrice: string;
		repairingCost: string;
		description: string;
		customerId: string;
	};
	onChange: (field: string, value: any) => void;
	errors: Record<string, string>;
	isEdit: boolean;
	hideBrandModel?: boolean;
	specs: {
		allBrands: any[];
		allModels: any[];
		allStorages: any[];
		allRams: any[];
		addBrand: (name: string) => Promise<any>;
		addModel: (name: string, brandId: number) => Promise<any>;
		addStorage: (value: string) => Promise<any>;
		addRam: (value: string) => Promise<any>;
		refreshAllSpecs: () => Promise<void>;
	};
}

export function MobileRegisterForm({
	values,
	onChange,
	errors,
	isEdit,
	hideBrandModel = false,
	specs,
}: MobileRegisterFormProps) {
	// Spec Creators States

	// Spec Creators States
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [newBrandVal, setNewBrandVal] = useState("");
	const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
	const [brandInlineError, setBrandInlineError] = useState("");

	const [isAddingModel, setIsAddingModel] = useState(false);
	const [newModelVal, setNewModelVal] = useState("");
	const [isSubmittingModel, setIsSubmittingModel] = useState(false);
	const [modelInlineError, setModelInlineError] = useState("");





	// Spec submit handlers
	const handleCreateBrand = async () => {
		if (newBrandVal.trim()) {
			setIsSubmittingBrand(true);
			setBrandInlineError("");
			try {
				const res = await specs.addBrand(newBrandVal.trim());
				if (res.success) {
					toast.success("Brand request submitted.");
					await specs.refreshAllSpecs();
					setNewBrandVal("");
					setIsAddingBrand(false);
				} else {
					setBrandInlineError(res.message || "Failed to add Brand.");
				}
			} catch (err) {
				setBrandInlineError("Failed to add Brand.");
			} finally {
				setIsSubmittingBrand(false);
			}
		}
	};

	const handleCreateModel = async () => {
		if (newModelVal.trim()) {
			if (!values.brand) {
				setModelInlineError("Please select a brand first.");
				return;
			}
			setIsSubmittingModel(true);
			setModelInlineError("");
			try {
				const res = await specs.addModel(newModelVal.trim(), Number(values.brand));
				if (res.success) {
					toast.success("Model request submitted.");
					await specs.refreshAllSpecs();
					setNewModelVal("");
					setIsAddingModel(false);
				} else {
					setModelInlineError(res.message || "Failed to add Model.");
				}
			} catch (err) {
				setModelInlineError("Failed to add Model.");
			} finally {
				setIsSubmittingModel(false);
			}
		}
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* IMEI */}
				<ImeiInput
					value={values.imei}
					onChange={(val) => onChange("imei", val)}
					error={errors.imei}
					required={false}
				/>

				{/* Color */}
				<div className="space-y-1">
					<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
						Color *
					</label>
					<input
						type="text"
						value={values.color}
						onChange={(e) => onChange("color", e.target.value)}
						placeholder="e.g. Phantom Black"
						className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
							errors.color
								? "border-red-400 focus:ring-red-400"
								: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
						}`}
					/>
					{errors.color && (
						<p className="text-xs text-red-500 font-medium mt-1">{errors.color}</p>
					)}
				</div>
			</div>

			{/* Conditionally render Brand & Model dropdowns */}
			{!hideBrandModel && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Brand Select */}
					<div className="space-y-1">
						<div className="flex justify-between items-center">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Brand *
							</label>
							<button
								type="button"
								onClick={() => setIsAddingBrand(!isAddingBrand)}
								className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
							>
								{isAddingBrand ? "Cancel" : "Request Brand"}
							</button>
						</div>
						{isAddingBrand ? (
							<div className="flex flex-col gap-1.5 w-full">
								<div className="flex gap-2">
									<input
										type="text"
										value={newBrandVal}
										onChange={(e) => {
											setNewBrandVal(e.target.value);
											setBrandInlineError("");
										}}
										placeholder="e.g. OnePlus"
										className="flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-primary"
									/>
									<button
										type="button"
										disabled={isSubmittingBrand}
										onClick={handleCreateBrand}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
									>
										{isSubmittingBrand ? "Saving..." : "Save"}
									</button>
								</div>
								{brandInlineError && (
									<p className="text-[10px] text-red-500 font-semibold pl-1">
										{brandInlineError}
									</p>
								)}
							</div>
						) : (
							<Select
								value={values.brand}
								onChange={(e) => onChange("brand", e.target.value)}
								placeholder="-- Choose Brand --"
								options={specs.allBrands.map((b) => ({
									value: b.id.toString(),
									label: b.name,
								}))}
								error={errors.brand}
							/>
						)}
					</div>

					{/* Model Select */}
					<div className="space-y-1">
						<div className="flex justify-between items-center">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Model *
							</label>
							<button
								type="button"
								onClick={() => setIsAddingModel(!isAddingModel)}
								className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
							>
								{isAddingModel ? "Cancel" : "+ Add Model"}
							</button>
						</div>
						{isAddingModel ? (
							<div className="flex flex-col gap-1.5 w-full">
								<div className="flex gap-2">
									<input
										type="text"
										value={newModelVal}
										onChange={(e) => {
											setNewModelVal(e.target.value);
											setModelInlineError("");
										}}
										placeholder="e.g. Nord CE 3"
										className="flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-primary"
									/>
									<button
										type="button"
										disabled={isSubmittingModel}
										onClick={handleCreateModel}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
									>
										{isSubmittingModel ? "Saving..." : "Save"}
									</button>
								</div>
								{modelInlineError && (
									<p className="text-[10px] text-red-500 font-semibold pl-1">
										{modelInlineError}
									</p>
								)}
							</div>
						) : (
							<Select
								value={values.model}
								onChange={(e) => onChange("model", e.target.value)}
								placeholder={
									values.brand ? "-- Choose Model --" : "-- Choose Brand First --"
								}
								disabled={!values.brand}
								options={specs.allModels
									.filter((m) => m.brand_id.toString() === values.brand)
									.map((m) => ({ value: m.id.toString(), label: m.name }))}
								error={errors.model}
							/>
						)}
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* RAM Size */}
				<RamSelector
					value={values.ram}
					onChange={(val) => onChange("ram", val)}
					error={errors.ram}
					disabled={isEdit}
					customSpecs={specs}
				/>

				{/* Storage Capacity */}
				<StorageSelector
					value={values.storage}
					onChange={(val) => onChange("storage", val)}
					error={errors.storage}
					disabled={isEdit}
					customSpecs={specs}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Condition */}
				<div className="space-y-1">
					<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
						Condition *
					</label>
					<Select
						value={values.condition}
						onChange={(e) => onChange("condition", e.target.value)}
						options={[
							{ value: "NEW", label: "New" },
							{ value: "OLD", label: "Old" },
						]}
						error={errors.condition}
					/>
				</div>

				{/* Battery Health */}
				<div className="space-y-1">
					<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
						Battery Health (%) *
					</label>
					<input
						type="number"
						min={50}
						max={100}
						value={values.batteryHealth}
						onChange={(e) => onChange("batteryHealth", parseInt(e.target.value) || 0)}
						className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
							errors.batteryHealth
								? "border-red-400 focus:ring-red-400"
								: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
						}`}
					/>
					{errors.batteryHealth && (
						<p className="text-xs text-red-500 font-medium mt-1">
							{errors.batteryHealth}
						</p>
					)}
				</div>
			</div>

			{/* Customer Selection */}
			{!isEdit && (
				<PartnerSelector
					value={values.customerId}
					onChange={(val) => onChange("customerId", val)}
					label="Select Customer / Vendor (for Purchase Transaction)"
					placeholder="-- Choose Partner --"
					required={false}
					valueType="id"
				/>
			)}

			{/* Cost & Repair Price Grid */}
			{!isEdit ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Cost Price */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Purchase / Cost Price * (₹)
						</label>
						<input
							type="number"
							required
							value={values.purchasePrice}
							onChange={(e) => onChange("purchasePrice", e.target.value)}
							placeholder="e.g. 30000"
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
								errors.purchasePrice
									? "border-red-400 focus:ring-red-400"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
							}`}
						/>
						{errors.purchasePrice && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{errors.purchasePrice}
							</p>
						)}
					</div>

					{/* Repairing Cost */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Repairing Cost (₹)
						</label>
						<input
							type="number"
							value={values.repairingCost}
							onChange={(e) => onChange("repairingCost", e.target.value)}
							placeholder="e.g. 1500"
							className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
								errors.repairingCost
									? "border-red-400 focus:ring-red-400"
									: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
							}`}
						/>
						{errors.repairingCost && (
							<p className="text-xs text-red-500 font-medium mt-1">
								{errors.repairingCost}
							</p>
						)}
					</div>
				</div>
			) : (
				/* Repairing Cost only for Edit mode */
				<div className="space-y-1">
					<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
						Repairing Cost (₹)
					</label>
					<input
						type="number"
						value={values.repairingCost}
						onChange={(e) => onChange("repairingCost", e.target.value)}
						placeholder="e.g. 1500"
						className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
							errors.repairingCost
								? "border-red-400 focus:ring-red-400"
								: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
						}`}
					/>
					{errors.repairingCost && (
						<p className="text-xs text-red-500 font-medium mt-1">
							{errors.repairingCost}
						</p>
					)}
				</div>
			)}

			{/* Description */}
			<div className="space-y-1">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
					Listing Description
				</label>
				<textarea
					value={values.description}
					onChange={(e) => onChange("description", e.target.value)}
					placeholder="e.g. Mint condition. Minor scratch on screen, box and original cable available..."
					rows={3}
					className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-colors ${
						errors.description
							? "border-red-400 focus:ring-red-400"
							: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
					}`}
				/>
				{errors.description && (
					<p className="text-xs text-red-500 font-medium mt-1">{errors.description}</p>
				)}
			</div>
		</div>
	);
}
