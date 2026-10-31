import React, { useState } from 'react';
import { X, Send, Check } from 'lucide-react';

export default function BotConfigModal({ isOpen, onClose, currentHandle, onSave }) {
  const [handle, setHandle] = useState(currentHandle);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = handle.trim().replace(/^@/, '');
    onSave(clean || "IELTSPrepAssistantBot");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5 bg-[#0f172a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Configure Telegram Bot Handle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Enter the Telegram username of your bot (created via @BotFather). All buttons and links across this website will instantly connect to your specific bot!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bot Handle:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="YourBotUsername"
                className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl pl-8 pr-3 py-2.5 border border-slate-700 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Update Links</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
