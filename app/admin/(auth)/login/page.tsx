"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLoginAction, getAdminProfileAction } from "@/actions/admin-auth";
import { useAdminAuth } from "@/context/admin/auth-context";

export default function AdminLoginPage() {
	const router = useRouter();
	const { setAdmin } = useAdminAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
	const [isLoading, setIsLoading] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	useEffect(() => {
		getAdminProfileAction()
			.then((result) => {
				if (result.success && result.data?.success && result.data?.admin) {
					router.push("/admin/dashboard");
				}
			})
			.catch(() => {
				// User is not authenticated
			});
	}, [router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({});
		setGeneralError(null);

		let hasError = false;
		const newErrors: { email?: string; password?: string } = {};

		if (!email.trim()) {
			newErrors.email = "Email is required";
			hasError = true;
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = "Please enter a valid email address";
			hasError = true;
		}

		if (!password) {
			newErrors.password = "Password is required";
			hasError = true;
		}

		if (hasError) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);
		try {
			const res = await adminLoginAction(email, password);
			if (res.success && res.data?.success) {
				setAdmin(res.data.admin);
				window.location.href = "/admin/dashboard";
			} else {
				setGeneralError(res.errorData?.message || res.message || "Invalid credentials. Please try again.");
			}
		} catch (err: any) {
			setGeneralError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0d0e12] overflow-hidden px-4">
			{/* Decorative Gradients */}
			<div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[120px] pointer-events-none" />

			{/* Login Card */}
			<div className="w-full max-w-md bg-white dark:bg-[#13151a]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-8 shadow-xl dark:shadow-2xl relative z-10">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4">
						<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Mobora Admin Portal</h1>
					<p className="text-sm text-zinc-500 dark:text-gray-400 mt-2">Sign in with your administrator credentials</p>
				</div>

				{generalError && (
					<div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
						<svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
						</svg>
						<span>{generalError}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Email Address"
						type="email"
						placeholder="admin@mobora.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						error={errors.email}
						disabled={isLoading}
						leftIcon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
								/>
							</svg>
						}
					/>

					<Input
						label="Password"
						type="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						error={errors.password}
						disabled={isLoading}
						leftIcon={
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="w-5 h-5"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
								/>
							</svg>
						}
					/>

					<Button
						type="submit"
						disabled={isLoading}
						className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/15 dark:shadow-indigo-600/25 transition-all duration-200 mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
					>
						{isLoading ? (
							<>
								<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Signing In...
							</>
						) : (
							"Sign In"
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}
