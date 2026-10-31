import React, { useState } from 'react';
import { GraduationCap, Users, Plus, Key, ArrowRight, CheckCircle2, ShieldCheck, LogOut, BookOpen, Clock, BarChart2, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ClassStatsModal from '../common/ClassStatsModal';

export default function ClassroomView() {
  const { user, joinClass, leaveClass, createTeachingClass } = useAuth();
  
  const teachingClasses = user?.teaching_classes || [];
  const enrolledClasses = user?.enrolled_classes || [];

  const [activeTab, setActiveTab] = useState('both'); // 'both' | 'teaching' | 'enrolled'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  // Create class form state
  const [newClassName, setNewClassName] = useState('');
  const [listeningGoal, setListeningGoal] = useState(180);
  const [readingGoal, setReadingGoal] = useState(180);
  const [createdInfo, setCreatedInfo] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoinStatus('');
    const res = await joinClass(joinCodeInput.trim());
    if (res.status === 'already_in') {
      setJoinStatus("You are already enrolled in this class.");
    } else if (res.success) {
      setJoinStatus("✅ Successfully enrolled in class as a student!");
      setJoinCodeInput('');
    } else {
      setJoinStatus("❌ Class code not found. Check with the instructor.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const created = await createTeachingClass(newClassName.trim(), listeningGoal, readingGoal);
    setCreatedInfo(created);
    setNewClassName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Classroom Multi-Role Management</span>
            <span className="text-xs font-mono font-normal badge-theme-accent px-2 py-0.5 rounded">
              Instructor & Learner
            </span>
          </h2>
          <p className="text-xs text-theme-secondary mt-1">
            You can simultaneously teach your own IELTS cohorts and enroll as a student in other instructors' classes.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex p-1 rounded-xl bg-theme-base border border-theme-subtle text-xs font-medium">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'both' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            All Classes ({teachingClasses.length + enrolledClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('teaching')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'teaching' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            Teaching ({teachingClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'enrolled' ? 'bg-theme-accent-subtle text-theme-accent font-bold border border-theme-accent-subtle' : 'text-theme-secondary'}`}
          >
            Attending as Student ({enrolledClasses.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: CLASSES YOU TEACH */}
      {(activeTab === 'both' || activeTab === 'teaching') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-theme-accent uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Classes You Teach (Instructor Mode)</span>
              </span>
              <span className="text-xs text-theme-muted font-mono">({teachingClasses.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachingClasses.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClass({ ...c, isTeacher: true })}
                className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-theme-accent-subtle transition cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded badge-theme-accent uppercase tracking-wider">
                      You are Instructor
                    </span>
                    <span className="text-xs text-theme-muted font-mono">{c.created_at || 'Active'}</span>
                  </div>

                  <h3 className="font-bold text-sm text-theme-primary group-hover:text-theme-accent transition-colors flex items-center justify-between">
                    <span>{c.name}</span>
                    <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme-accent transition-transform group-hover:translate-x-0.5" />
                  </h3>

                  <div className="p-2.5 bg-theme-elevated rounded-xl border border-theme-subtle flex items-center justify-between text-xs">
                    <span className="text-theme-secondary">Student Join Code:</span>
                    <span className="font-mono font-bold text-theme-accent text-sm tracking-widest">{c.join_code}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-theme-accent font-medium pt-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>View Statistics & Practice Month</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-secondary">
                  <span>Students: <strong className="text-theme-primary">{c.student_count || 0}</strong></span>
                  <span>Goals: {c.listening_goal}m L • {c.reading_goal}m R</span>
                </div>
              </div>
            ))}

            {/* Quick Add Class Card */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-dashed border-theme-strong flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-theme-primary flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-theme-accent" />
                  <span>Create a New Cohort to Teach</span>
                </h4>
                <p className="text-[11px] text-theme-secondary">
                  Generate a new class code to share with your IELTS students.
                </p>
              </div>

              <form onSubmit={handleCreate} className="space-y-2.5">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Band 8.0 Evening Batch"
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                />

                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="w-full py-2 rounded-xl btn-theme-primary text-xs transition disabled:opacity-50"
                >
                  Create & Get Code
                </button>
              </form>

              {createdInfo && (
                <div className="text-[11px] text-theme-accent p-2 bg-theme-accent-subtle rounded-lg border border-theme-accent-subtle font-mono">
                  Created! Code: <strong>{createdInfo.join_code}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CLASSES YOU ATTEND AS A STUDENT */}
      {(activeTab === 'both' || activeTab === 'enrolled') && (
        <div className="space-y-4 pt-4 border-t border-theme-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Classes You Attend as a Student (Learner Mode)</span>
              </span>
              <span className="text-xs text-theme-muted font-mono">({enrolledClasses.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledClasses.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedClass({ ...c, isTeacher: false })}
                className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase tracking-wider">
                      Student Enrolled
                    </span>
                    <span className="text-xs text-theme-muted font-mono">ID: {c.join_code}</span>
                  </div>

                  <h3 className="font-bold text-sm text-theme-primary group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>{c.name}</span>
                    <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                  </h3>

                  <div className="text-xs text-theme-secondary">
                    Taught by: <strong className="text-theme-primary">{c.teacher_name || "Instructor"}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>View My Class Trajectory & Mocks</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-theme-subtle flex items-center justify-between text-xs">
                  <span className="text-theme-secondary">
                    Target: {c.listening_goal}m L / {c.reading_goal}m R
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      leaveClass(c.id);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition p-1 hover:bg-rose-950/20 rounded"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Join Form Card */}
            <div className="p-5 rounded-2xl bg-theme-surface border border-dashed border-theme-strong flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-theme-primary flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Join Another Class as Student</span>
                </h4>
                <p className="text-[11px] text-theme-secondary">
                  Enter the 6-character code given by another IELTS teacher.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-2.5">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. EXAM88"
                  className="w-full bg-theme-elevated text-theme-primary text-xs font-mono font-bold rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-emerald-500 uppercase tracking-widest"
                />

                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  Join Class as Student
                </button>
              </form>

              {joinStatus && (
                <div className="text-[11px] p-2 bg-theme-elevated rounded-lg border border-theme-subtle text-theme-primary">
                  {joinStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Analytics & Practice Month Modal */}
      {selectedClass && (
        <ClassStatsModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          classData={selectedClass}
          isTeacher={selectedClass.isTeacher}
        />
      )}
    </div>
  );
}
