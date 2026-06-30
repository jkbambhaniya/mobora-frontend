"use client";

import React, { useState } from "react";
import { Select } from "./select";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { toast } from "react-hot-toast";

interface StorageSelectorProps {
	value: string;
	onChange: (val: string) => void;
	error?: string;
	disabled?: boolean;
	customSpecs?: {
		allStorages: any[];
		addStorage: (value: string) => Promise<any>;
		refreshAllSpecs: () => Promise<void>;
	};
}

export function StorageSelector({
	value,
	onChange,
	error,
	disabled = false,
	customSpecs,
}: StorageSelectorProps) {
	const contextSpecs = useSpecifications();
	const specs = customSpecs || contextSpecs;

	const [isAdding, setIsAdding] = useState(false);
	const [newVal, setNewVal] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [inlineError, setInlineError] = useState("");

	const handleCreate = async () => {
		if (newVal.trim()) {
			setIsSubmitting(true);
			setInlineError("");
			try {
				const res = await specs.addStorage(newVal.trim());
				if (res.success) {
					toast.success("Storage capacity request submitted.");
					await specs.refreshAllSpecs();
					setNewVal("");
					setIsAdding(false);
				} else {
					setInlineError(res.message || "Failed to add Storage.");
				}
			} catch (err) {
				setInlineError("Failed to add Storage.");
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	return (
		<div className="space-y-1 w-full">
			<div className="flex justify-between items-center h-5">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
					Storage Capacity *
				</label>
				{!disabled && (
					<button
						type="button"
						onClick={() => setIsAdding(!isAdding)}
						className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
					>
						{isAdding ? "Cancel" : "Request Storage"}
					</button>
				)}
			</div>
			{isAdding ? (
				<div className="flex flex-col gap-1.5 w-full">
					<div className="flex gap-2">
						<input
							type="text"
							value={newVal}
							onChange={(e) => {
								setNewVal(e.target.value);
								setInlineError("");
							}}
							placeholder="e.g. 512GB"
							className="flex-1 px-3 py-2 rounded-xl border text-xs bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none border-primary"
						/>
						<button
							type="button"
							disabled={isSubmitting}
							onClick={handleCreate}
							className="px-3 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
						>
							{isSubmitting ? "Saving..." : "Save"}
						</button>
					</div>
					{inlineError && (
						<p className="text-[10px] text-red-500 font-semibold pl-1">
							{inlineError}
						</p>
					)}
				</div>
			) : (
				<Select
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="-- Choose Storage --"
					options={(specs?.allStorages || []).map((s) => ({
						value: s.id.toString(),
						label: s.value,
					}))}
					error={error}
					disabled={disabled}
				/>
			)}
		</div>
	);
}
