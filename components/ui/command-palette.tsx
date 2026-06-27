"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard, slugify } from "@/context/vendor/dashboard-context";
import { logoutAction } from "@/actions/auth";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { confirmLogout } from "@/utils/confirm";
import toast from "react-hot-toast";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
}

interface CommandItem {
	id: string;
	category: "Navigation" | "Quick Actions" | "Devices" | "Customers";
	label: string;
	subLabel?: string;
	badge?: string;
	icon: React.ReactNode;
	action: () => void;
	searchKeywords?: string[];
	metaData?: {
		id?: string | number;
		brand?: string;
		model?: string;
		price?: number;
		stock?: number;
		condition?: string;
		storage?: string;
		ram?: string;
		color?: string;
		batteryHealth?: number;
		imei?: string;
		email?: string;
		phone?: string;
		spent?: number;
		orders?: number;
		kyc?: string;
		joined?: string;
		address?: string;
		purchases?: any[];
	};
}

// Component to highlight search terms
const HighlightText: React.FC<{ text: string; search: string }> = ({ text, search }) => {
	if (!search.trim()) return <span>{text}</span>;
	const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
	const parts = text.split(regex);
	return (
		<span>
			{parts.map((part, i) =>
				regex.test(part) ? (
					<mark key={i} className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-secondary rounded-[3px] px-0.5 font-bold">
						{part}
					</mark>
				) : (
					part
				)
			)}
		</span>
	);
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
	isOpen,
	onClose,
}) => {
	const router = useRouter();
	const { devices, customers } = useDashboard();
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [activeCategoryFilter, setActiveCategoryFilter] = useState<"All" | "Navigation" | "Devices" | "Customers" | "Quick Actions">("All");
	const [mounted, setMounted] = useState(false);
	const [inspectedItem, setInspectedItem] = useState<CommandItem | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Reset states when palette opens
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => {
				setSearch("");
				setSelectedIndex(0);
				setActiveCategoryFilter("All");
				setInspectedItem(null);
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

	// Copy to clipboard helper
	const handleCopyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard!`);
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
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
				</svg>
			),
			action: () => {
				router.push("/dashboard");
				onClose();
			},
			searchKeywords: ["overview", "dashboard", "analytics", "home", "metrics"],
		},
		{
			id: "nav-device",
			category: "Navigation",
			label: "Go to Inventory",
			subLabel: "Manage listings, conditions, prices & stock",
			badge: "G I",
			icon: (
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
			),
			action: () => {
				router.push("/inventory");
				onClose();
			},
			searchKeywords: ["inventory", "stock", "listing", "devices", "mobiles", "sell", "edit price"],
		},
		{
			id: "nav-specifications",
			category: "Navigation",
			label: "Go to Specifications Desk",
			subLabel: "Configure dynamic Brand, Model, Storage and RAM values",
			badge: "G P",
			icon: (
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
				</svg>
			),
			action: () => {
				router.push("/specifications");
				onClose();
			},
			searchKeywords: ["specifications", "brands", "models", "storage", "ram", "config"],
		},
		{
			id: "nav-customer",
			category: "Navigation",
			label: "Go to Customers Desk",
			subLabel: "View registered customer directory, spending & order history",
			badge: "G C",
			icon: (
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			),
			action: () => {
				router.push("/customer");
				onClose();
			},
			searchKeywords: ["customers", "clients", "buyers", "directory", "sales"],
		},
		{
			id: "nav-messages",
			category: "Navigation",
			label: "Go to Messages & Support Desk",
			subLabel: "Open chat module for customer live messaging",
			badge: "G M",
			icon: (
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
			),
			action: () => {
				router.push("/chat");
				onClose();
			},
			searchKeywords: ["messages", "chat", "live support", "sms", "vendor help", "customer support"],
		},
		{
			id: "nav-settings",
			category: "Navigation",
			label: "Go to Profile Settings Page",
			subLabel: "Configure profile credentials, business settings, and security",
			badge: "G S",
			icon: (
				<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			),
			action: () => {
				router.push("/profile");
				onClose();
			},
			searchKeywords: ["settings", "profile", "password", "shop details", "gst", "markup"],
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
				<svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
				</svg>
			),
			action: () => {
				toggleThemeGlobal();
				onClose();
			},
			searchKeywords: ["theme", "dark mode", "light mode", "toggle theme", "color scheme"],
		},
		{
			id: "act-logout",
			category: "Quick Actions",
			label: "Sign Out / Log Out",
			subLabel: "Terminate vendor session safely",
			badge: "Esc",
			icon: (
				<svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
			searchKeywords: ["logout", "signout", "exit", "close account"],
		},
	];

	// Map devices
	const deviceCommands: CommandItem[] = (devices || []).map((dev) => {
		const isImeiSearch =
			search.trim() &&
			dev.imei &&
			dev.imei.includes(search.trim()) &&
			/^\d+$/.test(search.trim());
		const targetPath = isImeiSearch && dev.imei
			? `/mobiles/${encodeURIComponent(dev.brand)}/${slugify(dev.model)}/${dev.imei}`
			: `/mobiles/${encodeURIComponent(dev.brand)}/${slugify(dev.model)}`;

		return {
			id: `dev-${dev.id}`,
			category: "Devices",
			label: `${dev.brand} ${dev.model}`,
			subLabel: `${dev.storage} • ${dev.color} • ${dev.condition} condition • ${dev.imei ? `IMEI: ${dev.imei} • ` : ""}₹${dev.price.toLocaleString()}`,
			badge: "↵",
			icon: (
				<svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
			),
			action: () => {
				router.push(targetPath);
				onClose();
			},
			searchKeywords: [
				dev.brand.toLowerCase(),
				dev.model.toLowerCase(),
				dev.color.toLowerCase(),
				dev.storage.toLowerCase(),
				dev.ram?.toLowerCase() || "",
				dev.imei || "",
				dev.condition.toLowerCase(),
			],
			metaData: {
				id: dev.id,
				brand: dev.brand,
				model: dev.model,
				price: dev.price,
				stock: dev.stock,
				condition: dev.condition,
				storage: dev.storage,
				ram: dev.ram,
				color: dev.color,
				batteryHealth: dev.batteryHealth,
				imei: dev.imei,
			},
		};
	});

	// Map customers
	const customerCommands: CommandItem[] = (customers || []).map((cust) => {
		return {
			id: `cust-${cust.id}`,
			category: "Customers",
			label: cust.name,
			subLabel: `${cust.phone} • ${cust.email || "No Email"} • spent ₹${cust.totalSpent.toLocaleString()}`,
			badge: "↵",
			icon: (
				<svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			),
			action: () => {
				router.push(`/customer/${cust.id}`);
				onClose();
			},
			searchKeywords: [
				cust.name.toLowerCase(),
				cust.phone,
				cust.email?.toLowerCase() || "",
				cust.address.toLowerCase(),
			],
			metaData: {
				id: cust.id,
				email: cust.email || undefined,
				phone: cust.phone,
				spent: cust.totalSpent,
				orders: cust.totalOrders,
				kyc: cust.kycStatus || "Not Checked",
				joined: cust.joinedDate,
				address: cust.address,
				purchases: cust.purchases || [],
			},
		};
	});

	// Combine items
	const allItems = [
		...navigationCommands,
		...quickActions,
		...deviceCommands,
		...customerCommands,
	];

	// Filter based on search query & active category tab
	const filteredItems = allItems.filter((item) => {
		if (activeCategoryFilter !== "All") {
			if (activeCategoryFilter === "Navigation" && item.category !== "Navigation") return false;
			if (activeCategoryFilter === "Devices" && item.category !== "Devices") return false;
			if (activeCategoryFilter === "Customers" && item.category !== "Customers") return false;
			if (activeCategoryFilter === "Quick Actions" && item.category !== "Quick Actions") return false;
		}

		const term = search.toLowerCase().trim();
		if (!term) return true;

		return (
			item.label.toLowerCase().includes(term) ||
			(item.subLabel && item.subLabel.toLowerCase().includes(term)) ||
			item.category.toLowerCase().includes(term) ||
			(item.searchKeywords && item.searchKeywords.some((kw) => kw.includes(term)))
		);
	});

	// Keep index in bound
	useEffect(() => {
		setSelectedIndex(0);
	}, [search, activeCategoryFilter]);

	// Action dispatcher
	const handleSelectAction = (item: CommandItem) => {
		if (item.category === "Devices" || item.category === "Customers") {
			setInspectedItem(item);
		} else {
			item.action();
		}
	};

	// Key bindings
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			if (inspectedItem) {
				setInspectedItem(null);
			} else {
				onClose();
			}
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!inspectedItem) {
				setSelectedIndex((prev) =>
					filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length
				);
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (!inspectedItem) {
				setSelectedIndex((prev) =>
					filteredItems.length === 0
						? 0
						: (prev - 1 + filteredItems.length) % filteredItems.length
				);
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (!inspectedItem) {
				const target = filteredItems[selectedIndex];
				if (target) {
					handleSelectAction(target);
				}
			}
		} else if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
			e.preventDefault();
			if (!inspectedItem) {
				const idx = parseInt(e.key) - 1;
				const filters: Array<typeof activeCategoryFilter> = ["All", "Navigation", "Devices", "Customers", "Quick Actions"];
				setActiveCategoryFilter(filters[idx]);
			}
		}
	};

	// Selected Item for Preview
	const selectedItem = filteredItems[selectedIndex];

	// Keep selected item scrolled into view
	useEffect(() => {
		const listEl = listRef.current;
		if (!listEl) return;

		const selectedEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
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

	// Group filtered items for render
	const categories: Record<string, typeof filteredItems> = {};
	filteredItems.forEach((item) => {
		if (!categories[item.category]) {
			categories[item.category] = [];
		}
		categories[item.category].push(item);
	});

	let flatIdxCounter = 0;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center p-0 md:p-4 bg-zinc-950/60 backdrop-blur-md animate-fadeIn">
			{/* Command Dialog Panel */}
			<div
				ref={containerRef}
				onKeyDown={handleKeyDown}
				className="relative w-full max-w-4xl bg-white/95 dark:bg-zinc-900/95 border-0 md:border border-zinc-200/90 dark:border-zinc-800/90 rounded-none md:rounded-2xl shadow-2xl mt-0 md:mt-[10vh] overflow-hidden flex flex-col h-screen md:h-auto max-h-screen md:max-h-[75vh] animate-scaleUp"
			>
				{/* Search Bar Input */}
				<div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20">
					{inspectedItem ? (
						<button
							onClick={() => setInspectedItem(null)}
							className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-secondary hover:underline cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
							</svg>
							Back to Search
						</button>
					) : (
						<svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					)}

					<input
						ref={inputRef}
						type="text"
						disabled={!!inspectedItem}
						placeholder={inspectedItem ? `Inspecting details for ${inspectedItem.label}` : "Search devices, IMEI, customers, settings..."}
						value={inspectedItem ? "" : search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-zinc-900 dark:text-zinc-50 placeholder-zinc-450 disabled:opacity-50"
					/>
					<button
						onClick={onClose}
						className="text-[9px] font-mono font-bold text-zinc-450 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm cursor-pointer"
					>
						ESC
					</button>
				</div>

				{/* Category Chips / Filters Menu */}
				{!inspectedItem && (
					<div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-50/30 dark:bg-zinc-950/10 border-b border-zinc-200/50 dark:border-zinc-800/40 overflow-x-auto scrollbar-none">
						{(["All", "Navigation", "Devices", "Customers", "Quick Actions"] as const).map((filterOpt, idx) => {
							const isActive = activeCategoryFilter === filterOpt;
							return (
								<button
									key={filterOpt}
									onClick={() => setActiveCategoryFilter(filterOpt)}
									className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
										isActive
											? "bg-primary text-white border-primary dark:bg-primary dark:text-white"
											: "bg-white dark:bg-zinc-850 text-zinc-650 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
									}`}
								>
									{filterOpt === "Navigation" ? "Pages" : filterOpt === "Quick Actions" ? "Actions" : filterOpt}
									<span className="ml-1 text-[8px] opacity-60 font-mono">Ctrl+{idx + 1}</span>
								</button>
							);
						})}
					</div>
				)}

				{/* Dynamic Screen Area */}
				{inspectedItem ? (
					/* INSPECTED ITEM FULL DETAILS VIEW */
					<div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-h-[65vh] bg-white dark:bg-zinc-900 scrollbar-thin">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
							<div className="flex items-center gap-3.5">
								<div className="p-3 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary shadow-sm">
									{inspectedItem.icon}
								</div>
								<div>
									<span className="text-[10px] uppercase tracking-widest font-extrabold text-primary dark:text-secondary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
										{inspectedItem.category}
									</span>
									<h2 className="text-xl font-black text-zinc-900 dark:text-zinc-55 mt-1">
										{inspectedItem.label}
									</h2>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<button
									onClick={() => inspectedItem.action()}
									className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all flex items-center gap-1.5 cursor-pointer"
								>
									Open Details Page
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
								</button>
								<button
									onClick={() => setInspectedItem(null)}
									className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer"
								>
									Back
								</button>
							</div>
						</div>

						{/* Device details layout */}
						{inspectedItem.category === "Devices" && inspectedItem.metaData && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-2 space-y-5">
									<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
										<h3 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Device Inventory Details</h3>
										
										<div className="grid grid-cols-2 gap-4">
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase">Brand</span>
												<p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{inspectedItem.metaData.brand}</p>
											</div>
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase">Model</span>
												<p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{inspectedItem.metaData.model}</p>
											</div>
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase">Storage Configuration</span>
												<p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{inspectedItem.metaData.storage} {inspectedItem.metaData.ram ? `/ ${inspectedItem.metaData.ram} RAM` : ""}</p>
											</div>
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase">Color Variant</span>
												<p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{inspectedItem.metaData.color}</p>
											</div>
										</div>
									</div>

									{inspectedItem.metaData.imei && (
										<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 flex items-center justify-between gap-4">
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase block">IMEI Identity</span>
												<p className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 select-all mt-0.5">{inspectedItem.metaData.imei}</p>
											</div>
											<button
												onClick={() => handleCopyToClipboard(inspectedItem.metaData?.imei || "", "IMEI")}
												className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer text-zinc-500 dark:text-zinc-400"
												title="Copy IMEI"
											>
												<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
												</svg>
											</button>
										</div>
									)}
								</div>

								<div className="space-y-4">
									<div className="bg-emerald-500/10 border border-emerald-500/25 p-5 rounded-2xl space-y-3">
										<span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">Pricing details</span>
										<div>
											<span className="text-[10px] text-emerald-800/85 dark:text-emerald-400/85 font-medium block">Current Selling Price</span>
											<p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{inspectedItem.metaData.price?.toLocaleString()}</p>
										</div>
										<div className="flex justify-between items-center pt-2 border-t border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
											<span>Available Stock:</span>
											<span className="font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-lg">{inspectedItem.metaData.stock} units</span>
										</div>
									</div>

									<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-2xl space-y-3 text-xs text-zinc-655 dark:text-zinc-400">
										<div className="flex justify-between items-center">
											<span className="text-zinc-400 font-semibold">Listing Condition:</span>
											<span className="font-extrabold bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-lg text-zinc-800 dark:text-zinc-200">{inspectedItem.metaData.condition}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-zinc-400 font-semibold">Battery health:</span>
											<span className="font-extrabold text-zinc-800 dark:text-zinc-200">{inspectedItem.metaData.batteryHealth}%</span>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Customer details layout */}
						{inspectedItem.category === "Customers" && inspectedItem.metaData && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="md:col-span-2 space-y-5">
									<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
										<h3 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Contact & Address</h3>
										
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase block">Phone Number</span>
												<div className="flex items-center gap-2 mt-1">
													<p className="font-bold text-zinc-800 dark:text-zinc-200 select-all">{inspectedItem.metaData.phone}</p>
													<button onClick={() => handleCopyToClipboard(inspectedItem.metaData?.phone || "", "Phone")} className="text-zinc-400 hover:text-zinc-600">
														<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
													</button>
												</div>
											</div>
											<div>
												<span className="text-[10px] font-bold text-zinc-400 uppercase block">Email address</span>
												<div className="flex items-center gap-2 mt-1">
													<p className="font-bold text-zinc-800 dark:text-zinc-200 select-all">{inspectedItem.metaData.email || "No Email Address"}</p>
													{inspectedItem.metaData.email && (
														<button onClick={() => handleCopyToClipboard(inspectedItem.metaData?.email || "", "Email")} className="text-zinc-400 hover:text-zinc-600">
															<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
														</button>
													)}
												</div>
											</div>
											<div className="md:col-span-2 pt-2 border-t border-zinc-150 dark:border-zinc-800/80">
												<span className="text-[10px] font-bold text-zinc-400 uppercase block">Billing Address</span>
												<p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-1 select-all">{inspectedItem.metaData.address || "No Address Saved"}</p>
											</div>
										</div>
									</div>

									{/* Purchases Timeline */}
									<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4">
										<h3 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Purchase History Ledger</h3>
										{inspectedItem.metaData.purchases && inspectedItem.metaData.purchases.length > 0 ? (
											<div className="space-y-3.5 max-h-[220px] overflow-y-auto scrollbar-thin">
												{inspectedItem.metaData.purchases.map((pur: any) => (
													<div key={pur.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/60 rounded-xl text-xs">
														<div className="space-y-0.5">
															<p className="font-extrabold text-zinc-800 dark:text-zinc-200">{pur.device}</p>
															<p className="text-[10px] text-zinc-400">{pur.date} • {pur.type}</p>
														</div>
														<div className="text-right">
															<p className="font-black text-primary dark:text-secondary">₹{pur.amount?.toLocaleString()}</p>
															<span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
																pur.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
															}`}>{pur.status}</span>
														</div>
													</div>
												))}
											</div>
										) : (
											<p className="text-xs text-zinc-450 italic py-2">No purchase records registered for this customer yet.</p>
										)}
									</div>
								</div>

								<div className="space-y-4">
									<div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl space-y-3">
										<span className="text-[10px] font-extrabold text-primary dark:text-secondary block uppercase tracking-wider">Lifetime value</span>
										<div>
											<span className="text-[10px] text-primary/80 dark:text-secondary/80 font-semibold block">Total Spent</span>
											<p className="text-2xl font-black text-primary dark:text-secondary mt-0.5">₹{inspectedItem.metaData.spent?.toLocaleString()}</p>
										</div>
										<div className="flex justify-between items-center pt-2 border-t border-primary/20 text-xs text-primary/80 dark:text-secondary/80">
											<span>Total Orders:</span>
											<span className="font-extrabold bg-primary/20 px-2 py-0.5 rounded-lg">{inspectedItem.metaData.orders} orders</span>
										</div>
									</div>

									<div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 p-5 rounded-2xl space-y-3 text-xs text-zinc-655 dark:text-zinc-400">
										<div className="flex justify-between items-center">
											<span className="text-zinc-400 font-semibold">KYC Verification:</span>
											<span className={`font-extrabold px-2 py-0.5 rounded-lg ${
												inspectedItem.metaData.kyc === "Verified"
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
											}`}>{inspectedItem.metaData.kyc}</span>
										</div>
										<div className="flex justify-between items-center">
											<span className="text-zinc-400 font-semibold">Joined Date:</span>
											<span className="font-bold text-zinc-800 dark:text-zinc-200">{inspectedItem.metaData.joined}</span>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					/* DUAL PANEL LIST + PREVIEW GRID */
					<div className="flex-1 flex min-h-0 divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
						{/* Left List Container */}
						<div
							ref={listRef}
							className="flex-1 overflow-y-auto p-3 space-y-3.5 max-h-[60vh] md:max-h-[50vh] scrollbar-thin"
						>
							{filteredItems.length === 0 ? (
								<div className="text-center py-12 text-zinc-400 dark:text-zinc-500">
									<svg className="w-9 h-9 mx-auto stroke-zinc-450 mb-2.5 opacity-55 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
									</svg>
									<p className="text-xs font-bold">No results matching &quot;{search}&quot;</p>
									<p className="text-[10px] text-zinc-450 mt-1">Try another brand name, specifications, phone number, or page route.</p>
								</div>
							) : (
								Object.keys(categories).map((categoryName) => (
									<div key={categoryName} className="space-y-1">
										<h4 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 py-1">
											{categoryName === "Navigation" ? "Pages" : categoryName}
										</h4>
										<div className="space-y-0.5">
											{categories[categoryName].map((item) => {
												const currentFlatIndex = flatIdxCounter;
												flatIdxCounter += 1;
												const isSelected = selectedIndex === currentFlatIndex;

												return (
													<button
														key={item.id}
														data-index={currentFlatIndex}
														onClick={() => handleSelectAction(item)}
														onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
														className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
															isSelected
																? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary border-l-2 border-primary dark:border-secondary pl-2.5 shadow-sm"
																: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 border-l-2 border-transparent"
														}`}
													>
														<div className="flex items-center gap-3.5 min-w-0">
															<div className={`p-2 rounded-lg shrink-0 transition-colors ${
																isSelected ? "text-primary dark:text-secondary bg-white dark:bg-zinc-800 shadow-sm" : "text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-850"
															}`}>
																{item.icon}
															</div>
															<div className="min-w-0">
																<p className="text-xs font-bold tracking-tight">
																	<HighlightText text={item.label} search={search} />
																</p>
																{item.subLabel && (
																	<p className={`text-[10px] mt-0.5 truncate font-medium ${
																		isSelected ? "text-primary/80 dark:text-secondary/80" : "text-zinc-400 dark:text-zinc-500"
																	}`}>
																		<HighlightText text={item.subLabel} search={search} />
																	</p>
																)}
															</div>
														</div>
														{item.badge && (
															<span className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all ${
																isSelected
																	? "bg-primary/20 border-primary/25 text-primary dark:bg-secondary/20 dark:border-secondary/25 dark:text-secondary font-bold"
																	: "bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-500"
															}`}>
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

						{/* Right Details Preview Pane (Desktop Only) */}
						{selectedItem && (
							<div className="hidden lg:flex w-[320px] bg-zinc-50/50 dark:bg-zinc-950/20 p-5 flex-col gap-4 overflow-y-auto">
								<div className="flex items-center gap-3">
									<div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-zinc-500 dark:text-zinc-400">
										{selectedItem.icon}
									</div>
									<div>
										<span className="text-[8px] uppercase tracking-widest font-extrabold text-primary/85 dark:text-secondary/85">
											{selectedItem.category}
										</span>
										<h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-55 mt-0.5 line-clamp-1">
											{selectedItem.label}
										</h4>
									</div>
								</div>

								<div className="h-[1px] bg-zinc-200 dark:bg-zinc-800" />

								{selectedItem.category === "Devices" && selectedItem.metaData && (
									<div className="space-y-3.5 text-xs text-zinc-655 dark:text-zinc-400">
										<div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 p-3 rounded-xl shadow-xs space-y-2">
											<div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
												<span>ESTIMATED PRICE</span>
												<span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold">ACTIVE STOCK</span>
											</div>
											<div className="flex justify-between items-baseline">
												<span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
													₹{selectedItem.metaData.price?.toLocaleString()}
												</span>
												<span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-250">
													{selectedItem.metaData.stock} units
												</span>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2">
											<div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30">
												<span className="text-[8px] font-bold text-zinc-400 block uppercase">Condition</span>
												<span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
													{selectedItem.metaData.condition}
												</span>
											</div>
											<div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30">
												<span className="text-[8px] font-bold text-zinc-400 block uppercase">Battery Health</span>
												<span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
													{selectedItem.metaData.batteryHealth}%
												</span>
											</div>
										</div>

										<div className="space-y-2 border border-zinc-200/50 dark:border-zinc-800/50 p-3 rounded-xl bg-white/40 dark:bg-zinc-900/10">
											{selectedItem.metaData.storage && (
												<div className="flex justify-between">
													<span className="text-zinc-400 font-medium">Storage/RAM:</span>
													<span className="font-bold text-zinc-800 dark:text-zinc-250">
														{selectedItem.metaData.storage} {selectedItem.metaData.ram ? `/ ${selectedItem.metaData.ram}` : ""}
													</span>
												</div>
											)}
											{selectedItem.metaData.color && (
												<div className="flex justify-between">
													<span className="text-zinc-400 font-medium">Color:</span>
													<span className="font-bold text-zinc-800 dark:text-zinc-250">{selectedItem.metaData.color}</span>
												</div>
											)}
											{selectedItem.metaData.imei && (
												<div className="flex flex-col gap-0.5 pt-1.5 border-t border-zinc-150 dark:border-zinc-800">
													<span className="text-[8px] font-bold text-zinc-450 uppercase block">IMEI NUMBER</span>
													<span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 text-[11px] select-all">
														{selectedItem.metaData.imei}
													</span>
												</div>
											)}
										</div>
									</div>
								)}

								{selectedItem.category === "Customers" && selectedItem.metaData && (
									<div className="space-y-3 text-xs text-zinc-655 dark:text-zinc-400">
										<div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 p-3 rounded-xl shadow-xs space-y-2">
											<span className="text-[8px] font-bold text-zinc-400 block uppercase">Customer Lifetime Value</span>
											<div className="flex justify-between items-baseline">
												<span className="text-lg font-extrabold text-primary dark:text-secondary">
													₹{selectedItem.metaData.spent?.toLocaleString()}
												</span>
												<span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">
													{selectedItem.metaData.orders} orders
												</span>
											</div>
										</div>

										<div className="space-y-2 border border-zinc-200/50 dark:border-zinc-800/50 p-3 rounded-xl bg-white/40 dark:bg-zinc-900/10">
											<div className="flex justify-between">
												<span className="text-zinc-400 font-medium">KYC Status:</span>
												<span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
													selectedItem.metaData.kyc === "Verified"
														? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
														: "bg-amber-500/15 text-amber-600 dark:text-amber-400"
												}`}>
													{selectedItem.metaData.kyc}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-zinc-400 font-medium">Joined:</span>
												<span className="font-bold text-zinc-800 dark:text-zinc-250">{selectedItem.metaData.joined}</span>
											</div>
										</div>

										<div className="space-y-1">
											<span className="text-[8px] font-bold text-zinc-400 block uppercase">Contact Details</span>
											<div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30 space-y-1">
												<div className="truncate font-semibold text-zinc-800 dark:text-zinc-200">{selectedItem.metaData.phone}</div>
												<div className="truncate text-[10px] text-zinc-450 select-all">{selectedItem.metaData.email}</div>
											</div>
										</div>
									</div>
								)}

								{selectedItem.category === "Navigation" && (
									<div className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed bg-zinc-100/30 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-xl">
										<p className="font-semibold text-zinc-800 dark:text-zinc-250">Navigation shortcut help:</p>
										<p className="mt-1.5">You can quickly access this page anytime by closing this dialog and pressing the keys: </p>
										<kbd className="mt-2 inline-block bg-white dark:bg-zinc-850 px-2 py-0.5 rounded border border-zinc-250/30 text-zinc-800 dark:text-zinc-250 font-bold font-mono">
											{selectedItem.badge}
										</kbd>
									</div>
								)}

								{selectedItem.category === "Quick Actions" && (
									<div className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed bg-zinc-100/30 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-xl">
										<p className="font-semibold text-zinc-800 dark:text-zinc-250">Quick execution action:</p>
										<p className="mt-1">Pressing <kbd className="bg-white dark:bg-zinc-850 px-1 py-0.2 rounded border border-zinc-250/30 font-bold font-mono">Enter</kbd> will trigger the function and close the menu.</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Help Guide Footer */}
				<div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold tracking-wide">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
						<span className="flex items-center gap-1.5">
							<kbd className="bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-xs">↑↓</kbd> Navigate
						</span>
						<span className="flex items-center gap-1.5">
							<kbd className="bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-xs">↵</kbd> Select
						</span>
						<span className="flex items-center gap-1.5">
							<kbd className="bg-white dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-250/20 shadow-xs">ESC</kbd> Close / Back
						</span>
					</div>
					{!inspectedItem && (
						<div className="flex items-center gap-2">
							<span>Category hotkeys:</span>
							<kbd className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.2 rounded font-mono">Ctrl+1</kbd>
							<span>to</span>
							<kbd className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.2 rounded font-mono">Ctrl+5</kbd>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
