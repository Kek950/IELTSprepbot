import React, { useState, useEffect } from 'react';
import { PenTool, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Award, Sparkles, BookOpen, GraduationCap, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TASK_PROMPTS, SAMPLE_ESSAYS, calculateIeltsBand, GEMINI_MODELS } from '../../data/mockData';

export default function WritingView({ editorFont = 'sans', targetBand = '7.5' }) {
  const { user, updateConfig, addSubmission } = useAuth();
  const [taskType, setTaskType] = useState('task2');
  const [promptId, setPromptId] = useState('t2_gap');
  const [selectedEnrolledClass, setSelectedEnrolledClass] = useState(user?.enrolled_classes?.[0]?.name || 'Personal Practice');
  const [customPrompt, setCustomPrompt] = useState('');
  const [essayText, setEssayText] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [activeModel, setActiveModel] = useState(user?.model || 'gemini-2.5-flash');

  useEffect(() => {
    if (user?.model) {
      setActiveModel(user.model);
    }
  }, [user?.model]);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(40 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    setTimerSeconds(taskType === 'task1' ? 20 * 60 : 40 * 60);
    setTimerRunning(false);
    const list = TASK_PROMPTS[taskType] || [];
    if (list.length > 0 && promptId !== 'custom') {
      setPromptId(list[0].id);
    }
  }, [taskType]);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      alert("⏰ Time is up! Submit your essay for AI evaluation.");
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const activePrompt = promptId === 'custom'
    ? customPrompt
    : TASK_PROMPTS[taskType]?.find(p => p.id === promptId)?.prompt || '';

  const words = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const minRequired = taskType === 'task1' ? 150 : 250;

  const handleLoadSample = (sampleKey) => {
    const s = SAMPLE_ESSAYS[sampleKey];
    if (!s) return;
    setTaskType(s.taskType);
    setPromptId(s.promptId);
    setEssayText(s.text);
    setLatestAssessment(null);
  };

  const handleAssess = async () => {
    if (!essayText.trim()) {
      alert("Please write or paste an essay first.");
      return;
    }
    if (words < 40) {
      alert("Essay is too short to evaluate. Write at least one paragraph.");
      return;
    }

    setLoading(true);
    try {
      const apiKey = user?.api_key || "";
      const model = activeModel || user?.model || "gemini-2.5-flash";

      let evalData = null;

      if (apiKey.startsWith("AIza")) {
        evalData = await runGeminiEvaluation(essayText, taskType, activePrompt, apiKey, model);
      } else {
        await new Promise(r => setTimeout(r, 1200));
        evalData = generateHeuristicEvaluation(essayText, taskType, words, model);
      }

      setLatestAssessment(evalData);

      // Save to user's real account history
      addSubmission({
        id: `sub_${Date.now()}`,
        class_name: selectedEnrolledClass,
        task_type: taskType,
        prompt: activePrompt,
        essay: essayText,
        band_score: evalData.band_score,
        manual_score: null,
        teacher_feedback: null,
        task_achievement: evalData.task_achievement,
        coherence_cohesion: evalData.coherence_cohesion,
        lexical_resource: evalData.lexical_resource,
        grammatical_range: evalData.grammatical_range,
        strengths: evalData.strengths,
        suggestions: evalData.suggestions,
        submitted_at: "Just now",
        tokens_used: evalData.tokens_used || 1280
      });

    } catch (err) {
      alert("Evaluation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runGeminiEvaluation = async (essay, type, prompt, key, initialModel) => {
    const modelsToTry = [initialModel];
    const fallbacks = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
    for (const fb of fallbacks) {
      if (!modelsToTry.includes(fb)) modelsToTry.push(fb);
    }

    const systemPrompt = `You are an official IELTS writing examiner. Assess the following writing task response based on Cambridge criteria. Provide response as JSON:
{
  "band_score": 7.5,
  "task_achievement": {"score": 7, "feedback": "..."},
  "coherence_cohesion": {"score": 8, "feedback": "..."},
  "lexical_resource": {"score": 7, "feedback": "..."},
  "grammatical_range": {"score": 8, "feedback": "..."},
  "strengths": ["...", "..."],
  "suggestions": ["...", "...", "..."],
  "tokens_used": 1350
}`;

    let lastError = null;
    for (const attemptModel of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${attemptModel}:generateContent?key=${key}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: `Task Type: ${type}\nPrompt: ${prompt}\n\nEssay:\n${essay}` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          // If permanent API key auth error, fail immediately
          if ((res.status === 400 && errMsg.toLowerCase().includes("api key")) || res.status === 403) {
            throw new Error(`Gemini API Key Error: ${errMsg}`);
          }
          // Otherwise try next fallback in the chain
          lastError = new Error(`${attemptModel}: ${errMsg}`);
          continue;
        }

        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(raw);
        parsed.model_used = attemptModel === initialModel 
          ? `${attemptModel} (Live API)` 
          : `${attemptModel} (Fallback from ${initialModel})`;
        return parsed;
      } catch (e) {
        if (e.message?.includes("Gemini API Key Error")) throw e;
        lastError = e;
      }
    }
    throw lastError || new Error("All model endpoints failed");
  };

  const generateHeuristicEvaluation = (text, type, count, model) => {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const academicTokens = ["furthermore", "moreover", "consequently", "nevertheless", "substantially", "predicament", "diminished", "disenfranchisement", "mitigate", "rehabilitation", "recidivism", "indispensable", "disparity"];
    const matches = academicTokens.filter(w => text.toLowerCase().includes(w));

    let tr = 7;
    let cc = 7;
    let lr = 7;
    let gra = 7;

    if (count < minRequired) tr = Math.max(5, tr - 1.5);
    else if (count >= minRequired + 30) tr = Math.min(8.5, tr + 0.5);

    if (paragraphs.length >= 3 && paragraphs.length <= 5) cc = Math.min(8.5, cc + 0.5);
    else cc = Math.max(5.5, cc - 1.0);

    if (matches.length >= 4) lr = 8;
    else if (matches.length >= 2) lr = 7;
    else lr = 6;

    const overall = calculateIeltsBand(tr, cc, lr, gra);

    return {
      band_score: overall,
      task_achievement: {
        score: tr,
        feedback: count >= minRequired
          ? `Thorough response meeting word count criteria (${count} words). Key arguments are well-developed.`
          : `Under minimum length penalty (${count}/${minRequired} words). Ensure all requirements are fully addressed.`
      },
      coherence_cohesion: {
        score: cc,
        feedback: `Divided into ${paragraphs.length} distinct paragraphs with effective cohesive links and logical flow.`
      },
      lexical_resource: {
        score: lr,
        feedback: `Employed ${matches.length} academic discourse markers and appropriate collocations.`
      },
      grammatical_range: {
        score: gra,
        feedback: `Good syntactic variety of complex and compound sentences with strong grammatical accuracy.`
      },
      strengths: [
        "Coherent thesis statement and clear position maintained throughout.",
        "Appropriate paragraph development with supporting evidence.",
        "Formal academic register with natural lexical collocations."
      ],
      suggestions: [
        "Introduce conditional clauses (e.g. 'Were governments to...') to aim for Band 8.5+.",
        "Refine paragraph transitions to feel more organic rather than mechanical.",
        "Ensure conclusions summarize key findings without copying introductory phrasing verbatim."
      ],
      model_used: `${model} (Simulated Cambridge Examiner)`,
      tokens_used: 1240
    };
  };

  const timerMin = Math.floor(timerSeconds / 60);
  const timerSec = timerSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-theme-card border border-theme-subtle">
        <div>
          <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
            <span>Writing Studio & AI Examiner</span>
            <span className="text-xs font-mono font-normal text-theme-muted">
              [{user?.phone_number}]
            </span>
          </h2>
          <p className="text-xs text-theme-secondary mt-0.5">
            Submit essays to receive instant Cambridge-standard band scores and line-by-line diagnostics.
          </p>
        </div>

        {/* Task Switcher & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-xl bg-theme-surface border border-theme-subtle">
            <button
              onClick={() => setTaskType('task1')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                taskType === 'task1' ? 'btn-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Task 1 (Report)
            </button>
            <button
              onClick={() => setTaskType('task2')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                taskType === 'task2' ? 'btn-theme-primary shadow-sm' : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Task 2 (Essay)
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-subtle font-mono text-xs">
            <span className="text-theme-accent font-bold">
              {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
            </span>
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-1 text-theme-secondary hover:text-theme-primary transition"
              title={timerRunning ? "Pause timer" : "Start timer"}
            >
              {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(taskType === 'task1' ? 20 * 60 : 40 * 60);
              }}
              className="p-1 text-theme-muted hover:text-theme-primary transition"
              title="Reset timer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Class Target & Prompt Picker */}
          <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary uppercase tracking-wider block">
                  Submission Target Context:
                </label>
                <select
                  value={selectedEnrolledClass}
                  onChange={(e) => setSelectedEnrolledClass(e.target.value)}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                >
                  <option value="Personal Self-Practice">Personal Self-Practice</option>
                  {user?.enrolled_classes?.map(c => (
                    <option key={c.id} value={c.name}>Class: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary uppercase tracking-wider block">
                  Exam Topic:
                </label>
                <select
                  value={promptId}
                  onChange={(e) => setPromptId(e.target.value)}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent"
                >
                  {TASK_PROMPTS[taskType]?.map(p => (
                    <option key={p.id} value={p.id}>[{p.type}] {p.title}</option>
                  ))}
                  <option value="custom">✏️ Custom Prompt (Enter your own)...</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary uppercase tracking-wider flex items-center justify-between">
                  <span>AI Model:</span>
                  <span className="text-[10px] text-theme-accent font-mono">
                    {GEMINI_MODELS.find(m => m.id === activeModel)?.tier === 'frontier' ? 'Frontier' : 'Active'}
                  </span>
                </label>
                <select
                  value={activeModel}
                  onChange={async (e) => {
                    const newModel = e.target.value;
                    setActiveModel(newModel);
                    if (updateConfig) {
                      await updateConfig(user?.api_key || '', newModel);
                    }
                  }}
                  className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-2.5 border border-theme-subtle outline-none focus:border-theme-accent font-mono truncate"
                  title="Choose active Gemini model for essay assessment"
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.tier === 'frontier' ? '⭐ ' : ''}{m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {promptId === 'custom' && (
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Type your IELTS prompt here..."
                rows={3}
                className="w-full bg-theme-elevated text-theme-primary text-xs rounded-xl p-3 border border-theme-subtle outline-none focus:border-theme-accent"
              />
            )}

            <div className="p-3 bg-theme-elevated/70 rounded-xl border border-theme-subtle text-xs text-theme-primary leading-relaxed italic">
              "{activePrompt}"
            </div>
          </div>

          {/* Editor Area */}
          <div className="p-4 rounded-2xl bg-theme-card border border-theme-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-theme-secondary uppercase tracking-wider">
                Candidate Response:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-theme-primary">
                  {words} words
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-theme-accent font-bold">
                  🎯 Target: Band {targetBand}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    words === 0
                      ? 'bg-theme-elevated text-theme-muted'
                      : words < minRequired
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {words === 0 ? `Min: ${minRequired}w` : words < minRequired ? `${minRequired - words}w needed` : `Length Met`}
                </span>
              </div>
            </div>

            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Write or paste your essay here..."
              rows={14}
              className={`w-full bg-theme-elevated text-theme-primary text-xs sm:text-sm rounded-xl p-4 border border-theme-subtle outline-none focus:border-theme-accent leading-relaxed resize-y ${
                editorFont === 'serif' ? 'font-serif' : editorFont === 'mono' ? 'font-mono' : 'font-sans'
              }`}
            />

            {/* Quick Sample Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-theme-subtle">
              <div className="flex items-center gap-1.5 text-xs text-theme-secondary">
                <span>Load Sample:</span>
                <button
                  onClick={() => handleLoadSample('band65')}
                  className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-theme-secondary text-xs transition border border-theme-subtle"
                >
                  Band 6.5
                </button>
                <button
                  onClick={() => handleLoadSample('band75')}
                  className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-theme-accent text-xs transition border border-theme-subtle"
                >
                  Band 7.5
                </button>
                <button
                  onClick={() => handleLoadSample('band85')}
                  className="px-2.5 py-1 rounded-lg bg-theme-elevated hover:bg-theme-surface text-emerald-400 text-xs transition border border-theme-subtle"
                >
                  Band 8.5
                </button>
              </div>

              <button
                onClick={() => { setEssayText(''); setLatestAssessment(null); }}
                className="text-xs text-theme-muted hover:text-theme-primary transition"
              >
                Clear Editor
              </button>
            </div>
          </div>

          {/* Assess Action */}
          <button
            onClick={handleAssess}
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-theme-primary text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>Grading with Gemini AI Examiner...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Assess Essay & Save to Account History</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Output Column */}
        <div className="lg:col-span-5 space-y-4">
          {latestAssessment ? (
            <div className="p-6 rounded-2xl bg-theme-card border border-theme-accent-subtle shadow-xl space-y-5 animate-fadeIn">
              {/* Score Header */}
              <div className="flex items-center justify-between pb-4 border-b border-theme-subtle">
                <div>
                  <span className="text-xs uppercase tracking-wider text-theme-muted font-semibold block">
                    Overall Band Score
                  </span>
                  <div className="text-xs text-theme-accent font-mono mt-0.5">
                    {latestAssessment.model_used}
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl btn-theme-primary flex items-center justify-center font-black text-2xl shadow-md">
                  {latestAssessment.band_score.toFixed(1)}
                </div>
              </div>

              {/* 4 Criteria Scores */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-primary block">
                  Official Criteria Breakdown
                </span>

                <div className="p-3 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                    <span>Task Achievement / Response</span>
                    <span className="text-theme-accent font-mono">{latestAssessment.task_achievement?.score}/9</span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    {latestAssessment.task_achievement?.feedback}
                  </p>
                </div>

                <div className="p-3 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                    <span>Coherence & Cohesion</span>
                    <span className="text-theme-accent font-mono">{latestAssessment.coherence_cohesion?.score}/9</span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    {latestAssessment.coherence_cohesion?.feedback}
                  </p>
                </div>

                <div className="p-3 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                    <span>Lexical Resource</span>
                    <span className="text-theme-accent font-mono">{latestAssessment.lexical_resource?.score}/9</span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    {latestAssessment.lexical_resource?.feedback}
                  </p>
                </div>

                <div className="p-3 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                    <span>Grammatical Range & Accuracy</span>
                    <span className="text-theme-accent font-mono">{latestAssessment.grammatical_range?.score}/9</span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    {latestAssessment.grammatical_range?.feedback}
                  </p>
                </div>
              </div>

              {/* Strengths */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Strengths</span>
                </span>
                <ul className="space-y-1 text-xs text-theme-secondary">
                  {latestAssessment.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Suggestions for Improvement</span>
                </span>
                <ul className="space-y-1 text-xs text-theme-secondary">
                  {latestAssessment.suggestions?.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-theme-accent font-bold">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-theme-card border border-theme-subtle text-center space-y-3">
              <Award className="w-10 h-10 text-theme-muted mx-auto" />
              <h3 className="font-bold text-sm text-theme-primary">Examiner Diagnostic Report</h3>
              <p className="text-xs text-theme-secondary max-w-xs mx-auto leading-relaxed">
                Write or load a sample essay on the left and click <strong>Assess Essay</strong>. Your evaluation will appear here and save to your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
