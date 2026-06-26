"use client";

import React, { useRef, useState, useEffect } from "react";

interface KycDocumentUploadProps {
	value?: string;
	onChange: (base64: string | null) => void;
	name: string;
}

export const KycDocumentUpload: React.FC<KycDocumentUploadProps> = ({
	value,
	onChange,
	name,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [previews, setPreviews] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Sync state if initial value changes (e.g. when editing loads)
	useEffect(() => {
		if (value) {
			let parsed: string[] = [];
			try {
				if (value.trim().startsWith("[")) {
					parsed = JSON.parse(value);
				} else {
					parsed = value.split(",").map(s => s.trim()).filter(Boolean);
				}
			} catch (e) {
				parsed = value.split(",").map(s => s.trim()).filter(Boolean);
			}
			setPreviews(parsed);
		} else {
			setPreviews([]);
		}
	}, [value]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		// Validate all files are images and < 2MB
		const invalidType = files.some(file => !file.type.startsWith("image/"));
		if (invalidType) {
			setError("Please select image files only.");
			return;
		}

		const invalidSize = files.some(file => file.size > 2 * 1024 * 1024);
		if (invalidSize) {
			setError("Each document size should be less than 2MB.");
			return;
		}

		const promises = files.map(file => {
			return new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(file);
			});
		});

		Promise.all(promises)
			.then(base64s => {
				const updated = [...previews, ...base64s];
				setPreviews(updated);
				onChange(JSON.stringify(updated));
			})
			.catch(() => {
				setError("Failed to read document files.");
			});
	};

	const handleRemoveAtIndex = (index: number, e: React.MouseEvent) => {
		e.stopPropagation();
		const updated = previews.filter((_, i) => i !== index);
		setPreviews(updated);
		onChange(updated.length > 0 ? JSON.stringify(updated) : null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const triggerSelect = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="flex flex-col items-center justify-center w-full space-y-3">
			{/* Scan line style overlay */}
			<style dangerouslySetInnerHTML={{ __html: `
				@keyframes scan-animation {
					0%, 100% {
						top: 0%;
						opacity: 0.2;
					}
					50% {
						top: 100%;
						opacity: 0.8;
					}
				}
				.animate-scanner-line {
					animation: scan-animation 3s infinite ease-in-out;
				}
				.kyc-scrollbar::-webkit-scrollbar {
					height: 5px;
				}
				.kyc-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.kyc-scrollbar::-webkit-scrollbar-thumb {
					background-color: rgba(156, 163, 175, 0.25);
					border-radius: 9999px;
				}
				.kyc-scrollbar::-webkit-scrollbar-thumb:hover {
					background-color: rgba(156, 163, 175, 0.45);
				}
			`}} />

			{previews.length > 0 ? (
				<div className="w-full max-w-xl">
					{/* Fixed Add Slot (on left) and Scrollable Images (on right) */}
					<div className="flex items-center gap-4 w-full overflow-hidden">
						{/* Fixed Add Document slot */}
						{previews.length < 6 && (
							<div
								onClick={triggerSelect}
								className="relative group cursor-pointer h-28 sm:h-32 aspect-[1.586/1] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/40 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-100/20 dark:hover:bg-zinc-900/20 flex flex-col items-center justify-center p-2 transition-all duration-300 shadow-sm shrink-0"
							>
								<div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
									</svg>
								</div>
								<span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 mt-1.5 group-hover:text-primary transition-colors">
									Add Side
								</span>
								<span className="text-[8px] text-zinc-400 dark:text-zinc-500">
									Front / Back Page
								</span>
							</div>
						)}

						{/* Horizontal Scrollable row of previews */}
						<div className="flex-1 flex gap-3 overflow-x-auto pb-2.5 pt-1 px-1 kyc-scrollbar">
							{previews.map((preview, index) => (
								<div
									key={index}
									className="relative group h-28 sm:h-32 aspect-[1.586/1] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/80 flex items-center justify-center shadow-sm shrink-0"
								>
									{/* Document Preview Image */}
									<img
										src={preview}
										alt={`KYC Document Preview ${index + 1}`}
										className="w-full h-full object-contain"
									/>
									{/* Document Border Frame Overlay */}
									<div className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />

									{/* Page Badge */}
									<div className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
										Page {index + 1}
									</div>

									{/* Hover Overlay */}
									<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-[9px] font-bold gap-2">
										Document Page Image
									</div>

									{/* Remove button */}
									<button
										onClick={(e) => handleRemoveAtIndex(index, e)}
										type="button"
										className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md border border-white dark:border-zinc-900 transition-all scale-95 hover:scale-100 cursor-pointer"
										title="Remove Page"
									>
										<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
											<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Under scroll help info */}
					<div className="flex justify-between items-center mt-2 px-1">
						<button
							type="button"
							onClick={triggerSelect}
							className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
						>
							Upload More Images
						</button>
						<span className="text-[9px] text-zinc-400 dark:text-zinc-500">
							Total: {previews.length} file(s) (Scroll right to view all →)
						</span>
					</div>
				</div>
			) : (
				<div
					onClick={triggerSelect}
					className="relative group cursor-pointer w-full max-w-md aspect-[1.586/1] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/40 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-100/20 dark:hover:bg-zinc-900/20 flex flex-col items-center justify-center p-4 transition-all duration-300 shadow-sm"
				>
					<div className="text-center space-y-4 p-4 flex flex-col items-center w-full">
						{/* Mini Document Wireframe Representation */}
						<div className="relative w-48 h-28 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex p-3 gap-3 overflow-hidden group-hover:scale-[1.03] transition-transform duration-300">
							{/* Scanner Animation Line */}
							<div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-scanner-line" style={{ top: '0%' }} />

							{/* Photo frame */}
							<div className="flex flex-col items-center justify-between w-1/3 h-full">
								<div className="w-12 h-14 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
									<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<div className="w-8 h-4 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700" />
							</div>

							{/* Lines representing fields */}
							<div className="flex-1 flex flex-col justify-center space-y-2">
								<div className="h-1.5 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-1.5 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-1 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
								<div className="mt-2 flex gap-1">
									<div className="h-3 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
									<div className="h-3 w-10 rounded bg-zinc-100 dark:bg-zinc-800" />
								</div>
							</div>
						</div>

						<div className="flex flex-col items-center">
							<span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 group-hover:text-primary transition-colors">
								<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
								</svg>
								Click to upload ID Card Copy
							</span>
							<span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[280px] leading-normal">
								Aadhaar Card, PAN Card, Voter ID, or DL (Front & Back Copy)
							</span>
						</div>
					</div>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				multiple
			/>

			<div className="text-[10px] text-zinc-400 dark:text-zinc-500">
				Supported formats: JPG, PNG, WEBP. Max size: 2MB.
			</div>

			{error && (
				<span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
					{error}
				</span>
			)}
		</div>
	);
};
