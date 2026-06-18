import { apiClient } from "@/actions/apiClient";
import { toast } from "react-hot-toast";

/**
 * Fetch invoice PDF from backend and trigger browser preview (inline stream).
 */
export async function streamInvoice(id: string) {
  const toastId = toast.loading("Generating invoice preview...");
  try {
    const response = await apiClient.get(`/vendor/transactions/${id}/invoice`, {
      responseType: "blob",
    });
    
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    
    toast.success("Invoice generated!", { id: toastId });
    window.open(url, "_blank");
  } catch (error: any) {
    console.error("Error streaming invoice:", error);
    toast.error("Failed to preview invoice.", { id: toastId });
  }
}

/**
 * Fetch invoice PDF from backend and trigger direct file download.
 */
export async function downloadInvoice(id: string, deviceLabel: string) {
  const toastId = toast.loading("Preparing invoice download...");
  try {
    const response = await apiClient.get(`/vendor/transactions/${id}/invoice`, {
      responseType: "blob",
    });
    
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const sanitizedLabel = deviceLabel.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("download", `invoice_${id}_${sanitizedLabel}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Invoice downloaded!", { id: toastId });
  } catch (error: any) {
    console.error("Error downloading invoice:", error);
    toast.error("Failed to download invoice.", { id: toastId });
  }
}
