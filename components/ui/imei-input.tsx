"use client";

import React, { useState } from "react";
import { BarcodeScannerModal } from "./barcode-scanner-modal";
import { ErrorMessage } from "./error-message";

interface ImeiInputProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
	label?: string;
	placeholder?: string;
	required?: boolean;
}

export function ImeiInput({
	value,
	onChange,
	error,
	disabled = false,
	label = "IMEI Number",
	placeholder = "e.g. 359283748291827",
	required = false,
}: ImeiInputProps) {
	const [isScannerOpen, setIsScannerOpen] = useState(false);

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.replace(/\D/g, "").slice(0, 15);
		onChange(val);
	};

	const handleScanSuccess = (decodedText: string) => {
		const filtered = decodedText.replace(/\D/g, "").slice(0, 15);
		onChange(filtered);
	};

	return (
		<div className="space-y-1">
			<div className="flex justify-between items-center h-5">
				<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
					{label} {required && "*"}
				</label>
				{!disabled && (
					<button
						type="button"
						onClick={() => setIsScannerOpen(true)}
						className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
					>
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 4v1m0 11v2m4-14h-8a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2z"
							/>
						</svg>
						Scan IMEI
					</button>
				)}
			</div>
			<input
				type="text"
				maxLength={15}
				disabled={disabled}
				value={value}
				onChange={handleTextChange}
				placeholder={placeholder}
				className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-zinc-900 dark:text-zinc-100 text-sm focus:ring-2 focus:outline-none font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
					error
						? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/10"
						: "border-zinc-200 dark:border-zinc-800 focus:ring-primary"
				}`}
			/>
			<ErrorMessage message={error} />

			<BarcodeScannerModal
				isOpen={isScannerOpen}
				onClose={() => setIsScannerOpen(false)}
				onScanSuccess={handleScanSuccess}
				title="Scan IMEI Barcode"
			/>
		</div>
	);
}
