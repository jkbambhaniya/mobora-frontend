"use client";

import React, { useState, useEffect, useRef } from "react";

export interface SelectOption {
	value: string | number;
	label: string;
}

interface SelectProps {
	value?: string | number;
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	options: SelectOption[];
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	error?: string;
	label?: string;
	name?: string;
	id?: string;
	required?: boolean;
	size?: "sm" | "md";
	onOptionEdit?: (value: string | number, label: string) => void;
}

export const Select: React.FC<SelectProps> = ({
	value,
	onChange,
	options,
	placeholder = "Select option",
	className = "",
	disabled = false,
	error,
	label,
	name,
	id,
	required,
	size = "md",
	onOptionEdit,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Find currently selected option
	const selectedOption = options.find(
		(opt) => String(opt.value) === String(value),
	);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Auto-flip dropdown if near bottom of screen
	useEffect(() => {
		if (isOpen && containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			const dropdownHeight = Math.min(options.length * 40 + 10, 240); // estimate height
			const spaceBelow = window.innerHeight - rect.bottom;
			if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
				setPlacement("top");
			} else {
				setPlacement("bottom");
			}
		}
	}, [isOpen, options.length]);

	const handleSelect = (optionValue: string | number) => {
		if (disabled) return;
		if (onChange) {
			// Create a mock change event to make it a transparent drop-in replacement for native select
			const mockEvent = {
				target: {
					value: optionValue,
					name: name || "",
				},
			} as React.ChangeEvent<HTMLSelectElement>;
			onChange(mockEvent);
		}
		setIsOpen(false);
	};

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;

		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightedIndex(
					selectedOption
						? options.findIndex(
							  (o) => o.value === selectedOption.value,
						  )
						: 0,
				);
			} else if (
				highlightedIndex >= 0 &&
				highlightedIndex < options.length
			) {
				handleSelect(options[highlightedIndex].value);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightedIndex(0);
			} else {
				setHighlightedIndex((prev) =>
					prev < options.length - 1 ? prev + 1 : prev,
				);
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (isOpen) {
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
			}
		}
	};

	// Scroll active option into view when navigating with keyboard
	useEffect(() => {
		if (highlightedIndex >= 0 && dropdownRef.current) {
			const activeEl = dropdownRef.current.children[
				highlightedIndex
			] as HTMLElement;
			if (activeEl) {
				activeEl.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex]);

	const sizeClasses = {
		sm: "px-3 py-1.5 text-xs rounded-lg",
		md: "px-4 py-2.5 text-sm rounded-xl",
	};

	const hasWidth = className.split(" ").some((c) => c.startsWith("w-") || c.startsWith("max-w-"));
	return (
		<div
			className={`relative ${hasWidth ? "" : "w-full"} font-sans ${className}`}
			ref={containerRef}
		>
			{label && (
				<label
					htmlFor={id}
					className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 pl-1 transition-colors duration-300
			${error ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
				>
					{label}
				</label>
			)}

			{/* Trigger Button */}
			<button
				id={id}
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				className={`w-full flex items-center justify-between border transition-all duration-300 bg-white/40 dark:bg-zinc-900/30 text-left text-zinc-900 dark:text-zinc-50 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
		  ${sizeClasses[size]}
		  ${
			  error
				  ? "border-red-500 ring-2 ring-red-500/10"
				  : isOpen
					? "border-primary ring-4 ring-primary/10 dark:border-primary/60"
					: "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
		  }`}
			>
				<span className="truncate">
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<svg
					className={`w-4 h-4 ml-2 text-zinc-400 dark:text-zinc-550 transition-transform duration-300 ${
						isOpen ? "rotate-180" : ""
					}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* Hidden native select for form validation and access */}
			<select
				name={name}
				value={value}
				onChange={onChange}
				required={required}
				disabled={disabled}
				className="sr-only"
				tabIndex={-1}
				aria-hidden="true"
			>
				<option value="">{placeholder}</option>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			{/* Dropdown Options Menu */}
			<div
				ref={dropdownRef}
				className={`absolute left-0 w-full min-w-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[9999] overflow-y-auto max-h-60 py-1 transition-all duration-200 transform origin-top
		  ${
			  placement === "top"
				  ? "bottom-full mb-1.5 origin-bottom"
				  : "top-full mt-1.5 origin-top"
		  }
		  ${
			  isOpen
				  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
				  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
		  }`}
			>
				{options.length === 0 ? (
					<div className="px-4 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
						No options available
					</div>
				) : (
					options.map((opt, index) => {
						const isSelected = String(opt.value) === String(value);
						const isHighlighted = index === highlightedIndex;

						return (
							<div
								key={opt.value}
								className={`w-full flex items-center justify-between group/opt transition-colors
								${
									isSelected
										? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary font-bold"
										: isHighlighted
											? "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100"
											: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
								}`}
							>
								<button
									type="button"
									onClick={() => handleSelect(opt.value)}
									className="flex-1 text-left px-4 py-2 text-xs cursor-pointer truncate bg-transparent border-0 focus:outline-none"
								>
									{opt.label}
								</button>
								
								<div className="flex items-center pr-3 shrink-0 gap-1.5">
									{onOptionEdit && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onOptionEdit(opt.value, opt.label);
											}}
											className="p-1 rounded-md text-zinc-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all opacity-0 group-hover/opt:opacity-100 cursor-pointer"
											title="Edit option"
										>
											<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
												<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
											</svg>
										</button>
									)}

									{isSelected && (
										<svg
											className="w-3.5 h-3.5 text-primary dark:text-secondary"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth="3"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Error Message */}
			{error && (
				<p className="mt-1.5 ml-1 text-xs text-red-500 flex items-center animate-fadeIn">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						className="w-3.5 h-3.5 mr-1 shrink-0"
					>
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
							clipRule="evenodd"
						/>
					</svg>
					{error}
				</p>
			)}
		</div>
	);
};
