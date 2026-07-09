"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface LightGalleryProps {
	images: string[];
	initialIndex?: number;
	isOpen: boolean;
	onClose: () => void;
	title?: string;
}

export function LightGallery({
	images,
	initialIndex = 0,
	isOpen,
	onClose,
	title = "Document Viewer",
}: LightGalleryProps) {
	const [mounted, setMounted] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [position, setPosition] = useState({ x: 0, y: 0 });
	
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	// Sync current index when initial index changes or gallery opens
	useEffect(() => {
		if (isOpen) {
			setCurrentIndex(initialIndex);
			resetControls();
			// Disable background scrolling
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen, initialIndex]);

	// Reset zoom, rotation and position
	const resetControls = () => {
		setZoom(1);
		setRotation(0);
		setPosition({ x: 0, y: 0 });
	};

	// Keyboard support
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "ArrowRight" && images.length > 1) {
				handleNext();
			} else if (e.key === "ArrowLeft" && images.length > 1) {
				handlePrev();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, currentIndex, images]);

	if (!isOpen || images.length === 0 || !mounted) return null;

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
		resetControls();
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
		resetControls();
	};

	const zoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.25, 4));
	};

	const zoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.25, 0.5));
	};

	const rotateRight = () => {
		setRotation((prev) => (prev + 90) % 360);
	};

	const handleDownload = async () => {
		try {
			const imageUrl = images[currentIndex];
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `document_${currentIndex + 1}.${blob.type.split("/")[1] || "jpg"}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			// Fallback: open in new tab
			window.open(images[currentIndex], "_blank");
		}
	};

	// Dragging functionality when zoomed in
	const handleMouseDown = (e: React.MouseEvent) => {
		if (zoom <= 1) return;
		e.preventDefault();
		setIsDragging(true);
		setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || zoom <= 1) return;
		e.preventDefault();
		setPosition({
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y,
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	return createPortal(
		<div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-md select-none justify-between animate-fade-in">
			{/* Top Bar */}
			<div className="flex items-center justify-between p-4 bg-zinc-900/60 border-b border-zinc-800/50 backdrop-blur-md z-10 text-white">
				<div className="flex flex-col">
					<span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</span>
					<span className="text-sm font-bold text-zinc-100">
						Page {currentIndex + 1} of {images.length}
					</span>
				</div>

				{/* Controls */}
				<div className="flex items-center gap-1.5 md:gap-3">
					{/* Zoom Out */}
					<button
						type="button"
						onClick={zoomOut}
						title="Zoom Out"
						className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
						</svg>
					</button>

					{/* Zoom In */}
					<button
						type="button"
						onClick={zoomIn}
						title="Zoom In"
						className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
						</svg>
					</button>

					{/* Reset Zoom */}
					{(zoom !== 1 || position.x !== 0 || position.y !== 0 || rotation !== 0) && (
						<button
							type="button"
							onClick={resetControls}
							title="Reset View"
							className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
						>
							<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
							</svg>
						</button>
					)}

					{/* Rotate */}
					<button
						type="button"
						onClick={rotateRight}
						title="Rotate"
						className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
						</svg>
					</button>

					{/* Download */}
					<button
						type="button"
						onClick={handleDownload}
						title="Download Image"
						className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
					</button>

					<div className="h-6 w-px bg-zinc-800 my-auto mx-1" />

					{/* Close */}
					<button
						type="button"
						onClick={onClose}
						title="Close (Esc)"
						className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
				{/* Navigation Left */}
				{images.length > 1 && (
					<button
						type="button"
						onClick={handlePrev}
						className="absolute left-4 z-25 p-3 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-white transition-all transform hover:scale-105 cursor-pointer border border-zinc-800/40"
					>
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				)}

				{/* Image Container */}
				<div
					className={`relative max-w-full max-h-full flex items-center justify-center ${
						zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
					}`}
					onMouseDown={handleMouseDown}
					onMouseMove={handleMouseMove}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
				>
					<img
						ref={imgRef}
						src={images[currentIndex]}
						alt={`Document Copy ${currentIndex + 1}`}
						style={{
							transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
							transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
						}}
						className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl select-none pointer-events-none"
					/>
				</div>

				{/* Navigation Right */}
				{images.length > 1 && (
					<button
						type="button"
						onClick={handleNext}
						className="absolute right-4 z-25 p-3 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-white transition-all transform hover:scale-105 cursor-pointer border border-zinc-800/40"
					>
						<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
							<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
				)}
			</div>

			{/* Thumbnails Bar */}
			{images.length > 1 && (
				<div className="bg-zinc-900/40 border-t border-zinc-900/50 p-4 flex justify-center gap-3 overflow-x-auto z-10">
					{images.map((img, idx) => (
						<button
							key={img + idx}
							type="button"
							onClick={() => {
								setCurrentIndex(idx);
								resetControls();
							}}
							className={`relative w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
								idx === currentIndex
									? "border-indigo-500 scale-105"
									: "border-transparent opacity-60 hover:opacity-100"
							}`}
						>
							<img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
						</button>
					))}
				</div>
			)}
		</div>,
		document.body
	);
}
