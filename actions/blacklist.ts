"use server";

import { apiClient } from "./apiClient";
import { ActionResponse } from "./mobiles";

export async function getBlacklistedDevicesAction(): Promise<ActionResponse> {
	try {
		const response = await apiClient.get("/vendor/blacklist");
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to fetch blacklisted devices.",
		};
	}
}

export async function blacklistDeviceAction(
	imei: string,
	reason: string,
): Promise<ActionResponse> {
	try {
		const response = await apiClient.post("/vendor/blacklist", { imei, reason });
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to blacklist device.",
		};
	}
}

export async function checkBlacklistAction(imei: string): Promise<ActionResponse> {
	try {
		const response = await apiClient.get(`/vendor/blacklist/check/${imei}`);
		return { success: true, data: response.data };
	} catch (error: any) {
		const errorData = error.response?.data;
		return {
			success: false,
			message: errorData?.message || error.message || "Failed to check blacklist status.",
		};
	}
}
