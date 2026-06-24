import React from "react";

interface PaginationProps {
	page: number;
	total: number;
	limit: number;
	onPageChange: (p: number) => void;
	onLimitChange: (l: number) => void;
	label?: string;
}

export default function Pagination({
	page,
	total,
	limit,
	onPageChange,
	onLimitChange,
	label = "entries",
}: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const from = total === 0 ? 0 : (page - 1) * limit + 1;
	const to = Math.min(page * limit, total);

	const pages: (number | "...")[] = [];
	if (totalPages <= 5) {
		for (let i = 1; i <= totalPages; i++) pages.push(i);
	} else {
		pages.push(1);
		if (page > 3) pages.push("...");
		for (
			let i = Math.max(2, page - 1);
			i <= Math.min(totalPages - 1, page + 1);
			i++
		) {
			pages.push(i);
		}
		if (page < totalPages - 2) pages.push("...");
		pages.push(totalPages);
	}

	if (total === 0) return null;

	return (
		<div className="px-5 py-4 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
			<p className="text-xs text-zinc-550 dark:text-gray-400">
				Showing <span className="font-semibold text-zinc-900 dark:text-white">{from}</span> to <span className="font-semibold text-zinc-900 dark:text-white">{to}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{total}</span> {label}
			</p>
			
			<div className="flex items-center gap-4 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-end">
				{/* Page size selector */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-zinc-500 dark:text-gray-400 whitespace-nowrap">Rows per page:</span>
					<select
						value={limit}
						onChange={(e) => onLimitChange(Number(e.target.value))}
						className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer h-8"
					>
						{[5, 10, 15, 20, 50].map((size) => (
							<option key={size} value={size} className="dark:bg-[#13151a]">
								{size}
							</option>
						))}
					</select>
				</div>

				{totalPages > 1 && (
					<div className="flex items-center gap-1.5">
						<button
							onClick={() => onPageChange(page - 1)}
							disabled={page === 1}
							className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
							</svg>
						</button>
						
						{pages.map((p, idx) =>
							p === "..." ? (
								<span key={`el-${idx}`} className="text-zinc-400 dark:text-gray-600 px-1.5 text-xs select-none">
									...
								</span>
							) : (
								<button
									key={p}
									onClick={() => onPageChange(Number(p))}
									className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
										p === page
											? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
											: "border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5"
									}`}
								>
									{p}
								</button>
							)
						)}

						<button
							onClick={() => onPageChange(page + 1)}
							disabled={page === totalPages}
							className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-white/5 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
