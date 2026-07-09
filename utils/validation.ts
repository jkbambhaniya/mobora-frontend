import * as yup from "yup";

export const brandValidationSchema = yup.object().shape({
	name: yup
		.string()
		.trim()
		.required("Brand name is required.")
		.max(255, "Brand name cannot exceed 255 characters."),
});

export const modelValidationSchema = yup.object().shape({
	name: yup
		.string()
		.trim()
		.required("Model name is required.")
		.max(255, "Model name cannot exceed 255 characters."),
	brand_id: yup
		.number()
		.integer("Brand ID must be an integer.")
		.required("Brand is required.")
		.positive("Invalid Brand ID."),
});

export const storageValidationSchema = yup.object().shape({
	value: yup
		.string()
		.trim()
		.required("Storage capacity is required.")
		.max(100, "Storage capacity cannot exceed 100 characters."),
});

export const ramValidationSchema = yup.object().shape({
	value: yup
		.string()
		.trim()
		.required("RAM size is required.")
		.max(100, "RAM size cannot exceed 100 characters."),
});

export const mobileValidationSchema = yup.object().shape({
	imei: yup
		.string()
		.trim()
		.required("IMEI is required.")
		.test(
			"is-15-digits",
			"IMEI must be exactly 15 digits.",
			(value) => !!value && /^\d{15}$/.test(value),
		),
	color: yup
		.string()
		.trim()
		.required("Color is required.")
		.max(100, "Color cannot exceed 100 characters."),
	brand: yup
		.string()
		.required("Brand is required."),
	model: yup
		.string()
		.required("Model is required."),
	storage: yup
		.string()
		.required("Storage capacity is required."),
	ram: yup
		.string()
		.required("RAM size is required."),
	condition: yup
		.string()
		.oneOf(["NEW", "OLD"], "Condition must be NEW or OLD.")
		.required("Condition is required."),
	batteryHealth: yup
		.number()
		.typeError("Battery health must be an integer.")
		.integer("Battery health must be an integer.")
		.min(50, "Battery health must be at least 50%.")
		.max(100, "Battery health cannot exceed 100%.")
		.nullable()
		.notRequired()
		.test(
			"is-required-for-apple",
			"Battery health is required for Apple devices.",
			function (value) {
				const { brand } = this.parent;
				if (brand && brand.toLowerCase() === "apple") {
					return value !== undefined && value !== null;
				}
				return true;
			}
		),
	purchasePrice: yup
		.number()
		.typeError("Purchase/Cost price must be a number.")
		.positive("Purchase/Cost price must be positive.")
		.notRequired()
		.test(
			"is-required",
			"Purchase/Cost price is required.",
			function (value) {
				const isEdit = this.options.context?.isEdit;
				if (isEdit) return true;
				return value !== undefined && value !== null;
			}
		),
	description: yup
		.string()
		.trim()
		.transform((value) => (value === "" ? null : value))
		.nullable()
		.notRequired(),
	repairingCost: yup
		.number()
		.typeError("Repairing cost must be a number.")
		.min(0, "Repairing cost cannot be negative.")
		.nullable()
		.notRequired(),
	customerId: yup
		.string()
		.nullable()
		.test(
			"is-required-for-purchase",
			"Customer / Dealer is required.",
			function (value) {
				const isEdit = this.options.context?.isEdit;
				if (isEdit) return true;
				return value !== undefined && value !== null && value !== "";
			}
		),
});

export const sellValidationSchema = yup.object().shape({
	sellPrice: yup
		.number()
		.typeError("Selling price must be a number.")
		.positive("Selling price must be a positive number.")
		.required("Selling price is required."),
	sellCustomer: yup
		.string()
		.required("Customer name is required."),
	sellDate: yup
		.string()
		.required("Sale date is required."),
	sellNotes: yup
		.string()
		.trim()
		.nullable()
		.notRequired(),
});

export const buybackValidationSchema = yup.object().shape({
	buybackPrice: yup
		.number()
		.typeError("Buyback price must be a number.")
		.positive("Buyback price must be a positive number.")
		.required("Buyback price is required."),
	buybackCustomer: yup
		.string()
		.required("Customer name is required."),
	buybackDate: yup
		.string()
		.required("Buyback date is required."),
	buybackCondition: yup
		.string()
		.oneOf(["NEW", "OLD"], "Invalid condition value.")
		.required("Condition is required."),
	buybackBattery: yup
		.number()
		.typeError("Battery health must be an integer.")
		.integer("Battery health must be an integer.")
		.min(50, "Battery health must be at least 50%.")
		.max(100, "Battery health cannot exceed 100%.")
		.required("Battery health is required."),
	buybackNotes: yup
		.string()
		.trim()
		.nullable()
		.notRequired(),
});

export const imeiCheckSchema = yup.object().shape({
	imei: yup
		.string()
		.trim()
		.required("IMEI number is required.")
		.test(
			"is-15-digits",
			"IMEI must be exactly 15 digits.",
			(value) => !!value && /^\d{15}$/.test(value)
		),
});


