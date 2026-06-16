"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useDashboard, MobileListing, slugify } from "@/context/dashboard-context";

export default function ModelDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
  const rawBrand = params.brand as string;
  const rawModel = params.model as string;

  const brand = decodeURIComponent(rawBrand);
  const modelSlug = decodeURIComponent(rawModel);

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

  // Find original model name from slug
  const model = useMemo(() => {
    const modelObj = models.find(
      (m) => m.brand.toLowerCase() === brand.toLowerCase() && slugify(m.name) === modelSlug
    );
    return modelObj ? modelObj.name : modelSlug;
  }, [models, brand, modelSlug]);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<MobileListing | null>(null);

  // Form Fields
  const [formImei, setFormImei] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formStorage, setFormStorage] = useState("");
  const [formRam, setFormRam] = useState("");
  const [formColor, setFormColor] = useState("");
  const [formCondition, setFormCondition] = useState<"Mint" | "Excellent" | "Good" | "Fair">("Excellent");
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

  // Open Handlers
  const handleOpenAdd = () => {
    setEditingDevice(null);
    setFormImei("");
    setFormBrand(brand);
    setFormModel(model);
    setFormStorage("");
    setFormRam("");
    setFormColor("");
    setFormCondition("Excellent");
    setFormBatteryHealth(90);
    setFormPurchasePrice("");
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
    setFormPurchasePrice(device.purchasePrice ? device.purchasePrice.toString() : "");
    setFormDescription(device.description);
    setIsFormOpen(true);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand || !formModel || !formStorage || !formRam || !formPurchasePrice) {
      alert("Please enter brand, model, storage, RAM, and purchase price.");
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
                stock: 1,
                batteryHealth: formBatteryHealth,
                description: formDescription,
              }
            : d
        )
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
        stock: 1,
        batteryHealth: formBatteryHealth,
        status: "Active",
        description: formDescription || `Manually registered ${formBrand} ${formModel} in stock.`,
      };
      setDevices((prev) => [newDevice, ...prev]);
      triggerToast(`Added ${formBrand} ${formModel} to stock.`);
    }
    setIsFormOpen(false);
  };

  // Dynamic spec creators
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

  // Search/Filter states for Level 2
  const [level2Search, setLevel2Search] = useState("");
  const [level2Condition, setLevel2Condition] = useState("All");

  // Filter devices matching this specific brand and model
  const modelDevices = useMemo(() => {
    return devices.filter(
      (d) =>
        d.brand.toLowerCase() === brand.toLowerCase() &&
        d.model.toLowerCase() === model.toLowerCase()
    );
  }, [devices, brand, model]);

  // Apply search/condition filters
  const filteredModelDevices = useMemo(() => {
    return modelDevices.filter((d) => {
      const query = level2Search.toLowerCase();
      const matchesSearch =
        (d.imei && d.imei.includes(query)) ||
        d.color.toLowerCase().includes(query) ||
        d.storage.toLowerCase().includes(query) ||
        d.ram.toLowerCase().includes(query);

      const matchesCondition = level2Condition === "All" || d.condition === level2Condition;

      return matchesSearch && matchesCondition;
    });
  }, [modelDevices, level2Search, level2Condition]);

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/mobiles")}
          className="flex items-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Mobiles
        </Button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={level2Search}
            onChange={(e) => setLevel2Search(e.target.value)}
            placeholder="Search IMEI, specs, color..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={level2Condition}
            onChange={(e) => setLevel2Condition(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
            className="px-3.5 py-2.5 rounded-xl font-bold cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Device
            </span>
          </Button>
        </div>
      </div>

      {/* INDIVIDUAL IMEI LISTING TABLE */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-sm">
        {filteredModelDevices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-bold text-xs uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
                  <th className="py-4 px-6">Specification</th>
                  <th className="py-4 px-6">IMEI</th>
                  <th className="py-4 px-6 text-center">Condition</th>
                  <th className="py-4 px-6 text-center">Battery</th>
                  <th className="py-4 px-6 text-right">Cost Price</th>
                  <th className="py-4 px-6 text-right">Selling Price</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModelDevices.map((d) => {
                  const conditionColorMap = {
                    Mint: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
                    Excellent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    Good: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    Fair: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  };

                  return (
                    <tr
                      key={d.id}
                      className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white leading-tight">
                            {d.color}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 font-semibold">
                            {d.storage} / {d.ram} RAM
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {d.imei ? (
                          <Link
                            href={`/mobiles/${encodeURIComponent(brand)}/${slugify(model)}/${d.imei}`}
                            className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
                          >
                            {d.imei}
                          </Link>
                        ) : (
                          <span className="text-zinc-400 italic font-sans text-[11px]">No IMEI Registered</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                            conditionColorMap[d.condition] || "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {d.condition}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-zinc-700 dark:text-zinc-300">
                        {d.batteryHealth}%
                      </td>
                      <td className="py-4 px-6 text-right text-zinc-500 font-medium" suppressHydrationWarning>
                        {d.purchasePrice ? `₹${d.purchasePrice.toLocaleString()}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-zinc-955 dark:text-zinc-100" suppressHydrationWarning>
                        {d.status === "Sold" ? `₹${d.price.toLocaleString()}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block ${
                            d.status === "Active"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {d.status === "Active" ? "In Hand" : "Sold"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {d.imei ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Navigate to dynamic nested route /mobiles/[brand]/[model]/[imei]
                                router.push(`/mobiles/${encodeURIComponent(brand)}/${slugify(model)}/${d.imei}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                            >
                              History
                            </Button>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Cannot Trace</span>
                          )}
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
            <h4 className="font-bold text-zinc-900 dark:text-zinc-200">No Configured Devices Found</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              We couldn't find any individual devices matching your filters.
            </p>
          </div>
        )}
      </div>

      {/* DYNAMIC MODAL FORM */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDevice ? `Edit Device: ${editingDevice.brand} ${editingDevice.model}` : "Register Mobile Device"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IMEI */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-450 uppercase tracking-wide">IMEI (15 digits)</label>
              <input
                type="text"
                maxLength={15}
                value={formImei}
                onChange={(e) => setFormImei(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 359283748291827"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono"
              />
            </div>

            {/* Color */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">Color</label>
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
            {/* STORAGE */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">Storage Capacity *</label>
                <button
                  type="button"
                  onClick={() => setIsAddingStorage(!isAddingStorage)}
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  {isAddingStorage ? "Cancel" : "+ Add Storage"}
                </button>
              </div>

              {isAddingStorage ? (
                <div className="flex gap-2 animate-scaleUp">
                  <input
                    type="text"
                    value={newStorageVal}
                    onChange={(e) => setNewStorageVal(e.target.value)}
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
                  onChange={(e) => setFormStorage(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="">-- Choose Storage --</option>
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
                <label className="text-xs font-semibold text-zinc-455 uppercase tracking-wide">RAM Size *</label>
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
                    onChange={(e) => setNewRamVal(e.target.value)}
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
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Condition</label>
              <select
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value as any)}
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
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Battery Health (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={formBatteryHealth}
                onChange={(e) => setFormBatteryHealth(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cost Price */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Purchase / Cost Price * (₹)</label>
            <input
              type="number"
              required
              value={formPurchasePrice}
              onChange={(e) => setFormPurchasePrice(e.target.value)}
              placeholder="e.g. 30000"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Listing Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="e.g. Mint condition. Minor scratch on screen protector, box and original cable available..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" size="sm">
              {editingDevice ? "Save Changes" : "Register Stock Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
