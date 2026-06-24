"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  footer?: React.ReactNode;
  isDrawer?: boolean; // If true, acts as a side drawer sliding from the right
  isDismissible?: boolean; // If false, close button is hidden and backdrop click is ignored
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
  footer,
  isDrawer = false,
  isDismissible = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
    full: "max-w-full",
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      {/* Backdrop Closer */}
      <div className="absolute inset-0 cursor-default" onClick={isDismissible ? onClose : undefined} />

      {/* Modal Card */}
      <div
        className={`relative w-full ${
          sizeClasses[size]
        } bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col animate-scaleUp max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — shown when a title is provided; close button rendered if isDismissible */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 p-6 pb-4 flex-shrink-0">
          {title ? (
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white pr-4">
              {title}
            </h3>
          ) : <span />}
          {isDismissible && (
            <button
              onClick={onClose}
              className="ml-auto text-zinc-400 hover:text-zinc-650 dark:hover:text-white cursor-pointer flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 text-left text-zinc-700 dark:text-zinc-350">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  const drawerContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-950/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop Closer */}
      <div className="absolute inset-0 cursor-default" onClick={isDismissible ? onClose : undefined} />

      {/* Drawer Card */}
      <div
        className={`relative w-full ${
          sizeClasses[size]
        } h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slideLeft overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header — close button rendered if isDismissible; title optional */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          {title ? (
            <div className="space-y-0.5 flex-1">{title}</div>
          ) : <span className="flex-1" />}
          {isDismissible && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-white transition-colors cursor-pointer flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left text-zinc-700 dark:text-zinc-350">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(isDrawer ? drawerContent : modalContent, document.body);
};
