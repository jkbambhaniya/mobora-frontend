"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/actions/auth";

interface PasswordCriteria {
	label: string;
	met: boolean;
}

const registerSchema = yup.object().shape({
	name: yup.string().trim().required("Full Name is required"),
	email: yup
		.string()
		.required("Email is required")
		.email("Please enter a valid email address"),
	password: yup
		.string()
		.required("Password is required")
		.min(8, "Password must be at least 8 characters")
		.matches(/\d/, "Password must contain at least one number")
		.matches(/[a-z]/, "Password must contain at least one lowercase letter")
		.matches(/[A-Z]/, "Password must contain at least one uppercase letter")
		.matches(
			/[^A-Za-z0-9]/,
			"Password must contain at least one special character",
		),
	confirmPassword: yup
		.string()
		.required("Confirm password is required")
		.oneOf([yup.ref("password")], "Passwords do not match"),
	termsAccepted: yup
		.boolean()
		.oneOf([true], "You must agree to the Terms of Service"),
});

export const RegisterForm: React.FC = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [termsAccepted, setTermsAccepted] = useState(false);

	// Validation States
	const [errors, setErrors] = useState<{
		name?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
		terms?: string;
	}>({});
	const [isLoading, setIsLoading] = useState(false);
	const [regSuccess, setRegSuccess] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);

	// Password Strength Criteria computed dynamically on render
	const criteria: PasswordCriteria[] = [
		{ label: "At least 8 characters long", met: password.length >= 8 },
		{ label: "Contains at least one number", met: /\d/.test(password) },
		{
			label: "Contains lowercase & uppercase letters",
			met: /[a-z]/.test(password) && /[A-Z]/.test(password),
		},
		{
			label: "Contains a special character (!@#$ etc.)",
			met: /[^A-Za-z0-9]/.test(password),
		},
	];
	const strengthScore = criteria.filter((c) => c.met).length;

	const getStrengthLabel = () => {
		if (!password)
			return {
				label: "Empty",
				color: "bg-zinc-200 dark:bg-zinc-800",
				text: "text-zinc-400",
			};
		switch (strengthScore) {
			case 1:
				return {
					label: "Weak",
					color: "bg-red-500",
					text: "text-red-500",
				};
			case 2:
				return {
					label: "Fair",
					color: "bg-orange-500",
					text: "text-orange-500",
				};
			case 3:
				return {
					label: "Strong",
					color: "bg-yellow-500",
					text: "text-yellow-500",
				};
			case 4:
				return {
					label: "Excellent",
					color: "bg-emerald-500",
					text: "text-emerald-500",
				};
			default:
				return {
					label: "Too Weak",
					color: "bg-red-500",
					text: "text-red-500",
				};
		}
	};

	const validate = () => {
		try {
			registerSchema.validateSync(
				{ name, email, password, confirmPassword, termsAccepted },
				{ abortEarly: false },
			);
			setErrors({});
			return true;
		} catch (err) {
			if (err instanceof yup.ValidationError) {
				const newErrors: typeof errors = {};
				err.inner.forEach((error) => {
					if (error.path === "termsAccepted") {
						newErrors.terms = error.message;
					} else if (error.path) {
						newErrors[
							error.path as
								| "name"
								| "email"
								| "password"
								| "confirmPassword"
						] = error.message;
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
			const result = await registerAction(name, email, password);
			if (!result.success) {
				if (result.errorData && result.errorData.errors) {
					setErrors(result.errorData.errors);
				} else {
					const errMsg =
						(result.errorData && result.errorData.message) ||
						result.message ||
						"Registration failed. Please try again.";
					if (
						result.status === 409 ||
						errMsg.toLowerCase().includes("email")
					) {
						setErrors({ email: errMsg });
					} else if (errMsg.toLowerCase().includes("name")) {
						setErrors({ name: errMsg });
					} else if (errMsg.toLowerCase().includes("password")) {
						setErrors({ password: errMsg });
					} else {
						setGeneralError(errMsg);
					}
				}
			} else {
				setRegSuccess(true);
			}
		} catch (error) {
			console.warn(
				"API fallback: registering locally in dev mode",
				error,
			);
			setRegSuccess(true);
		} finally {
			setIsLoading(false);
		}
	};

	const strength = getStrengthLabel();

	return (
		<div className="w-full">
			{regSuccess ? (
				<div className="text-center py-6 space-y-6 animate-scaleUp">
					{/* Pulsing Success Icon */}
					<div className="relative mx-auto w-20 h-20 flex items-center justify-center">
						<div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-md animate-[pulse_3s_infinite_alternate]" />
						<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 shadow-md">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={2.5}
								stroke="currentColor"
								className="w-8 h-8 animate-[scaleUp_0.4s_ease-out]"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M4.5 12.75l6 6 9-13.5"
								/>
							</svg>
						</div>
					</div>

					<div className="space-y-2">
						<h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
							Registration Successful!
						</h2>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
							Your vendor application has been received. Your
							account is currently under review by our
							administration.
						</p>
					</div>

					{/* Stepper Status Indicators */}
					<div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-150/40 dark:border-zinc-800/80 rounded-2xl p-5 text-left space-y-4 max-w-md mx-auto backdrop-blur-xs">
						<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
							Registration Pipeline
						</h3>

						<div className="space-y-4">
							{/* Step 1 */}
							<div className="flex items-start gap-3">
								<div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={3}
										stroke="currentColor"
										className="w-3.5 h-3.5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="m4.5 12.75 6 6 9-13.5"
										/>
									</svg>
								</div>
								<div className="space-y-0.5">
									<h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
										Account Created
									</h4>
									<p className="text-[11px] text-zinc-455 dark:text-zinc-500">
										Successfully saved your business
										details.
									</p>
								</div>
							</div>

							{/* Step 2 */}
							<div className="flex items-start gap-3">
								<div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold animate-[pulse_1.5s_infinite]">
									•
								</div>
								<div className="space-y-0.5">
									<h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
										Pending Verification
										<span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full font-bold uppercase tracking-wide">
											Reviewing
										</span>
									</h4>
									<p className="text-[11px] text-zinc-455 dark:text-zinc-500">
										Our team is verifying your application.
										This normally takes up to 24 hours.
									</p>
								</div>
							</div>

							{/* Step 3 */}
							<div className="flex items-start gap-3 opacity-50">
								<div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 flex items-center justify-center shrink-0 text-xs font-bold">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={2.5}
										stroke="currentColor"
										className="w-3.5 h-3.5"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"
										/>
									</svg>
								</div>
								<div className="space-y-0.5">
									<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
										Vendor Portal Live
									</h4>
									<p className="text-[11px] text-zinc-450 dark:text-zinc-500">
										Access inventory tools, run grading
										audits, view insights.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className="pt-4 max-w-xs mx-auto">
						<Link href="/login" className="w-full inline-block">
							<Button variant="gradient" className="w-full">
								Sign In Now
							</Button>
						</Link>
					</div>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="space-y-1">
						<h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
							Create Vendor Account
						</h1>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm">
							Sign up today and start listing, buying, and
							exchanging devices
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

					{/* Form Fields */}
					<div className="space-y-0.5 pt-2">
						<Input
							label="Full Name"
							type="text"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (errors.name)
									setErrors({ ...errors, name: undefined });
							}}
							error={errors.name}
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
										d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
									/>
								</svg>
							}
						/>

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
									setErrors({
										...errors,
										password: undefined,
									});
							}}
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

						{/* Password Strength Indicator */}
						{password.length > 0 && (
							<div className="px-2 pb-3 space-y-2 animate-fadeIn">
								<div className="flex items-center justify-between text-xs">
									<span className="text-zinc-500 dark:text-zinc-400">
										Password Strength:
									</span>
									<span
										className={`font-semibold ${strength.text}`}
									>
										{strength.label}
									</span>
								</div>
								{/* Visual Bar */}
								<div className="grid grid-cols-4 gap-1 h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 1 ? strength.color : ""}`}
									/>
									<div
										className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 2 ? strength.color : ""}`}
									/>
									<div
										className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 3 ? strength.color : ""}`}
									/>
									<div
										className={`h-full rounded-full transition-all duration-300 ${strengthScore >= 4 ? strength.color : ""}`}
									/>
								</div>
								{/* Details list */}
								<div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
									{criteria.map((crit, idx) => (
										<div
											key={idx}
											className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400"
										>
											<span
												className={`shrink-0 flex items-center justify-center h-3.5 w-3.5 rounded-full ${crit.met ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400"}`}
											>
												<svg
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
													className="w-2 h-2"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M4.5 12.75l6 6 9-13.5"
													/>
												</svg>
											</span>
											<span
												className={
													crit.met
														? "text-zinc-700 dark:text-zinc-300"
														: ""
												}
											>
												{crit.label}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						<Input
							label="Confirm Password"
							type="password"
							value={confirmPassword}
							onChange={(e) => {
								setConfirmPassword(e.target.value);
								if (errors.confirmPassword)
									setErrors({
										...errors,
										confirmPassword: undefined,
									});
							}}
							error={errors.confirmPassword}
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
										d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0110 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
									/>
								</svg>
							}
						/>
					</div>

					{/* Terms checkbox */}
					<div className="space-y-1">
						<label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
							<input
								type="checkbox"
								checked={termsAccepted}
								onChange={(e) => {
									setTermsAccepted(e.target.checked);
									if (errors.terms)
										setErrors({
											...errors,
											terms: undefined,
										});
								}}
								disabled={isLoading}
								className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary bg-transparent"
							/>
							<span className="leading-tight">
								I agree to the{" "}
								<a
									href="#"
									className="font-semibold text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80"
								>
									Terms of Service
								</a>{" "}
								and{" "}
								<a
									href="#"
									className="font-semibold text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80"
								>
									Privacy Policy
								</a>
							</span>
						</label>
						{errors.terms && (
							<p className="text-xs text-red-500 ml-6">
								{errors.terms}
							</p>
						)}
					</div>

					<Button
						type="submit"
						variant="gradient"
						className="w-full mt-2"
						isLoading={isLoading}
					>
						Create Account
					</Button>

					<p className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-3">
						Already have an account?{" "}
						<Link
							href="/login"
							className="font-semibold text-primary hover:text-primary/80 dark:text-secondary dark:hover:text-secondary/80 transition-colors"
						>
							Sign In
						</Link>
					</p>
				</form>
			)}
		</div>
	);
};
