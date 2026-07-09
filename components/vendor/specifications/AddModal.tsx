import React, { useState, useEffect } from "react";
import { Tab } from "@/types/specifications";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
	brandValidationSchema,
	modelValidationSchema,
	storageValidationSchema,
	ramValidationSchema,
} from "@/utils/validation";
import * as yup from "yup";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";

interface AddModalProps {
	isOpen: boolean;
	onClose: () => void;
	activeTab: Tab;
	allBrands: { id: number; name: string }[];
	onAdd: (
		value: string,
		brandId?: number,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
}

export default function AddModal({
	isOpen,
	onClose,
	activeTab,
	allBrands,
	onAdd,
}: AddModalProps) {
	const [value, setValue] = useState("");
	const [brandId, setBrandId] = useState<number | "">("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setValue("");
			setBrandId(allBrands.length > 0 ? allBrands[0].id : "");
			setErrors({});
		}
	}, [isOpen, activeTab, allBrands]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});
		try {
			if (activeTab === "brands") {
				await brandValidationSchema.validate(
					{ name: value },
					{ abortEarly: false },
				);
			} else if (activeTab === "models") {
				await modelValidationSchema.validate(
					{
						name: value,
						brand_id: brandId ? Number(brandId) : undefined,
					},
					{ abortEarly: false },
				);
			} else if (activeTab === "storages") {
				await storageValidationSchema.validate(
					{ value: value },
					{ abortEarly: false },
				);
			} else if (activeTab === "rams") {
				await ramValidationSchema.validate(
					{ value: value },
					{ abortEarly: false },
				);
			}
		} catch (err: any) {
			if (
				err.name === "ValidationError" ||
				err instanceof yup.ValidationError
			) {
				const errorsMap: Record<string, string> = {};
				if (err.inner && err.inner.length > 0) {
					err.inner.forEach((error: any) => {
						if (error.path) {
							errorsMap[error.path] = error.message;
						}
					});
				} else {
					errorsMap[err.path || "name"] = err.message;
				}
				setErrors(errorsMap);
				return;
			}
			throw err;
		}

		setLoading(true);
		const result = await onAdd(
			value,
			activeTab === "models" ? Number(brandId) : undefined,
		);
		setLoading(false);

		if (result.success) {
			onClose();
		} else {
			if (result.errors && typeof result.errors === "object") {
				setErrors(result.errors);
			} else {
				setErrors({
					general: result.message || "Something went wrong.",
				});
			}
		}
	};

	const title =
		activeTab === "brands"
			? "Request New Brand"
			: activeTab === "storages"
				? "Request New Storage"
				: activeTab === "rams"
					? "Request New RAM"
					: "Add New Model";

	const placeholder =
		activeTab === "brands"
			? "e.g. Motorola"
			: activeTab === "models"
				? "e.g. Moto Edge 50 Ultra"
				: activeTab === "storages"
					? "e.g. 512GB"
					: "e.g. 16GB";

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				{(activeTab === "brands" ||
					activeTab === "storages" ||
					activeTab === "rams") && (
					<div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
						Submit a request to add a new{" "}
						{activeTab === "brands"
							? "brand"
							: activeTab === "storages"
								? "storage option"
								: "RAM option"}
						. It will be available in listings and dropdowns once activated by
						an administrator.
					</div>
				)}

				{activeTab === "models" && (
					<Select
						label="Brand *"
						value={brandId}
						onChange={(e) => {
							setBrandId(Number(e.target.value));
							setErrors((prev) => {
								const next = { ...prev };
								delete next.brand_id;
								return next;
							});
						}}
						required
						error={errors.brand_id}
						placeholder="— Select Brand —"
						options={allBrands.map((b) => ({ value: b.id, label: b.name }))}
					/>
				)}

				<div className="space-y-1">
					<label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
						{activeTab === "rams"
							? "RAM Size"
							: activeTab.slice(0, -1).charAt(0).toUpperCase() +
								activeTab.slice(0, -1).slice(1)}{" "}
						Value *
					</label>
					<input
						type="text"
						autoFocus
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setErrors((prev) => {
								const next = { ...prev };
								delete next.name;
								delete next.value;
								delete next.general;
								return next;
							});
						}}
						placeholder={placeholder}
						className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none transition-all ${
							errors.name || errors.value
								? "border-red-500 focus:ring-red-500/20"
								: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
						}`}
						required
					/>					<ErrorMessage message={errors.name} />
					<ErrorMessage message={errors.value} />
					<ErrorMessage message={errors.general} />
				</div>

				<div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
					<Button type="button" variant="ghost" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="gradient"
						size="sm"
						disabled={loading}
					>
						{loading
							? activeTab === "brands"
								? "Submitting…"
								: "Adding…"
							: activeTab === "brands"
								? "Submit Request"
								: "Add"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
