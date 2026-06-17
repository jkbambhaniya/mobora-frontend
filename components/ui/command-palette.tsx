"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard, slugify } from "@/context/vendor/dashboard-context";
import { logoutAction } from "@/actions/auth";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { confirmLogout } from "@/utils/confirm";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
}

interface CommandItem {
	id: string;
	category: "Navigation" | "Quick Actions" | "Devices";
	label: string;
	subLabel?: string;
	badge?: string;
	icon: React.ReactNode;
	action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
	isOpen,
	onClose,
}) => {
	const router = useRouter();
	const { devices } = useDashboard();
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [mounted, setMounted] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setMounted(true);
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	// Reset search and selection when palette opens
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setSearch("");
				setSelectedIndex(0);
				inputRef.current?.focus();
			}, 50);
			document.body.style.overflow = "hidden";
			return () => clearTimeout(timer);
		} else {
			document.body.style.overflow = "unset";
		}
	}, [isOpen]);

	useOutsideClick(containerRef, onClose, isOpen);

	// Global helper to trigger global theme changes
	const toggleThemeGlobal = () => {
		const isDark = document.documentElement.classList.contains("dark");
		const nextTheme = isDark ? "light" : "dark";
		if (nextTheme === "dark") {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
		window.dispatchEvent(new Event("themechange"));
	};

	// Define static commands
	const navigationCommands: CommandItem[] = [
		{
			id: "nav-overview",
			category: "Navigation",
			label: "Go to Overview Dashboard",
			subLabel: "System analytics & business metrics",
			badge: "G D",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
					/>
				</svg>
			),
			action: () => {
				router.push("/dashboard");
				onClose();
			},
		},
		{
			id: "nav-device",
			category: "Navigation",
			label: "Go to Inventory",
			subLabel: "Manage listings, conditions, prices & stock",
			badge: "G I",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			),
			action: () => {
				router.push("/inventory");
				onClose();
			},
		},
		{
			id: "nav-specifications",
			category: "Navigation",
			label: "Go to Specifications Desk",
			subLabel: "Configure dynamic Brand, Model, Storage and RAM values",
			badge: "G P",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
					/>
				</svg>
			),
			action: () => {
				router.push("/specifications");
				onClose();
			},
		},
		{
			id: "nav-exchanges",
			category: "Navigation",
			label: "Go to Trade-In & Exchange Desk",
			subLabel: "Appraise trade requests & submit valuations",
			badge: "G E",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
					/>
				</svg>
			),
			action: () => {
				router.push("/exchanges");
				onClose();
			},
		},
		{
			id: "nav-orders",
			category: "Navigation",
			label: "Go to Sales Orders Ledger",
			subLabel: "Track customer purchases and exchange orders",
			badge: "G O",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
					/>
				</svg>
			),
			action: () => {
				router.push("/orders");
				onClose();
			},
		},
		{
			id: "nav-billing",
			category: "Navigation",
			label: "Go to Smart Invoicing Desk",
			subLabel: "GST & Margin Scheme POS billing terminal",
			badge: "G B",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			),
			action: () => {
				router.push("/billing");
				onClose();
			},
		},

		{
			id: "nav-customers",
			category: "Navigation",
			label: "Go to Customers Desk Directory",
			subLabel: "View clients profiles & historical interaction list",
			badge: "G C",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			),
			action: () => {
				router.push("/customer");
				onClose();
			},
		},
		{
			id: "nav-trades",
			category: "Navigation",
			label: "Go to Device Lifecycle Tracker",
			subLabel: "Audit specific IMEI buybacks and sales history",
			badge: "G T",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
			),
			action: () => {
				router.push("/trades");
				onClose();
			},
		},
		{
			id: "nav-messages",
			category: "Navigation",
			label: "Go to Messages & Support Desk",
			subLabel: "Open chat module for customer live messaging",
			badge: "G M",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
			),
			action: () => {
				router.push("/chat");
				onClose();
			},
		},
		{
			id: "nav-settings",
			category: "Navigation",
			label: "Go to Profile Settings Page",
			subLabel:
				"Configure profile credentials, business settings, and security",
			badge: "G S",
			icon: (
				<svg
					className="w-4 h-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			),
			action: () => {
				router.push("/profile");
				onClose();
			},
		},
	];

	const quickActions: CommandItem[] = [
		{
			id: "act-theme",
			category: "Quick Actions",
			label: "Toggle Visual Mode",
			subLabel: "Switch between Dark and Light mode themes",
			badge: "T T",
			icon: (
				<svg
					className="w-4 h-4 text-violet-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			),
			action: () => {
				toggleThemeGlobal();
				onClose();
			},
		},
		{
			id: "act-logout",
			category: "Quick Actions",
			label: "Sign Out / Log Out",
			subLabel: "Terminate vendor session safely",
			badge: "Esc",
			icon: (
				<svg
					className="w-4 h-4 text-rose-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			),
			action: () => {
				onClose();
				confirmLogout(async () => {
					try {
						await logoutAction();
					} catch (err) {
						console.error("Logout failed:", err);
					}
					window.location.href = "/";
				});
			},
		},
	];

	// Map devices to dynamic list
	const deviceCommands: CommandItem[] = devices.map((dev) => {
		const isImeiSearch =
			search.trim() &&
			dev.imei &&
			dev.imei.includes(search.trim()) &&
			/^\d+$/.test(search.trim());
		return {
			id: `dev-${dev.id}`,
			category: "Devices",
			label: isImeiSearch
				? `View Lifecycle History: ${dev.brand} ${dev.model}`
				: `${dev.brand} ${dev.model}`,
			subLabel: isImeiSearch
				? `Timeline Ledger for IMEI: ${dev.imei} • ₹${dev.price.toLocaleString()}`
				: `${dev.storage} • ${dev.color} • ${dev.condition} condition • ${dev.imei ? `IMEI: ${dev.imei} • ` : ""}₹${dev.price.toLocaleString()} (${dev.stock} left)`,
			badge: "↵",
			icon: (
				<svg
					className="w-4 h-4 text-sky-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			),
			action: () => {
				if (isImeiSearch && dev.imei) {
					router.push(
						`/mobiles/${encodeURIComponent(dev.brand)}/${slugify(dev.model)}/${dev.imei}`,
					);
				} else {
					router.push(
						`/mobiles/${encodeURIComponent(dev.brand)}/${slugify(dev.model)}`,
					);
				}
				onClose();
			},
		};
	});

	// Combine items
	const allItems = [
		...navigationCommands,
		...quickActions,
		...deviceCommands,
	];

	// Filter items based on search input
	const filteredItems = allItems.filter((item) => {
		const term = search.toLowerCase().trim();
		if (!term) return true;

		// Search matches label, subLabel, or category
		return (
			item.label.toLowerCase().includes(term) ||
			(item.subLabel && item.subLabel.toLowerCase().includes(term)) ||
			item.category.toLowerCase().includes(term)
		);
	});

	// Handle keyboard events inside the command palette dialog
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				filteredItems.length === 0
					? 0
					: (prev + 1) % filteredItems.length,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				filteredItems.length === 0
					? 0
					: (prev - 1 + filteredItems.length) % filteredItems.length,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			const target = filteredItems[selectedIndex];
			if (target) {
				target.action();
			}
		}
	};

	// Keep selected item scrolled into view
	useEffect(() => {
		const listEl = listRef.current;
		if (!listEl) return;

		const selectedEl = listEl.children[selectedIndex] as HTMLElement;
		if (!selectedEl) return;

		const listHeight = listEl.clientHeight;
		const listScrollTop = listEl.scrollTop;
		const elHeight = selectedEl.clientHeight;
		const elOffsetTop = selectedEl.offsetTop;

		if (elOffsetTop + elHeight > listScrollTop + listHeight) {
			listEl.scrollTop = elOffsetTop + elHeight - listHeight;
		} else if (elOffsetTop < listScrollTop) {
			listEl.scrollTop = elOffsetTop;
		}
	}, [selectedIndex]);

	if (!mounted || !isOpen) return null;

	// Group items by category to render beautifully
	const categories: Record<string, typeof filteredItems> = {};
	filteredItems.forEach((item) => {
		if (!categories[item.category]) {
			categories[item.category] = [];
		}
		categories[item.category].push(item);
	});

	// Flattened array indices corresponding to grouped renders
	// We need to match selection highlight to the correct item indices
	let flatIndex = 0;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fadeIn">
			{/* Search Palette Box */}
			<div
				ref={containerRef}
				onKeyDown={handleKeyDown}
				className="relative w-full max-w-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-2xl mt-[10vh] overflow-hidden flex flex-col max-h-[70vh] animate-scaleUp"
			>
				{/* Search Input Box */}
				<div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-250/20 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
					<svg
						className="w-5 h-5 text-zinc-400 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2.5"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						ref={inputRef}
						type="text"
						placeholder="Type a command, page name, or device model..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setSelectedIndex(0);
						}}
						className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
					/>
					<button
						onClick={onClose}
						className="text-[10px] font-mono font-bold text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shadow-sm cursor-pointer"
					>
						ESC
					</button>
				</div>

				{/* Dynamic List Container */}
				<div
					ref={listRef}
					className="flex-1 overflow-y-auto p-2.5 max-h-[50vh] space-y-3"
				>
					{filteredItems.length === 0 ? (
						<div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
							<svg
								className="w-8 h-8 mx-auto stroke-zinc-400 mb-2 opacity-50"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
								/>
							</svg>
							<p className="text-xs font-semibold">
								No results matching &quot;{search}&quot;
							</p>
							<p className="text-[10px] text-zinc-500 mt-1">
								Try typing another keyboard key or search
								parameter.
							</p>
						</div>
					) : (
						Object.keys(categories).map((categoryName) => (
							<div key={categoryName} className="space-y-1">
								{/* Category Header */}
								<h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400/90 dark:text-zinc-500/95 px-2.5 py-1">
									{categoryName}
								</h4>

								{/* Category Items */}
								<div className="space-y-0.5">
									{categories[categoryName].map((item) => {
										const currentFlatIndex = flatIndex;
										flatIndex += 1;
										const isSelected =
											selectedIndex === currentFlatIndex;

										return (
											<button
												key={item.id}
												onClick={item.action}
												onMouseEnter={() =>
													setSelectedIndex(
														currentFlatIndex,
													)
												}
												className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
													isSelected
														? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary shadow-sm scale-[1.005] border-l-2 border-primary dark:border-secondary pl-2.5"
														: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 border-l-2 border-transparent"
												}`}
											>
												<div className="flex items-center gap-3 min-w-0">
													{/* Item Icon */}
													<div
														className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "text-primary dark:text-secondary bg-white dark:bg-zinc-850 shadow-sm" : "text-zinc-450 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900"}`}
													>
														{item.icon}
													</div>

													{/* Item Text Details */}
													<div className="min-w-0">
														<p className="text-[12px] font-bold tracking-tight truncate">
															{item.label}
														</p>
														{item.subLabel && (
															<p
																className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-primary/75 dark:text-secondary/75" : "text-zinc-400 dark:text-zinc-500"}`}
															>
																{item.subLabel}
															</p>
														)}
													</div>
												</div>

												{/* Shortcut badge hint */}
												{item.badge && (
													<span
														className={`text-[8px] font-mono px-2 py-0.5 rounded border tracking-wider shrink-0 transition-colors ${
															isSelected
																? "bg-primary/25 border-primary/30 text-primary dark:bg-secondary/25 dark:border-secondary/30 dark:text-secondary font-bold"
																: "bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-500"
														}`}
													>
														{item.badge}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						))
					)}
				</div>

				{/* Command Palette Footer Help */}
				<div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold tracking-wide">
					<div className="flex items-center gap-3.5">
						<span className="flex items-center gap-1">
							<kbd className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-sm">
								↑↓
							</kbd>{" "}
							Navigate
						</span>
						<span className="flex items-center gap-1">
							<kbd className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-sm">
								↵
							</kbd>{" "}
							Select
						</span>
						<span className="flex items-center gap-1">
							<kbd className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-sm">
								Esc
							</kbd>{" "}
							Close
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<span>Global Shortcuts Enabled:</span>
						<kbd className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 rounded shadow-sm">
							G
						</kbd>
						<span>+</span>
						<kbd className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 rounded shadow-sm">
							Key
						</kbd>
					</div>
				</div>
			</div>
		</div>
	);
};
