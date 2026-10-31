import React, { useState } from 'react';
import { Calculator, HelpCircle, Check, Award } from 'lucide-react';
import { calculateIeltsBand } from '../data/mockData';

export default function BandCalculator() {
  const [tr, setTr] = useState(7.0);
  const [cc, setCc] = useState(7.5);
  const [lr, setLr] = useState(7.0);
  const [gra, setGra] = useState(7.0);

  const rawAvg = (tr + cc + lr + gra) / 4;
  const overallBand = calculateIeltsBand(tr, cc, lr, gra);

  const getCefrData = (band) => {
    if (band >= 8.5) {
      return {
        level: "CEFR C2",
        title: "Expert User",
        desc: "Has fully operational command of the language: appropriate, accurate and fluent with complete understanding."
      };
    } else if (band >= 7.0) {
      return {
        level: "CEFR C1",
        title: "Very Good User",
        desc: "Has operational command of the language, though with occasional unsystematic inaccuracies. Handles complex detailed argumentation well."
      };
    } else if (band >= 6.0) {
      return {
        level: "CEFR B2",
        title: "Competent User",
        desc: "Has generally effective command of the language despite some inaccuracies and misunderstandings. Can use and understand fairly complex language in familiar contexts."
      };
    } else if (band >= 5.0) {
      return {
        level: "CEFR B1",
        title: "Modest User",
        desc: "Has partial command of the language, coping with overall meaning in most situations, though likely to make many mistakes."
      };
    } else {
      return {
        level: "CEFR A2",
        title: "Limited / Intermittent User",
        desc: "Basic competence limited to familiar situations; frequent breakdowns in communication."
      };
    }
  };

  const cefr = getCefrData(overallBand);

  return (
    <section id="calculator" className="py-20 bg-slate-950/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Official Cambridge IELTS Band Calculator
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Move the sliders for each assessment criterion to calculate the exact overall IELTS writing band score using Cambridge rounding rules.
          </p>
        </div>

        <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Sliders */}
            <div className="md:col-span-7 space-y-6">
              {/* Task Achievement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Task Achievement / Response</span>
                  <span className="text-indigo-400 font-mono text-sm">{tr.toFixed(1)} / 9.0</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.5"
                  value={tr}
                  onChange={(e) => setTr(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Coherence & Cohesion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Coherence & Cohesion</span>
                  <span className="text-indigo-400 font-mono text-sm">{cc.toFixed(1)} / 9.0</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.5"
                  value={cc}
                  onChange={(e) => setCc(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Lexical Resource */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Lexical Resource</span>
                  <span className="text-indigo-400 font-mono text-sm">{lr.toFixed(1)} / 9.0</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.5"
                  value={lr}
                  onChange={(e) => setLr(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Grammatical Range & Accuracy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Grammatical Range & Accuracy</span>
                  <span className="text-indigo-400 font-mono text-sm">{gra.toFixed(1)} / 9.0</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="9.0"
                  step="0.5"
                  value={gra}
                  onChange={(e) => setGra(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Rounding Rule Note */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Official Cambridge Rule:</strong> Raw average <code>.25</code> rounds up to <code>.5</code>. Raw average <code>.75</code> rounds up to the next whole band (e.g. <code>6.75 &rarr; 7.0</code>).
              </div>
            </div>

            {/* Result Display Box */}
            <div className="md:col-span-5 bg-gradient-to-b from-indigo-950/40 to-slate-900/90 p-8 rounded-2xl border border-indigo-500/20 text-center space-y-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Calculated Overall Band
              </span>

              <div className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-white font-mono">
                {overallBand.toFixed(1)}
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>{cefr.level} • {cefr.title}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/5">
                {cefr.desc}
              </p>

              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                Raw Arithmetic Mean: {rawAvg.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
