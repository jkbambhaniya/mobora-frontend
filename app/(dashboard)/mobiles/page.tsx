"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
	useDashboard,
	MobileListing,
	slugify,
} from "@/context/vendor/dashboard-context";

export default function MobilesPage() {
	const router = useRouter();
	const {
		devices,
		setDevices,
		brands,
		models,
		storages,
		rams,
		handleAddBrand,
		handleAddModel,
		handleAddStorage,
		handleAddRam,
		triggerToast,
	} = useDashboard();

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);

	// Form Fields
	const [formImei, setFormImei] = useState("");
	const [formBrand, setFormBrand] = useState("");
	const [formModel, setFormModel] = useState("");
	const [formStorage, setFormStorage] = useState("");
	const [formRam, setFormRam] = useState("");
	const [formColor, setFormColor] = useState("");
	const [formCondition, setFormCondition] = useState<
		"Mint" | "Excellent" | "Good" | "Fair"
	>("Excellent");
	const [formBatteryHealth, setFormBatteryHealth] = useState(90);
	const [formPurchasePrice, setFormPurchasePrice] = useState("");
	const [formDescription, setFormDescription] = useState("");

	// Dynamic Add Dialog States
	const [isAddingBrand, setIsAddingBrand] = useState(false);
	const [newBrandVal, setNewBrandVal] = useState("");

	const [isAddingModel, setIsAddingModel] = useState(false);
	const [newModelVal, setNewModelVal] = useState("");

	const [isAddingStorage, setIsAddingStorage] = useState(false);
	const [newStorageVal, setNewStorageVal] = useState("");

	const [isAddingRam, setIsAddingRam] = useState(false);
	const [newRamVal, setNewRamVal] = useState("");

	// Open Handler
	const handleOpenAdd = () => {
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("Excellent");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormDescription("");
		setIsFormOpen(true);
	};

	// Submit Handler
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formBrand ||
			!formModel ||
			!formStorage ||
			!formRam ||
			!formPurchasePrice
		) {
			alert(
				"Please enter brand, model, storage, RAM, and purchase price.",
			);
			return;
		}

		const purchasePriceNum = parseFloat(formPurchasePrice);
		const priceNum = Math.round(purchasePriceNum * 1.2); // Auto markup selling price by 20%

		const newDevice: MobileListing = {
			id: `LIST-${Math.floor(1000 + Math.random() * 9000)}`,
			brand: formBrand,
			model: formModel,
			storage: formStorage,
			ram: formRam,
			color: formColor || "Space Gray",
			imei: formImei || undefined,
			condition: formCondition,
			price: priceNum,
			purchasePrice: purchasePriceNum,
			stock: 1,
			batteryHealth: formBatteryHealth,
			status: "Active",
			description:
				formDescription ||
				`Manually registered ${formBrand} ${formModel} in stock.`,
		};

		setDevices((prev) => [newDevice, ...prev]);
		triggerToast(`Added ${formBrand} ${formModel} to stock.`);
		setIsFormOpen(false);
	};

	// Dynamic creators
	const handleCreateBrand = () => {
		if (newBrandVal.trim()) {
			handleAddBrand(newBrandVal.trim());
			setFormBrand(newBrandVal.trim());
			setNewBrandVal("");
			setIsAddingBrand(false);
		}
	};

	const handleCreateModel = () => {
		if (!formBrand) {
			alert("Please choose a brand first.");
			return;
		}
		if (newModelVal.trim()) {
			handleAddModel(formBrand, newModelVal.trim());
			setFormModel(newModelVal.trim());
			setNewModelVal("");
			setIsAddingModel(false);
		}
	};

	const handleCreateStorage = () => {
		if (newStorageVal.trim()) {
			handleAddStorage(newStorageVal.trim());
			setFormStorage(newStorageVal.trim());
			setNewStorageVal("");
			setIsAddingStorage(false);
		}
	};

	const handleCreateRam = () => {
		if (newRamVal.trim()) {
			handleAddRam(newRamVal.trim());
			setFormRam(newRamVal.trim());
			setNewRamVal("");
			setIsAddingRam(false);
		}
	};

	// Search/Filter states for Level 1
	const [searchTerm, setSearchTerm] = useState("");
	const [brandFilter, setBrandFilter] = useState("All");
	const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Sold

	// List of unique brands for filters
	const uniqueBrandsList = useMemo(() => {
		return Array.from(new Set(devices.map((d) => d.brand)));
	}, [devices]);

	// Group devices by Brand + Model
	const modelGroups = useMemo(() => {
		const groups: {
			[key: string]: {
				brand: string;
				model: string;
				items: MobileListing[];
			};
		} = {};

		devices.forEach((d) => {
			const key = `${d.brand} ${d.model}`.toLowerCase();
			if (!groups[key]) {
				groups[key] = {
					brand: d.brand,
					model: d.model,
					items: [],
				};
			}
			groups[key].items.push(d);
		});

		return Object.values(groups);
	}, [devices]);

	// Apply filters on Level 1
	const filteredModelGroups = useMemo(() => {
		return modelGroups.filter((g) => {
			const query = searchTerm.toLowerCase();
			const matchesSearch =
				g.brand.toLowerCase().includes(query) ||
				g.model.toLowerCase().includes(query);

			const matchesBrand =
				brandFilter === "All" || g.brand === brandFilter;

			let matchesStatus = true;
			if (statusFilter === "Active") {
				matchesStatus = g.items.some(
					(d) => d.status === "Active" && d.stock > 0,
				);
			} else if (statusFilter === "Sold") {
				matchesStatus = g.items.some((d) => d.status === "Sold");
			}

			return matchesSearch && matchesBrand && matchesStatus;
		});
	}, [modelGroups, searchTerm, brandFilter, statusFilter]);

	// Level 1 Metrics
	const metrics = useMemo(() => {
		const activeStock = devices
			.filter((d) => d.status === "Active")
			.reduce((sum, d) => sum + d.stock, 0);
		const totalSold = devices.filter((d) => d.status === "Sold").length;
		const totalUniqueModels = modelGroups.length;
		const totalTracedDevices = devices.filter((d) => d.imei).length;

		return {
			activeStock,
			totalSold,
			totalUniqueModels,
			totalTracedDevices,
		};
	}, [devices, modelGroups]);

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRICS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-primary" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Unique Catalog Models
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalUniqueModels}
						</span>
						<span className="text-[11px] text-zinc-400">
							specifications
						</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Active Inventory
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.activeStock}
						</span>
						<span className="text-[11px] text-zinc-400">
							units in stock
						</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						Total Units Sold
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalSold}
						</span>
						<span className="text-[11px] text-zinc-400">
							completed sales
						</span>
					</div>
				</div>

				<div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
					<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
						IMEI Logged Devices
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{metrics.totalTracedDevices}
						</span>
						<span className="text-[11px] text-zinc-400">
							tracked lifecycles
						</span>
					</div>
				</div>
			</div>

			{/* FILTERS */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
				<div className="relative w-full md:w-80">
					<span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
						<svg
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</span>
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search models..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
					<select
						value={brandFilter}
						onChange={(e) => setBrandFilter(e.target.value)}
						className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
					>
						<option value="All">All Brands</option>
						{uniqueBrandsList.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>

					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
					>
						<option value="All">All Statuses</option>
						<option value="Active">Has In-Hand Stock</option>
						<option value="Sold">Has Sold Stock</option>
					</select>

					<Button
						variant="gradient"
						size="sm"
						onClick={handleOpenAdd}
						className="px-3.5 py-2.5 rounded-xl font-bold cursor-pointer"
					>
						<span className="flex items-center gap-2">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							Add Mobile
						</span>
					</Button>
				</div>
			</div>

			{/* GROUPED MODEL CARDS / LIST */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredModelGroups.length > 0 ? (
					filteredModelGroups.map((g) => {
						const activeCount = g.items
							.filter((d) => d.status === "Active")
							.reduce((sum, d) => sum + d.stock, 0);
						const soldCount = g.items.filter(
							(d) => d.status === "Sold",
						).length;
						const minPrice = Math.min(
							...g.items.map((d) => d.price),
						);
						const maxPrice = Math.max(
							...g.items.map((d) => d.price),
						);

						return (
							<div
								key={`${g.brand}-${g.model}`}
								className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80 transition-all duration-300 shadow-sm flex flex-col justify-between group"
							>
								<div className="space-y-4">
									{/* Brand Tag */}
									<div className="flex justify-between items-start">
										<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary uppercase tracking-wider">
											{g.brand}
										</span>
										<span className="text-[10px] text-zinc-400 font-bold tracking-widest font-mono">
											{g.items.length} CONFIGS
										</span>
									</div>

									{/* Title */}
									<div>
										<h3 className="font-extrabold text-lg text-zinc-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
											{g.brand} {g.model}
										</h3>
									</div>

									{/* Stock Details */}
									<div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-zinc-100 dark:border-zinc-850/60">
										<div>
											<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
												In Hand
											</span>
											<span className="text-sm font-black text-zinc-700 dark:text-zinc-200">
												{activeCount} units
											</span>
										</div>
										<div>
											<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
												Sold Out
											</span>
											<span className="text-sm font-black text-zinc-700 dark:text-zinc-200">
												{soldCount} units
											</span>
										</div>
									</div>

									{/* Price Range */}
									<div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
										<span>Pricing:</span>
										<span
											className="font-bold text-zinc-900 dark:text-zinc-100"
											suppressHydrationWarning
										>
											{minPrice === maxPrice
												? `₹${minPrice.toLocaleString()}`
												: `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`}
										</span>
									</div>
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										// Navigate to dynamic nested route /mobiles/[brand]/[model]
										router.push(
											`/mobiles/${encodeURIComponent(g.brand)}/${slugify(g.model)}`,
										);
									}}
									className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
								>
									View Devices
								</Button>
							</div>
						);
					})
				) : (
					<div className="col-span-full text-center py-16 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
						<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
							No Mobile Models Found
						</h4>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
							We couldn't find any mobile listings matching the
							current search parameters. Try adjusting your
							filters.
						</p>
					</div>
				)}
			</div>

			{/* REGISTER FORM MODAL */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title="Register Mobile Device"
				size="lg"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* IMEI */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-450 uppercase tracking-wide">
								IMEI (15 digits)
							</label>
							<input
								type="text"
								maxLength={15}
								value={formImei}
								onChange={(e) =>
									setFormImei(
										e.target.value.replace(/\D/g, ""),
									)
								}
								placeholder="e.g. 359283748291827"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
							/>
						</div>

						{/* Color */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
								Color
							</label>
							<input
								type="text"
								value={formColor}
								onChange={(e) => setFormColor(e.target.value)}
								placeholder="e.g. Phantom Black"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* BRAND SELECTION & INLINE CREATOR */}
						<div className="space-y-1 relative">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Brand *
								</label>
								<button
									type="button"
									onClick={() =>
										setIsAddingBrand(!isAddingBrand)
									}
									className="text-[10px] text-primary hover:underline font-bold"
								>
									{isAddingBrand ? "Cancel" : "+ Add Brand"}
								</button>
							</div>

							{isAddingBrand ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										value={newBrandVal}
										onChange={(e) =>
											setNewBrandVal(e.target.value)
										}
										placeholder="New Brand Name"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateBrand}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<select
									value={formBrand}
									onChange={(e) => {
										setFormBrand(e.target.value);
										setFormModel("");
									}}
									required
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								>
									<option value="">-- Choose Brand --</option>
									{brands.map((b) => (
										<option key={b} value={b}>
											{b}
										</option>
									))}
								</select>
							)}
						</div>

						{/* MODEL SELECTION & INLINE CREATOR */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Model *
								</label>
								<button
									type="button"
									disabled={!formBrand}
									onClick={() =>
										setIsAddingModel(!isAddingModel)
									}
									className="text-[10px] text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline"
								>
									{isAddingModel ? "Cancel" : "+ Add Model"}
								</button>
							</div>

							{isAddingModel ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										value={newModelVal}
										onChange={(e) =>
											setNewModelVal(e.target.value)
										}
										placeholder={`Model for ${formBrand}`}
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateModel}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<select
									value={formModel}
									disabled={!formBrand}
									onChange={(e) =>
										setFormModel(e.target.value)
									}
									required
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
								>
									<option value="">-- Choose Model --</option>
									{models
										.filter((m) => m.brand === formBrand)
										.map((m) => (
											<option key={m.name} value={m.name}>
												{m.name}
											</option>
										))}
								</select>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* STORAGE */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									Storage Capacity *
								</label>
								<button
									type="button"
									onClick={() =>
										setIsAddingStorage(!isAddingStorage)
									}
									className="text-[10px] text-primary hover:underline font-bold"
								>
									{isAddingStorage
										? "Cancel"
										: "+ Add Storage"}
								</button>
							</div>

							{isAddingStorage ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										value={newStorageVal}
										onChange={(e) =>
											setNewStorageVal(e.target.value)
										}
										placeholder="e.g. 512GB"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateStorage}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<select
									value={formStorage}
									onChange={(e) =>
										setFormStorage(e.target.value)
									}
									required
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								>
									<option value="">
										-- Choose Storage --
									</option>
									{storages.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
							)}
						</div>

						{/* RAM */}
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">
									RAM Size *
								</label>
								<button
									type="button"
									onClick={() => setIsAddingRam(!isAddingRam)}
									className="text-[10px] text-primary hover:underline font-bold"
								>
									{isAddingRam ? "Cancel" : "+ Add RAM"}
								</button>
							</div>

							{isAddingRam ? (
								<div className="flex gap-2 animate-scaleUp">
									<input
										type="text"
										value={newRamVal}
										onChange={(e) =>
											setNewRamVal(e.target.value)
										}
										placeholder="e.g. 16GB"
										className="flex-1 px-3 py-2 rounded-xl border border-primary text-xs bg-transparent focus:outline-none"
									/>
									<button
										type="button"
										onClick={handleCreateRam}
										className="px-3 bg-primary text-white text-xs font-bold rounded-xl"
									>
										Save
									</button>
								</div>
							) : (
								<select
									value={formRam}
									onChange={(e) => setFormRam(e.target.value)}
									required
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								>
									<option value="">-- Choose RAM --</option>
									{rams.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							)}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Condition */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Condition
							</label>
							<select
								value={formCondition}
								onChange={(e) =>
									setFormCondition(e.target.value as any)
								}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							>
								<option value="Mint">Mint</option>
								<option value="Excellent">Excellent</option>
								<option value="Good">Good</option>
								<option value="Fair">Fair</option>
							</select>
						</div>

						{/* Battery Health */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
								Battery Health (%)
							</label>
							<input
								type="number"
								min={50}
								max={100}
								value={formBatteryHealth}
								onChange={(e) =>
									setFormBatteryHealth(
										parseInt(e.target.value) || 0,
									)
								}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					{/* Cost Price */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Purchase / Cost Price * (₹)
						</label>
						<input
							type="number"
							required
							value={formPurchasePrice}
							onChange={(e) =>
								setFormPurchasePrice(e.target.value)
							}
							placeholder="e.g. 30000"
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					{/* Description */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
							Listing Description
						</label>
						<textarea
							value={formDescription}
							onChange={(e) => setFormDescription(e.target.value)}
							placeholder="e.g. Mint condition. Minor scratch on screen protector, box and original cable available..."
							rows={3}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setIsFormOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" variant="gradient" size="sm">
							Register Stock Item
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
