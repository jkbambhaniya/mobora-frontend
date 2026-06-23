"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useDashboard } from "@/context/vendor/dashboard-context";
import { getRepairsAction, createRepairAction, updateRepairAction, deleteRepairAction } from "@/actions/repairs";
import { getTransactionsAction } from "@/actions/transactions";
import { DataTable, Column } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import { toast } from "react-hot-toast";
import { PartnerSelector } from "@/components/vendor/PartnerSelector";

interface RepairJob {
	id: number;
	customer_name: string;
	customer_phone: string;
	device_model: string;
	imei?: string;
	issues: string[];
	estimated_cost: number;
	status: "Received" | "Diagnosing" | "Repaired" | "Delivered" | "Cancelled";
	delivery_date: string;
	notes?: string;
	created_at: string;
}

export default function RepairsPage() {
	const { customers } = useDashboard();

	// List & Filter States
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [repairs, setRepairs] = useState<RepairJob[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Modals State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingJob, setEditingJob] = useState<RepairJob | null>(null);

	// Form States
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [deviceModel, setDeviceModel] = useState("");
	const [imei, setImei] = useState("");
	const [estimatedCost, setEstimatedCost] = useState("");
	const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]); // default 2 days out
	const [notes, setNotes] = useState("");

	// Checklist for Issues
	const availableIssues = [
		"Screen Replacement",
		"Battery Replacement",
		"Charging Port Issue",
		"Speaker / Mic Fault",
		"Camera Malfunction",
		"Water Damage Repair",
		"Motherboard Repair",
		"Software / Unlocking",
		"Other Physical Damage"
	];
	const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

	// Debounce Search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	const loadRepairs = async () => {
		setIsLoading(true);
		try {
			const res = await getRepairsAction({
				search: debouncedSearch.trim() || undefined,
				status: statusFilter !== "All" ? statusFilter : undefined,
				sortBy,
				sortOrder,
			});
			if (res.success && res.data && res.data.success) {
				setRepairs(res.data.repairs || []);
			}
		} catch (err) {
			console.error("Error loading repairs:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadRepairs();
	}, [debouncedSearch, statusFilter, sortBy, sortOrder]);

	// Auto-fill customer phone if selected from list
	useEffect(() => {
		const found = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
		if (found && !customerPhone) {
			setCustomerPhone(found.phone);
		}
	}, [customerName, customers]);

	// Monitor IMEI input for auto-fill in repairs
	useEffect(() => {
		const checkImeiInSystem = async () => {
			if (imei.length === 15 && !editingJob) {
				try {
					const response = await getTransactionsAction({ search: imei, limit: 1 });
					if (response.success && response.data && response.data.success && response.data.transactions?.length > 0) {
						const tx = response.data.transactions[0];
						setDeviceModel(`${tx.deviceBrand} ${tx.deviceModel} (${tx.storage || "128GB"}/${tx.ram || "6GB"}, ${tx.color || "Space Gray"})`);
						if (tx.customerName && tx.customerName !== "Walk-in Customer") {
							setCustomerName(tx.customerName);
							const foundCust = customers.find(c => c.name.toLowerCase() === tx.customerName.toLowerCase());
							if (foundCust) {
								setCustomerPhone(foundCust.phone);
							}
						}
						toast.success("Device and customer matches found in system!");
					}
				} catch (err) {
					console.error("IMEI lookup failed:", err);
				}
			}
		};
		checkImeiInSystem();
	}, [imei, editingJob, customers]);

	// Quick Stats Calculator
	const stats = useMemo(() => {
		const active = repairs.filter((r) => r.status !== "Delivered" && r.status !== "Cancelled").length;
		const diagnosing = repairs.filter((r) => r.status === "Diagnosing").length;
		const repaired = repairs.filter((r) => r.status === "Repaired").length;
		const deliveredEarnings = repairs
			.filter((r) => r.status === "Delivered")
			.reduce((sum, r) => sum + r.estimated_cost, 0);

		return { active, diagnosing, repaired, deliveredEarnings };
	}, [repairs]);

	// Open for Add
	const handleOpenAdd = () => {
		setEditingJob(null);
		setCustomerName("");
		setCustomerPhone("");
		setDeviceModel("");
		setImei("");
		setSelectedIssues([]);
		setEstimatedCost("");
		setDeliveryDate(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
		setNotes("");
		setIsModalOpen(true);
	};

	// Open for Edit
	const handleOpenEdit = (job: RepairJob) => {
		setEditingJob(job);
		setCustomerName(job.customer_name);
		setCustomerPhone(job.customer_phone);
		setDeviceModel(job.device_model);
		setImei(job.imei || "");
		setSelectedIssues(job.issues);
		setEstimatedCost(job.estimated_cost.toString());
		setDeliveryDate(job.delivery_date);
		setNotes(job.notes || "");
		setIsModalOpen(true);
	};

	// Submit Job
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!customerName || !customerPhone || !deviceModel || !estimatedCost || !deliveryDate) {
			toast.error("Please fill in all required fields.");
			return;
		}

		if (selectedIssues.length === 0) {
			toast.error("Please select at least one repair issue checklist item.");
			return;
		}

		const costNum = parseFloat(estimatedCost);
		if (isNaN(costNum) || costNum < 0) {
			toast.error("Estimated cost must be a valid number.");
			return;
		}

		const [partnerType, partnerNameOrId] = customerName.includes(":")
			? (customerName.split(":") as ["Customer" | "Vendor", string])
			: ["Customer" as const, customerName];

		const payload = {
			customer_name: partnerNameOrId,
			customer_phone: customerPhone,
			device_model: deviceModel,
			imei: imei || undefined,
			issues: selectedIssues,
			estimated_cost: costNum,
			delivery_date: deliveryDate,
			notes,
		};

		if (editingJob) {
			const res = await updateRepairAction(editingJob.id, payload);
			if (res.success) {
				toast.success("Repair job updated successfully.");
				setIsModalOpen(false);
				loadRepairs();
			} else {
				toast.error(res.message || "Failed to update job.");
			}
		} else {
			const res = await createRepairAction(payload);
			if (res.success) {
				toast.success("New Repair Job Sheet registered!");
				setIsModalOpen(false);
				loadRepairs();
			} else {
				toast.error(res.message || "Failed to register repair.");
			}
		}
	};

	// Inline Status Update
	const handleStatusChange = async (id: number, newStatus: any) => {
		const res = await updateRepairAction(id, { status: newStatus });
		if (res.success) {
			toast.success(`Job status updated to ${newStatus}`);
			loadRepairs();
		} else {
			toast.error(res.message || "Failed to update status.");
		}
	};

	// Delete Job
	const handleDelete = async (id: number) => {
		if (confirm("Are you sure you want to delete this repair job?")) {
			const res = await deleteRepairAction(id);
			if (res.success) {
				toast.success("Repair job deleted.");
				loadRepairs();
			} else {
				toast.error(res.message || "Failed to delete job.");
			}
		}
	};

	// Print Job Receipt Utility
	const handlePrint = (job: RepairJob) => {
		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		const issuesList = job.issues.map((i) => `<li>${i}</li>`).join("");

		printWindow.document.write(`
			<html>
				<head>
					<title>Repair Job Sheet #${job.id}</title>
					<style>
						body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
						.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
						.header h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
						.header p { margin: 5px 0 0; font-size: 12px; color: #666; }
						.meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
						.meta div { font-size: 13px; line-height: 1.6; }
						.meta strong { color: #111; }
						.section-title { font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; color: #555; }
						.details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
						.details-table th, .details-table td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
						.details-table th { background: #f9f9f9; font-weight: bold; color: #555; }
						.issues-list { padding-left: 20px; margin: 0; }
						.total-row { font-size: 16px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
						.footer { text-align: center; font-size: 11px; color: #999; margin-top: 60px; border-t: 1px dashed #ddd; padding-top: 20px; }
					</style>
				</head>
				<body>
					<div class="header">
						<h1>MOBORA SERVICE CENTER</h1>
						<p>Smart Device Service & Repair Receipt</p>
					</div>
					<div class="meta">
						<div>
							<strong>Job Sheet No:</strong> #JOB-${job.id.toString().padStart(4, "0")}<br/>
							<strong>Date:</strong> ${new Date(job.created_at).toLocaleDateString()}<br/>
							<strong>Estimated Delivery:</strong> ${job.delivery_date}
						</div>
						<div style="text-align: right;">
							<strong>Customer:</strong> ${job.customer_name}<br/>
							<strong>Phone:</strong> ${job.customer_phone}
						</div>
					</div>
					
					<div class="section-title">Device & Service Description</div>
					<table class="details-table">
						<thead>
							<tr>
								<th>Device Model</th>
								<th>IMEI / Serial</th>
								<th>Reported Issues / Checklist</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td><strong>${job.device_model}</strong></td>
								<td><code>${job.imei || "N/A"}</code></td>
								<td>
									<ul class="issues-list">${issuesList}</ul>
								</td>
							</tr>
						</tbody>
					</table>

					${job.notes ? `
						<div class="section-title">Special Diagnostic Instructions / Notes</div>
						<p style="font-size:12px; font-style:italic; color:#555; line-height:1.5; margin-bottom:30px;">
							"${job.notes}"
						</p>
					` : ""}

					<div class="total-row">
						Estimated Total Cost: INR ${job.estimated_cost.toLocaleString()}.00
					</div>

					<div class="footer">
						<p>Thank you for choosing Mobora Service. Please bring this receipt for picking up your device.</p>
						<p>This is a computer-generated Job Sheet. No physical signature is required.</p>
					</div>
					<script>
						window.onload = function() { window.print(); }
					</script>
				</body>
			</html>
		`);
		printWindow.document.close();
	};

	const toggleIssue = (issue: string) => {
		setSelectedIssues((prev) =>
			prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue],
		);
	};

	const columns: Column<RepairJob>[] = [
		{
			key: "id",
			title: "Job ID",
			render: (r) => <span className="font-mono font-bold">#JOB-{r.id.toString().padStart(4, "0")}</span>,
		},
		{
			key: "customer_name",
			title: "Customer Contact",
			render: (r) => (
				<div>
					<div className="font-bold text-zinc-900 dark:text-white leading-tight">{r.customer_name}</div>
					<div className="text-[10px] text-zinc-400 mt-0.5">{r.customer_phone}</div>
				</div>
			),
		},
		{
			key: "device_model",
			title: "Device Specs",
			render: (r) => (
				<div>
					<div className="font-semibold text-zinc-800 dark:text-zinc-200">{r.device_model}</div>
					{r.imei && <div className="text-[9px] font-mono text-zinc-400 mt-0.5">IMEI: {r.imei}</div>}
				</div>
			),
		},
		{
			key: "issues",
			title: "Checklist Issues",
			render: (r) => (
				<div className="flex flex-wrap gap-1 max-w-[200px]">
					{r.issues.map((issue, idx) => (
						<span key={idx} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-semibold px-1.5 py-0.5 rounded">
							{issue}
						</span>
					))}
				</div>
			),
		},
		{
			key: "estimated_cost",
			title: "Cost",
			headerClassName: "text-right",
			className: "text-right",
			render: (r) => <span className="font-bold text-zinc-900 dark:text-zinc-150" suppressHydrationWarning>₹{r.estimated_cost.toLocaleString()}</span>,
		},
		{
			key: "delivery_date",
			title: "Delivery Date",
			render: (r) => <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{r.delivery_date}</span>,
		},
		{
			key: "status",
			title: "Repair Status",
			render: (r) => {
				const statusStyles = {
					Received: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
					Diagnosing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
					Repaired: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
					Delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
					Cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
				};

				return (
					<select
						value={r.status}
						onChange={(e) => handleStatusChange(r.id, e.target.value)}
						className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border-none focus:outline-none cursor-pointer ${statusStyles[r.status]}`}
					>
						<option value="Received">📥 Received</option>
						<option value="Diagnosing">🔍 Diagnosing</option>
						<option value="Repaired">🔧 Repaired</option>
						<option value="Delivered">📦 Delivered</option>
						<option value="Cancelled">❌ Cancelled</option>
					</select>
				);
			},
		},
		{
			key: "actions",
			title: "Actions",
			headerClassName: "text-center",
			className: "text-center",
			render: (r) => (
				<div className="flex items-center justify-center gap-1.5">
					<button
						type="button"
						onClick={() => handlePrint(r)}
						title="Print Job Sheet"
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
						</svg>
					</button>
					<button
						type="button"
						onClick={() => handleOpenEdit(r)}
						title="Edit Job"
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-primary transition-all duration-200 cursor-pointer shadow-sm text-zinc-500"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>
					<button
						type="button"
						onClick={() => handleDelete(r.id)}
						title="Delete Job"
						className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 cursor-pointer shadow-sm text-zinc-550"
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* HEADER PANEL */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
						Repairs & Servicing Desk
					</h1>
					<p className="text-xs text-zinc-400 mt-1">
						Log smartphone servicing requests, track diagnosing workflows, and print job cards.
					</p>
				</div>
				<Button variant="gradient" className="font-bold cursor-pointer" onClick={handleOpenAdd}>
					<span className="flex items-center gap-2">
						🔧 Create Repair Job Sheet
					</span>
				</Button>
			</div>

			{/* KPI STATS CARDS */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Active Repair Jobs
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white">
						{stats.active}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Currently in workshop</span>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Diagnosing Phase
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white">
						{stats.diagnosing}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Awaiting hardware analysis</span>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Repaired & Ready
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white">
						{stats.repaired}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Tested and ready for delivery</span>
				</div>

				<div className="p-6 rounded-2xl border border-zinc-200/65 dark:border-zinc-800/65 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
					<span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
						Delivered Revenue
					</span>
					<span className="text-3xl font-black block mt-2 text-zinc-900 dark:text-white" suppressHydrationWarning>
						₹{stats.deliveredEarnings.toLocaleString()}
					</span>
					<span className="text-[10px] text-zinc-400 block mt-2">Earning from completed repairs</span>
				</div>
			</div>

			{/* FILTERS */}
			<div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 items-center justify-between">
				<div className="relative w-full md:w-96">
					<span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					</span>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by customer phone, model, IMEI..."
						className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
					/>
				</div>

				<div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
					<Select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						options={[
							{ value: "All", label: "Filter: All Statuses" },
							{ value: "Received", label: "Filter: Received" },
							{ value: "Diagnosing", label: "Filter: Diagnosing" },
							{ value: "Repaired", label: "Filter: Repaired" },
							{ value: "Delivered", label: "Filter: Delivered" },
							{ value: "Cancelled", label: "Filter: Cancelled" }
						]}
						className="w-48"
					/>

					<Select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						options={[
							{ value: "createdAt", label: "Sort: Job Logged" },
							{ value: "deliveryDate", label: "Sort: Est. Delivery" },
							{ value: "cost", label: "Sort: Repair Cost" }
						]}
						className="w-44"
					/>
				</div>
			</div>

			{/* TABLE LOG */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
				<DataTable
					columns={columns}
					data={repairs}
					loading={isLoading}
					emptyMessage={
						<div className="text-center py-16 space-y-3">
							<h4 className="font-bold text-zinc-900 dark:text-zinc-200">No Repair Jobs Found</h4>
							<p className="text-xs text-zinc-500 max-w-sm mx-auto">
								There are no registered repair job sheets matching your filter/search criteria.
							</p>
						</div>
					}
				/>
			</div>

			{/* REPAIR FORM MODAL */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={editingJob ? "🔧 Edit Repair Job Sheet" : "🔧 Create Repair Job Sheet"}
				size="lg"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* IMEI / Serial No (Top & Full-Width) */}
					<div className="space-y-1 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">IMEI / Serial No (Autodetects Specs & Customer)</label>
						<input
							type="text"
							maxLength={15}
							value={imei}
							onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
							placeholder="Type 15-digit IMEI to auto-fill details from sales history..."
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
						/>
					</div>

					{/* Customer Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						<PartnerSelector
							value={customerName}
							onChange={setCustomerName}
							label="Customer Name *"
							placeholder="-- Select Customer --"
							required={true}
							valueType="name"
						/>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Customer Phone *</label>
							<input
								type="text"
								required
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								placeholder="e.g. +91 98765 43210"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					{/* Device Model (Full-Width) */}
					<div className="space-y-1 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase">Device Model *</label>
						<input
							type="text"
							required
							value={deviceModel}
							onChange={(e) => setDeviceModel(e.target.value)}
							placeholder="e.g. iPhone 15 Pro Max"
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-zinc-900 dark:text-white"
						/>
					</div>

					{/* Issues checklist */}
					<div className="space-y-2 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase block">Reported Issues Checklist *</label>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-4 border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl">
							{availableIssues.map((issue) => {
								const isSelected = selectedIssues.includes(issue);
								return (
									<button
										key={issue}
										type="button"
										onClick={() => toggleIssue(issue)}
										className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all duration-150 cursor-pointer
											${
												isSelected
													? "bg-primary text-white border-primary shadow-sm"
													: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
											}`}
									>
										{issue}
									</button>
								);
							})}
						</div>
					</div>

					{/* Pricing & Date */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Estimated Repair Cost (₹) *</label>
							<input
								type="number"
								required
								value={estimatedCost}
								onChange={(e) => setEstimatedCost(e.target.value)}
								placeholder="e.g. 3500"
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-zinc-400 uppercase">Estimated Delivery Date *</label>
							<input
								type="date"
								required
								value={deliveryDate}
								onChange={(e) => setDeliveryDate(e.target.value)}
								className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
							/>
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-1 text-left">
						<label className="text-xs font-semibold text-zinc-400 uppercase">Diagnostic Notes / Fault Description</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="e.g. Customer states touch not working on lower half. Minor dent on bottom edge. Screen replacement confirmed..."
							rows={3}
							className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
						/>
					</div>

					<Button type="submit" variant="gradient" className="w-full py-3 rounded-xl font-bold cursor-pointer">
						{editingJob ? "🔧 Save Changes" : "🔧 Save Repair Job Card"}
					</Button>
				</form>
			</Modal>
		</div>
	);
}
