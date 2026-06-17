import React from "react";
import LoadingRows from "./LoadingRows";
import SortIcon from "./SortIcon";

export interface Column<T> {
	key: string;
	title: string;
	sortable?: boolean;
	headerClassName?: string;
	className?: string;
	render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	loading?: boolean;
	onSort?: (key: any) => void;
	sortDir?: (key: any) => "asc" | "desc" | null;
	emptyMessage?: React.ReactNode;
}

export function DataTable<T>({
	columns,
	data,
	loading,
	onSort,
	sortDir,
	emptyMessage,
}: DataTableProps<T>) {
	if (loading) {
		return (
			<table className="w-full text-left text-sm border-collapse">
				<thead>
					<tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold text-xs uppercase border-b border-zinc-200/40 dark:border-zinc-800/40">
						{columns.map((col) => (
							<th
								key={col.key}
								className={`py-4 px-6 ${col.headerClassName || ""}`}
							>
								{col.title}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					<LoadingRows cols={columns.length} />
				</tbody>
			</table>
		);
	}

	return (
		<table className="w-full text-left text-sm border-collapse">
			<thead>
				<tr className="bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 font-semibold text-xs uppercase select-none border-b border-zinc-200/40 dark:border-zinc-800/40">
					{columns.map((col) => {
						const isSortable = col.sortable !== false && onSort;
						return (
							<th
								key={col.key}
								className={`py-4 px-6 ${col.headerClassName || ""} ${
									isSortable
										? "cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
										: ""
								}`}
								onClick={() => isSortable && onSort(col.key)}
							>
								<div className="flex items-center gap-1.5">
									<span>{col.title}</span>
									{isSortable && sortDir && (
										<SortIcon dir={sortDir(col.key)} />
									)}
								</div>
							</th>
						);
					})}
				</tr>
			</thead>
			<tbody>
				{data.length === 0 ? (
					<tr>
						<td
							colSpan={columns.length}
							className="py-16 text-center"
						>
							{emptyMessage || "No data found"}
						</td>
					</tr>
				) : (
					data.map((row: any, rowIndex) => (
						<tr
							key={row.id ?? rowIndex}
							className="border-b border-zinc-100 dark:border-zinc-850/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
						>
							{columns.map((col) => (
								<td
									key={col.key}
									className={`py-4 px-6 ${col.className || ""}`}
								>
									{col.render
										? col.render(row, rowIndex)
										: row[col.key]}
								</td>
							))}
						</tr>
					))
				)}
			</tbody>
		</table>
	);
}
