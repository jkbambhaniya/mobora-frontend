import { useState, useCallback, useRef, useEffect } from "react";
import { useSpecifications } from "@/context/vendor/specifications-context";
import { Tab } from "@/types/specifications";

export function useSpecificationsTable(activeTab: Tab) {
	const {
		fetchBrands,
		fetchModels,
		fetchStorages,
		fetchRams,
	} = useSpecifications();

	const [brandsFilters, setBrandsFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "name",
		sortOrder: "asc" as "asc" | "desc",
	});

	const [modelsFilters, setModelsFilters] = useState({
		search: "",
		brandId: "",
		page: 1,
		limit: 10,
		sortBy: "name",
		sortOrder: "asc" as "asc" | "desc",
	});

	const [storagesFilters, setStoragesFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "value",
		sortOrder: "asc" as "asc" | "desc",
	});

	const [ramsFilters, setRamsFilters] = useState({
		search: "",
		page: 1,
		limit: 10,
		sortBy: "value",
		sortOrder: "asc" as "asc" | "desc",
	});

	const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Fetching helpers
	const doFetchBrands = useCallback(
		(f = brandsFilters, force = false) => {
			fetchBrands({ ...f, brandId: undefined }, force);
		},
		[fetchBrands, brandsFilters],
	);

	const doFetchModels = useCallback(
		(f = modelsFilters, force = false) => {
			fetchModels({ ...f, brandId: f.brandId || undefined }, force);
		},
		[fetchModels, modelsFilters],
	);

	const doFetchStorages = useCallback(
		(f = storagesFilters, force = false) => {
			fetchStorages(f, force);
		},
		[fetchStorages, storagesFilters],
	);

	const doFetchRams = useCallback(
		(f = ramsFilters, force = false) => {
			fetchRams(f, force);
		},
		[fetchRams, ramsFilters],
	);

	// Bootstrap tab on activeTab change
	useEffect(() => {
		if (activeTab === "brands") doFetchBrands();
		else if (activeTab === "models") doFetchModels();
		else if (activeTab === "storages") doFetchStorages();
		else if (activeTab === "rams") doFetchRams();
	}, [activeTab]);

	const handleSearch = useCallback((value: string) => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(() => {
			if (activeTab === "brands") {
				const f = { ...brandsFilters, search: value, page: 1 };
				setBrandsFilters(f);
				fetchBrands(f, true);
			} else if (activeTab === "models") {
				const f = { ...modelsFilters, search: value, page: 1 };
				setModelsFilters(f);
				fetchModels({ ...f, brandId: f.brandId || undefined }, true);
			} else if (activeTab === "storages") {
				const f = { ...storagesFilters, search: value, page: 1 };
				setStoragesFilters(f);
				fetchStorages(f, true);
			} else if (activeTab === "rams") {
				const f = { ...ramsFilters, search: value, page: 1 };
				setRamsFilters(f);
				fetchRams(f, true);
			}
		}, 400);
	}, [activeTab, brandsFilters, modelsFilters, storagesFilters, ramsFilters, fetchBrands, fetchModels, fetchStorages, fetchRams]);

	const handleSort = useCallback((col: string) => {
		if (activeTab === "brands") {
			const sameCol = brandsFilters.sortBy === col;
			const f = {
				...brandsFilters,
				sortBy: col,
				sortOrder: (sameCol && brandsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const sameCol = modelsFilters.sortBy === col;
			const f = {
				...modelsFilters,
				sortBy: col,
				sortOrder: (sameCol && modelsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const sameCol = storagesFilters.sortBy === col;
			const f = {
				...storagesFilters,
				sortBy: col,
				sortOrder: (sameCol && storagesFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const sameCol = ramsFilters.sortBy === col;
			const f = {
				...ramsFilters,
				sortBy: col,
				sortOrder: (sameCol && ramsFilters.sortOrder === "asc"
					? "desc"
					: "asc") as "asc" | "desc",
				page: 1,
			};
			setRamsFilters(f);
			fetchRams(f, true);
		}
	}, [activeTab, brandsFilters, modelsFilters, storagesFilters, ramsFilters, fetchBrands, fetchModels, fetchStorages, fetchRams]);

	const handlePageChange = useCallback((p: number) => {
		if (activeTab === "brands") {
			const f = { ...brandsFilters, page: p };
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const f = { ...modelsFilters, page: p };
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const f = { ...storagesFilters, page: p };
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const f = { ...ramsFilters, page: p };
			setRamsFilters(f);
			fetchRams(f, true);
		}
	}, [activeTab, brandsFilters, modelsFilters, storagesFilters, ramsFilters, fetchBrands, fetchModels, fetchStorages, fetchRams]);

	const handleLimitChange = useCallback((l: number) => {
		if (activeTab === "brands") {
			const f = { ...brandsFilters, limit: l, page: 1 };
			setBrandsFilters(f);
			fetchBrands(f, true);
		} else if (activeTab === "models") {
			const f = { ...modelsFilters, limit: l, page: 1 };
			setModelsFilters(f);
			fetchModels({ ...f, brandId: f.brandId || undefined }, true);
		} else if (activeTab === "storages") {
			const f = { ...storagesFilters, limit: l, page: 1 };
			setStoragesFilters(f);
			fetchStorages(f, true);
		} else if (activeTab === "rams") {
			const f = { ...ramsFilters, limit: l, page: 1 };
			setRamsFilters(f);
			fetchRams(f, true);
		}
	}, [activeTab, brandsFilters, modelsFilters, storagesFilters, ramsFilters, fetchBrands, fetchModels, fetchStorages, fetchRams]);

	const handleModelBrandFilter = useCallback((brandId: string) => {
		const f = { ...modelsFilters, brandId, page: 1 };
		setModelsFilters(f);
		fetchModels({ ...f, brandId: brandId || undefined }, true);
	}, [modelsFilters, fetchModels]);

	const currentSearch =
		activeTab === "brands"
			? brandsFilters.search
			: activeTab === "models"
				? modelsFilters.search
				: activeTab === "storages"
					? storagesFilters.search
					: ramsFilters.search;

	const sortDir = useCallback((col: string): "asc" | "desc" | null => {
		if (activeTab === "brands")
			return brandsFilters.sortBy === col ? brandsFilters.sortOrder : null;
		if (activeTab === "models")
			return modelsFilters.sortBy === col ? modelsFilters.sortOrder : null;
		if (activeTab === "storages")
			return storagesFilters.sortBy === col ? storagesFilters.sortOrder : null;
		if (activeTab === "rams")
			return ramsFilters.sortBy === col ? ramsFilters.sortOrder : null;
		return null;
	}, [activeTab, brandsFilters, modelsFilters, storagesFilters, ramsFilters]);

	return {
		brandsFilters,
		modelsFilters,
		storagesFilters,
		ramsFilters,
		currentSearch,
		handleSearch,
		handleSort,
		handlePageChange,
		handleLimitChange,
		handleModelBrandFilter,
		sortDir,
		doFetchBrands,
		doFetchModels,
		doFetchStorages,
		doFetchRams,
	};
}
