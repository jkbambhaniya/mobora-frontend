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

interface EditModalData {
	tab: Tab;
	id: number;
	currentValue: string;
	currentBrandId?: number;
}

interface EditModalProps {
	editData: EditModalData | null;
	onClose: () => void;
	allBrands: { id: number; name: string }[];
	onEdit: (
		tab: Tab,
		id: number,
		value: string,
		brandId?: number,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
}

export default function EditModal({
	editData,
	onClose,
	allBrands,
	onEdit,
}: EditModalProps) {
	const [value, setValue] = useState("");
	const [brandId, setBrandId] = useState<number | "">("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (editData) {
			setValue(editData.currentValue);
			setBrandId(editData.currentBrandId || "");
			setErrors({});
		}
	}, [editData]);

	if (!editData) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});
		const { tab, id } = editData;
		try {
			if (tab === "brands") {
				await brandValidationSchema.validate(
					{ name: value },
					{ abortEarly: false },
				);
			} else if (tab === "models") {
				await modelValidationSchema.validate(
					{
						name: value,
						brand_id: brandId ? Number(brandId) : undefined,
					},
					{ abortEarly: false },
				);
			} else if (tab === "storages") {
				await storageValidationSchema.validate(
					{ value: value },
					{ abortEarly: false },
				);
			} else if (tab === "rams") {
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
		const result = await onEdit(
			tab,
			id,
			value,
			tab === "models" ? Number(brandId) : undefined,
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

	const tabLabel =
		editData.tab === "rams"
			? "RAM"
			: editData.tab.slice(0, -1).charAt(0).toUpperCase() +
				editData.tab.slice(0, -1).slice(1);

	return (
		<Modal
			isOpen={editData !== null}
			onClose={onClose}
			title={`Edit ${tabLabel}`}
			size="sm"
		>
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				{editData.tab === "models" && (
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
						className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm focus:ring-2 focus:outline-none transition-all ${
							errors.name || errors.value
								? "border-red-500 focus:ring-red-500/20"
								: "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary/40"
						}`}
						required
					/>
					{errors.name && (
						<p className="text-xs text-red-500 mt-1">{errors.name}</p>
					)}
					{errors.value && (
						<p className="text-xs text-red-500 mt-1">{errors.value}</p>
					)}
					{errors.general && (
						<p className="text-xs text-red-500 mt-1">{errors.general}</p>
					)}
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
						{loading ? "Saving…" : "Save Changes"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
