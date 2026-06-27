"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
	DashboardProvider,
	useDashboard,
} from "@/context/vendor/dashboard-context";
import Sidebar from "@/components/vendor/layout/sidebar";
import Header from "@/components/vendor/layout/header";
import Footer from "@/components/vendor/layout/footer";
import { CommandPalette } from "@/components/ui/command-palette";
import { PendingReview } from "@/components/vendor/auth/pending-review";
import { SuspendedAccount } from "@/components/vendor/auth/suspended-account";
import { logoutAction, updateProfileAction } from "@/actions/auth";
import { confirmLogout } from "@/utils/confirm";
import { Modal } from "@/components/ui/modal";
import { BusinessDetails } from "@/components/vendor/profile/BusinessDetails";
import toast from "react-hot-toast";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<DashboardProvider>
			<DashboardInnerLayout>{children}</DashboardInnerLayout>
		</DashboardProvider>
	);
}

function DashboardInnerLayout({ children }: { children: React.ReactNode }) {
	const { vendor, isLoadingVendor, fetchVendorProfile, setVendor } = useDashboard();
	const [isCommandOpen, setIsCommandOpen] = useState(false);
	const [isCheckingStatus, setIsCheckingStatus] = useState(false);
	const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
	const [isSavingDetails, setIsSavingDetails] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const isChat = pathname === "/chat";

	const handleLogout = () => {
		confirmLogout(async () => {
			try {
				await logoutAction();
			} catch (err) {
				console.error("Logout failed:", err);
			}
			setVendor(null);
			window.location.href = "/login";
		});
	};

	const handleBusinessDetailsSubmit = async (data: any) => {
		setIsSavingDetails(true);
		try {
			const response = await updateProfileAction(data);
			if (response.success && response.data?.success) {
				setVendor(response.data.vendor);
				await fetchVendorProfile();
				toast.success("Business profile configured successfully!");
			} else {
				toast.error(response.errorData?.message || "Failed to update business details.");
			}
		} catch (err) {
			toast.error("An unexpected error occurred.");
		} finally {
			setIsSavingDetails(false);
		}
	};

	// Redirect to login if user is not authenticated and loading has finished
	useEffect(() => {
		if (!isLoadingVendor && !vendor) {
			router.push("/login");
		}
	}, [isLoadingVendor, vendor, router]);

	// Helper to toggle theme globally and dispatch event
	const toggleThemeGlobal = () => {
		const isDark = document.documentElement.classList.contains("dark");
		const nextTheme = isDark ? "light" : "dark";
		if (nextTheme === "dark") {
			document.documentElement.classList.add("dark");
			localStorage.theme = "dark";
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.theme = "light";
		}
		window.dispatchEvent(new Event("themechange"));
	};

	useEffect(() => {
		let lastKey = "";
		let timeoutId: NodeJS.Timeout;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Avoid firing shortcuts when user is actively writing in input elements
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			const key = e.key.toLowerCase();

			// Toggle command palette with Ctrl+K / Cmd+K
			if ((e.metaKey || e.ctrlKey) && key === "k") {
				e.preventDefault();
				setIsCommandOpen((prev) => !prev);
				return;
			}

			// Gmail/GitHub-style sequential keyboard shortcuts
			if (lastKey === "g") {
				const routeMap: Record<string, string> = {
					d: "/dashboard",
					i: "/inventory",
					v: "/inventory",
					f: "/specifications",
					m: "/chat",
					s: "/profile",
					c: "/customer",
				};

				if (key in routeMap) {
					e.preventDefault();
					router.push(routeMap[key]);
					lastKey = "";
					return;
				}
			}

			if (lastKey === "t" && key === "t") {
				e.preventDefault();
				toggleThemeGlobal();
				lastKey = "";
				return;
			}

			// Capture 'g' or 't' start keys, reset after 1 second if no matching sequence key follows
			if (key === "g" || key === "t") {
				lastKey = key;
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					lastKey = "";
				}, 1000);
			} else {
				lastKey = "";
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			clearTimeout(timeoutId);
		};
	}, [router]);

	// Listen to opencommandpalette DOM custom events (dispatched by clicking the search bar)
	useEffect(() => {
		const handleOpen = () => setIsCommandOpen(true);
		window.addEventListener("opencommandpalette", handleOpen);
		return () =>
			window.removeEventListener("opencommandpalette", handleOpen);
	}, []);

	if (isLoadingVendor) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
				<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
					<svg
						className="animate-spin h-7 w-7 text-primary"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<p className="mt-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 animate-pulse">
					Verifying session...
				</p>
			</div>
		);
	}

	if (!vendor) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
				<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
					<svg
						className="animate-spin h-7 w-7 text-primary"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<p className="mt-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 animate-pulse">
					Redirecting to Login...
				</p>
			</div>
		);
	}

	if (vendor.status === "pending") {
		const handleCheckStatus = async () => {
			setIsCheckingStatus(true);
			setStatusFeedback(null);
			try {
				await fetchVendorProfile();
				setStatusFeedback("Status checked successfully.");
			} catch (err) {
				setStatusFeedback("Failed to update status. Please try again.");
			} finally {
				setIsCheckingStatus(false);
			}
		};

		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
				<div className="w-full max-w-[480px] p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-xl animate-fadeIn">
					<PendingReview
						statusFeedback={statusFeedback}
						isCheckingStatus={isCheckingStatus}
						onCheckStatus={handleCheckStatus}
						onBackToSignIn={handleLogout}
					/>
				</div>
			</div>
		);
	}

	if (vendor.status === "suspended" || vendor.status === "inactive") {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
				<div className="w-full max-w-[480px] p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-xl animate-fadeIn">
					<SuspendedAccount onBackToSignIn={handleLogout} />
				</div>
			</div>
		);
	}

	return (
		<div
			className={`flex-1 flex flex-col lg:flex-row relative bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 ${isChat ? "h-screen overflow-hidden" : "min-h-screen"}`}
		>
			{/* Fixed Desktop / Fluid Mobile Sidebar */}
			<Sidebar />

			{/* Workspace Content Panel wrapper to offset fixed sidebar */}
			<div
				className={`flex-1 lg:pl-72 flex flex-col ${isChat ? "h-screen overflow-hidden" : "min-h-screen"}`}
			>
				<main
					className={`flex-1 max-w-[1700px] w-full mx-auto flex flex-col ${
						isChat
							? "p-4 pb-20 md:pb-20 lg:pb-0 md:p-6 lg:p-8 h-full overflow-hidden gap-4"
							: "p-4 pb-24 md:p-6 md:pb-24 lg:p-8 gap-8"
					}`}
				>
					{/* Context Header */}
					<Header />

					{/* Page Tab Child Content */}
					<div className={isChat ? "flex-1 min-h-0 mb-2" : "flex-1"}>
						{children}
					</div>

					{/* Layout Footer */}
					{!isChat && <Footer />}
				</main>
			</div>

			{/* Global Command Palette Dialog */}
			<CommandPalette
				isOpen={isCommandOpen}
				onClose={() => setIsCommandOpen(false)}
			/>

			{/* Onboarding Profile Completion Modal */}
			{vendor && (!vendor.phone || !vendor.address) && (
				<Modal
					isOpen={true}
					onClose={() => {}}
					isDismissible={false}
					title="Setup Your Business Profile"
					size="lg"
				>
					<div className="space-y-4">
						<div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs font-semibold text-amber-800 dark:text-amber-400 leading-relaxed flex justify-between items-center gap-4">
							<span>Welcome to Mobora! Please complete your shop contact phone and address to unlock full portal access.</span>
							<button
								onClick={handleLogout}
								className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-955/20 dark:hover:bg-red-955/40 dark:text-red-400 rounded-xl font-bold transition-all text-[11px] whitespace-nowrap cursor-pointer shrink-0"
							>
								Sign Out
							</button>
						</div>
						<BusinessDetails
							initialData={{
								shop_name: vendor.shop_name || "",
								phone: vendor.phone || "",
								address: vendor.address || "",
								payment_methods: vendor.payment_methods || "Cash, UPI",
								gst_enabled: vendor.gst_enabled ?? true,
								gst_rate: vendor.gst_rate ?? 18,
								markup: vendor.markup ?? 20,
							}}
							onSubmit={handleBusinessDetailsSubmit}
							isLoading={isSavingDetails}
						/>
					</div>
				</Modal>
			)}
		</div>
	);
}
