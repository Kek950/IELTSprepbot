import React, { useState } from 'react';
import { History, ChevronDown, Award, Calendar, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HistoryView() {
  const { user } = useAuth();
  const submissions = user?.submissions || [];
  const [expandedId, setExpandedId] = useState(submissions[0]?.id || null);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Submission Archive & Progress History</span>
            <span className="text-xs font-mono font-normal text-theme-accent">
              [{user?.phone_number}]
            </span>
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Review past essays, band scores, and examiner/instructor feedback across Telegram and Web.
          </p>
        </div>

        <div className="text-xs text-theme-primary font-mono font-semibold px-3 py-1.5 rounded-xl bg-theme-elevated border border-theme-subtle">
          Total Submissions: {submissions.length}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length > 0 ? (
          submissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div
                key={sub.id}
                className="rounded-2xl bg-theme-card border border-theme-subtle overflow-hidden transition-all hover:border-theme-accent-subtle"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-theme-elevated/40 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Band Badge */}
                    <div className="w-12 h-12 rounded-xl btn-theme-primary font-black text-lg flex items-center justify-center font-mono shadow-sm shrink-0">
                      {sub.band_score?.toFixed(1) || "N/A"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-theme-elevated text-theme-secondary border border-theme-subtle">
                          {sub.task_type === 'task1' ? 'Task 1 (Report)' : 'Task 2 (Essay)'}
                        </span>
                        <span className="text-xs text-theme-muted font-mono">
                          {sub.submitted_at}
                        </span>
                        {sub.class_name && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-theme-accent">
                            Class: {sub.class_name}
                          </span>
                        )}
                        {sub.manual_score && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Teacher Grade: Band {sub.manual_score}</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-theme-primary line-clamp-1">{sub.prompt}</h4>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-theme-muted shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180 text-theme-accent' : ''
                    }`}
                  />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-theme-subtle bg-theme-base/60 space-y-5 animate-fadeIn">
                    {/* Teacher Manual Feedback if present */}
                    {sub.teacher_feedback && (
                      <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Teacher Notes (Reviewed by Instructor):</span>
                        </div>
                        <p className="text-xs text-theme-primary leading-relaxed italic">
                          "{sub.teacher_feedback}"
                        </p>
                      </div>
                    )}

                    {/* Essay Text */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted block">
                        Your Submitted Text:
                      </span>
                      <div className="p-4 bg-theme-card rounded-xl border border-theme-subtle text-xs text-theme-secondary leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                        {sub.essay}
                      </div>
                    </div>

                    {/* Criteria Sub-Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-theme-card rounded-xl border border-theme-subtle text-center">
                        <span className="text-[10px] text-theme-muted font-bold block mb-0.5">Task Achievement</span>
                        <span className="text-sm font-bold font-mono text-theme-accent">{sub.task_achievement?.score || 7}/9</span>
                      </div>
                      <div className="p-3 bg-theme-card rounded-xl border border-theme-subtle text-center">
                        <span className="text-[10px] text-theme-muted font-bold block mb-0.5">Coherence & Cohesion</span>
                        <span className="text-sm font-bold font-mono text-theme-accent">{sub.coherence_cohesion?.score || 7}/9</span>
                      </div>
                      <div className="p-3 bg-theme-card rounded-xl border border-theme-subtle text-center">
                        <span className="text-[10px] text-theme-muted font-bold block mb-0.5">Lexical Resource</span>
                        <span className="text-sm font-bold font-mono text-theme-accent">{sub.lexical_resource?.score || 7}/9</span>
                      </div>
                      <div className="p-3 bg-theme-card rounded-xl border border-theme-subtle text-center">
                        <span className="text-[10px] text-theme-muted font-bold block mb-0.5">Grammar & Accuracy</span>
                        <span className="text-sm font-bold font-mono text-theme-accent">{sub.grammatical_range?.score || 7}/9</span>
                      </div>
                    </div>

                    {/* Strengths & Suggestions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-emerald-400 block">Key Strengths:</span>
                        <ul className="space-y-1 text-xs text-theme-secondary">
                          {sub.strengths?.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-theme-accent block">Areas for Improvement:</span>
                        <ul className="space-y-1 text-xs text-theme-secondary">
                          {sub.suggestions?.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-theme-accent font-bold">{i + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
            <History className="w-8 h-8 text-theme-muted mx-auto" />
            <h3 className="text-sm font-bold text-theme-primary">No Submissions Yet</h3>
            <p className="text-xs text-theme-muted max-w-sm mx-auto">
              Your essay assessments will automatically appear here once graded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}