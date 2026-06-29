"use client";

import React, { useState } from "react";
import { Select } from "./select";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { toast } from "react-hot-toast";

interface RamSelectorProps {
	value: string;
	onChange: (val: string) => void;
	error?: string;
	disabled?: boolean;
	customSpecs?: {
		allRams: any[];
		addRam: (value: string) => Promise<any>;
		refreshAllSpecs: () => Promise<void>;
	};
}

export function RamSelector({
	value,
	onChange,
	error,
	disabled = false,
	customSpecs,
}: RamSelectorProps) {
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
				const res = await specs.addRam(newVal.trim());
				if (res.success) {
					toast.success("RAM request submitted.");
					await specs.refreshAllSpecs();
					setNewVal("");
					setIsAdding(false);
				} else {
					setInlineError(res.message || "Failed to add RAM.");
				}
			} catch (err) {
				setInlineError("Failed to add RAM.");
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	return (
		<div className="space-y-1 w-full">
			<div className="flex justify-between items-center">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
					RAM Size *
				</label>
				{!disabled && (
					<button
						type="button"
						onClick={() => setIsAdding(!isAdding)}
						className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
					>
						{isAdding ? "Cancel" : "Request RAM"}
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
							placeholder="e.g. 16GB"
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
					placeholder="-- Choose RAM --"
					options={(specs?.allRams || []).map((r) => ({
						value: r.id.toString(),
						label: r.value,
					}))}
					error={error}
					disabled={disabled}
				/>
			)}
		</div>
	);
}
