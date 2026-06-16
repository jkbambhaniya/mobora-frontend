"use client";

import React, { useRef, useState } from "react";

interface ProfileImageUploadProps {
  value?: string;
  onChange: (base64: string | null) => void;
  name: string;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ value, onChange, name }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate size (limit to 2MB to prevent SQL overflow or huge payload)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="relative group cursor-pointer" onClick={triggerSelect}>
        {/* Preview circle */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 group-hover:border-primary/60 transition-colors flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 shadow-lg">
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Hover upload overlay */}
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Floating Remove Button */}
        {preview && (
          <button
            onClick={handleRemove}
            type="button"
            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md border border-white dark:border-zinc-900 transition-colors cursor-pointer"
            title="Remove Image"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-center">
        <button
          type="button"
          onClick={triggerSelect}
          className="text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer"
        >
          {preview ? "Change Photo" : "Upload Photo"}
        </button>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
          JPG, PNG or GIF. Max 2MB.
        </p>
      </div>

      {error && (
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 animate-fadeIn">
          {error}
        </span>
      )}
    </div>
  );
};
