import React from 'react';
import { Send, Sun, Moon, Settings, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({ theme, toggleTheme, botHandle, onOpenConfig }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0f1d]/80 border-b border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                IELTS <span className="text-indigo-400">Prep Bot</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                v2.5 Gemini
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">AI Examiner & Classroom Manager</p>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <a href="#simulator" className="hover:text-indigo-400 transition-colors">Bot Simulator</a>
          <a href="#studio" className="hover:text-indigo-400 transition-colors">Writing Studio</a>
          <a href="#ecosystem" className="hover:text-indigo-400 transition-colors">Student & Teacher</a>
          <a href="#calculator" className="hover:text-indigo-400 transition-colors">Band Calculator</a>
          <a href="#prompts" className="hover:text-indigo-400 transition-colors">Prompt Bank</a>
          <a href="#byok" className="hover:text-indigo-400 transition-colors">BYOK Guide</a>
          <a href="#commands" className="hover:text-indigo-400 transition-colors">Commands</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Configure Bot Handle Modal Button */}
          <button
            onClick={onOpenConfig}
            title="Configure Telegram Bot username"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95 flex items-center gap-1.5 text-xs font-mono"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden lg:inline text-slate-300">@{botHandle}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-theme-accent" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Launch Bot CTA */}
          <a
            href={`https://t.me/${botHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Bot</span>
          </a>
        </div>
      </div>
    </header>
  );
}
