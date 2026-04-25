"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  thunkFetchAccountSessions, 
  thunkRevokeSession, 
  thunkRevokeAllOtherSessions 
} from "@/store/slices/dashboardSlice";
import { UAParser } from "ua-parser-js";
import { formatDistanceToNow } from "date-fns";
import { AlertDialog } from "@/components/ui/Modal";

const formatIP = (ip: string) =>
  ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1"
    ? "Local" 
    : ip;

export default function SessionsPage() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(s => s.dashboard.sessions);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);
  const [revokeAllSuccess, setRevokeAllSuccess] = useState(false);
  
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(thunkFetchAccountSessions() as any);
  }, [dispatch]);

  const handleRevokeClick = (id: string) => {
    setSessionToRevoke(id);
  };

  const confirmRevoke = async () => {
    if (sessionToRevoke) {
      await dispatch(thunkRevokeSession(sessionToRevoke) as any);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokeAllLoading(true);
    try {
      await dispatch(thunkRevokeAllOtherSessions() as any);
      setIsConfirmingAll(false);
      setRevokeAllSuccess(true);
      setTimeout(() => setRevokeAllSuccess(false), 3000);
    } finally {
      setRevokeAllLoading(false);
    }
  };

  const parseUA = (ua: string) => {
    const parser = new UAParser(ua);
    const browser = parser.getBrowser().name || "Unknown Browser";
    const os = parser.getOS().name || "Unknown OS";
    return `${browser} on ${os}`;
  };

  const getRelativeTime = (ts: string | Date) => {
    const date = new Date(ts);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    if (diffInMs < 60000) return "just now";
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-[20px] font-semibold text-[#0F1621]">Active sessions</h2>
        <p className="text-sm text-[#5A6474]">Devices currently signed in to your account.</p>
      </div>

      <div className="h-px bg-[#E8EAED] w-full" />

      <div className="space-y-4">
        {sessions.map((session) => (
          <div 
            key={session.sessionId} 
            className="bg-white border border-[#E8EAED] rounded-xl p-4 px-5 flex items-center gap-5 hover:shadow-sm transition-all"
          >
            <div className="h-10 w-10 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] shrink-0 border border-[#E8EAED]">
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#0F1621] truncate">{parseUA(session.userAgent)}</span>
              </div>
              <div className="text-[12px] text-[#5A6474] mt-0.5 font-medium">
                {formatIP(session.ip)} &bull; Last active {getRelativeTime(session.lastUsedAt)}
              </div>
            </div>

            {session.isCurrent ? (
              <span className="px-3 py-1 rounded-full bg-[#F0FDF4] text-[#059669] text-[11px] font-bold uppercase tracking-wider border border-[#10B981] shrink-0">
                Current session
              </span>
            ) : (
              <button 
                onClick={() => handleRevokeClick(session.sessionId)}
                className="px-4 py-1.5 border border-red-200 text-red-600 rounded-lg text-[12px] font-bold hover:bg-red-50 transition-colors shrink-0"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
        {/* ... existing count indicator ... */}
        {otherSessionsCount === 0 && (
          <div className="bg-[#F8F9FC] border border-[#E8EAED] rounded-xl p-4 flex items-center gap-3 text-[#5A6474]">
            <svg className="h-4 w-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <p className="text-[13px] font-medium">No other active sessions. Your account is only signed in here.</p>
          </div>
        )}
      </div>

      <div className="h-px bg-[#E8EAED] w-full mt-6" />

      {/* Danger Zone */}
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <h3 className="text-[14px] font-bold text-[#0F1621]">Security actions</h3>
          <p className="text-[13px] text-[#5A6474]">Signing out other devices will invalidate their sessions immediately.</p>
        </div>

        {revokeAllSuccess && (
          <div className="p-3 px-4 rounded-lg bg-[#F0FDF4] border border-[#10B981] text-[#059669] text-[13px] font-medium animate-in fade-in">
            All other devices signed out.
          </div>
        )}

        {isConfirmingAll ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in">
            <p className="text-[13px] text-red-600 font-bold mb-1 sm:mb-0">Are you sure? This will sign out all other devices.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleRevokeAll}
                disabled={revokeAllLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {revokeAllLoading ? "Signing out..." : "Yes, confirm"}
              </button>
              <button 
                onClick={() => setIsConfirmingAll(false)}
                className="px-4 py-2 bg-white border border-[#E8EAED] text-[#5A6474] rounded-lg text-xs font-bold hover:bg-[#F8F9FC] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group/btn w-fit">
            <button 
              disabled={otherSessionsCount === 0}
              onClick={() => setIsConfirmingAll(true)}
              className="px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-[14px] font-bold hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sign out all other devices
            </button>
            {otherSessionsCount === 0 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1E293B] text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                No other active sessions
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        isOpen={sessionToRevoke !== null}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={confirmRevoke}
        title="Sign out device"
        message="Are you sure you want to sign out this device? You will need to log in again on that device."
        confirmText="Sign out"
        variant="danger"
      />
    </div>
  );
}
