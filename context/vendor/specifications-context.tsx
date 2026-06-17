"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { useAuth } from "./auth-context";
import {
	getBrandsAction,
	createBrandAction,
	updateBrandAction,
	deleteBrandAction,
	getModelsAction,
	createModelAction,
	updateModelAction,
	deleteModelAction,
	getStoragesAction,
	createStorageAction,
	updateStorageAction,
	deleteStorageAction,
	getRamsAction,
	createRamAction,
	updateRamAction,
	deleteRamAction,
	getSpecMetricsAction,
	getAllSpecsAction,
	SpecFilters,
} from "@/actions/specifications";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface SpecBrand {
	id: number;
	name: string;
	status?: string;
	model_count?: number;
	created_at?: string;
}

export interface SpecModel {
	id: number;
	name: string;
	brand_id: number;
	brand_name: string;
	vendor_id?: number | null;
	created_at?: string;
}

export interface SpecStorage {
	id: number;
	value: string;
	status?: string;
	created_at?: string;
}

export interface SpecRam {
	id: number;
	value: string;
	status?: string;
	created_at?: string;
}

export interface SpecPaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}

export interface SpecMetrics {
	totalBrands: number;
	totalModels: number;
	totalStorages: number;
	totalRams: number;
}

interface SpecificationsContextType {
	// Metrics
	specMetrics: SpecMetrics;

	// Brands
	brands: SpecPaginatedResult<SpecBrand>;
	brandsLoading: boolean;
	fetchBrands: (filters?: SpecFilters, force?: boolean) => Promise<void>;
	addBrand: (
		name: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	editBrand: (
		id: number,
		name: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	removeBrand: (id: number) => Promise<boolean>;

	// Models
	models: SpecPaginatedResult<SpecModel>;
	modelsLoading: boolean;
	fetchModels: (filters?: SpecFilters, force?: boolean) => Promise<void>;
	addModel: (
		name: string,
		brand_id: number,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	editModel: (
		id: number,
		data: { name?: string; brand_id?: number },
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	removeModel: (id: number) => Promise<boolean>;

	// Storages
	storages: SpecPaginatedResult<SpecStorage>;
	storagesLoading: boolean;
	fetchStorages: (filters?: SpecFilters, force?: boolean) => Promise<void>;
	addStorage: (
		value: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	editStorage: (
		id: number,
		value: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	removeStorage: (id: number) => Promise<boolean>;

	// RAMs
	rams: SpecPaginatedResult<SpecRam>;
	ramsLoading: boolean;
	fetchRams: (filters?: SpecFilters, force?: boolean) => Promise<void>;
	addRam: (
		value: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	editRam: (
		id: number,
		value: string,
	) => Promise<{ success: boolean; message?: string; errors?: any }>;
	removeRam: (id: number) => Promise<boolean>;

	// Dropdown lists (unpaginated, for selects in inventory/trades/etc.)
	allBrands: { id: number; name: string }[];
	allModels: {
		id: number;
		name: string;
		brand_id: number;
		brand_name: string;
	}[];
	allStorages: { id: number; value: string }[];
	allRams: { id: number; value: string }[];
	refreshAllSpecs: () => Promise<void>;
	refreshMetrics: () => Promise<void>;
}

const SpecificationsContext = createContext<
	SpecificationsContextType | undefined
>(undefined);

const EMPTY_PAGE = { data: [], total: 0, page: 1, limit: 10 };
const DEFAULT_METRICS: SpecMetrics = {
	totalBrands: 0,
	totalModels: 0,
	totalStorages: 0,
	totalRams: 0,
};

export function SpecificationsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { vendor } = useAuth();

	const [specMetrics, setSpecMetrics] =
		useState<SpecMetrics>(DEFAULT_METRICS);
	const [allBrands, setAllBrands] = useState<{ id: number; name: string }[]>(
		[],
	);
	const [allModels, setAllModels] = useState<
		{ id: number; name: string; brand_id: number; brand_name: string }[]
	>([]);
	const [allStorages, setAllStorages] = useState<
		{ id: number; value: string }[]
	>([]);
	const [allRams, setAllRams] = useState<{ id: number; value: string }[]>([]);

	const [brands, setBrands] =
		useState<SpecPaginatedResult<SpecBrand>>(EMPTY_PAGE);
	const [brandsLoading, setBrandsLoading] = useState(false);
	const [brandsKey, setBrandsKey] = useState<string | null>(null);

	const [models, setModels] =
		useState<SpecPaginatedResult<SpecModel>>(EMPTY_PAGE);
	const [modelsLoading, setModelsLoading] = useState(false);
	const [modelsKey, setModelsKey] = useState<string | null>(null);

	const [storages, setStorages] =
		useState<SpecPaginatedResult<SpecStorage>>(EMPTY_PAGE);
	const [storagesLoading, setStoragesLoading] = useState(false);
	const [storagesKey, setStoragesKey] = useState<string | null>(null);

	const [rams, setRams] = useState<SpecPaginatedResult<SpecRam>>(EMPTY_PAGE);
	const [ramsLoading, setRamsLoading] = useState(false);
	const [ramsKey, setRamsKey] = useState<string | null>(null);

	const refreshMetrics = useCallback(async () => {
		if (!vendor) return;
		try {
			const res = await getSpecMetricsAction();
			if (res.success && res.data?.success) {
				setSpecMetrics(res.data.metrics);
			}
		} catch (_) {}
	}, [vendor]);

	const refreshAllSpecs = useCallback(async () => {
		if (!vendor) return;
		try {
			const res = await getAllSpecsAction();
			if (res.success && res.data?.success) {
				setAllBrands(res.data.brands || []);
				setAllModels(res.data.models || []);
				setAllStorages(res.data.storages || []);
				setAllRams(res.data.rams || []);
			}
		} catch (_) {}
	}, [vendor]);

	// ─── Brands ───
	const fetchBrands = useCallback(
		async (filters?: SpecFilters, force = false) => {
			if (!vendor) return;
			const key = JSON.stringify(filters || {});
			if (!force && brandsKey === key) return;
			setBrandsLoading(true);
			try {
				const res = await getBrandsAction(filters);
				if (res.success && res.data?.success) {
					setBrands(res.data);
					setBrandsKey(key);
				}
			} catch (_) {
			} finally {
				setBrandsLoading(false);
			}
		},
		[vendor, brandsKey],
	);

	const addBrand = async (name: string) => {
		const res = await createBrandAction(name);
		if (res.success) {
			await fetchBrands(undefined, true);
			await refreshMetrics();
			await refreshAllSpecs();
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const editBrand = async (id: number, name: string) => {
		const res = await updateBrandAction(id, name);
		if (res.success) {
			await fetchBrands(undefined, true);
			await refreshAllSpecs();
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const removeBrand = async (id: number) => {
		const res = await deleteBrandAction(id);
		if (res.success) {
			await fetchBrands(undefined, true);
			await refreshMetrics();
			await refreshAllSpecs();
		}
		return res.success;
	};

	// ─── Models ───
	const fetchModels = useCallback(
		async (filters?: SpecFilters, force = false) => {
			if (!vendor) return;
			const key = JSON.stringify(filters || {});
			if (!force && modelsKey === key) return;
			setModelsLoading(true);
			try {
				const res = await getModelsAction(filters);
				if (res.success && res.data?.success) {
					setModels(res.data);
					setModelsKey(key);
				}
			} catch (_) {
			} finally {
				setModelsLoading(false);
			}
		},
		[vendor, modelsKey],
	);

	const addModel = async (name: string, brand_id: number) => {
		const res = await createModelAction(name, brand_id);
		if (res.success) {
			await fetchModels(undefined, true);
			await refreshMetrics();
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const editModel = async (
		id: number,
		data: { name?: string; brand_id?: number },
	) => {
		const res = await updateModelAction(id, data);
		if (res.success) {
			await fetchModels(undefined, true);
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const removeModel = async (id: number) => {
		const res = await deleteModelAction(id);
		if (res.success) {
			await fetchModels(undefined, true);
			await refreshMetrics();
		}
		return res.success;
	};

	// ─── Storages ───
	const fetchStorages = useCallback(
		async (filters?: SpecFilters, force = false) => {
			if (!vendor) return;
			const key = JSON.stringify(filters || {});
			if (!force && storagesKey === key) return;
			setStoragesLoading(true);
			try {
				const res = await getStoragesAction(filters);
				if (res.success && res.data?.success) {
					setStorages(res.data);
					setStoragesKey(key);
				}
			} catch (_) {
			} finally {
				setStoragesLoading(false);
			}
		},
		[vendor, storagesKey],
	);

	const addStorage = async (value: string) => {
		const res = await createStorageAction(value);
		if (res.success) {
			await fetchStorages(undefined, true);
			await refreshMetrics();
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const editStorage = async (id: number, value: string) => {
		const res = await updateStorageAction(id, value);
		if (res.success) {
			await fetchStorages(undefined, true);
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const removeStorage = async (id: number) => {
		const res = await deleteStorageAction(id);
		if (res.success) {
			await fetchStorages(undefined, true);
			await refreshMetrics();
		}
		return res.success;
	};

	// ─── RAMs ───
	const fetchRams = useCallback(
		async (filters?: SpecFilters, force = false) => {
			if (!vendor) return;
			const key = JSON.stringify(filters || {});
			if (!force && ramsKey === key) return;
			setRamsLoading(true);
			try {
				const res = await getRamsAction(filters);
				if (res.success && res.data?.success) {
					setRams(res.data);
					setRamsKey(key);
				}
			} catch (_) {
			} finally {
				setRamsLoading(false);
			}
		},
		[vendor, ramsKey],
	);

	const addRam = async (value: string) => {
		const res = await createRamAction(value);
		if (res.success) {
			await fetchRams(undefined, true);
			await refreshMetrics();
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const editRam = async (id: number, value: string) => {
		const res = await updateRamAction(id, value);
		if (res.success) {
			await fetchRams(undefined, true);
		}
		return {
			success: res.success,
			message: res.message,
			errors: res.errors,
		};
	};

	const removeRam = async (id: number) => {
		const res = await deleteRamAction(id);
		if (res.success) {
			await fetchRams(undefined, true);
			await refreshMetrics();
		}
		return res.success;
	};

	// Bootstrap on vendor login
	useEffect(() => {
		if (vendor) {
			refreshMetrics();
			refreshAllSpecs();
		} else {
			setSpecMetrics(DEFAULT_METRICS);
			setAllBrands([]);
			setAllModels([]);
			setAllStorages([]);
			setAllRams([]);
			setBrands(EMPTY_PAGE);
			setModels(EMPTY_PAGE);
			setStorages(EMPTY_PAGE);
			setRams(EMPTY_PAGE);
		}
	}, [vendor]);

	return (
		<SpecificationsContext.Provider
			value={{
				specMetrics,
				brands,
				brandsLoading,
				fetchBrands,
				addBrand,
				editBrand,
				removeBrand,
				models,
				modelsLoading,
				fetchModels,
				addModel,
				editModel,
				removeModel,
				storages,
				storagesLoading,
				fetchStorages,
				addStorage,
				editStorage,
				removeStorage,
				rams,
				ramsLoading,
				fetchRams,
				addRam,
				editRam,
				removeRam,
				allBrands,
				allModels,
				allStorages,
				allRams,
				refreshAllSpecs,
				refreshMetrics,
			}}
		>
			{children}
		</SpecificationsContext.Provider>
	);
}

export function useSpecifications() {
	const context = useContext(SpecificationsContext);
	if (context === undefined) {
		throw new Error(
			"useSpecifications must be used within a SpecificationsProvider",
		);
	}
	return context;
}
