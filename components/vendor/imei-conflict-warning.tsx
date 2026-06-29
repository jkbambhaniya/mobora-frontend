"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export interface ImeiConflictInfo {
	isOwnStock: boolean;
	vendor: {
		name: string;
		shopName: string;
		phone: string;
		email: string;
	};
}

interface ImeiConflictWarningProps {
	conflictInfo: ImeiConflictInfo;
	onBack?: () => void;
	onClose?: () => void;
}

export function ImeiConflictWarning({
	conflictInfo,
	onBack,
	onClose,
}: ImeiConflictWarningProps) {
	return (
		<div className="p-5 border border-red-200 dark:border-red-950/40 bg-red-500/5 dark:bg-red-500/10 rounded-2xl space-y-4 text-left">
			<div className="flex items-start gap-3 text-red-650 dark:text-red-400">
				<svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div>
					<h3 className="font-extrabold text-sm uppercase tracking-wide">IMEI Registration Conflict!</h3>
					<p className="text-xs font-semibold mt-1 opacity-90 leading-relaxed">
						This IMEI is currently active and available in another vendor's stock. You cannot register it at this time.
					</p>
				</div>
			</div>

			<div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-xl space-y-3">
				<h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Owner Vendor Details</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
					<div>
						<span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider mb-0.5">Shop Name</span>
						<span className="text-zinc-800 dark:text-zinc-200">{conflictInfo.vendor.shopName}</span>
					</div>
					<div>
						<span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider mb-0.5">Contact Person</span>
						<span className="text-zinc-800 dark:text-zinc-200">{conflictInfo.vendor.name}</span>
					</div>
					<div>
						<span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider mb-0.5">Phone Number</span>
						<span>
							<a href={`tel:${conflictInfo.vendor.phone}`} className="text-primary hover:underline font-extrabold">
								{conflictInfo.vendor.phone}
							</a>
						</span>
					</div>
					<div>
						<span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider mb-0.5">Email Address</span>
						<span>
							<a href={`mailto:${conflictInfo.vendor.email}`} className="text-primary hover:underline">
								{conflictInfo.vendor.email}
							</a>
						</span>
					</div>
				</div>
			</div>

			<div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
				{onBack && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onBack}
					>
						Back to Form
					</Button>
				)}
				{onClose && (
					<Button
						type="button"
						variant="primary"
						size="sm"
						onClick={onClose}
					>
						Close
					</Button>
				)}
			</div>
		</div>
	);
}
