"use client";

import React, { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getAdminMobileDetailAction } from "@/actions/admin-mobiles";

function slugify(text: string) {
	if (!text) return "";
	return text.toString().toLowerCase().trim()
		.replace(/\s+/g, '-')           // Replace spaces with -
		.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
		.replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

export default function AdminMobileBrandRedirectPage({ params }: { params: Promise<{ brand: string }> }) {
	const router = useRouter();
	const resolvedParams = use(params);
	const { brand: id } = resolvedParams; // Since we renamed [id] to [brand], the ID is now in the brand parameter

	useEffect(() => {
		const performRedirect = async () => {
			// If it's not a numeric ID, redirect back to mobiles main directory
			if (isNaN(Number(id))) {
				router.replace("/admin/mobiles");
				return;
			}

			try {
				const res = await getAdminMobileDetailAction(id);
				if (res.success && res.data && res.data.success) {
					const m = res.data.mobile;
					const brandSlug = slugify(m.brand);
					const modelSlug = slugify(m.model);
					if (brandSlug && modelSlug) {
						router.replace(`/admin/mobiles/${brandSlug}/${modelSlug}`);
						return;
					}
				}
				toast.error("Failed to resolve device details.");
				router.replace("/admin/mobiles");
			} catch (error) {
				console.error("Redirect error:", error);
				router.replace("/admin/mobiles");
			}
		};
		performRedirect();
	}, [id, router]);

	return (
		<div className="flex-1 bg-zinc-50 dark:bg-[#0d0e12] flex flex-col items-center justify-center p-8">
			<svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
			<p className="text-sm text-zinc-500 dark:text-gray-400">Redirecting to slug route...</p>
		</div>
	);
}
