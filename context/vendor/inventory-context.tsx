"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Mobile } from "./types";
import { useUi } from "./ui-context";
import { useAuth } from "./auth-context";
import { useSpecifications } from "./specifications-context";
import {
	getMobilesAction,
	getMobileMetricsAction,
	createMobileAction,
	updateMobileAction,
	deleteMobileAction,
	MobileFilters,
} from "@/actions/mobiles";

interface InventoryMetrics {
	totalUniqueModels: number;
	activeStock: number;
	totalSold: number;
	totalTracedDevices: number;
}

interface InventoryContextType {
	devices: Mobile[];
	setDevices: React.Dispatch<React.SetStateAction<Mobile[]>>;
	isLoading: boolean;
	total: number;
	metrics: InventoryMetrics;
	refreshDevices: (filters?: MobileFilters, force?: boolean) => Promise<void>;
	refreshMetrics: () => Promise<void>;
	addDevice: (data: any) => Promise<{ success: boolean; message?: string }>;
	editDevice: (id: string | number, data: any) => Promise<{ success: boolean; message?: string }>;
	removeDevice: (id: string | number) => Promise<boolean>;

	// Backward-compatible specification states mapped to database specifications
	brands: string[];
	setBrands: React.Dispatch<React.SetStateAction<string[]>>;
	models: { brand: string; name: string }[];
	setModels: React.Dispatch<
		React.SetStateAction<{ brand: string; name: string }[]>
	>;
	storages: string[];
	setStorages: React.Dispatch<React.SetStateAction<string[]>>;
	rams: string[];
	setRams: React.Dispatch<React.SetStateAction<string[]>>;

	// Spec modifiers
	handleAddBrand: (brand: string) => void;
	handleAddModel: (brand: string, name: string) => void;
	handleAddStorage: (capacity: string) => void;
	handleAddRam: (size: string) => void;
	handleDeleteBrand: (brand: string) => void;
	handleDeleteModel: (brand: string, name: string) => void;
	handleDeleteStorage: (capacity: string) => void;
	handleDeleteRam: (size: string) => void;
	handleEditBrand: (oldBrand: string, newBrand: string) => void;
	handleEditModel: (
		brand: string,
		oldModel: string,
		newModel: string,
	) => void;
	handleEditStorage: (oldStorage: string, newStorage: string) => void;
	handleEditRam: (oldRam: string, newRam: string) => void;
	handleDeleteListing: (id: string, name: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
	undefined,
);

const DEFAULT_METRICS: InventoryMetrics = {
	totalUniqueModels: 0,
	activeStock: 0,
	totalSold: 0,
	totalTracedDevices: 0,
};

export function InventoryProvider({ children }: { children: React.ReactNode }) {
	const { triggerToast } = useUi();
	const { vendor } = useAuth();
	const specs = useSpecifications();

	const [devices, setDevices] = useState<Mobile[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [metrics, setMetrics] = useState<InventoryMetrics>(DEFAULT_METRICS);
	const activeFiltersRef = useRef<string | null>(null);
 
	// Fetch mobiles list from backend
	const refreshDevices = useCallback(async (filters?: MobileFilters, force = false) => {
		if (!vendor) return;
 
		const currentFilters = { ...filters };
		const filtersStr = JSON.stringify(currentFilters);
		if (!force && activeFiltersRef.current === filtersStr) return; // Skip duplicate loads
 
		setIsLoading(true);
		try {
			const res = await getMobilesAction(currentFilters);
			if (res.success && res.data && res.data.success) {
				setDevices(res.data.mobiles || []);
				setTotal(res.data.total || (res.data.mobiles ? res.data.mobiles.length : 0));
				activeFiltersRef.current = filtersStr;
			} else {
				console.warn("[InventoryContext] Failed to load devices:", res.message);
			}
		} catch (err) {
			console.error("[InventoryContext] Error loading devices:", err);
		} finally {
			setIsLoading(false);
		}
	}, [vendor]);
 
	// Fetch metrics
	const refreshMetrics = useCallback(async () => {
		if (!vendor) return;
		try {
			const res = await getMobileMetricsAction();
			if (res.success && res.data && res.data.success) {
				setMetrics(res.data.metrics || DEFAULT_METRICS);
			}
		} catch (err) {
			console.error("[InventoryContext] Error loading metrics:", err);
		}
	}, [vendor]);
 
	// Initialize on vendor login
	useEffect(() => {
		if (vendor) {
			refreshDevices(undefined, true);
			refreshMetrics();
		} else {
			setDevices([]);
			setTotal(0);
			setMetrics(DEFAULT_METRICS);
			activeFiltersRef.current = null;
		}
	}, [vendor, refreshMetrics, refreshDevices]);
 
	// CRUD wrappers
	const addDevice = async (data: any) => {
		setIsLoading(true);
		try {
			const res = await createMobileAction(data);
			if (res.success && res.data && res.data.success) {
				const parsedFilters = activeFiltersRef.current ? JSON.parse(activeFiltersRef.current) : undefined;
				await refreshDevices(parsedFilters, true);
				await refreshMetrics();
				return { success: true };
			} else {
				return { success: false, message: res.message || "Failed to create device listing." };
			}
		} catch (err: any) {
			return { success: false, message: err.message || "Failed to create device listing." };
		} finally {
			setIsLoading(false);
		}
	};
 
	const editDevice = async (id: string | number, data: any) => {
		setIsLoading(true);
		try {
			const res = await updateMobileAction(id, data);
			if (res.success && res.data && res.data.success) {
				const parsedFilters = activeFiltersRef.current ? JSON.parse(activeFiltersRef.current) : undefined;
				await refreshDevices(parsedFilters, true);
				await refreshMetrics();
				return { success: true };
			} else {
				return { success: false, message: res.message || "Failed to update device listing." };
			}
		} catch (err: any) {
			return { success: false, message: err.message || "Failed to update device listing." };
		} finally {
			setIsLoading(false);
		}
	};
 
	const removeDevice = async (id: string | number) => {
		setIsLoading(true);
		try {
			const res = await deleteMobileAction(id);
			if (res.success && res.data && res.data.success) {
				const parsedFilters = activeFiltersRef.current ? JSON.parse(activeFiltersRef.current) : undefined;
				await refreshDevices(parsedFilters, true);
				await refreshMetrics();
				return true;
			} else {
				return false;
			}
		} catch (err) {
			console.error("[InventoryContext] Error deleting listing:", err);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// ─────────────────────────────────────────────
	// SPECIFICATIONS BACKWARD COMPATIBILITY
	// ─────────────────────────────────────────────
	const brands = useMemo(() => specs.allBrands.map((b) => b.name), [specs.allBrands]);
	const models = useMemo(() => specs.allModels.map((m) => ({ brand: m.brand_name, name: m.name })), [specs.allModels]);
	const storages = useMemo(() => specs.allStorages.map((s) => s.value), [specs.allStorages]);
	const rams = useMemo(() => specs.allRams.map((r) => r.value), [specs.allRams]);

	// Mock React setStates to prevent breaking compiler imports
	const [/*_brands*/, setBrands] = useState<string[]>([]);
	const [/*_models*/, setModels] = useState<{ brand: string; name: string }[]>([]);
	const [/*_storages*/, setStorages] = useState<string[]>([]);
	const [/*_rams*/, setRams] = useState<string[]>([]);

	const handleAddBrand = (brandName: string) => {
		specs.addBrand(brandName);
	};

	const handleAddModel = (brandName: string, modelName: string) => {
		const matchedBrand = specs.allBrands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
		if (matchedBrand) {
			specs.addModel(modelName, matchedBrand.id);
		} else {
			triggerToast("Select a valid approved brand before adding a model.");
		}
	};

	const handleAddStorage = (capacity: string) => {
		specs.addStorage(capacity);
	};

	const handleAddRam = (size: string) => {
		specs.addRam(size);
	};

	const handleDeleteBrand = (brandName: string) => {
		const matchedBrand = specs.allBrands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
		if (matchedBrand) specs.removeBrand(matchedBrand.id);
	};

	const handleDeleteModel = (brandName: string, modelName: string) => {
		const matchedModel = specs.allModels.find(
			(m) => m.brand_name.toLowerCase() === brandName.toLowerCase() && m.name.toLowerCase() === modelName.toLowerCase()
		);
		if (matchedModel) specs.removeModel(matchedModel.id);
	};

	const handleDeleteStorage = (capacity: string) => {
		const matchedStorage = specs.allStorages.find((s) => s.value === capacity);
		if (matchedStorage) specs.removeStorage(matchedStorage.id);
	};

	const handleDeleteRam = (size: string) => {
		const matchedRam = specs.allRams.find((r) => r.value === size);
		if (matchedRam) specs.removeRam(matchedRam.id);
	};

	// Mock edit functions mapping to specs-context triggers
	const handleEditBrand = (oldBrand: string, newBrand: string) => {
		const matchedBrand = specs.allBrands.find((b) => b.name === oldBrand);
		if (matchedBrand) specs.editBrand(matchedBrand.id, newBrand);
	};

	const handleEditModel = (brandName: string, oldModel: string, newModel: string) => {
		const matchedModel = specs.allModels.find(
			(m) => m.brand_name.toLowerCase() === brandName.toLowerCase() && m.name.toLowerCase() === oldModel.toLowerCase()
		);
		const matchedBrand = specs.allBrands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
		if (matchedModel && matchedBrand) {
			specs.editModel(matchedModel.id, { name: newModel, brand_id: matchedBrand.id });
		}
	};

	const handleEditStorage = (oldCapacity: string, newCapacity: string) => {
		const matchedStorage = specs.allStorages.find((s) => s.value === oldCapacity);
		if (matchedStorage) specs.editStorage(matchedStorage.id, newCapacity);
	};

	const handleEditRam = (oldSize: string, newSize: string) => {
		const matchedRam = specs.allRams.find((r) => r.value === oldSize);
		if (matchedRam) specs.editRam(matchedRam.id, newSize);
	};

	const handleDeleteListing = async (id: string, name: string) => {
		const success = await removeDevice(id);
		if (success) {
			triggerToast(`Deleted ${name} from inventory.`);
		} else {
			triggerToast(`Failed to delete ${name}.`);
		}
	};

	return (
		<InventoryContext.Provider
			value={{
				devices,
				setDevices,
				isLoading,
				total,
				metrics,
				refreshDevices,
				refreshMetrics,
				addDevice,
				editDevice,
				removeDevice,

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
		throw new Error(
			"useInventory must be used within an InventoryProvider",
		);
	}
	return context;
}
