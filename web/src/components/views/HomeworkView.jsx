import React from 'react';
import { BookOpen, Calendar, CheckCircle2, Clock, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HomeworkView({ onStartEssay }) {
  const { user } = useAuth();
  const homework = user?.homework || [];
  const enrolledClasses = user?.enrolled_classes || [];
  const classInfo = user?.class_info;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Class Homework & Assignments</span>
            <span className="text-xs font-mono font-normal text-theme-accent">
              [{user?.phone_number}]
            </span>
          </h2>
          <p className="text-xs text-theme-muted mt-0.5">
            View instructor-assigned tasks, upcoming deadlines, and submission status across your enrolled classes.
          </p>
        </div>

        {enrolledClasses.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {enrolledClasses.map(cls => (
              <div key={cls.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-card border border-theme-subtle text-xs">
                <GraduationCap className="w-3.5 h-3.5 text-theme-accent" />
                <span className="text-theme-primary font-semibold">{cls.name}</span>
                <span className="text-[10px] font-mono badge-theme-accent px-1.5 py-0.5 rounded">
                  {cls.join_code}
                </span>
              </div>
            ))}
          </div>
        ) : classInfo ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-card border border-theme-subtle text-xs">
            <GraduationCap className="w-4 h-4 text-theme-accent" />
            <span className="text-theme-primary font-semibold">{classInfo.name}</span>
            <span className="text-[10px] font-mono badge-theme-accent px-1.5 py-0.5 rounded">
              {classInfo.join_code}
            </span>
          </div>
        ) : (
          <div className="text-xs badge-theme-accent px-3 py-1.5 rounded-xl font-medium">
            Not enrolled in a class yet (go to "My Classes" tab to join)
          </div>
        )}
      </div>

      {/* Homework List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homework.length > 0 ? (
          homework.map((hw) => (
            <div
              key={hw.id}
              className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-theme-accent-subtle transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    hw.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'badge-theme-accent'
                  }`}>
                    {hw.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                  </span>
                  <span className="text-xs text-theme-muted flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-theme-muted" />
                    <span>Due: {hw.deadline}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-theme-primary">{hw.title}</h3>
                  {hw.class_name && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-elevated text-theme-muted border border-theme-subtle">
                      {hw.class_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  {hw.description}
                </p>
              </div>

              <div className="pt-3 border-t border-theme-subtle flex items-center justify-between">
                <span className="text-[11px] text-theme-muted">
                  {hw.task_type === 'task2' ? 'Task 2 Essay' : hw.task_type === 'task1' ? 'Task 1 Report' : 'General Practice'}
                </span>

                {hw.task_type?.startsWith('task') && (
                  <button
                    onClick={() => onStartEssay && onStartEssay(hw)}
                    className="text-xs text-theme-accent hover:text-theme-accent-light font-bold flex items-center gap-1 transition"
                  >
                    <span>Write for Homework</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-theme-primary">All Caught Up!</h3>
            <p className="text-xs text-theme-muted max-w-sm mx-auto">
              You have no pending homework assignments from your instructors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}