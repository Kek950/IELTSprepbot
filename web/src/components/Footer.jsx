import React from 'react';
import { Send, Heart } from 'lucide-react';

export default function Footer({ botHandle }) {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#080c18] text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
            </div>
            <span className="font-extrabold text-white text-base">IELTS Prep Bot</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
            <a href="#simulator" className="hover:text-indigo-400 transition">Simulator</a>
            <a href="#studio" className="hover:text-indigo-400 transition">Writing Studio</a>
            <a href="#calculator" className="hover:text-indigo-400 transition">Band Calculator</a>
            <a href="#prompts" className="hover:text-indigo-400 transition">Prompt Bank</a>
            <a href="#byok" className="hover:text-indigo-400 transition">BYOK Setup</a>
            <a href={`https://t.me/${botHandle}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
              Telegram (@{botHandle})
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500">
          <p>
            IELTS is a registered trademark of University of Cambridge ESOL, British Council, and IDP Education Australia. This application is an independent educational tool.
          </p>
          <p className="shrink-0 flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> for IELTS test takers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
