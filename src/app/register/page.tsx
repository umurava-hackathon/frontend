"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { thunkRegister } from "@/store/slices/dashboardSlice";
import { AlertDialog } from "@/components/ui/Modal";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const loading = useAppSelector((state) => state.dashboard.auth.loading);
  const error = useAppSelector((state) => state.dashboard.auth.error);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const passwordStrength = useMemo(() => {
    const { password } = formData;
    if (!password) return { label: "", color: "bg-neutral-200" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-danger" };
    if (score === 2) return { label: "Fair", color: "bg-warning" };
    if (score === 3) return { label: "Good", color: "bg-primary-400" };
    return { label: "Strong", color: "bg-success" };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setShowAlert(true);
      return;
    }
    const result = await dispatch(thunkRegister(formData) as any);
    if (thunkRegister.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-neutral-200">
        <div className="text-center space-y-2">
           <div className="flex justify-center mb-6">
             <div className="h-12 w-12 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold text-2xl shadow-sm">U</div>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">Join Umurava AI</h1>
          <p className="text-sm text-neutral-500">Create an account to start screening talent</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* ... existing form fields ... */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-neutral-700">First name</label>
              <input
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus-ring transition-all"
                placeholder="Amara"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-neutral-700">Last name</label>
              <input
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus-ring transition-all"
                placeholder="Diallo"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-neutral-700">Email address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus-ring transition-all"
              placeholder="amara@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-neutral-700">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus-ring transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            
            {formData.password && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        (passwordStrength.label === "Weak" && i === 1) ||
                        (passwordStrength.label === "Fair" && i <= 2) ||
                        (passwordStrength.label === "Good" && i <= 3) ||
                        (passwordStrength.label === "Strong" && i <= 4)
                        ? passwordStrength.color : "bg-neutral-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-neutral-400">Strength</span>
                  <span style={{ color: passwordStrength.label ? "" : "transparent" }} className={passwordStrength.label === "Weak" ? "text-danger" : passwordStrength.label === "Fair" ? "text-warning" : "text-success"}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-semibold text-neutral-700">Confirm password</label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus-ring transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-dangerLight/20 border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-primary-600 disabled:bg-neutral-300 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[13px] text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-500 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Registration Error"
        message="Passwords do not match. Please try again."
        confirmText="OK"
        showCancel={false}
        variant="warning"
      />
    </main>
  );
}
