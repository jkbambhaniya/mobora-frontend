"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { useSpecifications } from "@/context/vendor/specifications-context";
import { useAuth } from "@/context/vendor/auth-context";
import { Tab } from "@/types/specifications";
import { useSpecificationsTable } from "@/hooks/useSpecificationsTable";
import { ConfirmDeleteModal } from "@/components/ui/confirm-modal";

import {
	BrandTable,
	ModelTable,
	StorageTable,
	RamTable,
	SpecificationHeader,
	MetricsCards,
	AddModal,
	EditModal,
} from "@/components/vendor/specifications";
import Pagination from "@/components/ui/Pagination";

export default function SpecificationsPage() {
	const {
		specMetrics,
		brands,
		brandsLoading,
		addBrand,
		editBrand,
		removeBrand,
		models,
		modelsLoading,
		addModel,
		editModel,
		removeModel,
		storages,
		storagesLoading,
		addStorage,
		editStorage,
		removeStorage,
		rams,
		ramsLoading,
		addRam,
		editRam,
		removeRam,
		allBrands,
	} = useSpecifications();

	const { vendor } = useAuth();

	const [activeTab, setActiveTab] = useState<Tab>("brands");

	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const tabParam = params.get("tab") as Tab;
			if (tabParam && ["brands", "models", "storages", "rams"].includes(tabParam)) {
				setActiveTab(tabParam);
			}
		}
	}, []);

	// Custom hook for search, pagination, limits, sorting
	const {
		currentSearch,
		handleSearch,
		handleSort,
		handlePageChange,
		handleLimitChange,
		handleModelBrandFilter,
		sortDir,
		modelsFilters,
	} = useSpecificationsTable(activeTab);

	// Modals State
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [editData, setEditData] = useState<{
		tab: Tab;
		id: number;
		currentValue: string;
		currentBrandId?: number;
	} | null>(null);

	const [deleteModal, setDeleteModal] = useState<{
		tab: Tab;
		id: number;
		label: string;
	} | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Handlers
	const handleAdd = async (value: string, brandId?: number) => {
		let result;
		if (activeTab === "brands") {
			result = await addBrand(value);
		} else if (activeTab === "models") {
			result = await addModel(value, brandId!);
		} else if (activeTab === "storages") {
			result = await addStorage(value);
		} else {
			result = await addRam(value);
		}

		if (result.success) {
			const label = activeTab.slice(0, -1);
			const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
			toast.success(
				activeTab === "models"
					? "Model added successfully!"
					: `${formattedLabel} request submitted successfully!`,
			);
		}
		return result;
	};

	const handleEdit = async (
		tab: Tab,
		id: number,
		value: string,
		brandId?: number,
	) => {
		let result;
		if (tab === "brands") {
			result = await editBrand(id, value);
		} else if (tab === "models") {
			result = await editModel(id, { name: value, brand_id: brandId });
		} else if (tab === "storages") {
			result = await editStorage(id, value);
		} else {
			result = await editRam(id, value);
		}

		if (result.success) {
			const label = tab.slice(0, -1);
			const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
			toast.success(`${formattedLabel} updated successfully!`);
		}
		return result;
	};

	const handleDelete = async () => {
		if (!deleteModal) return;
		setDeleteLoading(true);
		const { tab, id } = deleteModal;
		let success = false;

		if (tab === "brands") success = await removeBrand(id);
		else if (tab === "models") success = await removeModel(id);
		else if (tab === "storages") success = await removeStorage(id);
		else success = await removeRam(id);

		setDeleteLoading(false);
		if (success) {
			setDeleteModal(null);
			const label = tab.slice(0, -1);
			const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
			toast.success(`${formattedLabel} deleted successfully!`);
		} else {
			toast.error("Failed to delete item.");
		}
	};

	const isLoading =
		(activeTab === "brands" && brandsLoading) ||
		(activeTab === "models" && modelsLoading) ||
		(activeTab === "storages" && storagesLoading) ||
		(activeTab === "rams" && ramsLoading);

	const paginatedData =
		activeTab === "brands"
			? brands
			: activeTab === "models"
				? models
				: activeTab === "storages"
					? storages
					: rams;

	return (
		<div className="space-y-8 animate-fadeIn">
			{/* METRIC CARDS */}
			<MetricsCards
				specMetrics={specMetrics}
				activeTab={activeTab}
				setActiveTab={setActiveTab}
			/>

			{/* TABLE CARD */}
			<div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm overflow-hidden">
				{/* TABLE HEADER & CONTROLS */}
				<SpecificationHeader
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					brandId={modelsFilters.brandId}
					onBrandFilterChange={handleModelBrandFilter}
					allBrands={allBrands}
					currentSearch={currentSearch}
					onSearchChange={handleSearch}
					onAddClick={() => setIsAddOpen(true)}
				/>

				{/* TABLE BODY */}
				<div className="overflow-x-auto">
					{activeTab === "brands" && (
						<BrandTable
							data={brands.data}
							loading={isLoading}
							page={brands.page}
							limit={brands.limit}
							onSort={handleSort}
							sortDir={sortDir}
						/>
					)}

					{activeTab === "models" && (
						<ModelTable
							data={models.data}
							loading={isLoading}
							page={models.page}
							limit={models.limit}
							vendorId={
								vendor?.id !== undefined && vendor?.id !== null
									? Number(vendor.id)
									: undefined
							}
							onSort={handleSort}
							sortDir={sortDir}
							onEdit={(row) =>
								setEditData({
									tab: "models",
									id: row.id,
									currentValue: row.name,
									currentBrandId: row.brand_id,
								})
							}
							onDelete={(row) =>
								setDeleteModal({
									tab: "models",
									id: row.id,
									label: row.name,
								})
							}
						/>
					)}

					{activeTab === "storages" && (
						<StorageTable
							data={storages.data}
							loading={isLoading}
							page={storages.page}
							limit={storages.limit}
							onSort={handleSort}
							sortDir={sortDir}
						/>
					)}

					{activeTab === "rams" && (
						<RamTable
							data={rams.data}
							loading={isLoading}
							page={rams.page}
							limit={rams.limit}
							onSort={handleSort}
							sortDir={sortDir}
						/>
					)}
				</div>

				{/* PAGINATION */}
				<Pagination
					page={paginatedData.page}
					total={paginatedData.total}
					limit={paginatedData.limit}
					onPageChange={handlePageChange}
					onLimitChange={handleLimitChange}
				/>
			</div>

			{/* ADD MODAL */}
			<AddModal
				isOpen={isAddOpen}
				onClose={() => setIsAddOpen(false)}
				activeTab={activeTab}
				allBrands={allBrands}
				onAdd={handleAdd}
			/>

			{/* EDIT MODAL */}
			<EditModal
				editData={editData}
				onClose={() => setEditData(null)}
				allBrands={allBrands}
				onEdit={handleEdit}
			/>

			{/* DELETE CONFIRMATION MODAL */}
			<ConfirmDeleteModal
				isOpen={deleteModal !== null}
				onClose={() => setDeleteModal(null)}
				onConfirm={handleDelete}
				itemName={deleteModal?.label || ""}
				warningText={
					deleteModal?.tab === "brands"
						? "⚠ All models under this brand will also be deleted."
						: undefined
				}
				loading={deleteLoading}
			/>
		</div>
	);
}
