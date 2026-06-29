import React, { useState, useEffect } from "react";
import { useDashboard, ChatTemplate } from "@/context/vendor/dashboard-context";
import { Button } from "@/components/ui/button";
import { showConfirm } from "@/utils/confirm";

interface TemplateManagerModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function TemplateManagerModal({ isOpen, onClose }: TemplateManagerModalProps) {
	const {
		templates,
		fetchTemplates,
		createTemplate,
		updateTemplate,
		deleteTemplate,
	} = useDashboard();

	const [templateText, setTemplateText] = useState("");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsLoading(true);
			fetchTemplates().finally(() => setIsLoading(false));
			// Reset input form
			setTemplateText("");
			setEditingId(null);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!templateText.trim()) return;

		setIsSubmitting(true);
		try {
			if (editingId !== null) {
				const success = await updateTemplate(editingId, templateText);
				if (success) {
					setEditingId(null);
					setTemplateText("");
				}
			} else {
				const success = await createTemplate(templateText);
				if (success) {
					setTemplateText("");
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = (tmpl: ChatTemplate) => {
		setEditingId(tmpl.id);
		setTemplateText(tmpl.template_text);
	};

	const handleDelete = (id: number) => {
		showConfirm(
			async () => {
				await deleteTemplate(id);
				if (editingId === id) {
					setEditingId(null);
					setTemplateText("");
				}
			},
			{
				title: "Delete Template",
				message: "Are you sure you want to delete this template?",
				okButtonText: "Delete",
				cancelButtonText: "Cancel",
				isDestructive: true,
			}
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-300">
				
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-850 dark:hover:text-zinc-100 transition-all cursor-pointer"
				>
					<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{/* Header */}
				<div className="mb-5">
					<h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
						Manage Quick Templates
					</h3>
					<p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold tracking-wide uppercase mt-1">
						Customize replies to quickly insert during chat sessions
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="mb-6 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
					<div className="space-y-3">
						<div>
							<label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
								<span>{editingId !== null ? "Edit Template Text *" : "New Template Text *"}</span>
								{templates.length >= 5 && editingId === null && (
									<span className="text-rose-500 font-extrabold text-[9px] normal-case tracking-normal">
										Limit: Maximum 5 templates allowed
									</span>
								)}
							</label>
							<textarea
								value={templateText}
								onChange={(e) => setTemplateText(e.target.value)}
								placeholder={templates.length >= 5 && editingId === null ? "Delete a template to add a new one..." : "Enter reply template text..."}
								rows={3}
								maxLength={300}
								disabled={templates.length >= 5 && editingId === null}
								className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-xs focus:outline-none focus:ring-2 focus:ring-primary resize-none text-zinc-900 dark:text-white transition-all disabled:opacity-50"
							/>
						</div>

						<div className="flex gap-2 justify-end">
							{editingId !== null && (
								<Button
									type="button"
									variant="outline"
									className="text-[10px] px-3.5 h-[32px] rounded-lg cursor-pointer"
									onClick={() => {
										setEditingId(null);
										setTemplateText("");
									}}
								>
									Cancel
								</Button>
							)}
							<Button
								type="submit"
								variant="primary"
								className="text-[10px] px-4.5 h-[32px] rounded-lg cursor-pointer"
								disabled={isSubmitting || !templateText.trim() || (templates.length >= 5 && editingId === null)}
							>
								{isSubmitting
									? "Saving..."
									: editingId !== null
									? "Update Template"
									: "Add Template"}
							</Button>
						</div>
					</div>
				</form>

				{/* Template List */}
				<div>
					<h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
						Your Templates ({templates.length})
					</h4>
					
					{isLoading ? (
						<div className="text-center py-8 text-xs text-zinc-450 dark:text-zinc-500 font-semibold animate-pulse">
							Loading templates...
						</div>
					) : templates.length === 0 ? (
						<div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs italic">
							No custom templates added yet. Add one above!
						</div>
					) : (
						<div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
							{templates.map((tmpl) => (
								<div
									key={tmpl.id}
									className="group flex gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all duration-200 text-left items-start"
								>
									<p className="flex-1 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
										{tmpl.template_text}
									</p>
									<div className="flex gap-1.5 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity self-center">
										<button
											type="button"
											onClick={() => handleEdit(tmpl)}
											className="p-1.5 text-zinc-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg cursor-pointer transition-colors"
											title="Edit"
										>
											<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
												<path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
											</svg>
										</button>
										<button
											type="button"
											onClick={() => handleDelete(tmpl.id)}
											className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/5 dark:hover:bg-danger/10 rounded-lg cursor-pointer transition-colors"
											title="Delete"
										>
											<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
												<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

			</div>
		</div>
	);
}
