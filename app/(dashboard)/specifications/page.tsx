"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDashboard } from "@/context/dashboard-context";

export default function SpecificationsPage() {
  const {
    brands,
    models,
    storages,
    rams,
    handleAddBrand,
    handleAddModel,
    handleAddStorage,
    handleAddRam,
    handleDeleteBrand,
    handleDeleteModel,
    handleDeleteStorage,
    handleDeleteRam,
    handleEditBrand,
    handleEditModel,
    handleEditStorage,
    handleEditRam,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<"brands" | "models" | "storages" | "rams">("brands");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals for editing
  const [editingItem, setEditingItem] = useState<{
    type: "brand" | "model" | "storage" | "ram";
    oldVal: string;
    brand?: string; // used for model
  } | null>(null);
  
  const [editInputVal, setEditInputVal] = useState("");
  const [editModelBrandVal, setEditModelBrandVal] = useState(""); // optional brand modification

  // Modal for adding
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addInputVal, setAddInputVal] = useState("");
  const [addModelBrandVal, setAddModelBrandVal] = useState("");

  const handleOpenEdit = (type: "brand" | "model" | "storage" | "ram", val: string, brand?: string) => {
    setEditingItem({ type, oldVal: val, brand });
    setEditInputVal(val);
    if (brand) setEditModelBrandVal(brand);
    else setEditModelBrandVal("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInputVal.trim()) return;

    if (editingItem) {
      const { type, oldVal, brand } = editingItem;
      if (type === "brand") {
        handleEditBrand(oldVal, editInputVal.trim());
      } else if (type === "model" && brand) {
        handleEditModel(brand, oldVal, editInputVal.trim());
      } else if (type === "storage") {
        handleEditStorage(oldVal, editInputVal.trim());
      } else if (type === "ram") {
        handleEditRam(oldVal, editInputVal.trim());
      }
      setEditingItem(null);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInputVal.trim()) return;

    if (activeTab === "brands") {
      handleAddBrand(addInputVal.trim());
    } else if (activeTab === "models") {
      if (!addModelBrandVal) {
        alert("Please select a brand first.");
        return;
      }
      handleAddModel(addModelBrandVal, addInputVal.trim());
    } else if (activeTab === "storages") {
      handleAddStorage(addInputVal.trim());
    } else if (activeTab === "rams") {
      handleAddRam(addInputVal.trim());
    }

    setAddInputVal("");
    setIsAddOpen(false);
  };

  const handleOpenAdd = () => {
    setAddInputVal("");
    if (brands.length > 0) setAddModelBrandVal(brands[0]);
    else setAddModelBrandVal("");
    setIsAddOpen(true);
  };

  const handleDeleteConfirm = (type: "brand" | "model" | "storage" | "ram", val: string, brand?: string) => {
    let confirmMsg = `Are you sure you want to delete ${type} "${val}"?`;
    if (type === "brand") {
      confirmMsg += "\nWarning: All models associated with this brand will also be deleted!";
    }

    if (confirm(confirmMsg)) {
      if (type === "brand") {
        handleDeleteBrand(val);
      } else if (type === "model" && brand) {
        handleDeleteModel(brand, val);
      } else if (type === "storage") {
        handleDeleteStorage(val);
      } else if (type === "ram") {
        handleDeleteRam(val);
      }
    }
  };

  // Dynamic filter lists based on active tab and search
  const filteredBrands = brands.filter(b => b.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStorages = storages.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRams = rams.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* METRICS OR INFO CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Brands</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{brands.length}</span>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Models</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{models.length}</span>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Storages</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{storages.length}</span>
        </div>
        <div className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">RAM Sizes</span>
          <span className="text-2xl font-extrabold tracking-tight mt-1 block">{rams.length}</span>
        </div>
      </div>

      {/* TABS & SEARCH HEADER */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-955 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => { setActiveTab("brands"); setSearchTerm(""); }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === "brands"
                  ? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
                  : "text-zinc-505 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Brands Setup
            </button>
            <button
              onClick={() => { setActiveTab("models"); setSearchTerm(""); }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === "models"
                  ? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
                  : "text-zinc-505 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Model Catalog
            </button>
            <button
              onClick={() => { setActiveTab("storages"); setSearchTerm(""); }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === "storages"
                  ? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
                  : "text-zinc-505 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Storage Options
            </button>
            <button
              onClick={() => { setActiveTab("rams"); setSearchTerm(""); }}
              className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === "rams"
                  ? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
                  : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              RAM Options
            </button>
          </div>

          {/* Action and Search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary placeholder-zinc-400"
              />
            </div>
            
            <Button variant="gradient" size="sm" className="w-full sm:w-auto" onClick={handleOpenAdd}>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add {activeTab.slice(0, -1)}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* DYNAMIC LISTINGS TABLES */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
        {/* BRANDS TAB */}
        {activeTab === "brands" && (
          <div>
            {filteredBrands.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                      <th className="py-4 px-6">Brand Name</th>
                      <th className="py-4 px-6 text-center">Associated Models</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map((b) => {
                      const associatedModelsCount = models.filter((m) => m.brand === b).length;
                      return (
                        <tr key={b} className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white text-sm">{b}</td>
                          <td className="py-4 px-6 text-center font-medium text-zinc-550 dark:text-zinc-400">
                            {associatedModelsCount} model{associatedModelsCount !== 1 ? "s" : ""}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit("brand", b)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteConfirm("brand", b)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-550">No brands found.</div>
            )}
          </div>
        )}

        {/* MODELS TAB */}
        {activeTab === "models" && (
          <div>
            {filteredModels.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                      <th className="py-4 px-6">Brand</th>
                      <th className="py-4 px-6">Model Catalog Name</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((m) => (
                      <tr key={`${m.brand}-${m.name}`} className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-zinc-550 dark:text-zinc-400">{m.brand}</td>
                        <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white text-sm">{m.name}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit("model", m.name, m.brand)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-655 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm("model", m.name, m.brand)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-655 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-550">No models found.</div>
            )}
          </div>
        )}

        {/* STORAGES TAB */}
        {activeTab === "storages" && (
          <div>
            {filteredStorages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                      <th className="py-4 px-6">Storage Size</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStorages.map((s) => (
                      <tr key={s} className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white text-sm">{s}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit("storage", s)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm("storage", s)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-555">No storage capacities defined.</div>
            )}
          </div>
        )}

        {/* RAM TAB */}
        {activeTab === "rams" && (
          <div>
            {filteredRams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                      <th className="py-4 px-6">RAM Capacity</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRams.map((r) => (
                      <tr key={r} className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white text-sm">{r}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit("ram", r)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm("ram", r)}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-550">No RAM configurations defined.</div>
            )}
          </div>
        )}
      </div>

      {/* EDIT POPUP MODAL */}
      <Modal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title={editingItem ? `Rename ${editingItem.type.toUpperCase()}: ${editingItem.oldVal}` : "Modify Attribute"}
        size="sm"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wide">
              {editingItem ? `${editingItem.type.toUpperCase()} VALUE` : "Value"}
            </label>
            <input
              type="text"
              value={editInputVal}
              onChange={(e) => setEditInputVal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-850">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm">
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD POPUP MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={`Add New ${activeTab.slice(0, -1).toUpperCase()}`}
        size="sm"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {activeTab === "models" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">Brand Category *</label>
              <select
                value={addModelBrandVal}
                onChange={(e) => setAddModelBrandVal(e.target.value)}
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
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wide">
              {activeTab.slice(0, -1).toUpperCase()} Value *
            </label>
            <input
              type="text"
              placeholder={
                activeTab === "brands"
                  ? "e.g. Motorola"
                  : activeTab === "models"
                  ? "e.g. Moto Edge 50 Ultra"
                  : activeTab === "storages"
                  ? "e.g. 512GB"
                  : "e.g. 16GB"
              }
              value={addInputVal}
              onChange={(e) => setAddInputVal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-850">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm">
              Add option
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
