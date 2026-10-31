import React, { useState } from 'react';
import { BookOpen, Search, Copy, Check, ArrowRight } from 'lucide-react';
import { TASK_PROMPTS } from '../data/mockData';

export default function PromptBank() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const allPrompts = [
    ...TASK_PROMPTS.task1.map(p => ({ ...p, category: 'task1' })),
    ...TASK_PROMPTS.task2.map(p => ({ ...p, category: 'task2' }))
  ];

  const filtered = allPrompts.filter(p => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCopy = (id, prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <section id="prompts" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cambridge Prompt Bank</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Curated Cambridge Exam Topics
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Authentic Task 1 processes, charts, and tables alongside high-frequency Task 2 essay questions with recommended paragraph structures.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Prompts
            </button>
            <button
              onClick={() => setFilter('task1')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                filter === 'task1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Task 1 (Reports)
            </button>
            <button
              onClick={() => setFilter('task2')}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                filter === 'task2'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Task 2 (Essays)
            </button>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics, keywords..."
              className="w-full bg-slate-900 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-800 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Grid of Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {filtered.map(p => (
            <div key={p.id} className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/30 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      p.category === 'task1'
                        ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/40'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {p.category === 'task1' ? 'Task 1' : 'Task 2'} • {p.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {p.minWords}+ words • {p.timeMinutes}m
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 italic">
                  "{p.prompt}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <a
                  href="#studio"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition"
                >
                  <span>Practice in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleCopy(p.id, p.prompt)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
