import React, { useState } from 'react';
import { X, User, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, GraduationCap, Users, LogOut, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { user, login, logout } = useAuth();
  const [identifier, setIdentifier] = useState(user?.nickname || user?.phone_number || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Nickname or Phone Number.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your Password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await login(identifier.trim(), password.trim());
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your password.");
    } finally {
      setLoading(false);
    }
  };

  const teachingCount = user?.teaching_classes?.length || 0;
  const enrolledCount = user?.enrolled_classes?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-theme-card w-full max-w-md p-6 rounded-2xl border border-theme-subtle shadow-2xl space-y-6 text-theme-primary transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-theme-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-theme-accent-subtle border border-theme-accent-subtle flex items-center justify-center text-theme-accent">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-theme-primary">Account & Session</h3>
              <p className="text-[11px] text-theme-muted">Single Password Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Status if signed in */}
        {user && (
          <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-theme-accent font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Active Session</span>
              </div>
              <div className="font-mono text-xs font-bold text-theme-primary flex items-center gap-2">
                <span>{user.nickname ? `@${user.nickname.replace(/^@/, '')}` : (user.phone_number || user.username)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded badge-theme-accent font-sans font-medium">
                  {teachingCount} Teaching • {enrolledCount} Enrolled
                </span>
              </div>
            </div>
            <button
              onClick={() => { logout(); onClose(); }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold ml-2 shrink-0 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Single Password Switch / Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
              <span>Nickname or Phone Number</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. @azamat or +998901234567"
                className="w-full bg-theme-base text-theme-primary text-xs sm:text-sm rounded-xl pl-10 pr-3 py-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-secondary block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full bg-theme-base text-theme-primary text-xs sm:text-sm rounded-xl pl-10 pr-10 py-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? "Authenticating..." : "Sign In with Password"}</span>
          </button>
        </form>

        {/* Telegram Instruction */}
        <div className="p-3 bg-theme-elevated/60 rounded-xl border border-theme-subtle text-[11px] text-theme-muted leading-relaxed flex items-start gap-2">
          <Send className="w-3.5 h-3.5 text-theme-accent mt-0.5 shrink-0" />
          <span>
            <strong>Registration & Password Setup:</strong> Open <strong>@IELTSgenius_bot</strong> in Telegram, send <code>/start</code>, share your contact, and set your password.
          </span>
        </div>
      </div>
    </div>
  );
}
