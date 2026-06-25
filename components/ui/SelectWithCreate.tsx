"use client";

import React, { useState } from "react";
import { Select, SelectOption } from "./select";
import toast from "react-hot-toast";

interface SelectWithCreateProps {
	label: string;
	addButtonLabel?: string;
	value?: string | number;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	options: SelectOption[];
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	error?: string;
	canAdd?: boolean; // whether the add button is active (e.g. brand is selected)
	disabledAddMessage?: string; // message if clicked when disabled
	onCreate: (name: string) => Promise<string | number | undefined>; // return created item value/id on success
}

export const SelectWithCreate: React.FC<SelectWithCreateProps> = ({
	label,
	addButtonLabel = "+ Add",
	value,
	onChange,
	options,
	placeholder = "Select option",
	disabled = false,
	required = false,
	error,
	canAdd = true,
	disabledAddMessage,
	onCreate,
}) => {
	const [isAdding, setIsAdding] = useState(false);
	const [newVal, setNewVal] = useState("");
	const [inlineError, setInlineError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleAddClick = () => {
		if (!canAdd) {
			if (disabledAddMessage) {
				toast.error(disabledAddMessage);
			}
			return;
		}
		setIsAdding(!isAdding);
		setNewVal("");
		setInlineError("");
	};

	const handleSave = async () => {
		if (!newVal.trim()) return;

		setIsSubmitting(true);
		setInlineError("");
		try {
			const newId = await onCreate(newVal.trim());
			if (newId !== undefined) {
				// Success
				setIsAdding(false);
				setNewVal("");
				
				// Automatically select the new option
				if (onChange) {
					const mockEvent = {
						target: {
							value: String(newId),
							name: "",
						},
					} as React.ChangeEvent<HTMLSelectElement>;
					onChange(mockEvent);
				}
			}
		} catch (err: any) {
			setInlineError(err.message || "Failed to save item.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-1 w-full">
			<div className="flex items-center justify-between mb-1">
				<label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
					{label}
				</label>
				<button
					type="button"
					disabled={disabled || isSubmitting}
					onClick={handleAddClick}
					className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
				>
					{isAdding ? "Cancel" : addButtonLabel}
				</button>
			</div>

			{isAdding ? (
				<div className="flex flex-col gap-1.5 w-full">
					<div className="flex gap-2 animate-scaleUp">
						<input
							type="text"
							disabled={isSubmitting || disabled}
							value={newVal}
							onChange={(e) => {
								setNewVal(e.target.value);
								setInlineError("");
							}}
							placeholder={`${label} Name`}
							className={`flex-1 px-3 h-11 rounded-xl border text-xs bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
								${inlineError ? "border-red-500" : "border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary"}`}
						/>
						<button
							type="button"
							disabled={isSubmitting || disabled || !newVal.trim()}
							onClick={handleSave}
							className="px-4 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[70px] h-11 cursor-pointer"
						>
							{isSubmitting ? (
								<>
									<svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span>Saving...</span>
								</>
							) : (
								"Save"
							)}
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
					onChange={onChange}
					options={options}
					placeholder={placeholder}
					disabled={disabled}
					required={required}
					error={error}
				/>
			)}
		</div>
	);
};
