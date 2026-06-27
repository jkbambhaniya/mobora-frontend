"use client";

import React, { useState, useEffect } from "react";

interface DateRangePickerProps {
	startDate: string;
	endDate: string;
	onChange: (start: string, end: string, preset: string) => void;
	defaultPreset?: string;
}

export function DateRangePicker({
	startDate,
	endDate,
	onChange,
	defaultPreset = "Last 7 Days",
}: DateRangePickerProps) {
	const [selectedPreset, setSelectedPreset] = useState(defaultPreset);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [hoverDate, setHoverDate] = useState<string | null>(null);

	// Navigation for calendar view
	const [navDate, setNavDate] = useState(() => {
		const d = new Date();
		return { month: d.getMonth(), year: d.getFullYear() };
	});

	// Default ranges helper
	const getDaysAgoStr = (days: number) => {
		const d = new Date();
		d.setDate(d.getDate() - days);
		return d.toISOString().split("T")[0];
	};
	const getTodayStr = () => {
		return new Date().toISOString().split("T")[0];
	};

	// Apply quick presets logic
	const applyPreset = (preset: string) => {
		setSelectedPreset(preset);
		const today = new Date();
		let start = new Date();
		let end = new Date();

		switch (preset) {
			case "Today":
				start = today;
				end = today;
				break;
			case "Yesterday":
				start = new Date();
				start.setDate(today.getDate() - 1);
				end = new Date();
				end.setDate(today.getDate() - 1);
				break;
			case "Last 7 Days":
				start = new Date();
				start.setDate(today.getDate() - 6);
				end = today;
				break;
			case "Last 30 Days":
				start = new Date();
				start.setDate(today.getDate() - 29);
				end = today;
				break;
			case "This Month":
				start = new Date(today.getFullYear(), today.getMonth(), 1);
				end = today;
				break;
			case "Last Month":
				start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				end = new Date(today.getFullYear(), today.getMonth(), 0);
				break;
			case "Custom Range":
				return;
		}

		const sStr = start.toISOString().split("T")[0];
		const eStr = end.toISOString().split("T")[0];
		onChange(sStr, eStr, preset);
		setIsPickerOpen(false);
	};

	// Calendar helpers
	const getDaysInMonth = (year: number, month: number) => {
		return new Date(year, month + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (year: number, month: number) => {
		return new Date(year, month, 1).getDay();
	};

	// Check if a date is in the future
	const isFutureDate = (date: Date) => {
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		return date > today;
	};

	const handleDateClick = (dateStr: string) => {
		setSelectedPreset("Custom Range");
		if (!startDate || (startDate && endDate)) {
			onChange(dateStr, "", "Custom Range");
		} else {
			if (new Date(dateStr) < new Date(startDate)) {
				onChange(dateStr, "", "Custom Range");
			} else {
				onChange(startDate, dateStr, "Custom Range");
				setIsPickerOpen(false);
			}
		}
	};

	const handleDateMouseEnter = (dateStr: string) => {
		if (startDate && !endDate) {
			setHoverDate(dateStr);
		}
	};

	const handlePrevMonth = () => {
		setNavDate((prev) => {
			let m = prev.month - 1;
			let y = prev.year;
			if (m < 0) {
				m = 11;
				y -= 1;
			}
			return { month: m, year: y };
		});
	};

	const handleNextMonth = () => {
		setNavDate((prev) => {
			let m = prev.month + 1;
			let y = prev.year;
			if (m > 11) {
				m = 0;
				y += 1;
			}
			return { month: m, year: y };
		});
	};

	const renderCalendarMonth = (year: number, month: number, showPrevArrow = false, showNextArrow = false) => {
		const daysInMonth = getDaysInMonth(year, month);
		const firstDay = getFirstDayOfMonth(year, month);
		const monthNames = [
			"January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];
		const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

		const days = [];
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(new Date(year, month, i));
		}

		return (
			<div className="w-[220px] shrink-0 select-none">
				<div className="flex items-center justify-between px-1 mb-3">
					{showPrevArrow ? (
						<button
							onClick={handlePrevMonth}
							className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
							</svg>
						</button>
					) : (
						<div className="w-6" />
					)}
					<span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
						{monthNames[month]} {year}
					</span>
					{showNextArrow ? (
						<button
							onClick={handleNextMonth}
							className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 cursor-pointer"
						>
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					) : (
						<div className="w-6" />
					)}
				</div>
				<div className="grid grid-cols-7 gap-y-1 text-center mb-1">
					{dayNames.map((d) => (
						<span key={d} className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{d}</span>
					))}
				</div>
				<div className="grid grid-cols-7 gap-y-1">
					{days.map((date, idx) => {
						if (!date) return <span key={`empty-${idx}`} className="h-6 w-6" />;

						const dateStr = date.toISOString().split("T")[0];
						const isFuture = isFutureDate(date);
						const isStart = dateStr === startDate;
						const isEnd = dateStr === endDate;
						const isWithin = startDate && endDate && dateStr > startDate && dateStr < endDate;
						const isHovered = startDate && !endDate && hoverDate && dateStr > startDate && dateStr <= hoverDate;

						return (
							<button
								key={dateStr}
								disabled={isFuture}
								onClick={() => handleDateClick(dateStr)}
								onMouseEnter={() => handleDateMouseEnter(dateStr)}
								className={`h-6 w-6 text-[10px] font-bold rounded-full flex items-center justify-center transition-all ${
									isFuture
										? "text-zinc-200 dark:text-zinc-800 cursor-not-allowed line-through"
										: isStart || isEnd
										? "bg-indigo-600 text-white cursor-pointer"
										: isWithin || isHovered
										? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold cursor-pointer"
										: "text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
								}`}
							>
								{date.getDate()}
							</button>
						);
					})}
				</div>
			</div>
		);
	};

	// Determine Left and Right month values
	const leftMonth = navDate.month;
	const leftYear = navDate.year;

	let rightMonth = navDate.month + 1;
	let rightYear = navDate.year;
	if (rightMonth > 11) {
		rightMonth = 0;
		rightYear += 1;
	}

	return (
		<div className="relative z-30">
			<button
				onClick={() => setIsPickerOpen(!isPickerOpen)}
				className="px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 focus:outline-none flex items-center gap-2 cursor-pointer shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
			>
				<svg className="w-4 h-4 text-zinc-500 dark:text-zinc-455" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				<span>{selectedPreset}: {startDate} {endDate ? `to ${endDate}` : ""}</span>
				<svg className={`w-3.5 h-3.5 ml-1 transition-transform ${isPickerOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isPickerOpen && (
				<div className="absolute left-0 mt-2 z-55 flex flex-col md:flex-row rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl p-4 min-w-[280px] md:min-w-[660px] animate-fadeIn">
					{/* Left Column: Preset Ranges */}
					<div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/80 pb-3 md:pb-0 md:pr-4 shrink-0">
						{["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "Custom Range"].map((preset) => (
							<button
								key={preset}
								onClick={() => applyPreset(preset)}
								className={`text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
									selectedPreset === preset
										? "bg-indigo-600 text-white font-extrabold"
										: "text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
								}`}
							>
								{preset}
							</button>
						))}
					</div>

					{/* Right Column: Side-by-Side Month Calendars */}
					<div className="flex-1 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
						<div className="flex flex-col sm:flex-row gap-6 justify-center items-start">
							{renderCalendarMonth(leftYear, leftMonth, true, false)}
							{renderCalendarMonth(rightYear, rightMonth, false, true)}
						</div>
						<div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-3 flex justify-between items-center text-[10px] text-zinc-450">
							<span>Future dates are disabled. Click start date, then click end date to select.</span>
							{startDate && endDate && (
								<button
									onClick={() => setIsPickerOpen(false)}
									className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
								>
									Apply Range
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
