import React from 'react';
import { Key, ExternalLink, Zap, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { GEMINI_MODELS } from '../data/mockData';

export default function ByokGuide() {
  return (
    <section id="byok" className="py-20 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-theme-accent text-xs font-semibold mb-3">
            <Key className="w-3.5 h-3.5" />
            <span>Zero-Cost Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            How Bring-Your-Own-Key (BYOK) Works
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Unlike commercial IELTS apps charging $20–$50 per month, IELTS Prep Bot connects directly to Google AI Studio's free tier. 100% free, private, and unlimited for personal prep.
          </p>
        </div>

        {/* 3-Step Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 font-extrabold text-xl flex items-center justify-center font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Visit Google AI Studio</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Navigate to Google AI Studio's official API management console using your standard personal Google account (18+).
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              <span>Open aistudio.google.com/apikey</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 font-extrabold text-xl flex items-center justify-center font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Click "Create API Key"</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Click the blue <strong>Create API Key</strong> button, assign it to a new project, and copy the generated key starting with <code>AIza...</code>.
            </p>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400">
              AIzaSyD-sample_gemini_key_xxx
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-theme-accent-subtle text-theme-accent font-extrabold text-xl flex items-center justify-center font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Send /setup to Bot</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Open Telegram and send <code>/setup</code> to the bot. Paste your key. The bot securely encrypts it for your account and unlocks unlimited essay grading.
            </p>
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300">
              /setup ➔ Select Model ➔ Ready 🎯
            </div>
          </div>
        </div>

        {/* Supported Models Matrix */}
        <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Supported Google Gemini Models</h3>
              <p className="text-xs text-slate-400">You can seamlessly switch models in Telegram using the settings menu.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GEMINI_MODELS.map(m => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.isDefault
                    ? 'bg-indigo-950/30 border-indigo-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-bold text-sm text-white">{m.name}</span>
                  {m.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">{m.description}</p>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Speed: {m.speed}</span>
                  <span>Quality: {m.quality}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
