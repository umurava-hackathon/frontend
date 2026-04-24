"use client";

import React, { useState, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { thunkUpdateAccountPassword } from "@/store/slices/dashboardSlice";

export default function PasswordPage() {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criteria = useMemo(() => {
    const p = formData.newPassword;
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      number: /\d/.test(p),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)
    };
  }, [formData.newPassword]);

  const strength = useMemo(() => {
    if (!formData.newPassword) return { label: "", color: "bg-[#E8EAED]", width: "0%" };
    const score = Object.values(criteria).filter(Boolean).length;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", width: "50%" };
    if (score === 3) return { label: "Strong", color: "bg-[#2B71F0]", width: "75%" };
    return { label: "Very strong", color: "bg-[#10B981]", width: "100%" };
  }, [criteria, formData.newPassword]);

  const canSubmit = Object.values(criteria).every(Boolean) && 
                    formData.newPassword === formData.confirmPassword &&
                    formData.currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const resAction = await dispatch(thunkUpdateAccountPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }) as any);
      
      if (thunkUpdateAccountPassword.fulfilled.match(resAction)) {
        setSuccess(true);
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(resAction.error.message || "Failed to update password");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#0F1621]">Change password</h2>
        <p className="text-sm text-[#5A6474]">Choose a strong password to keep your account secure.</p>
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      {success && (
        <div className="p-3 px-4 rounded-lg bg-[#F0FDF4] border border-[#10B981] text-[#059669] text-[14px] animate-in fade-in mb-6">
          Password updated. Other devices have been signed out.
        </div>
      )}

      <form className="space-y-6 pt-2" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-[#5A6474]">Current password</label>
          <div className="relative">
            <input
              type={showPass.current ? "text" : "password"}
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
            />
            <button type="button" onClick={() => setShowPass({...showPass, current: !showPass.current})} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BA5B4] hover:text-[#5A6474] transition-colors">
              {showPass.current ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {error && <div className="text-[12px] text-red-600 font-medium mt-1">{error}</div>}
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-[#5A6474]">New password</label>
            <div className="relative">
              <input
                type={showPass.next ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
              />
              <button type="button" onClick={() => setShowPass({...showPass, next: !showPass.next})} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BA5B4] hover:text-[#5A6474] transition-colors">
                {showPass.next ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            
            {/* Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-3 pt-1">
                <div className="h-1.5 w-full bg-[#E8EAED] rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9BA5B4] flex justify-between">
                  <span>Password strength</span>
                  <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { key: "length", label: "8+ characters" },
                    { key: "upper", label: "Uppercase letter" },
                    { key: "number", label: "One number" },
                    { key: "special", label: "Special character" }
                  ].map((c) => (
                    <div key={c.key} className="flex items-center gap-2">
                       {criteria[c.key as keyof typeof criteria] ? (
                         <svg className="h-3.5 w-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                       ) : (
                         <svg className="h-3 w-3 text-[#E8EAED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                       )}
                       <span className={`text-[11px] ${criteria[c.key as keyof typeof criteria] ? "text-[#0F1621] font-medium" : "text-[#9BA5B4]"}`}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[13px] font-semibold text-[#5A6474]">Confirm new password</label>
            <div className="relative">
              <input
                type={showPass.confirm ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full rounded-lg border border-[#E8EAED] bg-white px-4 py-2.5 text-sm focus-ring transition-all"
              />
              <button type="button" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9BA5B4] hover:text-[#5A6474] transition-colors">
                {showPass.confirm ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <div className="text-[11px] text-red-600 font-medium mt-1">Passwords do not match</div>
            )}
          </div>
        </div>

        <div className="pt-8 flex justify-end border-t border-[#E8EAED] mt-10">
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full sm:w-auto min-w-[160px] bg-[#2B71F0] text-white rounded-lg px-8 py-2.5 text-sm font-bold hover:bg-[#1A5CE0] disabled:bg-neutral-300 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
