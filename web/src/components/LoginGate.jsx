import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, 
  ArrowRight, GraduationCap, Users, Send, Sun, Moon, Palette, Check, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginGate({ theme, toggleTheme, currentPalette, setCurrentPalette }) {
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const paletteMenuRef = useRef(null);

  const palettes = [
    { id: 'amber', name: 'Amber Gold', color: '#f59e0b' },
    { id: 'emerald', name: 'Pine Emerald', color: '#10b981' },
    { id: 'rose', name: 'Rose Quartz', color: '#f43f5e' },
    { id: 'violet', name: 'Nebula Violet', color: '#a855f7' },
    { id: 'cyan', name: 'Arctic Cyan', color: '#06b6d4' },
    { id: 'monochrome', name: 'Carbon OLED', color: '#e4e4e7' }
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (paletteMenuRef.current && !paletteMenuRef.current.contains(event.target)) {
        setPaletteMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Nickname or Phone Number.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your Password.");
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await login(identifier.trim(), password.trim());
      // On success, AuthContext updates `user` state and LoginGate unmounts automatically
    } catch (err) {
      setErrorMsg(err.message || "Login failed. Please verify your credentials or register via Telegram.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-base text-theme-primary font-sans transition-colors relative overflow-hidden">
      
      {/* Background Decorative Accent Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-theme-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Bar with Branding & Customization Controls */}
      <header className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-theme-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl btn-theme-primary flex items-center justify-center shadow-md font-black text-sm">
            IE
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-theme-primary">
                IELTS <span className="text-theme-accent font-semibold">Hub</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-theme-accent">
                Dual Platform
              </span>
            </div>
            <p className="text-[11px] text-theme-muted hidden sm:block">
              Web & Telegram Connected Companion
            </p>
          </div>
        </div>

        {/* Customization Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Palette Picker */}
          <div className="relative" ref={paletteMenuRef}>
            <button
              onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-card hover:bg-theme-elevated text-theme-accent border border-theme-subtle text-xs transition"
              title="Change Theme Palette"
            >
              <Palette className="w-3.5 h-3.5" />
              <span 
                className="w-2.5 h-2.5 rounded-full border border-white/20" 
                style={{ backgroundColor: palettes.find(p => p.id === currentPalette)?.color || '#f59e0b' }} 
              />
              <span className="text-[11px] font-semibold hidden md:inline text-theme-primary">
                {palettes.find(p => p.id === currentPalette)?.name}
              </span>
            </button>

            {paletteMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl bg-theme-card border border-theme-subtle shadow-2xl space-y-1 z-50 animate-fadeIn text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  Palette Themes
                </div>
                {palettes.map(p => {
                  const active = currentPalette === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentPalette && setCurrentPalette(p.id);
                        setPaletteMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        active ? 'bg-theme-accent-subtle text-theme-accent font-bold' : 'text-theme-secondary hover:bg-theme-elevated hover:text-theme-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-theme-card hover:bg-theme-elevated text-theme-secondary hover:text-theme-primary border border-theme-subtle transition"
            title="Toggle Light / Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-theme-accent" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Gate Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-theme-card border border-theme-subtle rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-colors">
          
          {/* Header & Lock Indicator */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-theme-accent-subtle border border-theme-accent-subtle text-theme-accent mx-auto flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-theme-primary tracking-tight">
              Sign In to IELTS Hub
            </h1>
            <p className="text-xs text-theme-secondary max-w-xs mx-auto leading-relaxed">
              Enter your registered Nickname or Phone Number and Password to access your workspace.
            </p>
          </div>

          {/* Telegram Registration Banner (No Web Sign-Up Policy) */}
          <div className="p-3.5 rounded-2xl bg-theme-elevated/70 border border-theme-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-theme-secondary flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#2AABEE]" />
                <span>Need an Account?</span>
              </span>
              <span className="text-[10px] font-mono text-theme-muted">Telegram Exclusive</span>
            </div>
            <p className="text-[11px] text-theme-muted leading-relaxed">
              Registration, role assignment, and password creation are managed exclusively in Telegram via <strong className="text-theme-primary">@IELTSgenius_bot</strong>.
            </p>
            <a
              href="https://t.me/IELTSgenius_bot?start=register"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-[#2AABEE]/15 hover:bg-[#2AABEE]/25 border border-[#2AABEE]/30 text-[#2AABEE] text-xs font-bold transition flex items-center justify-center gap-2 group"
            >
              <Send className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Register via @IELTSgenius_bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Nickname or Phone Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-theme-accent" />
                <span>Nickname or Phone Number</span>
              </label>

              <div className="relative">
                <User className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  placeholder="@nickname or +998901234567"
                  autoFocus
                  className="w-full text-xs sm:text-sm rounded-xl pl-10 pr-3 py-3 border font-mono transition outline-none bg-theme-base text-theme-primary border-theme-subtle focus:border-theme-accent"
                />
              </div>
              <p className="text-[11px] text-theme-muted">
                Enter your Telegram username (e.g. <code className="text-theme-accent">@azamat</code>), custom nickname, or phone.
              </p>
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Password</span>
                </label>
                <a
                  href="https://t.me/IELTSgenius_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-theme-accent hover:underline flex items-center gap-1"
                >
                  <span>Forgot password?</span>
                </a>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter your password"
                  className="w-full text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 border font-mono transition outline-none bg-theme-base text-theme-primary border-theme-subtle focus:border-theme-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-theme-muted">
                Set during registration in Telegram (or reset with <code className="text-theme-accent">/password</code>).
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-start gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-theme-primary text-xs font-bold transition shadow-md flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Log In to IELTS Hub</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Telegram Companion Note */}
          <div className="p-3 rounded-xl bg-theme-base/60 border border-theme-subtle text-[11px] text-theme-muted flex items-start gap-2 leading-relaxed">
            <Send className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-0.5" />
            <div>
              <span>Manage your profile anytime via </span>
              <a 
                href="https://t.me/IELTSgenius_bot" 
                target="_blank" 
                rel="noreferrer" 
                className="text-theme-accent font-bold hover:underline"
              >
                @IELTSgenius_bot
              </a>
              <span>: send </span>
              <code className="text-theme-accent font-bold">/myinfo</code>
              <span> to view credentials, </span>
              <code className="text-theme-accent font-bold">/password</code>
              <span> to change password, or </span>
              <code className="text-theme-accent font-bold">/nickname</code>
              <span> to update nickname.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[1400px] mx-auto px-4 py-4 text-center text-xs text-theme-muted border-t border-theme-subtle flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>IELTS Preparation Platform & Examiner • Dual-Platform Architecture</span>
        <span className="font-mono text-[11px] text-theme-secondary">Telegram-Exclusive Registration & Secure Web Access</span>
      </footer>
    </div>
  );
}
