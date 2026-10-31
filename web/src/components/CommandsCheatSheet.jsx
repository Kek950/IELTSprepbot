import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { BOT_COMMANDS } from '../data/mockData';

export default function CommandsCheatSheet() {
  const [copiedCmd, setCopiedCmd] = useState(null);

  const handleCopy = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  return (
    <section id="commands" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Terminal className="w-3.5 h-3.5" />
            <span>Quick Reference</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Telegram Bot Command Directory
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Essential commands for student practice, API setup, class navigation, and instructor administration. Click any command to copy it to your clipboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {BOT_COMMANDS.map((c, i) => (
            <div
              key={i}
              className="glass-panel p-5 rounded-2xl border border-white/5 flex items-start justify-between gap-4 hover:border-indigo-500/30 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {c.cmd}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                    {c.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <button
                onClick={() => handleCopy(c.cmd.split(" ")[0])}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                title="Copy command"
              >
                {copiedCmd === c.cmd.split(" ")[0] ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
