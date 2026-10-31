import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, Clock, BookOpen, History, Cpu, GraduationCap, Users, Settings, Target,
  Sun, Moon, LogIn, ChevronDown, Palette, Maximize2, Minimize2, Check, Lock, LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GEMINI_MODELS } from '../data/mockData';

export default function Header({ 
  currentView, 
  setCurrentView, 
  theme, 
  toggleTheme, 
  currentPalette, 
  setCurrentPalette,
  cyclePalette, 
  density = 'comfortable',
  toggleDensity,
  onOpenAuth 
}) {
  const { user, updateConfig, logout } = useAuth();
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const paletteMenuRef = useRef(null);
  const modelMenuRef = useRef(null);

  const teachingCount = user?.teaching_classes?.length || 0;
  const enrolledCount = user?.enrolled_classes?.length || 0;
  const pendingReviews = user?.student_queue?.filter(q => q.status === 'pending_review').length || 0;
  const pendingHw = user?.homework?.filter(h => h.status !== 'completed').length || 0;

  // Compact & short navigation items to prevent squishing
  const navItems = [
    { id: 'writing', short: 'Studio', fullName: 'Writing Studio & Rubric Evaluator', icon: PenTool },
    { id: 'practice', short: 'Practice', fullName: 'Daily Practice & Goal Tracker', icon: Clock },
    { id: 'mocks', short: 'Mocks', fullName: 'Mock Tests & Trajectory Analytics', icon: Target },
    { id: 'homework', short: 'H/W', fullName: 'Homework & Assignments', icon: BookOpen, badge: pendingHw > 0 ? `${pendingHw}` : null },
    { id: 'history', short: 'Archive', fullName: 'Submission Archive & Score History', icon: History },
    { id: 'tokens', short: 'Tokens', fullName: 'API Token Telemetry & Usage', icon: Cpu },
    { id: 'classroom', short: 'Classes', fullName: 'Dual-Role Classrooms (Teaching & Enrolled)', icon: GraduationCap, badge: `${teachingCount}T · ${enrolledCount}S` },
    { id: 'teacher', short: 'Review', fullName: 'Teacher Review Hub & Cohort Grading', icon: Users, badge: pendingReviews > 0 ? `${pendingReviews}` : null },
    { id: 'settings', short: 'Settings', fullName: 'Account, AI & Customization Preferences', icon: Settings }
  ];

  const palettes = [
    { id: 'amber', name: 'Amber Gold', color: '#f59e0b' },
    { id: 'emerald', name: 'Pine Emerald', color: '#10b981' },
    { id: 'rose', name: 'Rose Quartz', color: '#f43f5e' },
    { id: 'violet', name: 'Nebula Violet', color: '#a855f7' },
    { id: 'cyan', name: 'Arctic Cyan', color: '#06b6d4' },
    { id: 'monochrome', name: 'Carbon OLED', color: '#e4e4e7' }
  ];

  // Close palette & model menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (paletteMenuRef.current && !paletteMenuRef.current.contains(event.target)) {
        setPaletteMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) {
        setModelMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-theme-surface/95 backdrop-blur-md border-b border-theme-subtle transition-colors">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-2">
          
          {/* Brand - Compact & Sleek */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl btn-theme-primary flex items-center justify-center shadow-sm font-black text-xs">
              IE
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-theme-primary">
                IELTS <span className="text-theme-accent font-semibold">Hub</span>
              </span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-theme-elevated text-theme-accent-light border border-theme-accent-subtle hidden sm:inline-block">
                Dual
              </span>
            </div>
          </div>

          {/* Navigation Bar - Unloaded, Compact Shortened Labels (Never squished) */}
          <nav className="hidden md:flex items-center gap-1 bg-theme-base/90 p-1 rounded-xl border border-theme-subtle max-w-fit">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={item.fullName}
                  className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    active
                      ? 'bg-theme-accent-subtle text-theme-accent-light border border-theme-accent-subtle font-bold shadow-sm'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-elevated/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.short}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1 py-0.1 rounded-full border leading-tight ${
                      active 
                        ? 'bg-theme-accent-subtle text-theme-accent-light border-theme-accent-subtle font-bold' 
                        : 'bg-theme-elevated text-theme-muted border-theme-subtle'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Palette Picker Dropdown */}
            <div className="relative" ref={paletteMenuRef}>
              <button
                onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
                className="flex items-center gap-1 p-2 rounded-xl bg-theme-base hover:bg-theme-elevated text-theme-accent border border-theme-subtle transition"
                title={`Active Theme: ${currentPalette}. Click to choose palette.`}
              >
                <Palette className="w-4 h-4" />
                <span 
                  className="w-2 h-2 rounded-full border border-white/20 hidden sm:block" 
                  style={{ backgroundColor: palettes.find(p => p.id === currentPalette)?.color || '#f59e0b' }} 
                />
              </button>

              {paletteMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl bg-theme-card border border-theme-subtle shadow-xl space-y-1 z-50 animate-fadeIn text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                    Atmospheric Themes
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

            {/* AI Model Selector Pill & Dropdown (Higher Gemini Versions) */}
            <div className="relative" ref={modelMenuRef}>
              <button
                onClick={() => setModelMenuOpen(!modelMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-theme-base hover:bg-theme-elevated text-theme-primary border border-theme-subtle transition text-xs font-medium"
                title={`Active Gemini Model: ${user?.model || 'gemini-2.5-flash'}. Click to switch higher versions (Gemini 4.0 Argon, 4.0 Pro, 3.5 Pro/Flash).`}
              >
                <Cpu className="w-3.5 h-3.5 text-theme-accent" />
                <span className="hidden xl:inline-block font-mono text-[11px] max-w-[125px] truncate">
                  {GEMINI_MODELS.find(m => m.id === (user?.model || 'gemini-2.5-flash'))?.tag || user?.model || 'Gemini'}
                </span>
                <ChevronDown className="w-3 h-3 text-theme-muted" />
              </button>

              {modelMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-theme-card border border-theme-subtle shadow-2xl space-y-1 z-50 animate-fadeIn text-xs max-h-[75vh] overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center justify-between border-b border-theme-subtle pb-1.5 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-theme-accent" />
                      <span>Choose Gemini Model</span>
                    </span>
                    <span className="text-theme-accent font-mono text-[9px] font-bold">
                      {GEMINI_MODELS.length} Active
                    </span>
                  </div>
                  {GEMINI_MODELS.map(m => {
                    const active = (user?.model || 'gemini-2.5-flash') === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={async () => {
                          if (updateConfig) {
                            await updateConfig(user?.api_key || '', m.id);
                          }
                          setModelMenuOpen(false);
                        }}
                        className={`w-full flex items-start justify-between p-2 rounded-xl text-left transition ${
                          active 
                            ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle shadow-sm' 
                            : 'text-theme-secondary hover:bg-theme-elevated hover:text-theme-primary'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold truncate">{m.name}</span>
                            {m.tier === 'frontier' && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                                Frontier
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-theme-muted font-mono flex items-center gap-2">
                            <span>⚡ {m.speed}</span>
                            <span>⭐ {m.quality}</span>
                          </div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-theme-accent shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* UI Density Toggle */}
            {toggleDensity && (
              <button
                onClick={toggleDensity}
                className="p-2 rounded-xl bg-theme-base hover:bg-theme-elevated text-theme-secondary hover:text-theme-primary border border-theme-subtle transition hidden sm:flex"
                title={density === 'compact' ? "Switch to Comfortable UI" : "Switch to Compact UI"}
              >
                {density === 'compact' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-theme-base hover:bg-theme-elevated text-theme-secondary hover:text-theme-primary border border-theme-subtle transition"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-theme-accent" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Pill & Sign Out */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-theme-base hover:bg-theme-elevated border border-theme-subtle text-left transition group"
                  title="Account Settings & Roles"
                >
                  <div className="w-6 h-6 rounded-lg bg-theme-accent-subtle border border-theme-accent-subtle text-theme-accent flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-theme-primary font-mono leading-none flex items-center gap-1">
                        <span>{user.phone_number}</span>
                        <Lock className="w-2.5 h-2.5 text-theme-accent" title="Phone Locked to Session" />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Telegram Linked" />
                    </div>
                    <div className="text-[10px] text-theme-accent-light leading-none mt-0.5 font-medium">
                      T:{teachingCount} · S:{enrolledCount}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-theme-muted group-hover:text-theme-primary transition-transform" />
                </button>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-theme-base hover:bg-rose-500/10 hover:text-rose-400 text-theme-muted border border-theme-subtle transition"
                  title="Sign Out of Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-theme-primary text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar - Compact & Horizontally Scrollable */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-1.5 border-t border-theme-subtle scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                  active ? 'bg-theme-accent-subtle text-theme-accent border border-theme-accent-subtle font-bold' : 'text-theme-secondary'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.short}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1 rounded-full bg-theme-elevated text-theme-muted border border-theme-subtle">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}