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
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [previews, setPreviews] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

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

	// Clean up camera stream on unmount
	useEffect(() => {
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop());
			}
		};
	}, []);

	const startCamera = async (mode: "user" | "environment" = "environment") => {
		setError(null);
		try {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach(track => track.stop());
			}
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: mode },
				audio: false,
			});
			streamRef.current = stream;
			setIsCameraOpen(true);
			setFacingMode(mode);

			// Small timeout to allow element to render before setting srcObject
			setTimeout(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			}, 100);
		} catch (err: any) {
			console.error("Camera access error:", err);
			if (mode === "environment") {
				// Retry with front camera
				startCamera("user");
			} else {
				setError("Could not access camera. Please check permissions.");
			}
		}
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(track => track.stop());
			streamRef.current = null;
		}
		setIsCameraOpen(false);
	};

	const capturePhoto = () => {
		if (videoRef.current) {
			const video = videoRef.current;
			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 480;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				if (facingMode === "user") {
					ctx.translate(canvas.width, 0);
					ctx.scale(-1, 1);
				}
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
				const updated = [...previews, dataUrl];
				setPreviews(updated);
				onChange(JSON.stringify(updated));
				stopCamera();
			}
		}
	};

	const toggleCamera = () => {
		const nextMode = facingMode === "user" ? "environment" : "user";
		startCamera(nextMode);
	};

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
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={triggerSelect}
								className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
							>
								Upload File
							</button>
							<span className="text-[10px] text-zinc-300 dark:text-zinc-700">|</span>
							<button
								type="button"
								onClick={() => startCamera("environment")}
								className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
							>
								<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
									<path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Open Camera
							</button>
						</div>
						<span className="text-[9px] text-zinc-400 dark:text-zinc-500">
							Total: {previews.length} file(s) (Scroll right to view all →)
						</span>
					</div>
				</div>
			) : (
				<div
					className="relative group w-full max-w-md aspect-[2.3/1] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 dark:hover:border-primary/40 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-100/20 dark:hover:bg-zinc-900/20 flex flex-col items-center justify-center p-3 transition-all duration-300 shadow-sm"
				>
					<div className="text-center space-y-2.5 p-2 flex flex-col items-center w-full">
						{/* Mini Document Wireframe Representation */}
						<div className="relative w-36 h-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex p-2 gap-2 overflow-hidden group-hover:scale-[1.03] transition-transform duration-300">
							{/* Scanner Animation Line */}
							<div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-scanner-line" style={{ top: '0%' }} />

							{/* Photo frame */}
							<div className="flex flex-col items-center justify-between w-1/3 h-full">
								<div className="w-9 h-10 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								</div>
								<div className="w-6 h-3 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700" />
							</div>

							{/* Lines representing fields */}
							<div className="flex-1 flex flex-col justify-center space-y-1">
								<div className="h-1 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-1 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
								<div className="h-0.5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
								<div className="mt-1 flex gap-1">
									<div className="h-2 w-4 rounded bg-zinc-100 dark:bg-zinc-800" />
									<div className="h-2 w-8 rounded bg-zinc-100 dark:bg-zinc-800" />
								</div>
							</div>
						</div>

						<div className="flex flex-col items-center space-y-2">
							<span className="block text-[9px] text-zinc-400 dark:text-zinc-500 max-w-[280px] leading-normal">
								Aadhaar Card, PAN Card, Voter ID, or DL (Front & Back Copy)
							</span>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										triggerSelect();
									}}
									className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-primary hover:border-primary/50 transition-all shadow-sm cursor-pointer"
								>
									<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
										<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
									</svg>
									Upload File
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										startCamera("environment");
									}}
									className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-primary hover:border-primary/50 transition-all shadow-sm cursor-pointer"
								>
									<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									Take Photo
								</button>
							</div>
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

			{/* Camera Streaming Modal Overlay */}
			{isCameraOpen && (
				<div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
					<div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/50">
							<span className="text-sm font-bold text-white tracking-wide">Take KYC Document Photo</span>
							<button
								type="button"
								onClick={stopCamera}
								className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Video Feed */}
						<div className="relative aspect-[4/3] bg-black flex items-center justify-center">
							<video
								ref={videoRef}
								autoPlay
								playsInline
								className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
							/>
							{/* Frame indicator */}
							<div className="absolute inset-6 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
								<div className="text-[10px] font-semibold text-white/50 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full uppercase tracking-wider">
									Align ID card inside this box
								</div>
							</div>
						</div>

						{/* Controls */}
						<div className="p-5 bg-zinc-950 flex justify-between items-center gap-4">
							<button
								type="button"
								onClick={toggleCamera}
								className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow border border-zinc-700 cursor-pointer"
								title="Switch Camera"
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
									<path d="M8.5 14.5A2.5 2.5 0 0 1 12 12m3.5-2.5A2.5 2.5 0 0 1 12 12" />
									<path d="m14 7.5 1.5 2.5-2.5 1.5M10 16.5l-1.5-2.5 2.5-1.5" />
								</svg>
							</button>

							{/* Capture shutter button */}
							<button
								type="button"
								onClick={capturePhoto}
								className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white hover:bg-zinc-100 active:scale-95 transition-all shadow-lg cursor-pointer"
								title="Capture Photo"
							>
								<div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-white" />
							</button>

							<button
								type="button"
								onClick={stopCamera}
								className="text-xs font-bold text-zinc-400 hover:text-white py-2 px-4 transition-colors cursor-pointer"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
