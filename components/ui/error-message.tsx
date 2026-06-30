import React from "react";

interface ErrorMessageProps {
	message?: string;
	className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
	if (!message) return null;
	
	return (
		<p className={`mt-1.5 ml-1 text-xs text-red-500 flex items-center animate-fadeIn ${className}`}>
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
			{message}
		</p>
	);
}
