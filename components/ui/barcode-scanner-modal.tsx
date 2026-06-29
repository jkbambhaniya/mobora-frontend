"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface BarcodeScannerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onScanSuccess: (decodedText: string) => void;
	title?: string;
}

export function BarcodeScannerModal({
	isOpen,
	onClose,
	onScanSuccess,
	title = "Scan Barcode / IMEI",
 }: BarcodeScannerModalProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const [permissionError, setPermissionError] = useState<string | null>(null);

	const playBeep = () => {
		try {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(800, ctx.currentTime);
			gain.gain.setValueAtTime(0.08, ctx.currentTime);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start();
			setTimeout(() => {
				osc.stop();
				ctx.close();
			}, 130);
		} catch (e) {
			console.warn(e);
		}
	};

	useEffect(() => {
		let isMounted = true;
		if (isOpen) {
			setPermissionError(null);
			const timer = setTimeout(() => {
				if (!isMounted) return;
				try {
					const html5QrCode = new Html5Qrcode("scanner-reader", {
						formatsToSupport: [
							Html5QrcodeSupportedFormats.CODE_128,
							Html5QrcodeSupportedFormats.EAN_13,
							Html5QrcodeSupportedFormats.EAN_8,
							Html5QrcodeSupportedFormats.CODE_39,
							Html5QrcodeSupportedFormats.UPC_A,
							Html5QrcodeSupportedFormats.UPC_E,
							Html5QrcodeSupportedFormats.QR_CODE
						],
						verbose: false
					});
					scannerRef.current = html5QrCode;
					const config = {
						fps: 30,
						qrbox: { width: 280, height: 140 },
						aspectRatio: 1.777778,
						experimentalFeatures: {
							useBarCodeDetectorIfSupported: true,
						},
						videoConstraints: {
							facingMode: "environment",
							width: { min: 640, ideal: 1280 },
							height: { min: 480, ideal: 720 },
						}
					};
					html5QrCode
						.start(
							{ facingMode: "environment" },
							config,
							(decodedText) => {
								playBeep();
								onScanSuccess(decodedText);
								html5QrCode
									.stop()
									.then(() => {
										onClose();
									})
									.catch((err) => {
										console.error("Failed to stop scanner", err);
										onClose();
									});
							},
							() => {}
						)
						.catch((err) => {
							console.error("Scanner start error", err);
							const errMsg = err?.toString() || "";
							if (
								errMsg.includes("NotAllowedError") ||
								errMsg.includes("Permission denied")
							) {
								setPermissionError(
									"Camera permission was denied. Please allow camera access in your browser settings to scan barcodes."
								);
							} else {
								setPermissionError(
									"Could not start the camera scanner. Please make sure no other application is using the camera."
								);
							}
						});
				} catch (e) {
					console.error("Scanner init error", e);
					setPermissionError("Failed to initialize camera scanner.");
				}
			}, 300);

			return () => {
				isMounted = false;
				clearTimeout(timer);
				if (scannerRef.current) {
					const scanner = scannerRef.current;
					if (scanner.isScanning) {
						scanner
							.stop()
							.catch((err) => console.error("Scanner cleanup stop failed", err));
					}
				}
			};
		}
	}, [isOpen]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
			<div className="space-y-4 py-2">
				<div className="relative bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
					{permissionError ? (
						<div className="p-6 text-center space-y-3 flex flex-col items-center justify-center">
							<div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
								<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<p className="text-xs font-semibold text-zinc-300">Camera Access Required</p>
							<p className="text-[11px] text-zinc-500 leading-normal max-w-[240px]">
								{permissionError}
							</p>
						</div>
					) : (
						<>
							<div id="scanner-reader" className="w-full min-h-[220px] bg-black"></div>
							<div
								className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_8px_#ef4444] pointer-events-none"
								style={{
									animation: "scanLine 2s ease-in-out infinite",
									top: "50%",
								}}
							/>
							<style
								dangerouslySetInnerHTML={{
									__html: `
								@keyframes scanLine {
									0% { top: 10%; }
									50% { top: 90%; }
									100% { top: 10%; }
								}
							`,
								}}
							/>
						</>
					)}
				</div>

				<p className="text-[10px] text-zinc-500 text-center leading-normal">
					Align the device box EAN/IMEI barcode inside the scanning box.
				</p>

				<div className="flex justify-end pt-1">
					<Button type="button" variant="ghost" size="sm" onClick={onClose}>
						Close Camera
					</Button>
				</div>
			</div>
		</Modal>
	);
}
