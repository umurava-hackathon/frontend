"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkUpdateAccountProfile } from "@/store/slices/dashboardSlice";
import { useRouter } from "next/navigation";

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function ProfilePage() {
  const user = useAppSelector(s => s.dashboard.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName ? toTitleCase(user.firstName) : "",
        lastName: user.lastName ? toTitleCase(user.lastName) : "",
        email: user.email || ""
      });
    }
  }, [user]);

  const emailChanged = user && formData.email !== user.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const resAction = await dispatch(thunkUpdateAccountProfile(formData) as any);
      if (thunkUpdateAccountProfile.fulfilled.match(resAction)) {
        if (resAction.payload.requiresReauth) {
           alert("Email changed. Please log in again with your new email.");
           router.push("/login");
           return;
        }
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(resAction.error.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName ? toTitleCase(user.firstName) : "",
        lastName: user.lastName ? toTitleCase(user.lastName) : "",
        email: user.email || ""
      });
    }
    setError(null);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#0F1621]">Your profile</h2>
        <p className="text-sm text-[#5A6474]">Manage your account identification and contact details.</p>
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="h-[72px] w-[72px] rounded-full bg-[#EEF4FF] text-[#2B71F0] flex items-center justify-center font-bold text-2xl shadow-sm border border-[#EEF4FF]">
          {user?.firstName?.[0] || "U"}
        </div>
        <div className="space-y-1">
          <div className="text-[16px] font-semibold text-[#0F1621]">
            {user?.firstName ? toTitleCase(user.firstName) : ""} {user?.lastName ? toTitleCase(user.lastName) : ""}
          </div>
          <div className="text-[13px] text-[#5A6474]">{user?.email}</div>
          <p className="text-[11px] font-normal text-[#9BA5B4] mt-1">Profile photo coming soon</p>
        </div>
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      {success && (
        <div className="p-3 px-4 rounded-lg bg-[#F0FDF4] border border-[#10B981] text-[#059669] text-[14px] animate-in fade-in">
          Profile updated successfully.
        </div>
      )}

      <form className="space-y-6 pt-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#5A6474]">First name</label>
            <input
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#5A6474]">Last name</label>
            <input
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-[#5A6474]">Email address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
          />
          {emailChanged && (
            <div className="bg-[#FEF9C3] border border-[#FDE047] rounded-lg p-3 text-[12px] text-[#92400E] animate-in fade-in flex gap-2">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Changing your email will require you to log in again.
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-[#5A6474]">Account role</label>
          <div className="flex">
            <span className="px-3 py-1 rounded-full bg-[#EEF4FF] text-[#2B71F0] text-[11px] font-bold uppercase tracking-widest border border-[#EEF4FF]">
              {user?.role || "Recruiter"}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold animate-in fade-in">
            {error}
          </div>
        )}

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-[#E8EAED]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#E8EAED] text-[#5A6474] rounded-lg text-sm font-semibold hover:bg-[#F8F9FC] transition-all order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-2.5 bg-[#2B71F0] text-white rounded-lg text-sm font-bold hover:bg-[#1A5CE0] disabled:bg-neutral-300 transition-all shadow-sm active:scale-[0.98] order-1 sm:order-2"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
