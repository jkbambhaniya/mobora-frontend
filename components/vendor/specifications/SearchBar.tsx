import React from "react";
import { Tab } from "@/types/specifications";

interface SearchBarProps {
	activeTab: Tab;
	currentSearch: string;
	onSearchChange: (value: string) => void;
}

export default function SearchBar({
	activeTab,
	currentSearch,
	onSearchChange,
}: SearchBarProps) {
	return (
		<div className="relative w-full sm:w-56">
			<span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 pointer-events-none">
				<svg
					className="w-3.5 h-3.5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2.5"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</span>
			<input
				type="text"
				defaultValue={currentSearch}
				key={activeTab}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder={`Search ${activeTab}...`}
				className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-primary placeholder-zinc-400"
			/>
		</div>
	);
}
