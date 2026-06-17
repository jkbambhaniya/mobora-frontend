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
