"use client";

import React, { useState, useEffect, useRef } from "react";
import { ErrorMessage } from "./error-message";

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
	showSearch?: boolean;
	onSearchChange?: (term: string) => void;
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
	showSearch = false,
	onSearchChange,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Filtered options based on search query
	const filteredOptions = options.filter((opt) =>
		opt.label.toLowerCase().includes(searchTerm.toLowerCase())
	);

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
				setSearchTerm("");
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
			const dropdownHeight = Math.min(filteredOptions.length * 40 + (showSearch ? 50 : 10), 240); // estimate height
			const spaceBelow = window.innerHeight - rect.bottom;
			if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
				setPlacement("top");
			} else {
				setPlacement("bottom");
			}
		}
	}, [isOpen, filteredOptions.length, showSearch]);

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
		setSearchTerm("");
	};

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (disabled) return;

		if (e.key === "Enter" || e.key === " ") {
			// If user is typing in search input, don't trigger select on Space
			if (document.activeElement?.tagName === "INPUT") return;
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightedIndex(
					selectedOption
						? filteredOptions.findIndex(
							  (o) => o.value === selectedOption.value,
						  )
						: 0,
				);
			} else if (
				highlightedIndex >= 0 &&
				highlightedIndex < filteredOptions.length
			) {
				handleSelect(filteredOptions[highlightedIndex].value);
			}
		} else if (e.key === "Escape") {
			setIsOpen(false);
			setSearchTerm("");
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (!isOpen) {
				setIsOpen(true);
				setHighlightedIndex(0);
			} else {
				setHighlightedIndex((prev) =>
					prev < filteredOptions.length - 1 ? prev + 1 : prev,
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
			// Adjust index for search bar element if present
			const childrenArray = Array.from(dropdownRef.current.children);
			const optionElements = showSearch ? childrenArray.slice(1) : childrenArray;
			const activeEl = optionElements[highlightedIndex] as HTMLElement;
			if (activeEl) {
				activeEl.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex, showSearch]);

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
				onClick={() => {
					setIsOpen(!isOpen);
					if (!isOpen) setSearchTerm("");
				}}
				onKeyDown={handleKeyDown}
				className={`w-full flex items-center justify-between border transition-all duration-300 bg-white/40 dark:bg-zinc-900/30 text-left text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
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
					className={`w-4 h-4 ml-2 text-zinc-400 dark:text-zinc-400 transition-transform duration-300 ${
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
				{showSearch && (
					<div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
						<input
							type="text"
							placeholder="Search..."
							value={searchTerm}
							onChange={(e) => {
								const val = e.target.value;
								setSearchTerm(val);
								if (onSearchChange) onSearchChange(val);
							}}
							className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:text-zinc-100"
							onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
						/>
					</div>
				)}
				{filteredOptions.length === 0 ? (
					<div className="px-4 py-2 text-xs text-zinc-400 dark:text-zinc-500 text-center">
						No options available
					</div>
				) : (
					filteredOptions.map((opt, index) => {
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
									className="flex-1 text-left px-4 py-2 text-xs text-inherit cursor-pointer truncate bg-transparent border-0 focus:outline-none"
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

			<ErrorMessage message={error} />
		</div>
	);
};
