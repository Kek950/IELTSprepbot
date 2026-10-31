import React, { useState } from 'react';
import { Users, Plus, CheckCircle, FileText, Send, Radio, UserCheck, Award, Calendar, ShieldAlert, Lock, BarChart2, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ClassStatsModal from '../common/ClassStatsModal';

export default function TeacherView() {
  const { user, reviewStudentEssay, assignHomework, broadcastLesson } = useAuth();
  const teachingClasses = user?.teaching_classes || [];
  
  // STRICT TEACHER ISOLATION:
  // Teachers ONLY get access to cohorts they created and students in their groups
  const myClassIds = new Set(teachingClasses.map(c => c.id));
  const myClassNames = new Set(teachingClasses.map(c => c.name));

  const queue = (user?.student_queue || []).filter(item => 
    (item.class_id && myClassIds.has(item.class_id)) || 
    (item.class_name && myClassNames.has(item.class_name))
  );

  const [activeTab, setActiveTab] = useState('queue'); // queue | homework | broadcast | practice_month
  const [statsModalClass, setStatsModalClass] = useState(null);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwTargetClass, setHwTargetClass] = useState(teachingClasses[0]?.name || '');
  const [hwDeadline, setHwDeadline] = useState('Tomorrow, 23:59');
  const [hwSuccess, setHwSuccess] = useState(false);

  const [broadcastClass, setBroadcastClass] = useState(teachingClasses[0]?.name || '');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const handleReviewSave = async (item, score, notes) => {
    // Verify security boundary: item must belong to one of the teacher's classes
    if (!myClassIds.has(item.class_id) && !myClassNames.has(item.class_name)) {
      alert("⛔ Access Denied: You cannot grade submissions for classes you do not instruct.");
      return;
    }
    await reviewStudentEssay(item.id, score, notes);
    alert(`✅ Evaluation saved for ${item.student_name}! Grade updated in cohort.`);
  };

  const handleCreateHw = async (e) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    const targetObj = teachingClasses.find(c => c.name === hwTargetClass) || teachingClasses[0];
    if (!targetObj) {
      alert("⛔ Access Denied: You do not own any classes to assign homework to.");
      return;
    }
    try {
      await assignHomework(targetObj.id, targetObj.name, hwTitle.trim(), hwDesc.trim(), hwDeadline);
      setHwSuccess(true);
      setTimeout(() => {
        setHwSuccess(false);
        setHwTitle('');
        setHwDesc('');
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    const targetObj = teachingClasses.find(c => c.name === broadcastClass) || teachingClasses[0];
    if (!targetObj) {
      alert("⛔ Access Denied: You do not own any classes to broadcast to.");
      return;
    }
    try {
      if (broadcastLesson) {
        await broadcastLesson(targetObj.id, broadcastText.trim());
      }
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setBroadcastText('');
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-theme-primary">
              Teacher Evaluation & Dispatch Hub
            </h2>
            <span className="text-xs font-mono font-normal badge-theme-accent px-2 py-0.5 rounded">
              Teaching {teachingClasses.length} Cohort{teachingClasses.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-theme-secondary mt-0.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-theme-accent" />
            <span>Strict Access Control Active: You only have access to your own cohorts and students.</span>
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-theme-base border border-theme-subtle text-xs font-medium">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'queue' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            Submissions Queue ({queue.filter(q => q.status === 'pending_review').length})
          </button>
          <button
            onClick={() => setActiveTab('practice_month')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${activeTab === 'practice_month' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Practice Month</span>
          </button>
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'homework' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            Assign Homework
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'broadcast' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            Broadcast
          </button>
        </div>
      </div>

      {/* Cohorts Quick Launch Bar */}
      {teachingClasses.length > 0 && (
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold text-theme-primary">Your Cohorts Analytics:</span>
            <span className="text-[11px] text-theme-secondary">Click any cohort to view student statistics, HW volume, and log Practice Month mock scores:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {teachingClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => setStatsModalClass(c)}
                className="px-3 py-1.5 rounded-xl bg-theme-card border border-theme-subtle hover:border-theme-accent text-xs font-mono flex items-center gap-2 transition group shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-theme-accent" />
                <span className="font-bold text-theme-primary group-hover:text-theme-accent transition-colors">{c.name}</span>
                <span className="text-[10px] text-theme-muted">({c.student_count || 0})</span>
                <ChevronRight className="w-3 h-3 text-theme-muted group-hover:text-theme-accent transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zero Teaching Classes Warning */}
      {teachingClasses.length === 0 && (
        <div className="p-6 rounded-2xl bg-theme-accent-subtle/50 border border-theme-accent-subtle space-y-2">
          <div className="flex items-center gap-2 text-theme-accent font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Teacher Security Boundary: No Cohorts Created</span>
          </div>
          <p className="text-xs text-theme-secondary leading-relaxed">
            You are not currently registered as the instructor of any classes. In accordance with strict student privacy rules, instructors cannot view other teachers' cohorts, student lists, or essay submissions. To begin teaching, create a group in the <strong>Classes</strong> tab.
          </p>
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider flex items-center gap-1.5">
              <span>Your Student Submissions Queue ({queue.length})</span>
              <span className="text-[10px] text-theme-accent font-mono font-normal">🔒 Isolated to your classes</span>
            </span>
          </div>

          {queue.length > 0 ? (
            queue.map((item) => (
              <div key={item.id} className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-theme-subtle">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-theme-primary">{item.student_name}</span>
                      <span className="text-xs text-theme-muted font-mono">({item.student_phone})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded badge-theme-accent font-medium">
                        Class: {item.class_name}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-theme-secondary">{item.prompt}</h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-theme-muted uppercase block font-semibold">Gemini AI Band</span>
                    <span className="font-mono text-sm font-bold text-theme-accent">{item.ai_score} / 9.0</span>
                  </div>
                </div>

                {/* Student Essay Box */}
                <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle text-xs text-theme-primary leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {item.essay}
                </div>

                {/* Teacher Override Inputs */}
                <div className="p-4 bg-theme-base/60 rounded-xl border border-theme-subtle grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-xs text-theme-secondary font-bold block">
                      Teacher Band Score:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="9.0"
                      defaultValue={item.manual_score || item.ai_score}
                      id={`teacher_score_${item.id}`}
                      className="w-full bg-theme-elevated text-theme-primary text-sm font-bold font-mono rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-xs text-theme-secondary font-bold block">
                      Teacher Comments & Corrections:
                    </label>
                    <input
                      type="text"
                      id={`teacher_notes_${item.id}`}
                      defaultValue={item.teacher_notes}
                      placeholder="e.g. Well organized arguments! Strengthen your conclusion."
                      className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                    />
                  </div>

                  <div className="md:col-span-3 pt-4 md:pt-0">
                    <button
                      onClick={() => {
                        const score = parseFloat(document.getElementById(`teacher_score_${item.id}`).value);
                        const notes = document.getElementById(`teacher_notes_${item.id}`).value;
                        handleReviewSave(item, score, notes);
                      }}
                      className="w-full py-2.5 rounded-xl btn-theme-primary text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{item.status === 'reviewed' ? 'Update Review' : 'Approve & Send'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-theme-primary">No Submissions Pending Review</h3>
              <p className="text-xs text-theme-secondary max-w-sm mx-auto">
                {teachingClasses.length > 0
                  ? "None of your enrolled students have unreviewed essays waiting in your queue."
                  : "You currently have no teaching classes. Other teachers' student submissions are strictly protected and isolated."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-theme-accent" />
              <span>Assign Homework to Your Cohort</span>
            </h3>
            <span className="text-[10px] font-mono badge-theme-accent px-2 py-0.5 rounded">
              🔒 Your Cohorts Only
            </span>
          </div>

          {teachingClasses.length > 0 ? (
            <form onSubmit={handleCreateHw} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Select Your Cohort:</label>
                <select
                  value={hwTargetClass}
                  onChange={(e) => setHwTargetClass(e.target.value)}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                >
                  {teachingClasses.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.student_count || 0} students)</option>
                  ))}
                </select>
                <p className="text-[10px] text-theme-muted">
                  Strict Security: You can only assign tasks to groups where you are the instructor.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Assignment Title:</label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="e.g. Task 2: Artificial Intelligence & Workforce"
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Instructions / Prompt:</label>
                <textarea
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  placeholder="Write an opinion essay (250+ words). Focus on grammatical range..."
                  rows={3}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Submission Deadline:</label>
                <input
                  type="text"
                  value={hwDeadline}
                  onChange={(e) => setHwDeadline(e.target.value)}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl btn-theme-primary text-xs shadow-md"
              >
                {hwSuccess ? "✅ Assignment Published to Enrolled Students!" : "Publish Assignment"}
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-xs text-theme-muted space-y-2">
              <Lock className="w-6 h-6 text-theme-accent mx-auto" />
              <p>You cannot assign homework because you do not have any teaching cohorts.</p>
              <p>Create a class in the "Classes" tab to begin assigning homework.</p>
            </div>
          )}
        </div>
      )}

      {/* Practice Month Tab */}
      {activeTab === 'practice_month' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-theme-card to-theme-base border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-theme-primary">
                  IELTS Practice Month: Daily Mock Exam Management
                </h3>
                <p className="text-xs text-theme-secondary mt-0.5">
                  Input daily Listening, Reading, Writing, and Speaking mock scores for each student. Individual band scores, trajectories, and customizable charts update automatically for students in real-time.
                </p>
              </div>
            </div>
          </div>

          {teachingClasses.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span>Your Cohorts ({teachingClasses.length})</span>
                  <span className="text-[10px] text-theme-accent font-mono font-normal">Select a cohort to log daily mock scores</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachingClasses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setStatsModalClass(c)}
                    className="p-5 rounded-2xl bg-theme-card border border-theme-subtle hover:border-theme-accent transition shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded badge-theme-accent">
                          Code: {c.join_code}
                        </span>
                        <span className="text-xs text-theme-muted flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-theme-accent" />
                          <span>{c.student_count || 0} students</span>
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-theme-primary group-hover:text-theme-accent transition-colors">
                        {c.name}
                      </h4>
                      <p className="text-xs text-theme-secondary line-clamp-2">
                        Click to view cohort homework statistics, roster breakdown, and open the daily mock test scoring registry.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs font-semibold text-theme-accent group-hover:underline">
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Manage Mock Scores</span>
                      </span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
              <Lock className="w-8 h-8 text-theme-accent mx-auto" />
              <h3 className="text-sm font-bold text-theme-primary">No Teaching Cohorts Available</h3>
              <p className="text-xs text-theme-secondary max-w-sm mx-auto">
                You must be the instructor of at least one group to input daily mock exam scores. Create a group in the <strong>Classes</strong> tab to begin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
            <Radio className="w-4 h-4 text-theme-accent" />
            <span>Broadcast Announcement to Cohort</span>
          </h3>

          {teachingClasses.length > 0 ? (
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Target Cohort:</label>
                <select
                  value={broadcastClass}
                  onChange={(e) => setBroadcastClass(e.target.value)}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                >
                  {teachingClasses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-secondary block font-semibold">Message:</label>
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Send lesson notes, vocabulary lists, or exam advice..."
                  rows={5}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-3 border border-theme-subtle outline-none focus:border-theme-accent resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl btn-theme-primary text-xs shadow-md"
              >
                {broadcastSuccess ? "✅ Broadcast Sent to Cohort Telegram!" : "Send Broadcast to Students"}
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-xs text-theme-muted space-y-2">
              <Lock className="w-6 h-6 text-theme-accent mx-auto" />
              <p>You cannot broadcast announcements because you do not have any teaching cohorts.</p>
            </div>
          )}
        </div>
      )}

      {/* Class Statistics & Practice Month Daily Mock Scoring Modal */}
      {statsModalClass && (
        <ClassStatsModal
          isOpen={!!statsModalClass}
          onClose={() => setStatsModalClass(null)}
          classData={statsModalClass}
          isTeacher={true}
        />
      )}
    </div>
  );
}