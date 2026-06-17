"use client";

import React from "react";
import { Modal } from "./modal";
import { Button } from "./button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName: string;
  warningText?: string;
  loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  itemName,
  warningText,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {/* Danger Highlight Warning Box */}
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 text-left">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-white">&ldquo;{itemName}&rdquo;</span>?
            {warningText && (
              <span className="block mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {warningText}
              </span>
            )}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center min-w-[70px]"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
