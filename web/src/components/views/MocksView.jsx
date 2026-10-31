import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, TrendingUp, TrendingDown, Minus, BarChart2, LineChart, 
  Activity, Award, Calendar, Plus, Trash2, Sparkles, AlertCircle, 
  CheckCircle2, Zap, Brain, ChevronDown, ChevronUp, RefreshCw, Info,
  Sliders, ArrowUpRight, Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Standard Cambridge & Official Mock Suggestions
const MOCK_PRESETS = [
  "Cambridge 18 Academic Test 1",
  "Cambridge 18 Academic Test 2",
  "Cambridge 17 Academic Test 1",
  "Cambridge 17 Academic Test 2",
  "British Council Official Mock",
  "IDP In-Center Simulation",
  "Road to IELTS Practice Test",
  "IELTS Ready Premium Test"
];

const BAND_SCORES = [
  0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 
  5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0
];

// Helper: Official IELTS Band Rounding (0.25 and 0.75 thresholds)
function calculateOfficialBand(l, r, w, s) {
  const avg = (parseFloat(l) + parseFloat(r) + parseFloat(w) + parseFloat(s)) / 4.0;
  if (isNaN(avg)) return 0.0;
  const rem = avg - Math.floor(avg);
  if (rem < 0.25) return Math.floor(avg);
  if (rem < 0.75) return Math.floor(avg) + 0.5;
  return Math.floor(avg) + 1.0;
}

export default function MocksView({ targetBand = '7.5' }) {
  const { user, getStudentMockScores, recordStudentMockScore, deleteStudentMockScore } = useAuth();
  
  const [mockScores, setMockScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [graphType, setGraphType] = useState('line'); // 'line' | 'bar' | 'area' | 'radar'
  const [skillFilter, setSkillFilter] = useState('all'); // 'all' | 'overall' | 'listening' | 'reading' | 'writing' | 'speaking'
  const [selectedMock, setSelectedMock] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  // Input Form State
  const [formData, setFormData] = useState({
    title: 'Cambridge 18 Academic Test 1',
    date: new Date().toISOString().split('T')[0],
    listening: 6.5,
    reading: 6.5,
    writing: 6.0,
    speaking: 6.5,
    notes: ''
  });

  const parsedTarget = parseFloat(targetBand) || 7.5;

  // Live Overall Band for the modal form
  const liveCalculatedBand = useMemo(() => {
    return calculateOfficialBand(
      formData.listening,
      formData.reading,
      formData.writing,
      formData.speaking
    );
  }, [formData.listening, formData.reading, formData.writing, formData.speaking]);

  // Load scores on mount
  const loadScores = async () => {
    setLoading(true);
    try {
      const data = await getStudentMockScores();
      // Ensure sorted chronologically by date
      const sorted = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
      setMockScores(sorted);
      if (sorted.length > 0) {
        setSelectedMock(sorted[sorted.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load mock scores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, [user]);

  // Handle Form Submission
  const handleSubmitMock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRecord = await recordStudentMockScore({
        title: formData.title.trim() || 'IELTS Mock Exam',
        date: formData.date,
        listening: parseFloat(formData.listening),
        reading: parseFloat(formData.reading),
        writing: parseFloat(formData.writing),
        speaking: parseFloat(formData.speaking),
        overall: liveCalculatedBand,
        notes: formData.notes.trim()
      });

      if (newRecord) {
        setMockScores(prev => {
          const updated = [...prev, newRecord].sort((a, b) => new Date(a.date) - new Date(b.date));
          setSelectedMock(newRecord);
          return updated;
        });
        setShowLogModal(false);
        // Reset form to defaults
        setFormData({
          title: 'Cambridge 18 Academic Test 2',
          date: new Date().toISOString().split('T')[0],
          listening: 6.5,
          reading: 6.5,
          writing: 6.0,
          speaking: 6.5,
          notes: ''
        });
      }
    } catch (err) {
      alert("Failed to save mock test score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDeleteMock = async (mockId) => {
    if (!window.confirm("Are you sure you want to delete this mock score entry?")) return;
    try {
      await deleteStudentMockScore(mockId);
      setMockScores(prev => {
        const filtered = prev.filter(m => m.id !== mockId);
        if (selectedMock && selectedMock.id === mockId) {
          setSelectedMock(filtered.length > 0 ? filtered[filtered.length - 1] : null);
        }
        return filtered;
      });
    } catch (err) {
      alert("Failed to delete score.");
    }
  };

  // -------------------------------------------------------------
  // ADVANCED TRAJECTORY & MOTIVATION ENGINE
  // -------------------------------------------------------------
  const analytics = useMemo(() => {
    if (mockScores.length === 0) {
      return {
        count: 0,
        latest: null,
        previous: null,
        delta: 0,
        status: 'empty',
        bestSkill: null,
        worstSkill: null,
        targetGap: 0,
        encouragement: null
      };
    }

    const latest = mockScores[mockScores.length - 1];
    const previous = mockScores.length >= 2 ? mockScores[mockScores.length - 2] : null;
    const delta = previous ? Math.round((latest.overall - previous.overall) * 10) / 10 : 0;
    const targetGap = Math.round((latest.overall - parsedTarget) * 10) / 10;

    // Detect Subskill Strengths
    const skills = [
      { name: 'Listening', score: parseFloat(latest.listening || 0) },
      { name: 'Reading', score: parseFloat(latest.reading || 0) },
      { name: 'Writing', score: parseFloat(latest.writing || 0) },
      { name: 'Speaking', score: parseFloat(latest.speaking || 0) }
    ];
    skills.sort((a, b) => b.score - a.score);
    const bestSkill = skills[0];
    const worstSkill = skills[skills.length - 1];

    // Determine Trend Condition
    let status = 'baseline'; // 'baseline' | 'improving' | 'stagnant' | 'declining'
    if (mockScores.length >= 2) {
      if (delta > 0) {
        status = 'improving';
      } else if (delta < 0) {
        status = 'declining';
      } else {
        status = 'stagnant';
      }
    }

    // Check longer stagnation (e.g., 3 consecutive identical overall bands)
    if (mockScores.length >= 3) {
      const last3 = mockScores.slice(-3);
      if (last3[0].overall === last3[1].overall && last3[1].overall === last3[2].overall) {
        status = 'stagnant_long';
      }
    }

    // Generate Tailored Psychological & Tactical Encouragement
    let encouragement = {};
    if (status === 'improving') {
      encouragement = {
        badge: "Momentum Unlocked",
        color: "emerald",
        icon: TrendingUp,
        title: "Upward Trajectory! You are Gaining Ground 🚀",
        phrase: `Great work! You advanced from Band ${previous?.overall} to ${latest.overall} (+${delta}). Your consistent deliberate practice is showing up directly in your scoring precision.`,
        tactical: [
          `Your strongest pillar right now is ${bestSkill.name} at Band ${bestSkill.score}. Maintain this baseline with 2 light weekly maintenance drills.`,
          `To sustain this momentum toward your Band ${parsedTarget} target, direct your next study sprint toward ${worstSkill.name} (currently Band ${worstSkill.score}).`,
          "Cement this achievement: Document what specific mindset or timing routine you applied during this mock so you can duplicate it on test day."
        ]
      };
    } else if (status === 'stagnant' || status === 'stagnant_long') {
      encouragement = {
        badge: "Plateau Detected — Time to Pivot",
        color: "amber",
        icon: Minus,
        title: "Score Plateaus are Normal — Here is How You Shatter Them ⚡",
        phrase: `You scored Band ${latest.overall} again. Plateaus are not a sign of stagnation or failure; they are the necessary consolidation phase where fluency solidifies before your next leap.`,
        tactical: [
          "Stop passive testing: Doing 3 more full tests without deep autopsy will only reinforce existing patterns. Review every single incorrect question from this test until you can explain the trap.",
          `Bridge the productive gap: Your ${worstSkill.name} is sitting at Band ${worstSkill.score}. Receptive skills (Reading/Listening) often climb faster than productive skills (Writing/Speaking). Dedicate 75% of your upcoming sessions to active production.`,
          "Lexical precision: At this level, gains come from collocational naturalness and cohesion, not memorizing rare obscure vocabulary."
        ]
      };
    } else if (status === 'declining') {
      encouragement = {
        badge: "Diagnostic Dip — Regroup & Reload",
        color: "rose",
        icon: TrendingDown,
        title: "A Single Dip is Data, Not Defeat 🛡️",
        phrase: `Your score shifted from Band ${previous?.overall} to ${latest.overall} (${delta}). Even native English speakers and IELTS examiners fluctuate by ±0.5 band depending on unfamiliar topics, cognitive fatigue, and test anxiety.`,
        tactical: [
          "Check test conditions & mental fatigue: Did you take this test after a long exhausting day, late at night, or under distracting noise? Stamina and focus heavily influence reading comprehension speed.",
          `Isolate the point leak: Did ${worstSkill.name} drop due to strict time pressure? If Task 2 took 45 minutes, your Task 1 suffered. Work on a strict 20m/40m timer protocol.`,
          "Do not panic-study: Take a rest day, get good sleep, review the specific answer keys with curiosity, and bounce back stronger on the next run."
        ]
      };
    } else {
      encouragement = {
        badge: "Benchmark Established",
        color: "cyan",
        icon: Sparkles,
        title: "First Benchmark Recorded! 🎯",
        phrase: `You established your baseline at Band ${latest.overall}. Having an honest starting point is the single most important prerequisite for strategic score elevation.`,
        tactical: [
          `Current Gap: You are ${Math.abs(targetGap)} band${Math.abs(targetGap) === 1 ? '' : 's'} away from your Band ${parsedTarget} target.`,
          "Consistency rule: Schedule full timed mocks every 5–7 days rather than daily. Use intermediate days for focused subskill drilling.",
          "Track reflections: Always jot down quick notes about which section felt rushed so your trajectory engine can pinpoint recurring bottlenecks."
        ]
      };
    }

    return {
      count: mockScores.length,
      latest,
      previous,
      delta,
      status,
      bestSkill,
      worstSkill,
      targetGap,
      encouragement
    };
  }, [mockScores, parsedTarget]);

  return (
    <div className="space-y-6">
      
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP HEADER & QUICK METRICS HERO                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-colors shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-theme-accent-subtle text-theme-accent border border-theme-accent-subtle flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-theme-primary tracking-tight">
              Mock Tests & Band Trajectory
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-elevated text-theme-accent font-bold border border-theme-subtle">
              {mockScores.length} Tests Logged
            </span>
          </div>
          <p className="text-xs text-theme-muted max-w-2xl leading-relaxed">
            Record complete IELTS exam simulations, visualize subsection evolution with customizable charts, and leverage examiner coaching insights to break through score plateaus.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Mock Score</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* QUICK STATS CARDS                                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Latest Band */}
        <div className="p-4 rounded-xl bg-theme-card border border-theme-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span>Latest Overall</span>
            <Award className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-theme-accent">
              {analytics.latest ? analytics.latest.overall.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-theme-muted font-mono">
              / 9.0
            </span>
          </div>
          <div className="text-[10px] text-theme-muted truncate">
            {analytics.latest ? analytics.latest.title : 'No tests recorded'}
          </div>
        </div>

        {/* Target Band Gap */}
        <div className="p-4 rounded-xl bg-theme-card border border-theme-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span>Target Band</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-theme-primary">
              {parsedTarget.toFixed(1)}
            </span>
            {analytics.latest && (
              <span className={`text-[11px] font-mono font-bold ${
                analytics.targetGap >= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {analytics.targetGap >= 0 ? 'Achieved 🎯' : `${analytics.targetGap} gap`}
              </span>
            )}
          </div>
          <div className="text-[10px] text-theme-muted">
            {analytics.latest && analytics.targetGap >= 0 ? 'Target Band reached!' : 'Distance to goal'}
          </div>
        </div>

        {/* Velocity / Delta */}
        <div className="p-4 rounded-xl bg-theme-card border border-theme-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span>Trend Velocity</span>
            <Activity className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div className="flex items-center gap-1.5">
            {analytics.delta > 0 && <TrendingUp className="w-5 h-5 text-emerald-400" />}
            {analytics.delta < 0 && <TrendingDown className="w-5 h-5 text-rose-400" />}
            {analytics.delta === 0 && <Minus className="w-5 h-5 text-amber-400" />}
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              analytics.delta > 0 ? 'text-emerald-400' : analytics.delta < 0 ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {analytics.delta > 0 ? `+${analytics.delta}` : analytics.delta < 0 ? `${analytics.delta}` : '0.0'}
            </span>
          </div>
          <div className="text-[10px] text-theme-muted truncate">
            {analytics.status === 'improving' ? 'Upward trajectory' : 
             analytics.status === 'declining' ? 'Temporary dip' : 
             analytics.status === 'stagnant' ? 'Plateauing' : 'Baseline test'}
          </div>
        </div>

        {/* Best Subskill */}
        <div className="p-4 rounded-xl bg-theme-card border border-theme-subtle space-y-1">
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span>Pillar Subskill</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-theme-primary truncate">
              {analytics.bestSkill ? analytics.bestSkill.name : '—'}
            </span>
            <span className="text-sm font-mono font-bold text-theme-accent">
              {analytics.bestSkill ? analytics.bestSkill.score.toFixed(1) : ''}
            </span>
          </div>
          <div className="text-[10px] text-theme-muted truncate">
            {analytics.worstSkill ? `Focus: ${analytics.worstSkill.name} (${analytics.worstSkill.score})` : 'Subsection balance'}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MOTIVATION & ENCOURAGEMENT COACHING ENGINE BANNER          */}
      {/* ────────────────────────────────────────────────────────── */}
      {analytics.encouragement && (
        <div className={`p-5 rounded-2xl border transition-colors shadow-sm ${
          analytics.encouragement.color === 'emerald'
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : analytics.encouragement.color === 'rose'
            ? 'bg-rose-950/20 border-rose-500/30'
            : analytics.encouragement.color === 'amber'
            ? 'bg-amber-950/20 border-amber-500/30'
            : 'bg-cyan-950/20 border-cyan-500/30'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 border-b border-theme-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                analytics.encouragement.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                analytics.encouragement.color === 'rose' ? 'bg-rose-500/20 text-rose-400' :
                analytics.encouragement.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                'bg-cyan-500/20 text-cyan-400'
              }`}>
                {React.createElement(analytics.encouragement.icon, { className: "w-4 h-4" })}
              </div>
              <div>
                <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  analytics.encouragement.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300' :
                  analytics.encouragement.color === 'rose' ? 'bg-rose-500/10 text-rose-300' :
                  analytics.encouragement.color === 'amber' ? 'bg-amber-500/10 text-amber-300' :
                  'bg-cyan-500/10 text-cyan-300'
                }`}>
                  {analytics.encouragement.badge}
                </span>
                <h3 className="text-sm font-bold text-theme-primary mt-1">
                  {analytics.encouragement.title}
                </h3>
              </div>
            </div>
            <span className="text-[11px] text-theme-muted font-mono flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-theme-accent" />
              <span>Examiner Trajectory Diagnostic</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-medium mb-3">
            "{analytics.encouragement.phrase}"
          </p>

          <div className="space-y-1.5 bg-theme-base/60 p-3.5 rounded-xl border border-theme-subtle text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-accent flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3" />
              <span>Recommended Tactical Adjustments</span>
            </span>
            <ul className="space-y-1.5 text-theme-primary">
              {analytics.encouragement.tactical.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-theme-accent font-bold mt-0.5">•</span>
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE GRAPH SECTION                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-6 transition-colors">
        
        {/* Controls Toolbar: Graph Type Picker & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-theme-subtle pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">
              Visualization Mode:
            </span>
            <div className="flex items-center bg-theme-base p-1 rounded-xl border border-theme-subtle">
              <button
                onClick={() => setGraphType('line')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  graphType === 'line'
                    ? 'bg-theme-accent-subtle text-theme-accent-light font-bold border border-theme-accent-subtle shadow-sm'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
                title="Line Graph: Chronological Band Trajectory"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
              
              <button
                onClick={() => setGraphType('bar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  graphType === 'bar'
                    ? 'bg-theme-accent-subtle text-theme-accent-light font-bold border border-theme-accent-subtle shadow-sm'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
                title="Bar Chart: Subsection Column Breakdown"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Bar</span>
              </button>

              <button
                onClick={() => setGraphType('area')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  graphType === 'area'
                    ? 'bg-theme-accent-subtle text-theme-accent-light font-bold border border-theme-accent-subtle shadow-sm'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
                title="Area Chart: Elevation & Stability Gradient"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Area</span>
              </button>

              <button
                onClick={() => setGraphType('radar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  graphType === 'radar'
                    ? 'bg-theme-accent-subtle text-theme-accent-light font-bold border border-theme-accent-subtle shadow-sm'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
                title="Radar Chart: 4-Skill Balance Polygon"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Radar</span>
              </button>
            </div>
          </div>

          {/* Subskill Selector Filter */}
          {graphType !== 'radar' && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'All Skills' },
                { id: 'overall', label: 'Overall Only' },
                { id: 'listening', label: 'Listening' },
                { id: 'reading', label: 'Reading' },
                { id: 'writing', label: 'Writing' },
                { id: 'speaking', label: 'Speaking' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSkillFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    skillFilter === tab.id
                      ? 'bg-theme-elevated text-theme-primary border border-theme-subtle font-bold'
                      : 'text-theme-muted hover:text-theme-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* GRAPH CANVAS RENDERER                                      */}
        {/* ────────────────────────────────────────────────────────── */}
        {mockScores.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-theme-elevated text-theme-muted mx-auto flex items-center justify-center">
              <LineChart className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-theme-primary">No Mock Scores Logged Yet</h4>
            <p className="text-xs text-theme-muted max-w-md mx-auto">
              Simulate a test under timed conditions, input your 4 section scores, and watch your band trajectory come to life with automatic coaching guidance.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-2 px-4 py-2 rounded-xl btn-theme-primary text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Your First Mock Exam</span>
            </button>
          </div>
        ) : (
          <div>
            {graphType === 'line' && (
              <RenderLineChart 
                mockScores={mockScores} 
                targetBand={parsedTarget} 
                skillFilter={skillFilter}
                onSelectMock={setSelectedMock}
                selectedMock={selectedMock}
              />
            )}
            {graphType === 'bar' && (
              <RenderBarChart 
                mockScores={mockScores} 
                targetBand={parsedTarget} 
                skillFilter={skillFilter}
                onSelectMock={setSelectedMock}
                selectedMock={selectedMock}
              />
            )}
            {graphType === 'area' && (
              <RenderAreaChart 
                mockScores={mockScores} 
                targetBand={parsedTarget} 
                skillFilter={skillFilter}
                onSelectMock={setSelectedMock}
                selectedMock={selectedMock}
              />
            )}
            {graphType === 'radar' && (
              <RenderRadarChart 
                mockScores={mockScores} 
                targetBand={parsedTarget} 
                selectedMock={selectedMock || mockScores[mockScores.length - 1]} 
              />
            )}

            {/* Target Band Legend Marker */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-theme-subtle text-xs text-theme-muted">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-theme-accent" />
                  <span className="font-medium text-theme-primary">Overall Band</span>
                </div>
                {(skillFilter === 'all' || skillFilter === 'listening') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-400" />
                    <span>Listening</span>
                  </div>
                )}
                {(skillFilter === 'all' || skillFilter === 'reading') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span>Reading</span>
                  </div>
                )}
                {(skillFilter === 'all' || skillFilter === 'writing') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span>Writing</span>
                  </div>
                )}
                {(skillFilter === 'all' || skillFilter === 'speaking') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-400" />
                    <span>Speaking</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400" />
                  <span className="text-cyan-400 font-mono">Target ({parsedTarget})</span>
                </div>
              </div>

              {selectedMock && (
                <div className="text-[11px] font-mono text-theme-accent bg-theme-base px-2 py-0.5 rounded border border-theme-subtle">
                  Inspecting: {selectedMock.date} — {selectedMock.title} (Overall: {selectedMock.overall})
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* HISTORICAL TEST SCORES TABLE                              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-theme-accent" />
            <h3 className="text-sm font-bold text-theme-primary">
              Simulation History & Test Ledger
            </h3>
          </div>
          <span className="text-xs text-theme-muted font-mono">
            {mockScores.length} records
          </span>
        </div>

        {mockScores.length === 0 ? (
          <div className="py-8 text-center text-xs text-theme-muted">
            No mock records saved yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-theme-subtle text-theme-muted">
                  <th className="py-2.5 px-3 font-semibold">Date & Exam Title</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Listening</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Reading</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Writing</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Speaking</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Overall</th>
                  <th className="py-2.5 px-3 font-semibold">Notes & Bottlenecks</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {mockScores.slice().reverse().map((mock, idx) => {
                  const isSelected = selectedMock?.id === mock.id;
                  return (
                    <tr 
                      key={mock.id}
                      onClick={() => setSelectedMock(mock)}
                      className={`hover:bg-theme-elevated/50 transition cursor-pointer ${
                        isSelected ? 'bg-theme-accent-subtle/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-theme-primary">{mock.title || "IELTS Mock Exam"}</div>
                        <div className="text-[11px] text-theme-muted font-mono">{mock.date}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-400">
                        {mock.listening}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                        {mock.reading}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                        {mock.writing}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-purple-400">
                        {mock.speaking}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md font-mono font-black text-xs bg-theme-accent-subtle text-theme-accent border border-theme-accent-subtle">
                          {mock.overall}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-theme-secondary max-w-xs truncate">
                        {mock.notes || <span className="text-theme-muted italic">No notes</span>}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteMock(mock.id)}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Mock Score"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* LOG MOCK MODAL / DIALOG                                    */}
      {/* ────────────────────────────────────────────────────────── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-theme-card border border-theme-subtle shadow-2xl space-y-5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-theme-subtle pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-theme-accent" />
                <h3 className="font-bold text-base text-theme-primary">
                  Log IELTS Mock Test Simulation
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-theme-muted hover:text-theme-primary text-sm p-1 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitMock} className="space-y-4">
              
              {/* Title & Preset Suggestions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">
                  Exam Title / Source Material
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Cambridge 18 Academic Test 1"
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary text-xs focus:outline-none focus:border-theme-accent"
                />
                
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-theme-muted mr-1">Presets:</span>
                  {MOCK_PRESETS.slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, title: preset })}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-theme-elevated text-theme-secondary hover:text-theme-primary border border-theme-subtle transition"
                    >
                      {preset.replace(" Academic", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">
                  Test Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary text-xs focus:outline-none focus:border-theme-accent"
                />
              </div>

              {/* 4 Subscores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Listening */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-blue-400">
                    Listening
                  </label>
                  <select
                    value={formData.listening}
                    onChange={e => setFormData({ ...formData, listening: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary font-mono font-bold text-xs focus:outline-none focus:border-theme-accent"
                  >
                    {BAND_SCORES.map(b => (
                      <option key={`l_${b}`} value={b}>{b.toFixed(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Reading */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-emerald-400">
                    Reading
                  </label>
                  <select
                    value={formData.reading}
                    onChange={e => setFormData({ ...formData, reading: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary font-mono font-bold text-xs focus:outline-none focus:border-theme-accent"
                  >
                    {BAND_SCORES.map(b => (
                      <option key={`r_${b}`} value={b}>{b.toFixed(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Writing */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-400">
                    Writing
                  </label>
                  <select
                    value={formData.writing}
                    onChange={e => setFormData({ ...formData, writing: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary font-mono font-bold text-xs focus:outline-none focus:border-theme-accent"
                  >
                    {BAND_SCORES.map(b => (
                      <option key={`w_${b}`} value={b}>{b.toFixed(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Speaking */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-purple-400">
                    Speaking
                  </label>
                  <select
                    value={formData.speaking}
                    onChange={e => setFormData({ ...formData, speaking: parseFloat(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary font-mono font-bold text-xs focus:outline-none focus:border-theme-accent"
                  >
                    {BAND_SCORES.map(b => (
                      <option key={`s_${b}`} value={b}>{b.toFixed(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live IELTS Overall Band Calculation Card */}
              <div className="p-3 rounded-xl bg-theme-elevated border border-theme-subtle flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-theme-primary">
                    Calculated Overall Band
                  </div>
                  <div className="text-[10px] text-theme-muted">
                    Official .25 and .75 IELTS rounding rule applied
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-theme-accent">
                    {liveCalculatedBand.toFixed(1)}
                  </span>
                  <span className="text-xs text-theme-muted">/ 9.0</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary">
                  Diagnostic Reflections / Bottlenecks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Lost 5 minutes on Reading Passage 3; Task 2 conclusion was rushed; Speaking Part 2 had good idiomatic language."
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-subtle text-theme-primary text-xs focus:outline-none focus:border-theme-accent resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-theme-elevated text-theme-secondary hover:text-theme-primary text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl btn-theme-primary text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Mock Score</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SVG CHART 1: LINE GRAPH (Band Trajectory)
// ─────────────────────────────────────────────────────────────────
function RenderLineChart({ mockScores, targetBand, skillFilter, onSelectMock, selectedMock }) {
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // X & Y scale
  const minScore = 4.0;
  const maxScore = 9.0;
  const count = mockScores.length;

  const getX = (idx) => {
    if (count <= 1) return padding.left + plotW / 2;
    return padding.left + (idx / (count - 1)) * plotW;
  };

  const getY = (val) => {
    const clamped = Math.max(minScore, Math.min(maxScore, parseFloat(val || 0)));
    const pct = (clamped - minScore) / (maxScore - minScore);
    return padding.top + plotH - pct * plotH;
  };

  const targetY = getY(targetBand);

  // Generate path string for a series
  const buildPath = (key) => {
    if (count === 0) return '';
    return mockScores.map((m, idx) => {
      const x = getX(idx);
      const y = getY(m[key]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const series = [
    { key: 'overall', color: 'var(--color-theme-accent, #f59e0b)', strokeWidth: 3, show: skillFilter === 'all' || skillFilter === 'overall' },
    { key: 'listening', color: '#60a5fa', strokeWidth: 1.8, show: skillFilter === 'all' || skillFilter === 'listening' },
    { key: 'reading', color: '#34d399', strokeWidth: 1.8, show: skillFilter === 'all' || skillFilter === 'reading' },
    { key: 'writing', color: '#fbbf24', strokeWidth: 1.8, show: skillFilter === 'all' || skillFilter === 'writing' },
    { key: 'speaking', color: '#c084fc', strokeWidth: 1.8, show: skillFilter === 'all' || skillFilter === 'speaking' }
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[550px] select-none">
        
        {/* Horizontal Grid lines */}
        {[4, 5, 6, 7, 8, 9].map(score => {
          const y = getY(score);
          return (
            <g key={score}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-current text-theme-muted font-mono text-[10px]"
              >
                {score}.0
              </text>
            </g>
          );
        })}

        {/* Target Band Dashed Benchmark Line */}
        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#22d3ee"
          strokeWidth="1.8"
          strokeDasharray="6 4"
        />
        <text
          x={width - padding.right}
          y={targetY - 6}
          textAnchor="end"
          fill="#22d3ee"
          className="font-mono font-bold text-[10px]"
        >
          Target: {targetBand}
        </text>

        {/* Polyline Series */}
        {series.filter(s => s.show).map(s => (
          <path
            key={s.key}
            d={buildPath(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        ))}

        {/* Data Points */}
        {mockScores.map((m, idx) => {
          const x = getX(idx);
          const y = getY(m.overall);
          const isSelected = selectedMock?.id === m.id;
          return (
            <g 
              key={m.id} 
              className="cursor-pointer group"
              onClick={() => onSelectMock(m)}
            >
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={isSelected ? '#ffffff' : 'var(--color-theme-accent, #f59e0b)'}
                stroke="var(--color-theme-accent, #f59e0b)"
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200 group-hover:r-6"
              />

              {/* Score text label above overall dot */}
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="fill-current text-theme-primary font-mono font-bold text-[10px]"
              >
                {m.overall}
              </text>

              {/* X-axis date label */}
              <text
                x={x}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-current text-theme-muted font-mono text-[9px]"
              >
                {m.date ? m.date.slice(5) : `T${idx+1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SVG CHART 2: BAR CHART (Comparative Subsections)
// ─────────────────────────────────────────────────────────────────
function RenderBarChart({ mockScores, targetBand, skillFilter, onSelectMock, selectedMock }) {
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 45, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const minScore = 0;
  const maxScore = 9.0;
  const count = mockScores.length;

  const getY = (val) => {
    const clamped = Math.max(minScore, Math.min(maxScore, parseFloat(val || 0)));
    return padding.top + plotH - (clamped / maxScore) * plotH;
  };

  const targetY = getY(targetBand);
  const groupWidth = plotW / Math.max(1, count);
  const barGap = 4;

  const skills = [
    { key: 'listening', color: '#60a5fa', name: 'L' },
    { key: 'reading', color: '#34d399', name: 'R' },
    { key: 'writing', color: '#fbbf24', name: 'W' },
    { key: 'speaking', color: '#c084fc', name: 'S' }
  ];

  const activeSkills = skillFilter === 'overall' ? [] : skills.filter(s => skillFilter === 'all' || skillFilter === s.key);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[550px] select-none">
        
        {/* Horizontal Grid lines */}
        {[2, 4, 6, 8].map(score => {
          const y = getY(score);
          return (
            <g key={score}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-current text-theme-muted font-mono text-[10px]"
              >
                {score}.0
              </text>
            </g>
          );
        })}

        {/* Target Benchmark Line */}
        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Columns */}
        {mockScores.map((m, gIdx) => {
          const groupX = padding.left + gIdx * groupWidth;
          const isSelected = selectedMock?.id === m.id;

          if (skillFilter === 'overall') {
            // Single Overall Column
            const barW = Math.min(40, groupWidth * 0.5);
            const bx = groupX + (groupWidth - barW) / 2;
            const by = getY(m.overall);
            const bh = padding.top + plotH - by;
            return (
              <g key={m.id} className="cursor-pointer" onClick={() => onSelectMock(m)}>
                <rect
                  x={bx}
                  y={by}
                  width={barW}
                  height={bh}
                  rx={4}
                  fill="var(--color-theme-accent, #f59e0b)"
                  opacity={isSelected ? 1 : 0.85}
                  className="transition hover:opacity-100"
                />
                <text
                  x={bx + barW / 2}
                  y={by - 6}
                  textAnchor="middle"
                  className="fill-current text-theme-primary font-mono font-bold text-[10px]"
                >
                  {m.overall}
                </text>
                <text
                  x={bx + barW / 2}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="fill-current text-theme-muted font-mono text-[9px]"
                >
                  {m.date ? m.date.slice(5) : `T${gIdx+1}`}
                </text>
              </g>
            );
          }

          // 4-Skill Multi Bar
          const numBars = activeSkills.length;
          const totalBarsW = Math.min(groupWidth * 0.8, numBars * 18);
          const singleW = (totalBarsW - (numBars - 1) * barGap) / numBars;
          const startX = groupX + (groupWidth - totalBarsW) / 2;

          return (
            <g key={m.id} className="cursor-pointer" onClick={() => onSelectMock(m)}>
              {activeSkills.map((s, sIdx) => {
                const bx = startX + sIdx * (singleW + barGap);
                const val = m[s.key] || 0;
                const by = getY(val);
                const bh = padding.top + plotH - by;
                return (
                  <rect
                    key={s.key}
                    x={bx}
                    y={by}
                    width={singleW}
                    height={bh}
                    rx={3}
                    fill={s.color}
                    opacity={isSelected ? 1 : 0.8}
                    className="transition hover:opacity-100"
                  />
                );
              })}
              
              {/* Overall badge above the cluster */}
              <text
                x={groupX + groupWidth / 2}
                y={getY(m.overall) - 10}
                textAnchor="middle"
                className="fill-current text-theme-accent font-mono font-black text-[10px]"
              >
                ★ {m.overall}
              </text>

              <text
                x={groupX + groupWidth / 2}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-current text-theme-muted font-mono text-[9px]"
              >
                {m.date ? m.date.slice(5) : `T${gIdx+1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SVG CHART 3: AREA CHART (Volume Elevation)
// ─────────────────────────────────────────────────────────────────
function RenderAreaChart({ mockScores, targetBand, onSelectMock, selectedMock }) {
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const minScore = 4.0;
  const maxScore = 9.0;
  const count = mockScores.length;

  const getX = (idx) => {
    if (count <= 1) return padding.left + plotW / 2;
    return padding.left + (idx / (count - 1)) * plotW;
  };

  const getY = (val) => {
    const clamped = Math.max(minScore, Math.min(maxScore, parseFloat(val || 0)));
    const pct = (clamped - minScore) / (maxScore - minScore);
    return padding.top + plotH - pct * plotH;
  };

  const targetY = getY(targetBand);
  const bottomY = padding.top + plotH;

  // Build Area Path
  let areaPath = '';
  let linePath = '';
  if (count > 0) {
    const points = mockScores.map((m, idx) => ({ x: getX(idx), y: getY(m.overall) }));
    linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${bottomY} L ${points[0].x.toFixed(1)} ${bottomY} Z`;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[550px] select-none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-theme-accent, #f59e0b)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-theme-accent, #f59e0b)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[4, 5, 6, 7, 8, 9].map(score => {
          const y = getY(score);
          return (
            <line
              key={score}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Benchmark line */}
        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          stroke="#22d3ee"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />

        {/* Filled Area */}
        {areaPath && (
          <path d={areaPath} fill="url(#areaGrad)" />
        )}

        {/* Boundary Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-theme-accent, #f59e0b)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Dots */}
        {mockScores.map((m, idx) => {
          const x = getX(idx);
          const y = getY(m.overall);
          const isSelected = selectedMock?.id === m.id;
          return (
            <g key={m.id} className="cursor-pointer" onClick={() => onSelectMock(m)}>
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4.5}
                fill="#ffffff"
                stroke="var(--color-theme-accent, #f59e0b)"
                strokeWidth="2.5"
              />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="fill-current text-theme-primary font-mono font-bold text-[10px]"
              >
                {m.overall}
              </text>
              <text
                x={x}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="fill-current text-theme-muted font-mono text-[9px]"
              >
                {m.date ? m.date.slice(5) : `T${idx+1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SVG CHART 4: RADAR / SPIDER CHART (4-Skill Balance Polygon)
// ─────────────────────────────────────────────────────────────────
function RenderRadarChart({ mockScores, targetBand, selectedMock }) {
  const size = 320;
  const center = size / 2;
  const radius = center - 45;
  const maxScore = 9.0;

  // 4 Axes: Top (Listening), Right (Reading), Bottom (Writing), Left (Speaking)
  const axes = [
    { name: 'Listening', key: 'listening', angle: -Math.PI / 2, color: '#60a5fa' },
    { name: 'Reading', key: 'reading', angle: 0, color: '#34d399' },
    { name: 'Writing', key: 'writing', angle: Math.PI / 2, color: '#fbbf24' },
    { name: 'Speaking', key: 'speaking', angle: Math.PI, color: '#c084fc' }
  ];

  // Helper to convert (value, angle) to (x, y)
  const getPoint = (val, angle) => {
    const r = (parseFloat(val || 0) / maxScore) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Build Target Band Polygon
  const targetPoints = axes.map(a => getPoint(targetBand, a.angle));
  const targetPolygon = targetPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Build Selected Mock Polygon
  const mockPoints = axes.map(a => getPoint(selectedMock ? selectedMock[a.key] : 0, a.angle));
  const mockPolygon = mockPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
      <div className="relative">
        <svg width={size} height={size} className="select-none">
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-theme-accent, #f59e0b)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-theme-accent, #f59e0b)" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Concentric Circles for Band 3, 5, 7, 9 */}
          {[3, 5, 7, 9].map(score => {
            const r = (score / maxScore) * radius;
            return (
              <g key={score}>
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.12}
                  strokeDasharray={score === 9 ? 'none' : '3 3'}
                />
                <text
                  x={center + 3}
                  y={center - r + 9}
                  className="fill-current text-theme-muted font-mono text-[8px]"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* 4 Axis Lines */}
          {axes.map(a => {
            const end = getPoint(9.0, a.angle);
            return (
              <line
                key={a.name}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
            );
          })}

          {/* Target Band Benchmark Polygon */}
          <polygon
            points={targetPolygon}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Mock Test Polygon */}
          {selectedMock && (
            <polygon
              points={mockPolygon}
              fill="url(#radarGrad)"
              stroke="var(--color-theme-accent, #f59e0b)"
              strokeWidth="2.5"
            />
          )}

          {/* Vertex Circles */}
          {selectedMock && mockPoints.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="#ffffff"
              stroke={axes[idx].color}
              strokeWidth="2"
            />
          ))}

          {/* Axis Labels */}
          {axes.map(a => {
            const end = getPoint(9.0, a.angle);
            let textAnchor = 'middle';
            let dy = 4;
            if (a.angle === 0) { textAnchor = 'start'; end.x += 8; }
            else if (a.angle === Math.PI) { textAnchor = 'end'; end.x -= 8; }
            else if (a.angle === -Math.PI / 2) { dy = -8; }
            else if (a.angle === Math.PI / 2) { dy = 16; }

            const val = selectedMock ? selectedMock[a.key] : 0;

            return (
              <g key={a.name}>
                <text
                  x={end.x}
                  y={end.y + dy}
                  textAnchor={textAnchor}
                  className="fill-current text-theme-primary font-bold text-xs"
                >
                  {a.name}
                </text>
                <text
                  x={end.x}
                  y={end.y + dy + 11}
                  textAnchor={textAnchor}
                  fill={a.color}
                  className="font-mono font-bold text-[10px]"
                >
                  Band {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Radar Diagnostic Explainer Card */}
      <div className="max-w-xs space-y-3 p-4 rounded-xl bg-theme-base border border-theme-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-theme-primary">
          <Sliders className="w-4 h-4 text-theme-accent" />
          <span>Skill Symmetry Diagnostic</span>
        </div>
        <p className="text-theme-muted leading-relaxed">
          The closer this polygon is to an equilateral diamond, the more balanced your 4 subskills are.
        </p>
        {selectedMock && (
          <div className="space-y-1.5 pt-2 border-t border-theme-subtle">
            <div className="flex justify-between">
              <span className="text-theme-secondary">Receptive Avg (L+R):</span>
              <span className="font-mono font-bold text-theme-primary">
                {(((parseFloat(selectedMock.listening) || 0) + (parseFloat(selectedMock.reading) || 0)) / 2).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-theme-secondary">Productive Avg (W+S):</span>
              <span className="font-mono font-bold text-theme-primary">
                {(((parseFloat(selectedMock.writing) || 0) + (parseFloat(selectedMock.speaking) || 0)) / 2).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-theme-subtle font-semibold">
              <span className="text-theme-muted">Official Overall:</span>
              <span className="font-mono font-black text-theme-accent">
                Band {selectedMock.overall}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
