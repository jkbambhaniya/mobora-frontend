"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDashboard, Customer } from "@/context/dashboard-context";
import { toast } from "react-hot-toast";

export default function CustomerPage() {
  const router = useRouter();
  const { customers, setCustomers } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [spentFilter, setSpentFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "totalSpent" | "joinedDate">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("Active");
    setFormAddress("");
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormEmail(customer.email);
    setFormPhone(customer.phone);
    setFormStatus(customer.status);
    setFormAddress(customer.address);
    setFormNotes(customer.notes);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (customer: Customer) => {
    router.push(`/customer/${customer.id}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone) {
      triggerToast("Name, Email, and Phone number are required.");
      return;
    }

    if (editingCustomer) {
      // Edit Customer
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                name: formName,
                email: formEmail,
                phone: formPhone,
                status: formStatus,
                address: formAddress,
                notes: formNotes
              }
            : c
        )
      );
      triggerToast(`Updated profile of ${formName}`);
    } else {
      // Add Customer
      const newCust: Customer = {
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        status: formStatus,
        totalOrders: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split("T")[0],
        address: formAddress,
        notes: formNotes,
        purchases: []
      };
      setCustomers((prev) => [newCust, ...prev]);
      triggerToast(`Successfully registered ${formName}`);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm(`Are you sure you want to delete customer ${name}?`)) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      triggerToast(`Deleted customer ${name}`);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected customers?`)) {
      setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      triggerToast("Selected customers deleted successfully.");
    }
  };

  const handleBulkStatusToggle = (newStatus: "Active" | "Inactive") => {
    if (selectedIds.length === 0) return;
    setCustomers((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: newStatus } : c))
    );
    setSelectedIds([]);
    triggerToast(`Updated status of selected customers to ${newStatus}`);
  };

  const handleRowSelect = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    }
  };

  const handleSort = (field: "name" | "totalSpent" | "joinedDate") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Metrics calculations
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageLTV = totalCustomers > 0 ? Math.round(totalSpentAll / totalCustomers) : 0;

  // Filter & Search Logic
  const filteredCustomers = customers
    .filter((c) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || c.status === statusFilter;

      let matchesSpent = true;
      if (spentFilter === "High") {
        matchesSpent = c.totalSpent >= 50000;
      } else if (spentFilter === "Low") {
        matchesSpent = c.totalSpent < 50000;
      }

      return matchesSearch && matchesStatus && matchesSpent;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "totalSpent") {
        comparison = a.totalSpent - b.totalSpent;
      } else if (sortBy === "joinedDate") {
        comparison = a.joinedDate.localeCompare(b.joinedDate);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <>
      <div className="space-y-8 animate-fadeIn">

      {/* METRICS PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total Customers</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold tracking-tight">{totalCustomers}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Registered</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>+15% Growth rate</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-success" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Active Accounts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold tracking-tight">{activeCustomers}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Engaged this month</span>
          </div>
          <div className="text-xs text-zinc-400 mt-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>{totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}% Active index</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Customer Sales Value</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold tracking-tight" suppressHydrationWarning>₹{totalSpentAll.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Lifetime transaction volume</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Avg Customer LTV</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold tracking-tight" suppressHydrationWarning>₹{averageLTV.toLocaleString()}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">Per client</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-500 font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Premium tier rating</span>
          </div>
        </div>
      </div>

      {/* FILTER & DATA CONTROLS HEADER */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, phone or ID..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtering buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Accounts</option>
              <option value="Inactive">Inactive Accounts</option>
            </select>

            <select
              value={spentFilter}
              onChange={(e) => setSpentFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="All">All Spending Tiers</option>
              <option value="High">Premium (&ge; Ã¢â€šÂ¹50k)</option>
              <option value="Low">Standard (&lt; Ã¢â€šÂ¹50k)</option>
            </select>

            <Button variant="gradient" size="sm" onClick={handleOpenAdd}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Register Customer
              </span>
            </Button>
          </div>
        </div>

        {/* Batch action menu when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/15 border border-primary/20 p-3.5 rounded-xl animate-scaleUp">
            <div className="flex items-center gap-2 text-sm text-primary dark:text-secondary font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkStatusToggle("Active")}
                className="px-3.5 py-1.5 rounded-lg border border-primary/20 bg-white dark:bg-zinc-900 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer"
              >
                Set Active
              </button>
              <button
                onClick={() => handleBulkStatusToggle("Inactive")}
                className="px-3.5 py-1.5 rounded-lg border border-primary/20 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Set Inactive
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-950 transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOMER DATATABLE */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold text-xs uppercase select-none border-b border-zinc-200/40 dark:border-zinc-800/40">
                  <th className="py-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                      onChange={handleSelectAll}
                      className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-zinc-700 bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-zinc-900 dark:hover:text-white" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1.5">
                      <span>Customer Details</span>
                      {sortBy === "name" && (
                        <span>{sortOrder === "asc" ? "Ã¢â€“Â²" : "Ã¢â€“Â¼"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6 text-center">Orders</th>
                  <th className="py-4 px-6 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white" onClick={() => handleSort("totalSpent")}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total Spent</span>
                      {sortBy === "totalSpent" && (
                        <span>{sortOrder === "asc" ? "Ã¢â€“Â²" : "Ã¢â€“Â¼"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white" onClick={() => handleSort("joinedDate")}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Joined</span>
                      {sortBy === "joinedDate" && (
                        <span>{sortOrder === "asc" ? "Ã¢â€“Â²" : "Ã¢â€“Â¼"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const isChecked = selectedIds.includes(cust.id);
                  return (
                    <tr
                      key={cust.id}
                      className={`border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors ${
                        isChecked ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleRowSelect(cust.id, e)}
                          className="w-4.5 h-4.5 rounded border-zinc-300 dark:border-zinc-700 bg-transparent text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>

                      {/* ID column */}
                      <td className="py-4 px-6 font-mono font-bold text-zinc-400 text-xs">
                        {cust.id}
                      </td>

                      {/* Name Details column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
                            {cust.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white leading-tight">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px] truncate">
                              {cust.address.split(",")[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info Column */}
                      <td className="py-4 px-6">
                        <div className="text-zinc-700 dark:text-zinc-300 font-medium">{cust.phone}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{cust.email}</div>
                      </td>

                      {/* Orders Count Column */}
                      <td className="py-4 px-6 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {cust.totalOrders}
                      </td>

                      {/* Total Spent Column */}
                      <td className="py-4 px-6 text-right font-extrabold text-zinc-900 dark:text-zinc-100" suppressHydrationWarning>
                        ₹{cust.totalSpent.toLocaleString()}
                      </td>

                      {/* Joined Date Column */}
                      <td className="py-4 px-6 text-center text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {new Date(cust.joinedDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
                          cust.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                        }`}>
                          {cust.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetails(cust)}
                            className="p-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary transition-colors cursor-pointer"
                            title="View customer details"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(cust, e)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            title="Edit profile"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(cust.id, cust.name, e)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete customer"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-200">No Customers Found</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              We couldn&apos;t find any customers matching &quot;{searchTerm}&quot;. Try refining your search query or clear filters.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setStatusFilter("All"); setSpentFilter("All"); }}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        {/* DataTable Footer Controls */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850/40 text-xs text-zinc-400 font-semibold bg-zinc-50/20 dark:bg-zinc-900/10 select-none">
          <span>Showing {filteredCustomers.length} of {customers.length} customer records</span>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed">Previous</button>
            <button disabled className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>

    {/* ADD / EDIT CUSTOMER MODAL Ã¢â‚¬â€ portalled via Modal component */}
    <Modal
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
      title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : "Register New Customer"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Full Name *</label>
          <input
            type="text"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Email Address *</label>
            <input
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="e.g. ramesh@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Phone Number *</label>
            <input
              type="text"
              required
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Account Status</label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="Active">Active Account</option>
            <option value="Inactive">Inactive / Suspended</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Shipping Address</label>
          <textarea
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            placeholder="Street, Landmark, City, State, Pincode"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Internal Notes</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Record key preferences, device requirements or transaction quirks..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>Cancel</Button>
          <Button type="submit" variant="gradient" size="sm">
            {editingCustomer ? "Save Customer Profile" : "Register Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  </>
  );
}
