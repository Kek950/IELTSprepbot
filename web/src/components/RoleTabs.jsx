import React, { useState } from 'react';
import { GraduationCap, Users, Clock, Award, ShieldCheck, BookOpen, CheckCircle, BarChart3, Radio, FileCheck } from 'lucide-react';

export default function RoleTabs() {
  const [activeTab, setActiveTab] = useState('student');

  return (
    <section id="ecosystem" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Dual Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Engineered for Both Students & Instructors
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Whether preparing independently or managing multiple language school cohorts, IELTS Prep Bot delivers tailored interfaces for both roles.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'student'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>👨‍🎓 Student Experience</span>
            </button>

            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👨‍🏫 Teacher Toolkit</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'student' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto animate-fadeIn">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">24/7 AI Essay Examiner</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Submit Task 1 reports and Task 2 essays anytime directly on Telegram. Receive comprehensive diagnostic feedback, Cambridge band scores, and actionable sentence revisions in seconds.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Task 1 (Academic Reports)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Task 2 (Opinion & Discussion)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Detailed 4-criteria breakdowns</li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Time Tracking & Streaks</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Log listening and reading practice sessions daily. Track your active study streaks, monitor completion against weekly classroom goals, and build consistent habits.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Daily listening & reading logs</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Weekly goals vs actuals progress</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Motivation & consistency streaks</li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-theme-accent-subtle text-theme-accent flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Private BYOK API Key</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Bring your own free Gemini API key. Your credentials and submissions are completely isolated. You have zero subscription payments and full control over your data.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100% Free Google AI Studio tier</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Detailed token usage dashboard</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Isolated user storage</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto animate-fadeIn">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">6-Letter Class Codes</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Create virtual cohorts with unique invite codes (e.g. <code>/join IELTS9</code>). Students join seamlessly from their own Telegram accounts without manual invites.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Unlimited cohorts and students</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Simple one-click join link</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Automatic student roster synchronization</li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Homework & Deadlines</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Assign daily writing prompts or targeted homework to entire classes or individual students with strict deadlines and reminder notifications.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Class-wide or individual assignments</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Deadline countdowns & status tags</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Real-time submission notifications</li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Human Review & Broadcasts</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Review AI-graded student essays with teacher dual-view: inspect AI scores, override band numbers, and append personal teacher audio/text critique. Broadcast lessons to all enrolled students with one command.
              </p>
              <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-400" /> AI score adjustment & teacher notes</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-400" /> Mass broadcast announcements & PDFs</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-violet-400" /> Individual student progress dossiers</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
