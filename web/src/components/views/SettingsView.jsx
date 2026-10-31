import React, { useState } from 'react';
import { 
  Settings, Key, Cpu, Phone, ExternalLink, CheckCircle2, 
  Palette, Type, Sliders, Target, Eye, EyeOff, Layout, Sparkles, Check, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GEMINI_MODELS } from '../../data/mockData';

export default function SettingsView({ 
  currentPalette = 'amber', 
  setCurrentPalette,
  density = 'comfortable',
  setDensity,
  editorFont = 'sans',
  setEditorFont,
  targetBand = '7.5',
  setTargetBand,
  onOpenAuth
}) {
  const { user, updateConfig } = useAuth();
  const [apiKey, setApiKey] = useState(user?.api_key || '');
  const [model, setModel] = useState(user?.model || 'gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateConfig(apiKey.trim(), model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const palettes = [
    {
      id: 'amber',
      name: 'Obsidian & Amber Gold',
      desc: 'Executive charcoal workspace with warm amber gold highlights.',
      color: '#f59e0b',
      bgPreview: '#0c0d10'
    },
    {
      id: 'emerald',
      name: 'Pine & Forest Emerald',
      desc: 'Deep botanical jade aesthetic with emerald highlights.',
      color: '#10b981',
      bgPreview: '#080f0c'
    },
    {
      id: 'rose',
      name: 'Titanium & Rose Quartz',
      desc: 'Muted berry and rose tones on deep graphite.',
      color: '#f43f5e',
      bgPreview: '#0f0d0e'
    },
    {
      id: 'violet',
      name: 'Midnight & Ultraviolet',
      desc: 'Deep cosmos violet with neon amethyst highlights.',
      color: '#a855f7',
      bgPreview: '#0b0914'
    },
    {
      id: 'cyan',
      name: 'Nordic & Arctic Cyan',
      desc: 'Scandinavian deep marine slate with glacier cyan accents.',
      color: '#06b6d4',
      bgPreview: '#080e14'
    },
    {
      id: 'monochrome',
      name: 'Carbon OLED & Platinum',
      desc: 'Pure distraction-free pitch black and minimalist platinum.',
      color: '#e4e4e7',
      bgPreview: '#060607'
    }
  ];

  const fonts = [
    {
      id: 'sans',
      name: 'Modern Sans',
      sample: 'Clear, crisp contemporary interface typography.',
      fontClass: 'font-sans'
    },
    {
      id: 'serif',
      name: 'Academic Serif',
      sample: 'Traditional Cambridge exam & formal academic feel.',
      fontClass: 'font-serif'
    },
    {
      id: 'mono',
      name: 'Focus Monospace',
      sample: 'Typewriter focus mode for pure drafting discipline.',
      fontClass: 'font-mono'
    }
  ];

  const bandGoals = ['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Account, Appearance & AI Customization</span>
            <span className="text-xs font-mono font-normal text-theme-accent">
              [{user?.phone_number}]
            </span>
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Personalize your workspace aesthetic, editor typography, target band goals, and Google Gemini credentials.
          </p>
        </div>
      </div>

      {/* 1. Theme Palette Switcher (6 Options) */}
      <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
            <Palette className="w-4 h-4 text-theme-accent" />
            <span>Atmospheric Dark Theme & Palette</span>
          </h3>
          <span className="text-[11px] font-mono text-theme-accent font-semibold uppercase">
            {palettes.find(p => p.id === currentPalette)?.name}
          </span>
        </div>
        <p className="text-xs text-theme-muted">
          Select an executive dark aesthetic tailored for prolonged reading, writing, and cohort evaluation. Outlines, glows, badges, and accents adapt dynamically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {palettes.map(p => {
            const active = currentPalette === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPalette && setCurrentPalette(p.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2.5 ${
                  active
                    ? 'bg-theme-elevated border-theme-accent shadow-md ring-1 ring-theme-accent'
                    : 'bg-theme-base/60 border-theme-subtle hover:border-theme-strong'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-bold text-xs text-theme-primary">{p.name}</span>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-theme-accent shrink-0" />}
                  </div>
                  <p className="text-[11px] text-theme-muted leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: p.bgPreview }}>
                  <div className="h-full w-2/5" style={{ backgroundColor: p.color }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. UI Density & Typography Customization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UI Density */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
            <Layout className="w-4 h-4 text-theme-accent" />
            <span>Interface Density</span>
          </h3>
          <p className="text-xs text-theme-muted">
            Toggle between spacious breathing room and high information density.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDensity && setDensity('comfortable')}
              className={`p-3.5 rounded-xl border text-left transition ${
                density === 'comfortable'
                  ? 'bg-theme-elevated border-theme-accent ring-1 ring-theme-accent'
                  : 'bg-theme-base/60 border-theme-subtle hover:border-theme-strong'
              }`}
            >
              <div className="font-bold text-xs text-theme-primary mb-1">Comfortable</div>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Generous padding and larger interactive targets.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDensity && setDensity('compact')}
              className={`p-3.5 rounded-xl border text-left transition ${
                density === 'compact'
                  ? 'bg-theme-elevated border-theme-accent ring-1 ring-theme-accent'
                  : 'bg-theme-base/60 border-theme-subtle hover:border-theme-strong'
              }`}
            >
              <div className="font-bold text-xs text-theme-primary mb-1">Compact</div>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Condensed spacing for power users and smaller screens.
              </p>
            </button>
          </div>
        </div>

        {/* Editor Font Selector */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
            <Type className="w-4 h-4 text-theme-accent" />
            <span>Writing Studio Typography</span>
          </h3>
          <p className="text-xs text-theme-muted">
            Change the drafting font used in the essay response textarea.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {fonts.map(f => {
              const active = editorFont === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEditorFont && setEditorFont(f.id)}
                  className={`p-3 rounded-xl border text-center transition ${
                    active
                      ? 'bg-theme-elevated border-theme-accent ring-1 ring-theme-accent'
                      : 'bg-theme-base/60 border-theme-subtle hover:border-theme-strong'
                  }`}
                >
                  <span className={`text-base font-bold block mb-1 text-theme-primary ${f.fontClass}`}>
                    Ag
                  </span>
                  <span className="font-semibold text-xs text-theme-primary block">{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Target IELTS Band Goal */}
      <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-theme-accent" />
            <span>Target IELTS Overall Band Goal</span>
          </h3>
          <span className="text-sm font-bold font-mono badge-theme-accent px-2.5 py-0.5 rounded-lg">
            Target: Band {targetBand}
          </span>
        </div>
        <p className="text-xs text-theme-muted">
          Your selected benchmark score calibrates AI examiner diagnostic suggestions and progress milestones.
        </p>

        <div className="grid grid-cols-7 gap-2">
          {bandGoals.map(b => {
            const active = targetBand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setTargetBand && setTargetBand(b)}
                className={`py-2 rounded-xl text-xs font-bold font-mono transition border ${
                  active
                    ? 'btn-theme-primary border-theme-accent shadow-sm'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:border-theme-strong'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Credentials & AI Preferences Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Linked Phone Section - Strictly Locked & Immutable */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-theme-accent" />
              <span>Identity & Session Lock (Immutable)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Phone Verified & Locked</span>
            </span>
          </div>

          <div className="p-4 bg-theme-elevated/70 rounded-xl border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-theme-muted block font-medium flex items-center gap-1.5">
                <span>Active Account Phone Number:</span>
                <span className="text-[10px] text-theme-accent font-mono">(Read-Only Graph)</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user?.phone_number || ''}
                  disabled
                  readOnly
                  className="font-mono text-sm font-bold text-theme-accent-light bg-theme-base/80 px-3 py-1.5 rounded-lg border border-theme-accent-subtle cursor-not-allowed select-all"
                />
                <span className="text-[11px] text-theme-muted">🔒 Locked</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth()}
              className="px-3.5 py-2 rounded-xl bg-theme-base hover:bg-theme-elevated text-theme-primary border border-theme-subtle text-xs font-semibold transition"
            >
              Switch / Re-verify Account
            </button>
          </div>

          <p className="text-[11px] text-theme-muted leading-relaxed">
            This graph is locked to your verified Telegram/SMS session. To prevent account data collision, the phone number cannot be modified in place. To change accounts, use the switch button above.
          </p>
        </div>

        {/* Gemini API Key Configuration */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <Key className="w-4 h-4 text-theme-accent" />
              <span>Google Gemini API Key</span>
            </h3>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-theme-accent hover:text-theme-accent-light font-semibold flex items-center gap-1"
            >
              <span>Get Free Key at Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-theme-base text-theme-primary text-xs sm:text-sm rounded-xl pl-4 pr-10 py-3 border border-theme-subtle outline-none focus:border-theme-accent font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-theme-muted">
              Your API key is stored securely and isolated to your account. Used strictly to execute IELTS essay evaluations.
            </p>
          </div>
        </div>

        {/* AI Model Selector */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
                <Cpu className="w-4 h-4 text-theme-accent" />
                <span>Select Active AI Model ({GEMINI_MODELS.length} Available)</span>
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Choose the Google Gemini neural model that evaluates your essays and generates Cambridge rubric feedback. Frontier models up to Gemini 3.5 & 4.0 Argon supported.
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-theme-accent font-bold">
                Active: {model}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GEMINI_MODELS.map(m => {
              const active = model === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    active
                      ? 'bg-theme-elevated border-theme-accent shadow-md ring-1 ring-theme-accent'
                      : 'bg-theme-base/60 border-theme-subtle hover:border-theme-strong'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div>
                        <span className="font-bold text-xs text-theme-primary block">{m.name}</span>
                        <span className="text-[10px] font-mono text-theme-accent font-medium">{m.tag}</span>
                      </div>
                      {active && (
                        <span className="text-[9px] font-bold btn-theme-primary px-1.5 py-0.2 rounded font-mono shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-theme-muted leading-relaxed">{m.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-theme-muted font-mono border-t border-theme-subtle pt-2">
                    <span>Speed: {m.speed}</span>
                    <span>Context: {m.contextWindow || '1M'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Model ID Input */}
          <div className="pt-3 border-t border-theme-subtle space-y-2">
            <label className="text-xs font-semibold text-theme-secondary flex items-center gap-1.5">
              <span>Or enter a Custom / Experimental Model ID:</span>
              <span className="text-[10px] font-mono text-theme-muted">(e.g. gemini-3.5-pro, gemini-4.0-argon-preview, or fine-tuned model)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value.trim())}
                placeholder="Enter model identifier..."
                className="flex-1 bg-theme-base text-theme-primary text-xs sm:text-sm rounded-xl px-4 py-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono"
              />
              <button
                type="button"
                onClick={() => setSaved(false)}
                className="px-4 py-2 rounded-xl bg-theme-elevated hover:bg-theme-surface border border-theme-subtle text-xs text-theme-primary font-medium transition"
              >
                Set Custom
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl btn-theme-primary text-xs shadow-md transition"
        >
          {saved ? "✓ Configuration Saved Successfully!" : "Save All Configuration"}
        </button>
      </form>
    </div>
  );
}