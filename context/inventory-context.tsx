"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { MobileListing } from "./types";
import { useUi } from "./ui-context";
import { useAuth } from "./auth-context";

interface InventoryContextType {
  devices: MobileListing[];
  setDevices: React.Dispatch<React.SetStateAction<MobileListing[]>>;
  brands: string[];
  setBrands: React.Dispatch<React.SetStateAction<string[]>>;
  models: { brand: string; name: string }[];
  setModels: React.Dispatch<React.SetStateAction<{ brand: string; name: string }[]>>;
  storages: string[];
  setStorages: React.Dispatch<React.SetStateAction<string[]>>;
  rams: string[];
  setRams: React.Dispatch<React.SetStateAction<string[]>>;
  handleAddBrand: (brand: string) => void;
  handleAddModel: (brand: string, name: string) => void;
  handleAddStorage: (capacity: string) => void;
  handleAddRam: (size: string) => void;
  handleDeleteBrand: (brand: string) => void;
  handleDeleteModel: (brand: string, name: string) => void;
  handleDeleteStorage: (capacity: string) => void;
  handleDeleteRam: (size: string) => void;
  handleEditBrand: (oldBrand: string, newBrand: string) => void;
  handleEditModel: (brand: string, oldModel: string, newModel: string) => void;
  handleEditStorage: (oldStorage: string, newStorage: string) => void;
  handleEditRam: (oldRam: string, newRam: string) => void;
  handleDeleteListing: (id: string, name: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { triggerToast } = useUi();
  const { vendor } = useAuth();

  const [devices, setDevices] = useState<MobileListing[]>([
    {
      id: "LIST-1",
      brand: "Apple",
      model: "iPhone 13 Pro",
      storage: "128GB",
      ram: "6GB",
      color: "Graphite",
      imei: "359283748291827",
      condition: "Mint",
      price: 58000,
      purchasePrice: 47000,
      stock: 3,
      batteryHealth: 92,
      status: "Active",
      description: "No scratches, fully original, complete box and accessories available.",
    },
    {
      id: "LIST-2",
      brand: "Samsung",
      model: "Galaxy S22 Ultra",
      storage: "256GB",
      ram: "12GB",
      color: "Phantom Black",
      imei: "358764029481947",
      condition: "Good",
      price: 49000,
      purchasePrice: 38000,
      stock: 2,
      batteryHealth: 88,
      status: "Active",
      description: "Minor scuffs on the bottom bezel. Screen has a light protector, original cable.",
    },
    {
      id: "LIST-3",
      brand: "OnePlus",
      model: "OnePlus 10 Pro",
      storage: "128GB",
      ram: "8GB",
      color: "Emerald Forest",
      imei: "357284910283746",
      condition: "Excellent",
      price: 34000,
      purchasePrice: 28000,
      stock: 4,
      batteryHealth: 90,
      status: "Active",
      description: "Clean condition. Retail bill available. 6-month store warranty remaining.",
    },
    {
      id: "LIST-4",
      brand: "Apple",
      model: "iPhone 12 Mini",
      storage: "64GB",
      ram: "4GB",
      color: "Blue",
      imei: "356192837482910",
      condition: "Fair",
      price: 24500,
      purchasePrice: 19000,
      stock: 1,
      batteryHealth: 79,
      status: "Sold",
      description: "Slight battery degradation. Back glass has hairline cracks. Fully functional.",
    },
    {
      id: "LIST-5",
      brand: "Google",
      model: "Pixel 6 Pro",
      storage: "128GB",
      ram: "12GB",
      color: "Stormy Black",
      imei: "354928102938475",
      condition: "Good",
      price: 29000,
      purchasePrice: 22000,
      stock: 2,
      batteryHealth: 85,
      status: "Active",
      description: "Light screen burn, camera glass is clean. Works with all networks.",
    },
  ]);

  const [brands, setBrands] = useState<string[]>(["Apple", "Samsung", "OnePlus", "Google"]);
  const [models, setModels] = useState<{ brand: string; name: string }[]>([
    { brand: "Apple", name: "iPhone 13 Pro" },
    { brand: "Apple", name: "iPhone 12 Mini" },
    { brand: "Samsung", name: "Galaxy S22 Ultra" },
    { brand: "OnePlus", name: "OnePlus 10 Pro" },
    { brand: "Google", name: "Pixel 6 Pro" },
  ]);
  const [storages, setStorages] = useState<string[]>(["64GB", "128GB", "256GB", "512GB", "1TB"]);
  const [rams, setRams] = useState<string[]>(["4GB", "6GB", "8GB", "12GB", "16GB"]);

  const handleAddBrand = (brandName: string) => {
    if (brandName && !brands.includes(brandName)) {
      setBrands((prev) => [...prev, brandName]);
      triggerToast(`Added Brand: ${brandName}`);
    }
  };

  const handleAddModel = (brandName: string, modelName: string) => {
    if (brandName && modelName && !models.some(m => m.brand === brandName && m.name === modelName)) {
      setModels((prev) => [...prev, { brand: brandName, name: modelName }]);
      triggerToast(`Added Model: ${modelName} under ${brandName}`);
    }
  };

  const handleAddStorage = (capacity: string) => {
    if (capacity && !storages.includes(capacity)) {
      setStorages((prev) => [...prev, capacity]);
      triggerToast(`Added Storage: ${capacity}`);
    }
  };

  const handleAddRam = (size: string) => {
    if (size && !rams.includes(size)) {
      setRams((prev) => [...prev, size]);
      triggerToast(`Added RAM: ${size}`);
    }
  };

  const handleDeleteBrand = (brandName: string) => {
    setBrands((prev) => prev.filter((b) => b !== brandName));
    setModels((prev) => prev.filter((m) => m.brand !== brandName));
    triggerToast(`Deleted Brand: ${brandName}`);
  };

  const handleDeleteModel = (brandName: string, modelName: string) => {
    setModels((prev) => prev.filter((m) => !(m.brand === brandName && m.name === modelName)));
    triggerToast(`Deleted Model: ${modelName}`);
  };

  const handleDeleteStorage = (capacity: string) => {
    setStorages((prev) => prev.filter((s) => s !== capacity));
    triggerToast(`Deleted Storage: ${capacity}`);
  };

  const handleDeleteRam = (size: string) => {
    setRams((prev) => prev.filter((r) => r !== size));
    triggerToast(`Deleted RAM: ${size}`);
  };

  const handleEditBrand = (oldBrandName: string, newBrandName: string) => {
    if (!newBrandName) return;
    setBrands((prev) => prev.map((b) => (b === oldBrandName ? newBrandName : b)));
    setModels((prev) =>
      prev.map((m) => (m.brand === oldBrandName ? { ...m, brand: newBrandName } : m))
    );
    triggerToast(`Renamed Brand: ${oldBrandName} to ${newBrandName}`);
  };

  const handleEditModel = (brandName: string, oldModelName: string, newModelName: string) => {
    if (!newModelName) return;
    setModels((prev) =>
      prev.map((m) =>
        m.brand === brandName && m.name === oldModelName ? { ...m, name: newModelName } : m
      )
    );
    triggerToast(`Renamed Model: ${oldModelName} to ${newModelName}`);
  };

  const handleEditStorage = (oldCapacity: string, newCapacity: string) => {
    if (!newCapacity) return;
    setStorages((prev) => prev.map((s) => (s === oldCapacity ? newCapacity : s)));
    triggerToast(`Updated Storage: ${oldCapacity} to ${newCapacity}`);
  };

  const handleEditRam = (oldSize: string, newSize: string) => {
    if (!newSize) return;
    setRams((prev) => prev.map((r) => (r === oldSize ? newSize : r)));
    triggerToast(`Updated RAM: ${oldSize} to ${newSize}`);
  };

  const handleDeleteListing = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} listing?`)) {
      setDevices((prev) => prev.filter((item) => item.id !== id));
      triggerToast(`Deleted ${name} from inventory.`);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        devices,
        setDevices,
        brands,
        setBrands,
        models,
        setModels,
        storages,
        setStorages,
        rams,
        setRams,
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
        handleDeleteListing,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
