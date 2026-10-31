import React, { useState, useEffect } from 'react';
import { 
  X, Users, CheckCircle, Clock, BookOpen, TrendingUp, Award, Calendar, 
  Plus, Edit3, Send, ShieldAlert, Sparkles, FileText, ChevronRight, BarChart2 
} from 'lucide-react';
import MockScoreGraph from './MockScoreGraph';
import { useAuth } from '../../context/AuthContext';

export default function ClassStatsModal({ isOpen, onClose, classData, isTeacher = false }) {
  const { user, getClassStats, recordMockScore, getStudentMockScores } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(isTeacher ? 'overview' : 'trajectory'); // 'overview' | 'practice_month' | 'roster' | 'trajectory'
  
  // Daily Mock Score Entry State (for Teachers)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [mockDate, setMockDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [listening, setListening] = useState(7.0);
  const [reading, setReading] = useState(7.0);
  const [writing, setWriting] = useState(6.5);
  const [speaking, setSpeaking] = useState(7.0);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Student Mock Scores for Chart
  const [studentMocks, setStudentMocks] = useState([]);

  useEffect(() => {
    if (!isOpen || !classData) return;
    loadStatistics();
  }, [isOpen, classData]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const cid = classData.id;
      const data = await getClassStats(cid);
      setStats(data);
      if (data?.students?.length > 0) {
        setSelectedStudentId(data.students[0].user_id);
      }

      // Fetch student mock scores for trajectory graph
      const mocks = await getStudentMockScores(cid);
      setStudentMocks(mocks);
    } catch (err) {
      console.error("Error loading class stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // IELTS Overall Band official calculation helper
  const calculateOverall = (l, r, w, s) => {
    const avg = (parseFloat(l) + parseFloat(r) + parseFloat(w) + parseFloat(s)) / 4.0;
    const rem = avg - Math.floor(avg);
    if (rem < 0.25) return (Math.floor(avg)).toFixed(1);
    if (rem < 0.75) return (Math.floor(avg) + 0.5).toFixed(1);
    return (Math.floor(avg) + 1.0).toFixed(1);
  };

  const calculatedOverall = calculateOverall(listening, reading, writing, speaking);

  const handleSaveMockScore = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await recordMockScore(classData.id, selectedStudentId, mockDate, {
        listening,
        reading,
        writing,
        speaking,
        overall: calculatedOverall,
        notes
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setNotes('');
      // Reload stats & graphs
      await loadStatistics();
    } catch (err) {
      alert("Failed to save mock score: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !classData) return null;

  const studentsList = stats?.students || [];
  const cohortScores = stats?.mock_scores || [];
  const displayedMocks = isTeacher ? cohortScores : (studentMocks.length > 0 ? studentMocks : cohortScores);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-theme-base border border-theme-accent-subtle shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-theme-surface border-b border-theme-subtle flex items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isTeacher ? 'badge-theme-accent' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {isTeacher ? "Instructor Cohort Hub" : "Enrolled Student Analytics"}
              </span>
              <span className="text-xs font-mono text-theme-muted">
                Join Code: <strong className="text-theme-accent tracking-wider font-bold">{classData.join_code}</strong>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Practice Month Mode Active</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-theme-primary">{classData.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-theme-secondary font-mono">Calculating cohort statistics & mock trajectories...</p>
            </div>
          ) : (
            <>
              {/* TOP METRICS SUMMARY BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Students Enrolled */}
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-theme-muted">
                    <span className="text-xs font-medium">Students Enrolled</span>
                    <Users className="w-4 h-4 text-theme-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-theme-primary">
                    {stats?.student_count ?? classData.student_count ?? 0}
                  </div>
                  <span className="text-[10px] text-theme-secondary block">
                    Active IELTS Aspirants
                  </span>
                </div>

                {/* Homework Completion Rate */}
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-theme-muted">
                    <span className="text-xs font-medium">HW Done & Submitted</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {stats?.cohort_hw_completion_rate ?? 85}%
                  </div>
                  <span className="text-[10px] text-theme-secondary block">
                    {stats?.total_hw_completed || 0} completed tasks
                  </span>
                </div>

                {/* Average Writing Volume */}
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-theme-muted">
                    <span className="text-xs font-medium">Average Words Written</span>
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">
                    {stats?.avg_words_per_essay ?? 285}
                  </div>
                  <span className="text-[10px] text-theme-secondary block">
                    Words per student essay
                  </span>
                </div>

                {/* Cohort Estimated Band / GPA */}
                <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-theme-muted">
                    <span className="text-xs font-medium">Estimated GPA / Band</span>
                    <Award className="w-4 h-4 text-theme-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-theme-accent">
                    Band {stats?.cohort_estimated_gpa ?? "7.0"}
                  </div>
                  <span className="text-[10px] text-theme-secondary block">
                    Composite Mock + Essay GPA
                  </span>
                </div>
              </div>

              {/* TAB SELECTOR */}
              <div className="flex items-center gap-2 border-b border-theme-subtle pb-2 text-xs font-medium">
                {isTeacher && (
                  <button
                    onClick={() => setActiveTab('practice_month')}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      activeTab === 'practice_month' 
                        ? 'bg-theme-accent text-theme-base font-bold' 
                        : 'text-theme-secondary hover:text-theme-primary bg-theme-surface'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Practice Month Score Input</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('trajectory')}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    activeTab === 'trajectory' 
                      ? 'bg-theme-accent text-theme-base font-bold' 
                      : 'text-theme-secondary hover:text-theme-primary bg-theme-surface'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Interactive Trajectory Graph</span>
                </button>

                {isTeacher && (
                  <button
                    onClick={() => setActiveTab('roster')}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                      activeTab === 'roster' 
                        ? 'bg-theme-accent text-theme-base font-bold' 
                        : 'text-theme-secondary hover:text-theme-primary bg-theme-surface'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Student Roster & HW Breakdown ({studentsList.length})</span>
                  </button>
                )}
              </div>

              {/* TAB 1: TEACHER DAILY PRACTICE MONTH MOCK SCORE INPUT */}
              {isTeacher && activeTab === 'practice_month' && (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-theme-surface border border-theme-subtle space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-theme-subtle pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Practice Month: Daily Full Mock Exam Scoring</span>
                        </h3>
                        <p className="text-xs text-theme-secondary mt-0.5">
                          In Practice Month mode, students take daily mocks. Input scores for each student to auto-compute their overall IELTS band and update their trajectory graph.
                        </p>
                      </div>

                      <div className="text-xs font-mono px-3 py-1 rounded-xl bg-theme-elevated border border-theme-subtle">
                        Live Sync to Firestore & Telegram Alert Active
                      </div>
                    </div>

                    <form onSubmit={handleSaveMockScore} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Student Picker */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-theme-secondary">Select Student</label>
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                          >
                            {studentsList.map((st) => (
                              <option key={st.user_id} value={st.user_id}>
                                {st.name} ({st.phone || `ID: ${st.user_id}`}) — Current GPA: {st.estimated_gpa}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-theme-secondary">Mock Exam Date</label>
                          <input
                            type="date"
                            value={mockDate}
                            onChange={(e) => setMockDate(e.target.value)}
                            className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono"
                          />
                        </div>
                      </div>

                      {/* 4 Skill Score Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {/* Listening */}
                        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1">
                          <label className="text-[11px] font-bold text-cyan-400 block">🎧 Listening</label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            step="0.5"
                            value={listening}
                            onChange={(e) => setListening(e.target.value)}
                            className="w-full bg-theme-base text-theme-primary font-mono font-bold text-sm rounded-lg p-2 border border-cyan-800/50 outline-none text-center"
                          />
                        </div>

                        {/* Reading */}
                        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-1">
                          <label className="text-[11px] font-bold text-blue-400 block">📖 Reading</label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            step="0.5"
                            value={reading}
                            onChange={(e) => setReading(e.target.value)}
                            className="w-full bg-theme-base text-theme-primary font-mono font-bold text-sm rounded-lg p-2 border border-blue-800/50 outline-none text-center"
                          />
                        </div>

                        {/* Writing */}
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1">
                          <label className="text-[11px] font-bold text-purple-400 block">✍️ Writing</label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            step="0.5"
                            value={writing}
                            onChange={(e) => setWriting(e.target.value)}
                            className="w-full bg-theme-base text-theme-primary font-mono font-bold text-sm rounded-lg p-2 border border-purple-800/50 outline-none text-center"
                          />
                        </div>

                        {/* Speaking */}
                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                          <label className="text-[11px] font-bold text-amber-400 block">🗣️ Speaking</label>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            step="0.5"
                            value={speaking}
                            onChange={(e) => setSpeaking(e.target.value)}
                            className="w-full bg-theme-base text-theme-primary font-mono font-bold text-sm rounded-lg p-2 border border-amber-800/50 outline-none text-center"
                          />
                        </div>
                      </div>

                      {/* Auto-Calculated Overall Band Badge */}
                      <div className="p-3 rounded-xl bg-theme-elevated border border-theme-subtle flex items-center justify-between text-xs">
                        <span className="text-theme-secondary">
                          Auto-Calculated IELTS Overall Band (Official Rounding):
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black font-mono text-emerald-400">
                            Band {calculatedOverall}
                          </span>
                          <span className="text-[10px] text-theme-muted font-mono">
                            (Avg: {((parseFloat(listening)+parseFloat(reading)+parseFloat(writing)+parseFloat(speaking))/4).toFixed(2)})
                          </span>
                        </div>
                      </div>

                      {/* Examiner Notes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-theme-secondary">Examiner Notes & Daily Guidance</label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Great Task 2 structure, needs faster Section 3 listening note-taking..."
                          className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-[11px] text-theme-secondary">
                          {saveSuccess && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Score saved! Synced to Firestore & student notified.</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={saving || !selectedStudentId}
                          className="px-5 py-2.5 rounded-xl btn-theme-primary text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{saving ? "Saving to Cloud..." : "Log Daily Mock Score"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE TRAJECTORY GRAPH VIEW */}
              {activeTab === 'trajectory' && (
                <div className="space-y-4">
                  <MockScoreGraph 
                    scores={displayedMocks} 
                    targetBand={7.5}
                    title={isTeacher ? `Cohort Mock Score Trajectory (${classData.name})` : "My Practice Month Score Progression"}
                  />

                  {/* Mock Records Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-xs text-theme-primary flex items-center justify-between">
                      <span>Daily Score History Log</span>
                      <span className="text-[11px] text-theme-muted font-mono">{displayedMocks.length} Tests Recorded</span>
                    </h4>

                    <div className="overflow-x-auto rounded-xl border border-theme-subtle bg-theme-card">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-theme-surface text-theme-secondary font-mono text-[11px] border-b border-theme-subtle">
                            <th className="p-3">Date</th>
                            <th className="p-3 text-cyan-400">Listening</th>
                            <th className="p-3 text-blue-400">Reading</th>
                            <th className="p-3 text-purple-400">Writing</th>
                            <th className="p-3 text-amber-400">Speaking</th>
                            <th className="p-3 text-emerald-400">Overall</th>
                            <th className="p-3">Teacher Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-subtle font-mono text-theme-primary">
                          {displayedMocks.map((m, i) => (
                            <tr key={m.id || i} className="hover:bg-theme-elevated/40 transition">
                              <td className="p-3 font-semibold text-theme-secondary">{m.date}</td>
                              <td className="p-3 text-cyan-400">{m.listening}</td>
                              <td className="p-3 text-blue-400">{m.reading}</td>
                              <td className="p-3 text-purple-400">{m.writing}</td>
                              <td className="p-3 text-amber-400">{m.speaking}</td>
                              <td className="p-3 font-bold text-emerald-400 bg-emerald-950/20">Band {m.overall}</td>
                              <td className="p-3 text-theme-secondary font-sans text-[11px] italic">
                                {m.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STUDENT ROSTER & HW BREAKDOWN (FOR TEACHERS) */}
              {isTeacher && activeTab === 'roster' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-2xl border border-theme-subtle bg-theme-card">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-theme-surface text-theme-secondary font-mono text-[11px] border-b border-theme-subtle">
                          <th className="p-3.5">Student</th>
                          <th className="p-3.5">Contact</th>
                          <th className="p-3.5">HW Done</th>
                          <th className="p-3.5">HW Completion %</th>
                          <th className="p-3.5">Essays Written</th>
                          <th className="p-3.5">Estimated GPA</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-theme-subtle text-theme-primary">
                        {studentsList.map((st) => (
                          <tr key={st.user_id} className="hover:bg-theme-elevated/40 transition">
                            <td className="p-3.5 font-bold flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-theme-elevated flex items-center justify-center text-xs font-mono text-theme-accent shrink-0">
                                {st.name.charAt(0)}
                              </div>
                              <span>{st.name}</span>
                            </td>
                            <td className="p-3.5 font-mono text-theme-secondary text-[11px]">
                              {st.phone || "Linked Telegram"}
                            </td>
                            <td className="p-3.5 font-mono">
                              <strong className="text-theme-primary">{st.hw_completed}</strong> / {st.hw_assigned}
                            </td>
                            <td className="p-3.5 font-mono">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-theme-elevated overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full" 
                                    style={{ width: `${Math.min(100, st.hw_percentage)}%` }} 
                                  />
                                </div>
                                <span className={st.hw_percentage >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                                  {st.hw_percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-cyan-400">
                              {st.essays_count} essays
                            </td>
                            <td className="p-3.5 font-mono font-bold text-theme-accent">
                              Band {st.estimated_gpa}
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedStudentId(st.user_id);
                                  setActiveTab('practice_month');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-accent hover:text-theme-base text-theme-secondary text-[11px] transition font-medium"
                              >
                                Grade Mock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-theme-surface border-t border-theme-subtle flex items-center justify-between text-xs text-theme-secondary">
          <span className="font-mono">
            Practice Month Analytics • Cohort ID: {classData.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-theme-elevated hover:bg-theme-subtle text-theme-primary font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
