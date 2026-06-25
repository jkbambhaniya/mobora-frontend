"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import { getRequirementsAction, createRequirementAction, deleteRequirementAction, getMatchingDevicesAction } from "@/actions/requirements";

export interface DeviceRequirement {
	id: number;
	brandId: number;
	brand: string;
	modelId: number;
	model: string;
	storageId: number;
	storage: string;
	ramId: number;
	ram: string;
	color: string;
	status: string;
	createdAt?: string;
}

export interface MatchingDevice {
	id: number;
	brand: string;
	model: string;
	storage: string;
	ram: string;
	color: string;
	condition: string;
	price: number;
	status: string;
	vendorName: string;
	vendorEmail?: string;
	vendorPhone?: string;
	shopName: string;
	vendorId: number;
	matchedRequirementId: number;
}

interface RequirementsContextType {
	requirements: DeviceRequirement[];
	matchingDevices: MatchingDevice[];
	isLoading: boolean;
	fetchRequirements: () => Promise<void>;
	fetchMatchingDevices: () => Promise<void>;
	addRequirement: (data: {
		brand_id: number;
		model_id: number;
		storage_id: number;
		ram_id: number;
		color?: string;
	}) => Promise<{ success: boolean; message?: string }>;
	removeRequirement: (id: number) => Promise<boolean>;
}

const RequirementsContext = createContext<RequirementsContextType | undefined>(undefined);

export function RequirementsProvider({ children }: { children: React.ReactNode }) {
	const { vendor } = useAuth();
	const [requirements, setRequirements] = useState<DeviceRequirement[]>([]);
	const [matchingDevices, setMatchingDevices] = useState<MatchingDevice[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchRequirements = useCallback(async () => {
		if (!vendor) return;
		setIsLoading(true);
		try {
			const res = await getRequirementsAction();
			if (res.success && res.data?.success) {
				setRequirements(res.data.requirements || []);
			}
		} catch (error) {
			console.error("Failed to fetch requirements:", error);
		} finally {
			setIsLoading(false);
		}
	}, [vendor]);

	const fetchMatchingDevices = useCallback(async () => {
		if (!vendor) return;
		try {
			const res = await getMatchingDevicesAction();
			if (res.success && res.data?.success) {
				setMatchingDevices(res.data.matches || []);
			}
		} catch (error) {
			console.error("Failed to fetch matching devices:", error);
		}
	}, [vendor]);

	const addRequirement = async (data: {
		brand_id: number;
		model_id: number;
		storage_id: number;
		ram_id: number;
		color?: string;
	}) => {
		try {
			const res = await createRequirementAction(data);
			if (res.success && res.data?.success) {
				const newReq = res.data.requirement;
				setRequirements((prev) => [newReq, ...prev]);
				fetchMatchingDevices(); // Refresh matches after adding a requirement
				return { success: true };
			}
			return { success: false, message: res.message || "Failed to add requirement." };
		} catch (error: any) {
			return { success: false, message: error.message || "An unexpected error occurred." };
		}
	};

	const removeRequirement = async (id: number) => {
		try {
			const res = await deleteRequirementAction(id);
			if (res.success && res.data?.success) {
				setRequirements((prev) => prev.filter((r) => r.id !== id));
				setMatchingDevices((prev) => prev.filter((d) => d.matchedRequirementId !== id));
				return true;
			}
			return false;
		} catch (error) {
			console.error("Failed to delete requirement:", error);
			return false;
		}
	};

	useEffect(() => {
		if (vendor) {
			fetchRequirements();
			fetchMatchingDevices();
		} else {
			setRequirements([]);
			setMatchingDevices([]);
		}
	}, [vendor, fetchRequirements, fetchMatchingDevices]);

	return (
		<RequirementsContext.Provider
			value={{
				requirements,
				matchingDevices,
				isLoading,
				fetchRequirements,
				fetchMatchingDevices,
				addRequirement,
				removeRequirement,
			}}
		>
			{children}
		</RequirementsContext.Provider>
	);
}

export function useRequirements() {
	const context = useContext(RequirementsContext);
	if (context === undefined) {
		throw new Error("useRequirements must be used within a RequirementsProvider");
	}
	return context;
}
