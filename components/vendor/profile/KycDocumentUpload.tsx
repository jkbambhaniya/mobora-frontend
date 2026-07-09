"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { LightGallery } from "@/components/ui/LightGallery";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface KycDocumentUploadProps {
	value?: string;
	onChange: (base64: string | null) => void;
	name: string;
}

interface CropState {
	imageUrl: string;
	/** index of the pending file in pdfPages[] or -1 for a regular image */
	pageIndex: number;
	/** all pages from a PDF (base64 strings), null for regular image */
	pdfPages: string[] | null;
}

/* ─────────────────────────────────────────────────────────────
   Helper – crop a single image using canvas
───────────────────────────────────────────────────────────── */
function cropImageToCanvas(
	src: string,
	crop: { x: number; y: number; width: number; height: number },
	naturalWidth: number,
	naturalHeight: number,
	previewWidth: number,
	previewHeight: number
): Promise<string> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const scaleX = naturalWidth / previewWidth;
			const scaleY = naturalHeight / previewHeight;
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(crop.width * scaleX);
			canvas.height = Math.round(crop.height * scaleY);
			const ctx = canvas.getContext("2d")!;
			ctx.drawImage(
				img,
				Math.round(crop.x * scaleX),
				Math.round(crop.y * scaleY),
				canvas.width,
				canvas.height,
				0,
				0,
				canvas.width,
				canvas.height
			);
			resolve(canvas.toDataURL("image/jpeg", 0.92));
		};
		img.src = src;
	});
}

/* ─────────────────────────────────────────────────────────────
   ImageCropModal – pure-CSS drag-to-select cropper
───────────────────────────────────────────────────────────── */
interface CropBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

function ImageCropModal({
	src,
	onConfirm,
	onAddAnother,
	onSkip,
	onClose,
	pageLabel,
}: {
	src: string;
	onConfirm: (cropped: string) => void;
	onAddAnother: (cropped: string) => void;
	onSkip: () => void;
	onClose: () => void;
	pageLabel?: string;
}) {
	const imgRef = useRef<HTMLImageElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const [cropBox, setCropBox] = useState<CropBox | null>(null);
	const [dragging, setDragging] = useState(false);
	const dragStart = useRef<{ x: number; y: number } | null>(null);

	const getRelativePos = (e: React.MouseEvent | MouseEvent) => {
		const rect = overlayRef.current!.getBoundingClientRect();
		return {
			x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
			y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
		};
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		dragStart.current = getRelativePos(e);
		setCropBox(null);
		setDragging(true);
	};

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!dragging || !dragStart.current || !overlayRef.current) return;
			const pos = getRelativePos(e);
			const x = Math.min(pos.x, dragStart.current.x);
			const y = Math.min(pos.y, dragStart.current.y);
			const width = Math.abs(pos.x - dragStart.current.x);
			const height = Math.abs(pos.y - dragStart.current.y);
			setCropBox({ x, y, width, height });
		},
		[dragging]
	);

	const handleMouseUp = useCallback(() => {
		setDragging(false);
	}, []);

	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	/** Crop the current selection, returns null if no valid box */
	const getCropped = async (): Promise<string | null> => {
		const img = imgRef.current;
		const overlay = overlayRef.current;
		if (!img || !overlay) return null;
		if (!cropBox || cropBox.width < 5 || cropBox.height < 5) return null;
		return cropImageToCanvas(
			src,
			cropBox,
			img.naturalWidth,
			img.naturalHeight,
			overlay.clientWidth,
			overlay.clientHeight
		);
	};

	const handleConfirm = async () => {
		const cropped = await getCropped();
		if (!cropped) {
			// No selection → use full image
			onSkip();
			return;
		}
		onConfirm(cropped);
	};

	/** Save this crop, clear selection — user can draw another on same image */
	const handleAddAnother = async () => {
		const cropped = await getCropped();
		if (!cropped) return; // nothing selected yet
		onAddAnother(cropped);
		setCropBox(null); // clear the box so user can draw a fresh selection
	};

	const hasCrop = cropBox && cropBox.width > 5 && cropBox.height > 5;

	if (typeof document === "undefined") return null;
	return createPortal(
		<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
			<div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-zinc-800">
					<div>
						<span className="text-sm font-bold text-white">Crop Image</span>
						{pageLabel && (
							<span className="ml-2 text-xs text-zinc-400">{pageLabel}</span>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Instruction */}
				<div className="px-4 py-2 bg-zinc-950/50 text-xs text-zinc-400 text-center">
					Drag to select a region. Use <strong className="text-zinc-300">+ Add Crop</strong> to save &amp; select another region on the same image.
				</div>

				{/* Image area */}
				<div
					ref={overlayRef}
					onMouseDown={handleMouseDown}
					className="relative select-none cursor-crosshair flex items-center justify-center bg-black max-h-[60vh] overflow-hidden"
					style={{ userSelect: "none" }}
				>
					<img
						ref={imgRef}
						src={src}
						alt="crop preview"
						className="max-w-full max-h-[60vh] object-contain pointer-events-none"
						draggable={false}
					/>
					{/* Dark overlay outside crop */}
					{cropBox && cropBox.width > 2 && cropBox.height > 2 && (
						<div className="absolute inset-0 pointer-events-none">
							{/* Top */}
							<div className="absolute bg-black/50" style={{ top: 0, left: 0, width: "100%", height: cropBox.y }} />
							{/* Bottom */}
							<div className="absolute bg-black/50" style={{ top: cropBox.y + cropBox.height, left: 0, width: "100%", bottom: 0 }} />
							{/* Left */}
							<div className="absolute bg-black/50" style={{ top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }} />
							{/* Right */}
							<div className="absolute bg-black/50" style={{ top: cropBox.y, left: cropBox.x + cropBox.width, right: 0, height: cropBox.height }} />
							{/* Crop border */}
							<div
								className="absolute border-2 border-primary"
								style={{ top: cropBox.y, left: cropBox.x, width: cropBox.width, height: cropBox.height }}
							>
								{/* Corner handles */}
								{[["top-0 left-0", "-translate-x-1/2 -translate-y-1/2"],
									["top-0 right-0", "translate-x-1/2 -translate-y-1/2"],
									["bottom-0 left-0", "-translate-x-1/2 translate-y-1/2"],
									["bottom-0 right-0", "translate-x-1/2 translate-y-1/2"],
								].map(([pos, translate], i) => (
									<div key={i} className={`absolute ${pos} w-3 h-3 bg-primary rounded-full transform ${translate}`} />
								))}
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="p-4 flex items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/50">
					{/* Left: skip */}
					<button
						type="button"
						onClick={onSkip}
						className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
					>
						Use Full Image
					</button>

					{/* Right: add another + confirm */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleAddAnother}
							disabled={!hasCrop}
							className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer
								${hasCrop
									? "text-primary border-primary/50 hover:bg-primary/10"
									: "text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50"
								}`}
						>
							<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
							</svg>
							Add Crop
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow cursor-pointer"
						>
							{hasCrop ? "Crop & Next" : "Next →"}
						</button>
					</div>
				</div>
			</div>
		</div>
	, document.body);
}

/* ─────────────────────────────────────────────────────────────
   PdfPasswordModal
───────────────────────────────────────────────────────────── */
function PdfPasswordModal({
	onSubmit,
	onClose,
	error,
}: {
	onSubmit: (password: string) => void;
	onClose: () => void;
	error?: string;
}) {
	const [pwd, setPwd] = useState("");
	const [show, setShow] = useState(false);

	if (typeof document === "undefined") return null;
	return createPortal(
		<div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
			<div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-white">
						<svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						<span className="font-bold text-sm">PDF Password Required</span>
					</div>
					<button type="button" onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<p className="text-xs text-zinc-400">This PDF is password-protected. Enter the password to unlock and extract images.</p>

				<div className="relative">
					<input
						type={show ? "text" : "password"}
						value={pwd}
						onChange={(e) => setPwd(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && onSubmit(pwd)}
						placeholder="Enter PDF password"
						autoFocus
						className="w-full h-10 px-4 pr-10 rounded-xl border border-zinc-700 bg-zinc-800 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-primary focus:outline-none"
					/>
					<button
						type="button"
						onClick={() => setShow((v) => !v)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
					>
						{show ? (
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
							</svg>
						) : (
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
							</svg>
						)}
					</button>
				</div>

				{error && (
					<p className="text-xs font-bold text-red-400">{error}</p>
				)}

				<button
					type="button"
					onClick={() => onSubmit(pwd)}
					className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer"
				>
					Unlock PDF
				</button>
			</div>
		</div>
	, document.body);
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
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

	// PDF state
	const [pdfPending, setPdfPending] = useState<{ file: File; needsPassword: boolean } | null>(null);
	const [pdfPasswordError, setPdfPasswordError] = useState<string | undefined>(undefined);

	// Crop state
	const [cropState, setCropState] = useState<CropState | null>(null);
	const cropQueue = useRef<string[]>([]); // queue of base64 images waiting to be cropped

	// LightGallery state
	const [galleryOpen, setGalleryOpen] = useState(false);
	const [galleryIndex, setGalleryIndex] = useState(0);

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

	/* ── PDF Processing ── */
	const renderPdfPages = async (file: File, password?: string): Promise<string[] | "password_required" | "wrong_password"> => {
		// Dynamically import pdfjs-dist to avoid SSR issues
		const pdfjsLib = await import("pdfjs-dist");
		// Use local worker
		pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

		const arrayBuffer = await file.arrayBuffer();
		const uint8 = new Uint8Array(arrayBuffer);

		try {
			const loadingTask = pdfjsLib.getDocument({
				data: uint8,
				password: password || "",
			});

			// Handle password exception during loading
			const pdf = await new Promise<any>((resolve, reject) => {
				loadingTask.promise.then(resolve, (reason: any) => {
					if (reason?.name === "PasswordException") {
						reject(reason);
					} else {
						reject(reason);
					}
				});

				loadingTask.onPassword = (updateCallback: (pwd: string) => void, reason: number) => {
					// reason 1 = need password, reason 2 = incorrect password
					reject({ name: "PasswordException", code: reason });
				};
			});

			const pages: string[] = [];
			for (let i = 1; i <= pdf.numPages; i++) {
				const page = await pdf.getPage(i);
				const viewport = page.getViewport({ scale: 2 });
				const canvas = document.createElement("canvas");
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				const ctx = canvas.getContext("2d")!;
				await page.render({ canvasContext: ctx, viewport }).promise;
				pages.push(canvas.toDataURL("image/jpeg", 0.92));
			}
			return pages;
		} catch (err: any) {
			if (err?.name === "PasswordException") {
				if (err?.code === 2) return "wrong_password";
				return "password_required";
			}
			throw err;
		}
	};

	const processPdf = async (file: File, password?: string) => {
		setError(null);
		try {
			const result = await renderPdfPages(file, password);
			if (result === "password_required") {
				setPdfPending({ file, needsPassword: true });
				setPdfPasswordError(undefined);
				return;
			}
			if (result === "wrong_password") {
				setPdfPasswordError("Incorrect password. Please try again.");
				return;
			}
			setPdfPending(null);
			setPdfPasswordError(undefined);
			// Start crop queue for PDF pages
			cropQueue.current = [...result];
			showNextCropFromQueue([], result, true);
		} catch (e) {
			setError("Failed to process PDF file.");
		}
	};

	/* ── Crop Queue ── */
	// allItems = full list of all images being processed (PDF pages or plain images)
	const showNextCropFromQueue = (currentPreviews: string[], allItems: string[], isPdf: boolean) => {
		if (cropQueue.current.length === 0) return;
		const nextImg = cropQueue.current[0];
		const pageIndex = allItems.length - cropQueue.current.length;
		setCropState({
			imageUrl: nextImg,
			pageIndex,
			pdfPages: isPdf ? allItems : null,
		});
	};

	const handleCropConfirm = (croppedBase64: string) => {
		cropQueue.current = cropQueue.current.slice(1);
		const updatedPreviews = [...previews, croppedBase64];
		setPreviews(updatedPreviews);
		onChange(JSON.stringify(updatedPreviews));
		if (cropQueue.current.length === 0) {
			setCropState(null);
		} else {
			// More items in queue (more images or PDF pages)
			const isPdf = cropState?.pdfPages !== null;
			const allItems = cropState?.pdfPages ?? [];
			showNextCropFromQueue(updatedPreviews, allItems, isPdf);
		}
	};

	const handleCropSkip = () => {
		// Use original (full) image for this item
		const fullImage = cropState?.imageUrl || "";
		cropQueue.current = cropQueue.current.slice(1);
		const updatedPreviews = [...previews, fullImage];
		setPreviews(updatedPreviews);
		onChange(JSON.stringify(updatedPreviews));
		if (cropQueue.current.length === 0) {
			setCropState(null);
		} else {
			const isPdf = cropState?.pdfPages !== null;
			const allItems = cropState?.pdfPages ?? [];
			showNextCropFromQueue(updatedPreviews, allItems, isPdf);
		}
	};

	const handleCropClose = () => {
		cropQueue.current = [];
		setCropState(null);
	};

	/** Save a crop but stay on the same image (do NOT advance queue) */
	const handleCropAddAnother = (croppedBase64: string) => {
		const updatedPreviews = [...previews, croppedBase64];
		setPreviews(updatedPreviews);
		onChange(JSON.stringify(updatedPreviews));
		// cropState stays as-is — modal stays open for another region
	};

	/* ── File Input Handler ── */
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const imageBase64s: string[] = [];

		for (const file of files) {
			if (file.type === "application/pdf") {
				if (file.size > 10 * 1024 * 1024) {
					setError("PDF size should be less than 10MB.");
					continue;
				}
				await processPdf(file);
			} else if (file.type.startsWith("image/")) {
				if (file.size > 2 * 1024 * 1024) {
					setError("Each image size should be less than 2MB.");
					continue;
				}
				const base64 = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(file);
				});
				imageBase64s.push(base64);
			} else {
				setError("Please select image or PDF files only.");
			}
		}

		// Queue ALL images together so they crop one after another
		if (imageBase64s.length > 0) {
			cropQueue.current = [...imageBase64s];
			setCropState({ imageUrl: imageBase64s[0], pageIndex: 0, pdfPages: null });
		}

		// Reset input
		if (fileInputRef.current) fileInputRef.current.value = "";
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

	/* ── Camera ── */
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

			setTimeout(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			}, 100);
		} catch (err: any) {
			console.error("Camera access error:", err);
			if (mode === "environment") {
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
				stopCamera();
				// Show crop for captured photo
				cropQueue.current = [dataUrl];
				setCropState({ imageUrl: dataUrl, pageIndex: 0, pdfPages: null });
			}
		}
	};

	const toggleCamera = () => {
		const nextMode = facingMode === "user" ? "environment" : "user";
		startCamera(nextMode);
	};

	/* ── Render ── */
	return (
		<div className="flex flex-col items-center justify-center w-full space-y-3">
			{/* Inline styles */}
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
									className="relative group h-28 sm:h-32 aspect-[1.586/1] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/80 flex items-center justify-center shadow-sm shrink-0 cursor-pointer"
									onClick={() => {
										setGalleryIndex(index);
										setGalleryOpen(true);
									}}
								>
									{/* Document Preview Image */}
									<img
										src={preview}
										alt={`KYC Document Preview ${index + 1}`}
										className="w-full h-full object-contain pointer-events-none"
									/>
									{/* Document Border Frame Overlay */}
									<div className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />

									{/* Page Badge */}
									<div className="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
										Page {index + 1}
									</div>

									{/* Hover Overlay — click to view */}
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
										<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
										<span className="text-white text-[9px] font-bold">View</span>
									</div>

									{/* Remove button */}
									<button
										onClick={(e) => handleRemoveAtIndex(index, e)}
										type="button"
										className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md border border-white dark:border-zinc-900 transition-all scale-95 hover:scale-100 cursor-pointer z-10"
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
								Aadhaar Card, PAN Card, Voter ID, or DL (Front &amp; Back Copy)
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

			{/* Hidden file input — accept images AND PDFs */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*,application/pdf"
				onChange={handleFileChange}
				className="hidden"
				multiple
			/>

			<div className="text-[10px] text-zinc-400 dark:text-zinc-500">
				Supported formats: JPG, PNG, WEBP, PDF. Max size: 2MB (image) / 10MB (PDF).
			</div>

			{error && (
				<span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
					{error}
				</span>
			)}

			{/* ── PDF Password Modal ── */}
			{pdfPending?.needsPassword && (
				<PdfPasswordModal
					onSubmit={(pwd) => processPdf(pdfPending.file, pwd)}
					onClose={() => {
						setPdfPending(null);
						setPdfPasswordError(undefined);
					}}
					error={pdfPasswordError}
				/>
			)}

			{/* ── Light Gallery ── */}
			<LightGallery
				images={previews}
				initialIndex={galleryIndex}
				isOpen={galleryOpen}
				onClose={() => setGalleryOpen(false)}
				title="KYC Document Preview"
			/>

			{/* ── Image Crop Modal ── */}
			{cropState && (() => {
				const totalItems = cropState.pdfPages
					? cropState.pdfPages.length
					: cropState.pageIndex + 1 + cropQueue.current.length;
				const label = cropState.pdfPages
					? `Page ${cropState.pageIndex + 1} of ${totalItems}`
					: totalItems > 1
						? `Image ${cropState.pageIndex + 1} of ${totalItems}`
						: undefined;
				return (
					<ImageCropModal
						src={cropState.imageUrl}
						pageLabel={label}
						onConfirm={handleCropConfirm}
						onAddAnother={handleCropAddAnother}
						onSkip={handleCropSkip}
						onClose={handleCropClose}
					/>
				);
			})()}

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
