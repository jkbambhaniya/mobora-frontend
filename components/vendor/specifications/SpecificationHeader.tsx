import React from "react";
import { Tab } from "@/types/specifications";
import { Button } from "@/components/ui/button";
import SearchBar from "./SearchBar";
import { Select } from "@/components/ui/select";

interface SpecificationHeaderProps {
	activeTab: Tab;
	setActiveTab: (tab: Tab) => void;
	brandId: string;
	onBrandFilterChange: (brandId: string) => void;
	allBrands: { id: number; name: string }[];
	currentSearch: string;
	onSearchChange: (value: string) => void;
	onAddClick: () => void;
}

export default function SpecificationHeader({
	activeTab,
	setActiveTab,
	brandId,
	onBrandFilterChange,
	allBrands,
	currentSearch,
	onSearchChange,
	onAddClick,
}: SpecificationHeaderProps) {
	const tabConfig = [
		{ key: "brands" as Tab, label: "Brands Setup" },
		{ key: "models" as Tab, label: "Model Catalog" },
		{ key: "storages" as Tab, label: "Storage Options" },
		{ key: "rams" as Tab, label: "RAM Options" },
	];

	const addButtonText =
		activeTab === "brands"
			? "Request Brand"
			: activeTab === "storages"
				? "Request Storage"
				: activeTab === "rams"
					? "Request RAM"
					: "Add Model";

	return (
		<div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/40">
			{/* Tabs */}
			<div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-955 p-1 rounded-xl overflow-x-auto w-full lg:w-auto">
				{tabConfig.map(({ key, label }) => (
					<button
						key={key}
						id={`spec-tab-${key}`}
						onClick={() => setActiveTab(key)}
						className={`flex-1 lg:flex-initial px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer ${
							activeTab === key
								? "bg-white dark:bg-zinc-900 text-primary dark:text-secondary shadow-sm"
								: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
						}`}
					>
						{label}
					</button>
				))}
			</div>

			{/* Controls */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
				{/* Models: brand filter */}
				{activeTab === "models" && (
					<Select
						value={brandId}
						onChange={(e) => onBrandFilterChange(e.target.value)}
						options={[
							{ value: "", label: "All Brands" },
							...allBrands.map((b) => ({ value: b.id, label: b.name })),
						]}
						size="sm"
						className="w-40"
					/>
				)}

				{/* Search */}
				<SearchBar
					activeTab={activeTab}
					currentSearch={currentSearch}
					onSearchChange={onSearchChange}
				/>

				{/* Add Button */}
				<Button
					id="spec-add-btn"
					variant="gradient"
					size="sm"
					shape="pill"
					className="whitespace-nowrap font-bold"
					onClick={onAddClick}
				>
					<span className="flex items-center gap-2">
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						{addButtonText}
					</span>
				</Button>
			</div>
		</div>
	);
}
