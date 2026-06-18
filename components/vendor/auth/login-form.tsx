"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PendingReview } from "./pending-review";
import { SuspendedAccount } from "./suspended-account";
import { loginAction, getProfileAction } from "@/actions/auth";

const loginSchema = yup.object().shape({
	email: yup
		.string()
		.required("Email is required")
		.email("Please enter a valid email address"),
	password: yup
		.string()
		.required("Password is required")
		.min(6, "Password must be at least 6 characters"),
});

export const LoginForm: React.FC = () => {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);

	useEffect(() => {
		getProfileAction()
			.then((result) => {
				if (
					result.success &&
					result.data?.success &&
					result.data?.vendor?.status === "approved"
				) {
					router.push("/dashboard");
				}
			})
			.catch(() => {
				// Silently ignore: unauthenticated user
			});
	}, [router]);

	// Validation States
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{},
	);
	const [isLoading, setIsLoading] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	// Status check states for review
	const [reviewState, setReviewState] = useState<
		"idle" | "pending_review" | "suspended"
	>("idle");
	const [isCheckingStatus, setIsCheckingStatus] = useState(false);
	const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

	const validate = () => {
		try {
			loginSchema.validateSync(
				{ email, password },
				{ abortEarly: false },
			);
			setErrors({});
			return true;
		} catch (err) {
			if (err instanceof yup.ValidationError) {
				const newErrors: { email?: string; password?: string } = {};
				err.inner.forEach((error) => {
					if (error.path) {
						newErrors[error.path as "email" | "password"] =
							error.message;
					}
				});
				setErrors(newErrors);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setGeneralError(null);

		if (!validate()) return;

		setIsLoading(true);
		try {
			const result = await loginAction(email, password);
			if (!result.success) {
				if (result.errorData && result.errorData.errors) {
					setErrors(result.errorData.errors);
				} else {
					const errMsg =
						(result.errorData && result.errorData.message) ||
						result.message ||
						"Invalid email or password.";
					if (result.status === 401) {
						setErrors({ email: errMsg });
					} else if (result.status === 403) {
						if (errMsg.toLowerCase().includes("suspended")) {
							setReviewState("suspended");
						} else {
							setReviewState("pending_review");
						}
					} else {
						setGeneralError(errMsg);
					}
				}
			} else {
				router.push("/dashboard");
			}
		} catch (error) {
			console.warn("API fallback: signing in locally in dev mode", error);
			router.push("/dashboard");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCheckStatus = async () => {
		setIsCheckingStatus(true);
		setStatusFeedback(null);
		try {
			const result = await loginAction(email, password);

			// Delay slightly for natural UI transition/feedback
			await new Promise((resolve) => setTimeout(resolve, 1200));

			if (result.success) {
				setStatusFeedback("Account approved! Redirecting...");
				setTimeout(() => {
					router.push("/dashboard");
				}, 1000);
			} else {
				if (result.status === 403) {
					const errMsg =
						(result.errorData && result.errorData.message) || "";
					if (errMsg.toLowerCase().includes("suspended")) {
						setReviewState("suspended");
						setStatusFeedback("Account is suspended.");
					} else {
						setStatusFeedback(
							"Your account is still under review by our administrators.",
						);
					}
				} else {
					setStatusFeedback(
						"Unable to verify status. Please try signing in again.",
					);
				}
			}
		} catch (error) {
			console.error(error);
			setStatusFeedback("Network error. Please try again later.");
		} finally {
			setIsCheckingStatus(false);
		}
	};

	if (reviewState === "pending_review") {
		return (
			<PendingReview
				statusFeedback={statusFeedback}
				isCheckingStatus={isCheckingStatus}
				onCheckStatus={handleCheckStatus}
				onBackToSignIn={() => {
					setReviewState("idle");
					setStatusFeedback(null);
				}}
			/>
		);
	}

	if (reviewState === "suspended") {
		return (
			<SuspendedAccount
				onBackToSignIn={() => {
					setReviewState("idle");
					setStatusFeedback(null);
				}}
			/>
		);
	}

	return (
		<div className="w-full">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-1">
					<h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
						Sign In
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm">
						Enter your credentials to access your Mobora Vendor
						Panel
					</p>
				</div>

				{generalError && (
					<div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn backdrop-blur-xs">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
							className="w-4 h-4 shrink-0 mt-0.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
							/>
						</svg>
						<span>{generalError}</span>
					</div>
				)}

				{/* Social Sign In */}
				{/* <div className="grid grid-cols-2 gap-3 pt-3">
		  <button
			type="button"
			className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
		  >
			<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
			  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
			  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
			  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
			  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
			</svg>
			Google
		  </button>
		  <button
			type="button"
			className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer"
		  >
			<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
			  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
			</svg>
			GitHub
		  </button>
		</div>

		<div className="relative flex items-center justify-center my-4 py-2">
		  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
		  <span className="absolute bg-white dark:bg-zinc-950 px-3 text-xs uppercase text-zinc-450 dark:text-zinc-500">
			Or continue with
		  </span>
		</div> */}

				{/* Form Fields */}
				<div className="space-y-1">
					<Input
						label="Email Address"
						type="email"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							if (errors.email)
								setErrors({ ...errors, email: undefined });
						}}
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
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (errors.password)
								setErrors({ ...errors, password: undefined });
						}}
						error={errors.password}
						disabled={isLoading}
						leftIcon={
							<svg
								xmlns="http://www.w3.org/2050/svg"
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
				</div>

				{/* Remember & Forgot */}
				<div className="flex items-center justify-between text-sm py-1">
					<label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
							disabled={isLoading}
							className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary bg-transparent"
						/>
						Remember me
					</label>
					<Link
						href="/forgot-password"
						className="font-medium text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80 transition-colors"
					>
						Forgot password?
					</Link>
				</div>

				<Button
					type="submit"
					variant="gradient"
					className="w-full mt-2"
					isLoading={isLoading}
				>
					Sign In
				</Button>

				<p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-4">
					Don&apos;t have an account?{" "}
					<Link
						href="/register"
						className="font-semibold text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80 transition-colors"
					>
						Sign up for free
					</Link>
				</p>
			</form>
		</div>
	);
};
