import React from "react";

export default function LoadingRows({ cols }: { cols: number }) {
	return (
		<>
			{[...Array(5)].map((_, i) => (
				<tr
					key={i}
					className="border-b border-zinc-100 dark:border-zinc-800/40"
				>
					{[...Array(cols)].map((_, j) => (
						<td key={j} className="py-4 px-6">
							<div
								className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"
								style={{ width: `${60 + Math.random() * 30}%` }}
							/>
						</td>
					))}
				</tr>
			))}
		</>
	);
}
