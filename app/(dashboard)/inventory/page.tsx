"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";
import {
	useDashboard,
	MobileListing,
	Customer,
	slugify,
} from "@/context/vendor/dashboard-context";

export default function InventoryPage() {
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
		customers,
		setCustomers,
		handleAddTradeTransaction,
		trades,
		orders,
	} = useDashboard();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [brandFilter, setBrandFilter] = useState("All");
	const [conditionFilter, setConditionFilter] = useState("All");

	// Modal State
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState<MobileListing | null>(
		null,
	);

	// Delete Modal State
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingDevice, setDeletingDevice] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Sell Modal State
	const [isSellFormOpen, setIsSellFormOpen] = useState(false);
	const [sellingDevice, setSellingDevice] = useState<MobileListing | null>(
		null,
	);
	const [sellPrice, setSellPrice] = useState("");
	const [sellCustomer, setSellCustomer] = useState("");
	const [sellDate, setSellDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [sellNotes, setSellNotes] = useState("");

	// Buyback Modal State
	const [isBuybackFormOpen, setIsBuybackFormOpen] = useState(false);
	const [buybackDevice, setBuybackDevice] = useState<MobileListing | null>(
		null,
	);
	const [buybackPrice, setBuybackPrice] = useState("");
	const [buybackCustomer, setBuybackCustomer] = useState("");
	const [buybackCondition, setBuybackCondition] = useState<
		"Mint" | "Excellent" | "Good" | "Fair"
	>("Excellent");
	const [buybackBatteryHealth, setBuybackBatteryHealth] = useState(90);
	const [buybackDate, setBuybackDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [buybackNotes, setBuybackNotes] = useState("");

	// Quick Add Customer States
	const [isAddingCust, setIsAddingCust] = useState(false);
	const [newCustName, setNewCustName] = useState("");
	const [newCustPhone, setNewCustPhone] = useState("");

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
	const [formPrice, setFormPrice] = useState("");
	const [formStock, setFormStock] = useState(1);
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

	// Open Handlers
	const handleOpenAdd = () => {
		setEditingDevice(null);
		setFormImei("");
		setFormBrand("");
		setFormModel("");
		setFormStorage("");
		setFormRam("");
		setFormColor("");
		setFormCondition("Excellent");
		setFormBatteryHealth(90);
		setFormPurchasePrice("");
		setFormPrice("");
		setFormStock(1);
		setFormDescription("");
		setIsFormOpen(true);
	};

	const handleOpenEdit = (device: MobileListing) => {
		setEditingDevice(device);
		setFormImei(device.imei || "");
		setFormBrand(device.brand);
		setFormModel(device.model);
		setFormStorage(device.storage);
		setFormRam(device.ram);
		setFormColor(device.color);
		setFormCondition(device.condition);
		setFormBatteryHealth(device.batteryHealth);
		setFormPurchasePrice(
			device.purchasePrice ? device.purchasePrice.toString() : "",
		);
		setFormPrice(device.price.toString());
		setFormStock(device.stock);
		setFormDescription(device.description);
		setIsFormOpen(true);
	};

	const handleOpenSell = (device: MobileListing) => {
		setSellingDevice(device);
		setSellPrice(device.price.toString());
		setSellCustomer(customers[0]?.name || "");
		setSellDate(new Date().toISOString().split("T")[0]);
		setSellNotes(`Sold from inventory catalog.`);
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setIsSellFormOpen(true);
	};

	const handleSellSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!sellingDevice) return;
		if (!sellCustomer) {
			alert("Please select a customer or quick-add a new one.");
			return;
		}
		if (!sellPrice) {
			alert("Please specify the selling price.");
			return;
		}

		const priceNum = parseFloat(sellPrice);

		handleAddTradeTransaction({
			imei: sellingDevice.imei || "N/A",
			deviceBrand: sellingDevice.brand,
			deviceModel: sellingDevice.model,
			type: "Sale",
			customerName: sellCustomer,
			amount: priceNum,
			date: sellDate,
			notes: sellNotes || `Sold from inventory catalog.`,
			storage: sellingDevice.storage,
			ram: sellingDevice.ram,
			color: sellingDevice.color,
			condition: sellingDevice.condition,
			batteryHealth: sellingDevice.batteryHealth,
		});

		setDevices((prev) =>
			prev.map((d) =>
				d.id === sellingDevice.id
					? { ...d, status: "Sold", stock: 0 }
					: d,
			),
		);

		setIsSellFormOpen(false);
		triggerToast(
			`Recorded sale of ${sellingDevice.brand} ${sellingDevice.model} to ${sellCustomer}.`,
		);
	};

	const handleOpenBuyback = (device: MobileListing) => {
		setBuybackDevice(device);
		setBuybackPrice(
			device.purchasePrice
				? Math.round(device.purchasePrice * 0.9).toString()
				: "",
		);

		// Trace original buyer from trades or orders
		let originalBuyer = "";
		if (device.imei) {
			const saleTrade = trades
				.filter((t) => t.imei === device.imei && t.type === "Sale")
				.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];
			if (saleTrade) {
				originalBuyer = saleTrade.customerName;
			}
		}
		if (!originalBuyer) {
			const saleTrade = trades
				.filter(
					(t) =>
						t.deviceBrand.toLowerCase() ===
							device.brand.toLowerCase() &&
						t.deviceModel.toLowerCase() ===
							device.model.toLowerCase() &&
						t.type === "Sale",
				)
				.sort(
					(a, b) =>
						new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];
			if (saleTrade) {
				originalBuyer = saleTrade.customerName;
			}
		}
		if (!originalBuyer) {
			const matchingOrder = orders.find(
				(o) =>
					o.device
						.toLowerCase()
						.includes(device.model.toLowerCase()) ||
					(device.imei && o.device.includes(device.imei)),
			);
			if (matchingOrder) {
				originalBuyer = matchingOrder.customerName;
			}
		}

		if (originalBuyer) {
			const exists = customers.some(
				(c) => c.name.toLowerCase() === originalBuyer.toLowerCase(),
			);
			if (!exists) {
				const newCust: Customer = {
					id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
					name: originalBuyer,
					phone: "+91 99999 88888",
					email: `${originalBuyer.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
					status: "Active",
					totalOrders: 1,
					totalSpent: device.price,
					joinedDate: new Date().toISOString().split("T")[0],
					address: "Registered from sales history",
					notes: "Automatically registered during device buyback.",
					purchases: [],
				};
				setCustomers((prev) => [newCust, ...prev]);
			}
			setBuybackCustomer(originalBuyer);
		} else {
			setBuybackCustomer(customers[0]?.name || "");
		}

		setBuybackCondition(device.condition);
		setBuybackBatteryHealth(device.batteryHealth);
		setBuybackDate(new Date().toISOString().split("T")[0]);
		setBuybackNotes(`Re-acquired device from customer.`);
		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		setIsBuybackFormOpen(true);
	};

	const handleBuybackSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!buybackDevice) return;
		if (!buybackCustomer) {
			alert("Please select a customer or quick-add a new one.");
			return;
		}
		if (!buybackPrice) {
			alert("Please specify the buyback price.");
			return;
		}

		const priceNum = parseFloat(buybackPrice);

		handleAddTradeTransaction({
			imei: buybackDevice.imei || "N/A",
			deviceBrand: buybackDevice.brand,
			deviceModel: buybackDevice.model,
			type: "Purchase",
			customerName: buybackCustomer,
			amount: priceNum,
			date: buybackDate,
			notes:
				buybackNotes ||
				`Re-acquired via buyback from ${buybackCustomer}.`,
			storage: buybackDevice.storage,
			ram: buybackDevice.ram,
			color: buybackDevice.color,
			condition: buybackCondition,
			batteryHealth: buybackBatteryHealth,
		});

		setDevices((prev) =>
			prev.map((d) =>
				d.id === buybackDevice.id
					? {
						  ...d,
						  status: "Active",
						  stock: 1,
						  purchasePrice: priceNum,
						  price: Math.round(priceNum * 1.2), // Auto markup price by 20%
						  condition: buybackCondition,
						  batteryHealth: buybackBatteryHealth,
						  description:
							  buybackNotes ||
							  `Re-acquired via buyback from ${buybackCustomer}.`,
					  }
					: d,
			),
		);

		setIsBuybackFormOpen(false);
		triggerToast(
			`Recorded buyback of ${buybackDevice.brand} ${buybackDevice.model} from ${buybackCustomer}.`,
		);
	};

	const handleCreateCustomer = () => {
		if (!newCustName || !newCustPhone) {
			alert("Customer name and phone number are required.");
			return;
		}
		const newCust: Customer = {
			id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
			name: newCustName,
			phone: newCustPhone,
			email: `${newCustName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
			status: "Active",
			totalOrders: 0,
			totalSpent: 0,
			joinedDate: new Date().toISOString().split("T")[0],
			address: "Store Walk-in Registration",
			notes: "Quick registered during transaction from inventory catalog.",
			purchases: [],
		};
		setCustomers((prev) => [newCust, ...prev]);

		if (isSellFormOpen) {
			setSellCustomer(newCustName);
		} else if (isBuybackFormOpen) {
			setBuybackCustomer(newCustName);
		}

		setIsAddingCust(false);
		setNewCustName("");
		setNewCustPhone("");
		triggerToast(`Customer ${newCustName} quick-registered.`);
	};

	const handleDelete = (id: string, name: string) => {
		setDeletingDevice({ id, name });
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = () => {
		if (!deletingDevice) return;
		setDevices((prev) => prev.filter((d) => d.id !== deletingDevice.id));
		triggerToast(`Deleted ${deletingDevice.name} listing.`);
		setDeleteConfirmOpen(false);
		setDeletingDevice(null);
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

		if (editingDevice) {
			// Edit
			setDevices((prev) =>
				prev.map((d) =>
					d.id === editingDevice.id
						? {
							  ...d,
							  brand: formBrand,
							  model: formModel,
							  storage: formStorage,
							  ram: formRam,
							  color: formColor,
							  imei: formImei || undefined,
							  condition: formCondition,
							  price: priceNum,
							  purchasePrice: purchasePriceNum,
							  stock: 1, // Set to 1 since pre-owned devices are listed individually
							  batteryHealth: formBatteryHealth,
							  description: formDescription,
						  }
						: d,
				),
			);
			triggerToast(`Updated ${formBrand} ${formModel}`);
		} else {
			// Add
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
				stock: 1, // Set to 1 since pre-owned devices are listed individually
				batteryHealth: formBatteryHealth,
				status: "Active",
				description:
					formDescription ||
					`Manually registered ${formBrand} ${formModel} in stock.`,
			};
			setDevices((prev) => [newDevice, ...prev]);
			triggerToast(`Added ${formBrand} ${formModel} to stock.`);
		}
		setIsFormOpen(false);
	};

	// Dynamic spec helpers
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

	// Metrics
	const activeStockCount = devices
		.filter((d) => d.status === "Active")
		.reduce((sum, d) => sum + d.stock, 0);
	const soldCount = devices.filter((d) => d.status === "Sold").length;
	const avgPrice =
		devices.length > 0
			? Math.round(
				  devices.reduce((sum, d) => sum + d.price, 0) / devices.length,
			  )
			: 0;
	const uniqueModelsCount = Array.from(
		new Set(devices.map((d) => d.brand + " " + d.model)),
	).length;

	// Filter
	const filteredDevices = devices.filter((d) => {
		const query = searchTerm.toLowerCase();
		const matchesSearch =
			d.brand.toLowerCase().includes(query) ||
			d.model.toLowerCase().includes(query) ||
			d.color.toLowerCase().includes(query) ||
			(d.imei && d.imei.includes(query)) ||
			d.id.toLowerCase().includes(query);

		const matchesStatus =
			statusFilter === "All" || d.status === statusFilter;
		const matchesBrand = brandFilter === "All" || d.brand === brandFilter;
		const matchesCondition =
			conditionFilter === "All" || d.condition === conditionFilter;

		return (
			matchesSearch && matchesStatus && matchesBrand && matchesCondition
		);
	});

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRICS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
						Available Stock
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{activeStockCount}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Units in hand
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
						Total Sold
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{soldCount}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Completed sales
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
						Avg Selling Price
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span
							className="text-2xl font-extrabold tracking-tight"
							suppressHydrationWarning
						>
							₹{avgPrice.toLocaleString()}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Catalog average
						</span>
					</div>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative group overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">
						Unique Models
					</span>
					<div className="flex items-baseline gap-2 mt-2">
						<span className="text-2xl font-extrabold tracking-tight">
							{uniqueModelsCount}
						</span>
						<span className="text-xs text-zinc-400 dark:text-zinc-500">
							Specs cataloged
						</span>
					</div>
				</div>
			</div>

			{/* FILTER CONTROL BAR */}
			<div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
				<div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
					<div className="relative w-full lg:w-96">
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
							placeholder="Search by brand, model, color, IMEI..."
							className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
						<select
							value={brandFilter}
							onChange={(e) => setBrandFilter(e.target.value)}
							className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary"
						>
							<option value="All">All Brands</option>
							{brands.map((b) => (
								<option key={b} value={b}>
									{b}
								</option>
							))}
						</select>

						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary"
						>
							<option value="All">All Statuses</option>
							<option value="Active">Active Stock</option>
							<option value="Sold">Sold</option>
						</select>

						<select
							value={conditionFilter}
							onChange={(e) => setConditionFilter(e.target.value)}
							className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary"
						>
							<option value="All">All Conditions</option>
							<option value="Mint">Mint</option>
							<option value="Excellent">Excellent</option>
							<option value="Good">Good</option>
							<option value="Fair">Fair</option>
						</select>

						<Button
							variant="gradient"
							size="sm"
							onClick={handleOpenAdd}
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
								Register Stock
							</span>
						</Button>
					</div>
				</div>
			</div>

			{/* CATALOG DATA TABLE */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				{filteredDevices.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm border-collapse">
							<thead>
								<tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold text-xs uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
									<th className="py-4 px-6">ID</th>
									<th className="py-4 px-6">
										Inventory Specifications
									</th>
									<th className="py-4 px-6">IMEI</th>
									<th className="py-4 px-6 text-center">
										Condition
									</th>
									<th className="py-4 px-6 text-center">
										Battery
									</th>
									<th className="py-4 px-6 text-right">
										Cost Price
									</th>
									<th className="py-4 px-6 text-right">
										Sell Price
									</th>
									<th className="py-4 px-6 text-center">
										Status
									</th>
									<th className="py-4 px-6 text-center">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredDevices.map((d) => (
									<tr
										key={d.id}
										className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
									>
										<td className="py-4 px-6 font-mono font-bold text-zinc-400 text-xs">
											{d.id}
										</td>
										<td className="py-4 px-6">
											<div>
												<div className="font-bold text-zinc-900 dark:text-white leading-tight">
													{d.brand} {d.model}
												</div>
												<div className="text-[11px] text-zinc-400 mt-1">
													{d.storage} / {d.ram} RAM
													&bull; {d.color}
												</div>
											</div>
										</td>
										<td className="py-4 px-6 font-mono text-xs text-zinc-650 dark:text-zinc-300">
											{d.imei ? (
												<Link
													href={`/mobiles/${encodeURIComponent(d.brand)}/${slugify(d.model)}/${d.imei}`}
													className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
												>
													{d.imei}
												</Link>
											) : (
												"N/A"
											)}
										</td>
										<td className="py-4 px-6 text-center">
											<span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
												{d.condition}
											</span>
										</td>
										<td className="py-4 px-6 text-center font-semibold text-zinc-700 dark:text-zinc-300">
											{d.batteryHealth}%
										</td>
										<td
											className="py-4 px-6 text-right text-zinc-500 font-medium"
											suppressHydrationWarning
										>
											{d.purchasePrice
												? `₹${d.purchasePrice.toLocaleString()}`
												: "-"}
										</td>
										<td
											className="py-4 px-6 text-right font-extrabold text-zinc-900 dark:text-zinc-100"
											suppressHydrationWarning
										>
											{d.status === "Sold"
												? `₹${d.price.toLocaleString()}`
												: "-"}
										</td>
										<td className="py-4 px-6 text-center">
											<span
												className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
													d.status === "Active"
														? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
														: "bg-zinc-500/15 text-zinc-550 dark:text-zinc-400"
												}`}
											>
												{d.status === "Active"
													? "In Hand"
													: "Sold"}
											</span>
										</td>
										<td className="py-4 px-6 text-center">
											<div className="flex items-center justify-center gap-2">
												{d.status === "Active" && (
													<button
														onClick={() =>
															handleOpenSell(d)
														}
														title="Record Outgoing Sale"
														className="p-1.5 rounded-lg border border-emerald-250 dark:border-emerald-900/50 bg-emerald-500/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all cursor-pointer shadow-sm animate-fadeIn"
													>
														<svg
															className="w-4 h-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth="2"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button>
												)}
												{d.status === "Sold" && (
													<button
														onClick={() =>
															handleOpenBuyback(d)
														}
														title="Record Buyback (Re-acquire)"
														className="p-1.5 rounded-lg border border-indigo-250 dark:border-indigo-900/50 bg-indigo-500/5 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all cursor-pointer shadow-sm animate-fadeIn"
													>
														<svg
															className="w-4 h-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															strokeWidth="2"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
															/>
														</svg>
													</button>
												)}
												<button
													onClick={() =>
														handleOpenEdit(d)
													}
													title="Edit Device"
													className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary hover:scale-105 transition-all cursor-pointer"
												>
													<svg
														className="w-4 h-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														strokeWidth="2"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
														/>
													</svg>
												</button>
												<button
													onClick={() =>
														handleDelete(
															d.id,
															d.brand +
																" " +
																d.model,
														)
													}
													title="Delete Device"
													className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-red-500 hover:scale-105 transition-all cursor-pointer"
												>
													<svg
														className="w-4 h-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														strokeWidth="2"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-16 space-y-3">
						<h4 className="font-bold text-zinc-900 dark:text-zinc-200">
							No Inventory Items Listed
						</h4>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
							We couldn&apos;t find any inventory items matching
							your filters. Try clearing search query.
						</p>
					</div>
				)}
			</div>

			{/* MODAL FORM WITH INLINE CREATION */}
			<Modal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				title={
					editingDevice
						? `Edit Inventory Item: ${editingDevice.brand} ${editingDevice.model}`
						: "Register Stock Item"
				}
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
							{editingDevice
								? "Save Changes"
								: "Register Stock Item"}
						</Button>
					</div>
				</form>
			</Modal>

			{/* SELL MODAL */}
			<Modal
				isOpen={isSellFormOpen}
				onClose={() => setIsSellFormOpen(false)}
				title={
					<div className="flex items-center gap-3 text-left">
						<span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</span>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
								Record Device Sale
							</h3>
							<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
								Complete outgoing transaction details for this
								unit.
							</p>
						</div>
					</div>
				}
				size="lg"
			>
				{sellingDevice && (
					<form onSubmit={handleSellSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{sellingDevice.brand}{" "}
										{sellingDevice.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{sellingDevice.storage} /{" "}
										{sellingDevice.ram} RAM &bull;{" "}
										{sellingDevice.color} &bull;{" "}
										{sellingDevice.condition} Condition
									</p>
								</div>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
									Active in Hand
								</span>
							</div>
							<div className="grid grid-cols-3 gap-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2.5 mt-1 text-[11px]">
								<div>
									<span className="text-zinc-400 block">
										IMEI:
									</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
										{sellingDevice.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										₹
										{sellingDevice.purchasePrice?.toLocaleString() ||
											"-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Listed Price:
									</span>
									<span className="font-extrabold text-primary">
										₹{sellingDevice.price.toLocaleString()}
									</span>
								</div>
							</div>
						</div>

						{/* Form inputs */}
						<div className="space-y-4 text-left">
							{/* Customer selection */}
							<div className="space-y-1.5 relative">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Customer *
									</label>
									<button
										type="button"
										onClick={() =>
											setIsAddingCust(!isAddingCust)
										}
										className="text-[10px] text-primary hover:underline font-bold"
									>
										{isAddingCust
											? "Cancel"
											: "+ Quick Add"}
									</button>
								</div>

								{isAddingCust ? (
									<div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl space-y-3 animate-scaleUp">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Full Name
												</label>
												<input
													type="text"
													value={newCustName}
													onChange={(e) =>
														setNewCustName(
															e.target.value,
														)
													}
													placeholder="e.g. John Doe"
													className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Phone Number
												</label>
												<input
													type="text"
													value={newCustPhone}
													onChange={(e) =>
														setNewCustPhone(
															e.target.value,
														)
													}
													placeholder="e.g. +91 99999 88888"
													className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
										</div>
										<button
											type="button"
											onClick={handleCreateCustomer}
											className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
										>
											Save and Select Customer
										</button>
									</div>
								) : (
									<select
										value={sellCustomer}
										onChange={(e) =>
											setSellCustomer(e.target.value)
										}
										required
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									>
										<option value="">
											-- Choose Client --
										</option>
										{customers.map((c) => (
											<option key={c.id} value={c.name}>
												{c.name} ({c.phone})
											</option>
										))}
									</select>
								)}
							</div>

							{/* Price & Date */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Actual Selling Price (₹) *
									</label>
									<input
										type="number"
										required
										value={sellPrice}
										onChange={(e) =>
											setSellPrice(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Sale Date *
									</label>
									<input
										type="date"
										required
										value={sellDate}
										onChange={(e) =>
											setSellDate(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Transaction Notes
								</label>
								<textarea
									value={sellNotes}
									onChange={(e) =>
										setSellNotes(e.target.value)
									}
									placeholder="e.g. Screen and device inspected by buyer. Paid full via UPI."
									rows={2}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsSellFormOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="gradient"
								size="sm"
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
							>
								Confirm Sale
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* BUYBACK MODAL */}
			<Modal
				isOpen={isBuybackFormOpen}
				onClose={() => setIsBuybackFormOpen(false)}
				title={
					<div className="flex items-center gap-3 text-left">
						<span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
								/>
							</svg>
						</span>
						<div>
							<h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight">
								Record Device Buyback
							</h3>
							<p className="text-[11px] text-zinc-400 font-normal mt-0.5">
								Re-acquire a previously sold unit back into
								active inventory.
							</p>
						</div>
					</div>
				}
				size="lg"
			>
				{buybackDevice && (
					<form onSubmit={handleBuybackSubmit} className="space-y-5">
						{/* Device Info Panel */}
						<div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex flex-col gap-2 shadow-inner">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
										{buybackDevice.brand}{" "}
										{buybackDevice.model}
									</h4>
									<p className="text-[11px] text-zinc-400 mt-0.5">
										{buybackDevice.storage} /{" "}
										{buybackDevice.ram} RAM &bull;{" "}
										{buybackDevice.color}
									</p>
								</div>
								<span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-650 dark:text-zinc-400 uppercase tracking-wide">
									Currently Sold
								</span>
							</div>
							<div className="grid grid-cols-3 gap-4 border-t border-zinc-200/40 dark:border-zinc-800/40 pt-2.5 mt-1 text-[11px]">
								<div>
									<span className="text-zinc-400 block">
										IMEI:
									</span>
									<span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
										{buybackDevice.imei || "N/A"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Cost Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										₹
										{buybackDevice.purchasePrice?.toLocaleString() ||
											"-"}
									</span>
								</div>
								<div>
									<span className="text-zinc-400 block">
										Last Sell Price:
									</span>
									<span className="font-semibold text-zinc-700 dark:text-zinc-300">
										₹{buybackDevice.price.toLocaleString()}
									</span>
								</div>
							</div>
						</div>

						{/* Form inputs */}
						<div className="space-y-4 text-left">
							{/* Customer selection */}
							<div className="space-y-1.5 relative">
								<div className="flex justify-between items-center">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Customer (Selling back to store) *
									</label>
									<button
										type="button"
										onClick={() =>
											setIsAddingCust(!isAddingCust)
										}
										className="text-[10px] text-primary hover:underline font-bold"
									>
										{isAddingCust
											? "Cancel"
											: "+ Quick Add"}
									</button>
								</div>

								{isAddingCust ? (
									<div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl space-y-3 animate-scaleUp">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Full Name
												</label>
												<input
													type="text"
													value={newCustName}
													onChange={(e) =>
														setNewCustName(
															e.target.value,
														)
													}
													placeholder="e.g. John Doe"
													className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
											<div className="space-y-1">
												<label className="text-[10px] font-semibold text-zinc-400 uppercase">
													Phone Number
												</label>
												<input
													type="text"
													value={newCustPhone}
													onChange={(e) =>
														setNewCustPhone(
															e.target.value,
														)
													}
													placeholder="e.g. +91 99999 88888"
													className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
												/>
											</div>
										</div>
										<button
											type="button"
											onClick={handleCreateCustomer}
											className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
										>
											Save and Select Customer
										</button>
									</div>
								) : (
									<select
										value={buybackCustomer}
										onChange={(e) =>
											setBuybackCustomer(e.target.value)
										}
										required
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									>
										<option value="">
											-- Choose Client --
										</option>
										{customers.map((c) => (
											<option key={c.id} value={c.name}>
												{c.name} ({c.phone})
											</option>
										))}
									</select>
								)}
							</div>

							{/* Price, Date, and specs updates */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Amount Paid (₹) *
									</label>
									<input
										type="number"
										required
										value={buybackPrice}
										onChange={(e) =>
											setBuybackPrice(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Date *
									</label>
									<input
										type="date"
										required
										value={buybackDate}
										onChange={(e) =>
											setBuybackDate(e.target.value)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>
							</div>

							{/* Condition & Battery (Buyback inspection updates) */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Buyback Condition *
									</label>
									<select
										value={buybackCondition}
										onChange={(e) =>
											setBuybackCondition(
												e.target.value as any,
											)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									>
										<option value="Mint">Mint</option>
										<option value="Excellent">
											Excellent
										</option>
										<option value="Good">Good</option>
										<option value="Fair">Fair</option>
									</select>
								</div>
								<div className="space-y-1.5">
									<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
										Current Battery Health (%) *
									</label>
									<input
										type="number"
										min={50}
										max={100}
										required
										value={buybackBatteryHealth}
										onChange={(e) =>
											setBuybackBatteryHealth(
												parseInt(e.target.value) || 0,
											)
										}
										className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
									/>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
									Buyback Notes
								</label>
								<textarea
									value={buybackNotes}
									onChange={(e) =>
										setBuybackNotes(e.target.value)
									}
									placeholder="e.g. Device remains in excellent condition. Battery health is at 90%. Paid via Bank Transfer."
									rows={2}
									className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-850">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setIsBuybackFormOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="gradient"
								size="sm"
								className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
							>
								Confirm Buyback
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* Delete Confirmation Modal */}
			<ConfirmDeleteModal
				isOpen={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				itemName={deletingDevice?.name || ""}
			/>
		</div>
	);
}
