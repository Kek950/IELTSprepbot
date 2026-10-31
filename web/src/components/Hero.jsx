import React from 'react';
import { Send, Sparkles, CheckCircle2, Zap, Shield, ArrowRight, Bot } from 'lucide-react';

export default function Hero({ botHandle }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background Glow Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Release / AI Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Google Gemini 2.5 Flash • 100% Free AI Examiner</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Score Band <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">8.0+</span> with Your Telegram AI Examiner
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Instant Cambridge-standard band scoring, granular line-by-line grammar diagnostics, and collaborative teacher classroom tools directly inside Telegram. Free forever with Bring-Your-Own-Key.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href={`https://t.me/${botHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Open in Telegram (@{botHandle})</span>
          </a>

          <a
            href="#studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 font-semibold text-sm border border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <span>Try Live Web Grader</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </a>

          <a
            href="#simulator"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-transparent hover:bg-slate-800/50 text-slate-300 font-medium text-sm border border-transparent hover:border-slate-700/50 transition-all"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Try Bot Simulator</span>
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mb-1 font-mono">&lt; 3.0s</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Instant AI Grading</div>
            <p className="text-xs text-slate-400 mt-1">Full 4-criteria diagnostic report returned in seconds.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1 font-mono">100%</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Cambridge Rubric</div>
            <p className="text-xs text-slate-400 mt-1">Exact Task Achievement, Coherence, Lexical & Grammar scores.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-theme-accent mb-1 font-mono">$0.00</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Zero Cost (BYOK)</div>
            <p className="text-xs text-slate-400 mt-1">Uses your own free Google Gemini API key. No subscriptions.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-violet-400 mb-1 font-mono">Dual</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">Student & Teacher</div>
            <p className="text-xs text-slate-400 mt-1">Class codes, homework deadlines & teacher manual remarks.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
