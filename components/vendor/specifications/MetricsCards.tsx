import React from "react";
import { Tab } from "@/types/specifications";
import { SpecMetrics } from "@/context/vendor/specifications-context";

interface MetricsCardsProps {
	specMetrics: SpecMetrics;
	activeTab: Tab;
	setActiveTab: (tab: Tab) => void;
}

export default function MetricsCards({
	specMetrics,
	activeTab,
	setActiveTab,
}: MetricsCardsProps) {
	const cards = [
		{
			label: "Brands",
			value: specMetrics.totalBrands,
			color: "bg-indigo-500",
			tab: "brands" as Tab,
		},
		{
			label: "Models",
			value: specMetrics.totalModels,
			color: "bg-violet-500",
			tab: "models" as Tab,
		},
		{
			label: "Storages",
			value: specMetrics.totalStorages,
			color: "bg-sky-500",
			tab: "storages" as Tab,
		},
		{
			label: "RAM Sizes",
			value: specMetrics.totalRams,
			color: "bg-emerald-500",
			tab: "rams" as Tab,
		},
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
			{cards.map((card) => (
				<button
					key={card.tab}
					onClick={() => setActiveTab(card.tab)}
					className={`p-5 rounded-2xl border text-left relative overflow-hidden transition-all duration-200 cursor-pointer group ${
						activeTab === card.tab
							? "border-primary/40 bg-white dark:bg-zinc-900 shadow-md ring-1 ring-primary/20"
							: "border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 hover:shadow-sm"
					}`}
				>
					<div
						className={`absolute top-0 left-0 w-1.5 h-full ${card.color}`}
					/>
					<span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block pl-1">
						{card.label}
					</span>
					<span className="text-3xl font-extrabold tracking-tight mt-1 block pl-1">
						{card.value}
					</span>
				</button>
			))}
		</div>
	);
}
