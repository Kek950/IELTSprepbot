import React, { useState } from 'react';
import { Clock, Headphones, BookOpen, Flame, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PracticeView() {
  const { user, logPractice } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState('listening');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [justLogged, setJustLogged] = useState(false);

  const practice = user?.practice || {
    listening_total: 135,
    reading_total: 160,
    listening_week: 135,
    reading_week: 160,
    streak_days: 5
  };

  const listeningGoal = user?.class_info?.listening_goal || 180;
  const readingGoal = user?.class_info?.reading_goal || 180;

  const listeningPct = Math.min(100, Math.round((practice.listening_week / listeningGoal) * 100));
  const readingPct = Math.min(100, Math.round((practice.reading_week / readingGoal) * 100));

  const handleQuickLog = async (activity, mins) => {
    await logPractice(activity, mins);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Practice Time & Goal Tracker</span>
            <span className="text-xs font-mono font-normal text-theme-accent">
              [{user?.phone_number}]
            </span>
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            Log your daily listening and reading practice sessions to maintain streaks and hit weekly goals.
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl badge-theme-accent text-xs font-bold font-mono">
          <Flame className="w-4 h-4 text-theme-accent" />
          <span>{practice.streak_days} Day Streak</span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Listening Card */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-theme-accent-subtle text-theme-accent border border-theme-accent-subtle flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-theme-primary">Listening Practice</h3>
                <span className="text-xs text-theme-muted">Weekly Target: {listeningGoal} mins</span>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-theme-accent">
              {practice.listening_week} <span className="text-xs text-theme-muted">/ {listeningGoal}m</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-theme-elevated overflow-hidden border border-theme-subtle">
              <div
                className="h-full bg-theme-accent rounded-full transition-all duration-500"
                style={{ width: `${listeningPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-theme-muted">
              <span>{listeningPct}% of target completed</span>
              <span>Total all-time: {Math.floor(practice.listening_total / 60)}h {practice.listening_total % 60}m</span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="pt-2 border-t border-theme-subtle flex items-center gap-2">
            <span className="text-xs text-theme-secondary font-medium">Quick Log:</span>
            <button
              onClick={() => handleQuickLog('listening', 15)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-theme-accent-subtle transition"
            >
              +15m
            </button>
            <button
              onClick={() => handleQuickLog('listening', 30)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-theme-accent-subtle transition"
            >
              +30m
            </button>
            <button
              onClick={() => handleQuickLog('listening', 45)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-theme-accent-subtle transition"
            >
              +45m
            </button>
          </div>
        </div>

        {/* Reading Card */}
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-theme-primary">Reading Practice</h3>
                <span className="text-xs text-theme-muted">Weekly Target: {readingGoal} mins</span>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {practice.reading_week} <span className="text-xs text-theme-muted">/ {readingGoal}m</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-theme-elevated overflow-hidden border border-theme-subtle">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${readingPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-theme-muted">
              <span>{readingPct}% of target completed</span>
              <span>Total all-time: {Math.floor(practice.reading_total / 60)}h {practice.reading_total % 60}m</span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="pt-2 border-t border-theme-subtle flex items-center gap-2">
            <span className="text-xs text-theme-secondary font-medium">Quick Log:</span>
            <button
              onClick={() => handleQuickLog('reading', 15)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-emerald-500/30 transition"
            >
              +15m
            </button>
            <button
              onClick={() => handleQuickLog('reading', 30)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-emerald-500/30 transition"
            >
              +30m
            </button>
            <button
              onClick={() => handleQuickLog('reading', 60)}
              className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-xs font-medium text-theme-primary border border-theme-subtle hover:border-emerald-500/30 transition"
            >
              +60m
            </button>
          </div>
        </div>
      </div>

      {/* Manual Logger Card */}
      <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle max-w-xl mx-auto space-y-4 transition-colors">
        <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
          <Plus className="w-4 h-4 text-theme-accent" />
          <span>Log Custom Practice Session</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedActivity('listening')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              selectedActivity === 'listening'
                ? 'btn-theme-primary border-theme-accent shadow-sm'
                : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:text-theme-primary'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Listening</span>
          </button>

          <button
            onClick={() => setSelectedActivity('reading')}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              selectedActivity === 'reading'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:text-theme-primary'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Reading</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-theme-secondary block font-semibold">
            Duration in Minutes:
          </label>
          <input
            type="number"
            min="5"
            max="300"
            step="5"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
            className="w-full bg-theme-base text-theme-primary text-sm rounded-xl p-3 border border-theme-subtle outline-none focus:border-theme-accent font-mono"
          />
        </div>

        <button
          onClick={() => handleQuickLog(selectedActivity, customMinutes)}
          className="w-full py-3 rounded-xl btn-theme-primary text-xs transition shadow-sm"
        >
          {justLogged ? "✓ Practice Session Saved!" : "Save Practice Session"}
        </button>
      </div>
    </div>
  );
}