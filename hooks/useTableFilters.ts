import { useState, useCallback } from "react";

export interface FilterState {
	search: string;
	page: number;
	limit: number;
	sortBy: string;
	sortOrder: "asc" | "desc";
	[key: string]: any;
}

export function useTableFilters<T extends FilterState>(initialState: T) {
	const [filters, setFilters] = useState<T>(initialState);

	const updateFilter = useCallback((updater: Partial<T> | ((prev: T) => T)) => {
		setFilters((prev) => {
			const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
			return next;
		});
	}, []);

	const handleSearch = useCallback((value: string) => {
		updateFilter({ search: value, page: 1 } as Partial<T>);
	}, [updateFilter]);

	const handleSort = useCallback((column: string) => {
		updateFilter((prev) => {
			const sameCol = prev.sortBy === column;
			return {
				...prev,
				sortBy: column,
				sortOrder: sameCol && prev.sortOrder === "asc" ? "desc" : "asc",
				page: 1,
			} as T;
		});
	}, [updateFilter]);

	const handlePageChange = useCallback((page: number) => {
		updateFilter({ page } as Partial<T>);
	}, [updateFilter]);

	const handleLimitChange = useCallback((limit: number) => {
		updateFilter({ limit, page: 1 } as Partial<T>);
	}, [updateFilter]);

	return {
		filters,
		setFilters,
		updateFilter,
		handleSearch,
		handleSort,
		handlePageChange,
		handleLimitChange,
	};
}
