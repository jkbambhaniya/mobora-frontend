import React from "react";

export default function SortIcon({ dir }: { dir?: "asc" | "desc" | null }) {
	return (
		<span className="inline-flex flex-col ml-1 opacity-50">
			<svg
				className={`w-2.5 h-2.5 -mb-0.5 ${dir === "asc" ? "opacity-100 text-primary" : ""}`}
				viewBox="0 0 10 6"
				fill="currentColor"
			>
				<path d="M0 6l5-6 5 6z" />
			</svg>
			<svg
				className={`w-2.5 h-2.5 ${dir === "desc" ? "opacity-100 text-primary" : ""}`}
				viewBox="0 0 10 6"
				fill="currentColor"
			>
				<path d="M0 0l5 6 5-6z" />
			</svg>
		</span>
	);
}
