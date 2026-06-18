import React from "react";
import { PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { Select } from "./select";

interface PaginationProps {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
	onLimitChange: (l: number) => void;
}

export default function Pagination({
	page,
	total,
	limit,
	onPageChange,
	onLimitChange,
}: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	const pages: (number | "...")[] = [];
	if (totalPages <= 7) {
		for (let i = 1; i <= totalPages; i++) pages.push(i);
	} else {
		pages.push(1);
		if (page > 3) pages.push("...");
		for (
			let i = Math.max(2, page - 1);
			i <= Math.min(totalPages - 1, page + 1);
			i++
		)
			pages.push(i);
		if (page < totalPages - 2) pages.push("...");
		pages.push(totalPages);
	}

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/40">
			<div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
				<span>Show</span>
				<Select
					value={limit}
					onChange={(e) => onLimitChange(Number(e.target.value))}
					options={PAGE_SIZE_OPTIONS.map((s) => ({ value: s, label: String(s) }))}
					size="sm"
					className="w-16"
				/>
				<span>entries</span>
				<span className="ml-2 text-zinc-400">·</span>
				<span className="ml-2">
					{total === 0
						? "No entries"
						: `Showing ${from}–${to} of ${total}`}
				</span>
			</div>
			<div className="flex items-center gap-1">
				<button
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
					className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>
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
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				{pages.map((p, i) =>
					p === "..." ? (
						<span
							key={`e-${i}`}
							className="px-2 text-zinc-400 text-xs"
						>
							…
						</span>
					) : (
						<button
							key={p}
							onClick={() => onPageChange(Number(p))}
							className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
								p === page
									? "bg-primary text-white border-primary shadow-sm"
									: "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							}`}
						>
							{p}
						</button>
					),
				)}
				<button
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
				>
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
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
