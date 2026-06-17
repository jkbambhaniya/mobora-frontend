export const formatDate = (date?: string) => {
	if (!date) return "—";

	return new Date(date).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};
