import React from "react";
import { DataTable, Column } from "./DataTable";
import { SpecModel } from "@/context/vendor/specifications-context";
import { formatDate } from "@/utils/date";
import { EditIcon, DeleteIcon } from "./icons";

interface ModelTableProps {
	data: SpecModel[];
	loading: boolean;
	page: number;
	limit: number;
	vendorId?: number;
	onSort: (col: string) => void;
	sortDir: (col: string) => "asc" | "desc" | null;
	onEdit: (model: SpecModel) => void;
	onDelete: (model: SpecModel) => void;
}

export default function ModelTable({
	data,
	loading,
	page,
	limit,
	vendorId,
	onSort,
	sortDir,
	onEdit,
	onDelete,
}: ModelTableProps) {
	const columns: Column<SpecModel>[] = [
		{
			key: "index",
			title: "#",
			sortable: false,
			headerClassName: "w-8",
			className: "text-zinc-400 font-medium",
			render: (_, index) => (page - 1) * limit + index + 1,
		},
		{
			key: "brand",
			title: "Brand",
			sortable: true,
			render: (row) => (
				<span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
					{row.brand_name}
				</span>
			),
		},
		{
			key: "name",
			title: "Model Name",
			sortable: true,
			className: "font-bold text-zinc-900 dark:text-white text-sm",
		},
		{
			key: "created_at",
			title: "Added",
			sortable: true,
			className: "text-zinc-400 text-xs",
			render: (row) => formatDate(row.created_at),
		},
		{
			key: "actions",
			title: "Actions",
			sortable: false,
			headerClassName: "text-center",
			render: (row) => {
				const canEditDelete =
					row.vendor_id &&
					vendorId &&
					Number(row.vendor_id) === Number(vendorId);

				if (canEditDelete) {
					return (
						<div className="flex items-center justify-center gap-2">
							<button
								onClick={() => onEdit(row)}
								className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-primary transition-colors cursor-pointer"
								title="Edit"
							>
								<EditIcon />
							</button>
							<button
								onClick={() => onDelete(row)}
								className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
								title="Delete"
							>
								<DeleteIcon />
							</button>
						</div>
					);
				}

				return (
					<div className="flex items-center justify-center text-zinc-400 dark:text-zinc-500 gap-1 font-medium text-[11px]">
						<svg
							className="w-3 h-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							/>
						</svg>
						<span>System</span>
					</div>
				);
			},
		},
	];

	return (
		<DataTable
			columns={columns}
			data={data}
			loading={loading}
			onSort={onSort}
			sortDir={sortDir}
			emptyMessage={
				<div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
					<svg
						className="w-10 h-10 opacity-40"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m16 0l-1.5-1.5M4 13l1.5-1.5"
						/>
					</svg>
					<span className="text-sm font-medium">No models found</span>
					<span className="text-xs">
						Add your first model to get started.
					</span>
				</div>
			}
		/>
	);
}
