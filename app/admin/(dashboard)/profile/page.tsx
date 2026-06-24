"use client";

import React, { useState, useEffect } from "react";
import * as yup from "yup";
import { toast } from "react-hot-toast";
import { useAdminAuth } from "@/context/admin/auth-context";
import { ProfileImageUpload } from "@/components/vendor/profile/ProfileImageUpload";
import { updateAdminProfileAction, changeAdminPasswordAction } from "@/actions/admin-auth";

// Define Validation Schemas using Yup
const profileSchema = yup.object().shape({
  name: yup.string().trim().required("Full name is required"),
  email: yup
    .string()
    .trim()
    .required("Email address is required")
    .email("Please enter a valid email address"),
  profileImg: yup.string().nullable().optional()
});

const passwordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords must match")
});

export default function AdminProfilePage() {
  const { admin, setAdmin } = useAdminAuth();

  // Profile Info Form State
  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [profileImg, setProfileImg] = useState<string | null>(admin?.profile_img || null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Update states when context loads
  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
      setProfileImg(admin.profile_img || null);
    }
  }, [admin]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileErrors({});

    try {
      // Client-side yup validation
      await profileSchema.validate({ name, email, profileImg }, { abortEarly: false });

      const res = await updateAdminProfileAction(name, email, profileImg);
      if (res.success && res.data && res.data.success) {
        setAdmin(res.data.admin);
        toast.success("Profile updated successfully!");
      } else {
        const errorData = res.errorData || {};
        if (errorData.errors) {
          setProfileErrors(errorData.errors);
          toast.error("Please correct the errors in the form.");
        } else {
          const errMsg = res.message || errorData.message || "Failed to update profile.";
          setProfileErrors({ global: errMsg });
          toast.error(errMsg);
        }
      }
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            errors[validationError.path] = validationError.message;
          }
        });
        setProfileErrors(errors);
        toast.error("Please correct the validation errors.");
      } else {
        const errMsg = err.message || "An error occurred while updating profile.";
        setProfileErrors({ global: errMsg });
        toast.error(errMsg);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});

    try {
      // Client-side yup validation
      await passwordSchema.validate(
        { currentPassword, newPassword, confirmPassword },
        { abortEarly: false }
      );

      const res = await changeAdminPasswordAction(currentPassword, newPassword);
      if (res.success && res.data && res.data.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = res.errorData || {};
        if (errorData.errors) {
          setPasswordErrors(errorData.errors);
          toast.error("Please correct the errors in the form.");
        } else {
          const errMsg = res.message || errorData.message || "Failed to change password.";
          setPasswordErrors({ global: errMsg });
          toast.error(errMsg);
        }
      }
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((validationError) => {
          if (validationError.path) {
            errors[validationError.path] = validationError.message;
          }
        });
        setPasswordErrors(errors);
        toast.error("Please correct the validation errors.");
      } else {
        const errMsg = err.message || "An error occurred while changing password.";
        setPasswordErrors({ global: errMsg });
        toast.error(errMsg);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">Admin Profile Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">
          Manage your personal details, profile picture, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Info Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 border-b border-zinc-100 dark:border-white/5 pb-3">
            Profile Information
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileErrors.global && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl animate-fadeIn">
                {profileErrors.global}
              </div>
            )}

            {/* Profile Image Upload Component */}
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-[#0d0e12]/40 rounded-xl border border-zinc-200/60 dark:border-white/5">
              <span className="text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-3">Profile Photo</span>
              <ProfileImageUpload
                name="admin_profile_img"
                value={profileImg || ""}
                onChange={(base64) => setProfileImg(base64)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0d0e12]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-white transition-all text-sm ${
                    profileErrors.name ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/5"
                  }`}
                  placeholder="e.g. John Doe"
                />
                {profileErrors.name && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-semibold">{profileErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0d0e12]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-white transition-all text-sm ${
                    profileErrors.email ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/5"
                  }`}
                  placeholder="e.g. admin@mobora.com"
                />
                {profileErrors.email && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-semibold">{profileErrors.email}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                {profileLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#13151a]/50 backdrop-blur-md border border-zinc-200/80 dark:border-white/5 shadow-sm dark:shadow-lg">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 border-b border-zinc-100 dark:border-white/5 pb-3">
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordErrors.global && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl animate-fadeIn">
                {passwordErrors.global}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0d0e12]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-white transition-all text-sm ${
                    passwordErrors.currentPassword ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/5"
                  }`}
                  placeholder="••••••••"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-semibold">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0d0e12]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-white transition-all text-sm ${
                    passwordErrors.newPassword ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/5"
                  }`}
                  placeholder="••••••••"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-semibold">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#0d0e12]/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-white transition-all text-sm ${
                    passwordErrors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-zinc-200 dark:border-white/5"
                  }`}
                  placeholder="••••••••"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 font-semibold">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                {passwordLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
