import { Confirm } from "notiflix";

interface ConfirmOptions {
  title?: string;
  message?: string;
  okButtonText?: string;
  cancelButtonText?: string;
  isDestructive?: boolean;
}

export const showConfirm = (
  onConfirm: () => void,
  customOptions?: ConfirmOptions
) => {
  if (typeof window === "undefined") return;

  const isDark = document.documentElement.classList.contains("dark");
  
  const options = {
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    okButtonText: "Confirm",
    cancelButtonText: "Cancel",
    isDestructive: false,
    ...customOptions
  };

  const okBtnBg = options.isDestructive 
    ? "#e11d48" // Rose 600 (Destructive)
    : "#2563eb"; // Blue 600 (Primary)

  Confirm.show(
    options.title,
    options.message,
    options.okButtonText,
    options.cancelButtonText,
    onConfirm,
    () => {},
    {
      width: "360px",
      borderRadius: "16px",
      fontFamily: "var(--font-sans), system-ui, sans-serif",
      cssAnimation: true,
      cssAnimationStyle: "zoom",
      // Light vs Dark Mode styling
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      titleColor: options.isDestructive 
        ? (isDark ? "#fb7185" : "#e11d48") 
        : (isDark ? "#38bdf8" : "#2563eb"),
      messageColor: isDark ? "#cbd5e1" : "#334155",
      okButtonBackground: okBtnBg,
      okButtonColor: "#ffffff",
      cancelButtonBackground: isDark ? "#1e293b" : "#e2e8f0",
      cancelButtonColor: isDark ? "#94a3b8" : "#475569",
      backOverlayColor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.4)",
      zindex: 9999,
    }
  );
};

export const confirmLogout = (onConfirm: () => void) => {
  showConfirm(onConfirm, {
    title: "Sign Out",
    message: "Are you sure you want to sign out of your account?",
    okButtonText: "Yes, Sign Out",
    cancelButtonText: "Cancel",
    isDestructive: true,
  });
};
