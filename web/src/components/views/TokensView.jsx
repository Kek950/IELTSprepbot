import React, { useState } from 'react';
import { 
  Cpu, DollarSign, Activity, Zap, CheckCircle2, ShieldCheck, 
  Key, ExternalLink, ArrowRight, Copy, Check, Eye, EyeOff, 
  AlertCircle, Sparkles, RefreshCw, HelpCircle, Lock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GEMINI_MODELS } from '../../data/mockData';

export default function TokensView() {
  const { user, updateConfig } = useAuth();
  
  // Safe token extraction guarding against undefined / missing backend keys
  const rawTokens = user?.tokens || {};
  const todayTokens = Number(rawTokens.today ?? rawTokens.today_tokens ?? 0);
  const monthTokens = Number(rawTokens.month ?? rawTokens.month_tokens ?? 0);
  const totalTokens = Number(rawTokens.total ?? rawTokens.total_tokens ?? 0);
  const totalCalls = Number(rawTokens.calls ?? rawTokens.total_calls ?? 0);
  const recentLogs = Array.isArray(rawTokens.recent) ? rawTokens.recent : [];

  const model = user?.model || "gemini-2.5-flash";
  const userApiKey = (user?.api_key || "").trim();
  const hasApiKey = Boolean(userApiKey && userApiKey.length > 5);

  // Form state for inline API key setup
  const [inputKey, setInputKey] = useState(userApiKey);
  const [selectedModel, setSelectedModel] = useState(model);
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedStep, setCopiedStep] = useState(false);

  const handleSaveKey = async (e) => {
    if (e) e.preventDefault();
    const cleanKey = inputKey.trim();
    if (!cleanKey) {
      setErrorMsg("Please enter a valid Google Gemini API key (starts with AIza...).");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      if (updateConfig) {
        await updateConfig(cleanKey, selectedModel);
      }
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save API key. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputKey(text.trim());
      }
    } catch (e) {
      // Clipboard permissions denied
    }
  };

  // Masked key for security preview
  const maskedKey = userApiKey
    ? `${userApiKey.slice(0, 6)}••••••••••••••••${userApiKey.slice(-4)}`
    : "";

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          STATE 1: USER HAS NOT SUBMITTED AN API KEY YET
          Show comprehensive Step-by-Step Instructions & Activation Form
         ───────────────────────────────────────────────────────────── */}
      {(!hasApiKey || isEditing) ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Banner with Alert */}
          <div className="p-6 rounded-2xl bg-theme-surface border border-theme-subtle space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-theme-primary">
                      Google Gemini API Key Required
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Action Needed
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-theme-muted mt-1 max-w-2xl">
                    You haven’t connected your Google Gemini API key yet. Connect your key to unlock real-time token telemetry, certified IELTS rubric grading, and AI examiner feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono shrink-0">
                <DollarSign className="w-3.5 h-3.5" />
                <span>100% Free • No Credit Card</span>
              </div>
            </div>

            {hasApiKey && isEditing && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-theme-muted hover:text-theme-primary underline"
                >
                  Cancel & Return to Telemetry Dashboard
                </button>
              </div>
            )}
          </div>

          {/* 4-Step Visual Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-theme-accent/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-theme-accent-subtle text-theme-accent text-xs font-bold flex items-center justify-center font-mono">
                    1
                  </span>
                  <ExternalLink className="w-4 h-4 text-theme-muted" />
                </div>
                <h3 className="font-bold text-sm text-theme-primary">Go to AI Studio</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Open Google AI Studio. Sign in with any regular Google / Gmail account. No credit card or billing verification is required.
                </p>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl btn-theme-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Open Google AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-theme-accent/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-theme-accent-subtle text-theme-accent text-xs font-bold flex items-center justify-center font-mono">
                    2
                  </span>
                  <Sparkles className="w-4 h-4 text-theme-accent" />
                </div>
                <h3 className="font-bold text-sm text-theme-primary">Create Your API Key</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Click the blue <strong className="text-theme-primary">"Create API key"</strong> button in the top corner. Select or create any project. Google will generate your key instantly.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-center font-semibold">
                Takes ~5 seconds
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-theme-accent/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-theme-accent-subtle text-theme-accent text-xs font-bold flex items-center justify-center font-mono">
                    3
                  </span>
                  <Copy className="w-4 h-4 text-theme-muted" />
                </div>
                <h3 className="font-bold text-sm text-theme-primary">Copy the Secret Key</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Copy the generated string. It begins with <code className="text-theme-accent font-bold">AIzaSy...</code> and contains 39 characters.
                </p>
              </div>
              <div className="text-[11px] font-mono text-theme-muted bg-theme-elevated px-2.5 py-1.5 rounded-lg border border-theme-subtle text-center truncate">
                AIzaSy...xxxxxxxx
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle flex flex-col justify-between space-y-4 hover:border-theme-accent/50 transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-theme-accent-subtle text-theme-accent text-xs font-bold flex items-center justify-center font-mono">
                    4
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="font-bold text-sm text-theme-primary">Connect & Activate</h3>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Paste the key into the input form below and click <strong className="text-theme-primary">Connect API Key</strong>. Your token telemetry will activate immediately.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-theme-accent text-center flex items-center justify-center gap-1">
                <span>Form is right below</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Inline Key Connection Form */}
          <div className="p-6 rounded-2xl bg-theme-card border border-theme-accent/30 shadow-lg space-y-5">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-theme-primary flex items-center gap-2">
                <Zap className="w-4 h-4 text-theme-accent" />
                <span>Connect Google Gemini Key Now</span>
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Your key is stored securely, isolated to your account, and never shared.
              </p>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary flex items-center justify-between">
                  <span>Gemini API Key:</span>
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="text-[11px] text-theme-accent hover:underline flex items-center gap-1 font-normal"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Paste from Clipboard</span>
                  </button>
                </label>

                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    autoFocus
                    className="w-full bg-theme-base text-theme-primary text-xs sm:text-sm rounded-xl pl-4 pr-10 py-3 border border-theme-subtle outline-none focus:border-theme-accent font-mono transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-secondary block">
                  Select Evaluation Model:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {GEMINI_MODELS.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        selectedModel === m.id
                          ? "bg-theme-elevated border-theme-accent font-bold ring-1 ring-theme-accent text-theme-primary"
                          : "bg-theme-base border-theme-subtle text-theme-secondary hover:border-theme-strong"
                      }`}
                    >
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-[10px] text-theme-muted font-mono">{m.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Google Gemini API Key activated successfully! Loading telemetry...</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-theme-primary text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Zap className="w-4 h-4" />
                  <span>{submitting ? "Connecting Key..." : "Connect & Activate API Key"}</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-theme-muted">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Isolated BYOK</span>
                  </span>
                  <span>•</span>
                  <span>Free Tier: 15 RPM / 1M TPM</span>
                </div>
              </div>
            </form>
          </div>

          {/* Quick FAQ & Tips */}
          <div className="p-6 rounded-2xl bg-theme-surface border border-theme-subtle space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="font-bold text-theme-primary block">Is Google Gemini really free?</span>
                <p className="text-theme-muted leading-relaxed">
                  Yes. Google AI Studio provides a free tier with 15 requests/minute and 1,000,000 tokens/minute for non-commercial and learning workloads at $0.00 cost.
                </p>
              </div>

              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="font-bold text-theme-primary block">How many essays can I grade?</span>
                <p className="text-theme-muted leading-relaxed">
                  Each standard IELTS Task 1 or Task 2 essay assessment consumes approximately 1,200 tokens. With the free tier, you can evaluate hundreds of essays per day.
                </p>
              </div>

              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="font-bold text-theme-primary block">Can I set this in Telegram?</span>
                <p className="text-theme-muted leading-relaxed">
                  Yes. You can open <strong>@IELTSgenius_bot</strong> in Telegram and type <code className="text-theme-accent">/setup</code> or <code className="text-theme-accent">/start</code> anytime to configure your key.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            STATE 2: API KEY IS CONNECTED & ACTIVE
            Show Full Telemetry & Token Usage Dashboard
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6 animate-fadeIn">
          {/* Banner */}
          <div className="p-5 rounded-2xl bg-theme-surface border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
                  <span>API Token Telemetry & Usage</span>
                  <span className="text-xs font-mono font-normal text-theme-accent">
                    [{user?.phone_number || user?.nickname || 'Connected'}]
                  </span>
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Key Active</span>
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Monitoring live token consumption on your isolated Google Gemini API key.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-theme-card hover:bg-theme-elevated text-theme-primary border border-theme-subtle text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Key className="w-3.5 h-3.5 text-theme-accent" />
                <span>Change Key</span>
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold font-mono">
                <DollarSign className="w-3.5 h-3.5" />
                <span>$0.00 Host Cost (BYOK Free Tier)</span>
              </div>
            </div>
          </div>

          {/* Key Summary Strip */}
          <div className="p-3.5 bg-theme-card rounded-xl border border-theme-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono text-theme-secondary">
              <Key className="w-3.5 h-3.5 text-theme-accent" />
              <span>Active Key:</span>
              <span className="font-bold text-theme-primary">{maskedKey}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-theme-muted font-mono">
              <span>Model: <strong className="text-theme-accent">{model}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">15 RPM / 1M TPM</span>
            </div>
          </div>

          {/* Metrics Cards — Completely Protected against undefined values */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle space-y-1 transition-colors">
              <span className="text-xs text-theme-muted font-semibold block">Tokens Used Today</span>
              <div className="text-2xl font-black font-mono text-theme-primary">
                {todayTokens.toLocaleString()}
              </div>
              <span className="text-[11px] text-theme-muted">
                ~{Math.round(todayTokens / 1200)} essays graded
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle space-y-1 transition-colors">
              <span className="text-xs text-theme-muted font-semibold block">Tokens This Month</span>
              <div className="text-2xl font-black font-mono text-theme-accent">
                {monthTokens.toLocaleString()}
              </div>
              <span className="text-[11px] text-theme-muted">Monthly billing cycle</span>
            </div>

            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle space-y-1 transition-colors">
              <span className="text-xs text-theme-muted font-semibold block">All-Time Tokens</span>
              <div className="text-2xl font-black font-mono text-theme-accent">
                {totalTokens.toLocaleString()}
              </div>
              <span className="text-[11px] text-theme-muted">Lifetime usage</span>
            </div>

            <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle space-y-1 transition-colors">
              <span className="text-xs text-theme-muted font-semibold block">Total Evaluations</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {totalCalls.toLocaleString()}
              </div>
              <span className="text-[11px] text-theme-muted">Assessed essays</span>
            </div>
          </div>

          {/* Provider & Model Specs */}
          <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-4 transition-colors">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-theme-accent" />
              <span>Active Provider & Rate Limit Allocation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="text-theme-muted font-bold block">Active Model</span>
                <span className="font-mono text-theme-primary text-sm block">{model}</span>
                <span className="text-[11px] text-theme-muted">Optimized for IELTS Rubric JSON output</span>
              </div>

              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="text-theme-muted font-bold block">Free Tier Limits</span>
                <span className="font-mono text-emerald-400 text-sm block">15 RPM / 1M TPM</span>
                <span className="text-[11px] text-theme-muted">Provided by Google AI Studio at zero charge</span>
              </div>

              <div className="p-3.5 bg-theme-elevated rounded-xl border border-theme-subtle space-y-1">
                <span className="text-theme-muted font-bold block">Key Isolation</span>
                <span className="font-mono text-theme-accent text-sm block">100% Dedicated</span>
                <span className="text-[11px] text-theme-muted">Isolated session credentials</span>
              </div>
            </div>
          </div>

          {/* Recent Usage Activity */}
          <div className="p-6 rounded-2xl bg-theme-card border border-theme-subtle space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-theme-accent" />
                <span>Recent Assessment Activity</span>
              </h3>
              <span className="text-[11px] text-theme-muted font-mono">
                {recentLogs.length} logged runs
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-4 bg-theme-elevated/60 rounded-xl border border-theme-subtle text-xs text-theme-muted text-center">
                No essay evaluations logged yet today. Evaluate an essay in Writing Studio to generate real-time token telemetry!
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-theme-elevated rounded-xl border border-theme-subtle flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-theme-primary capitalize">
                        {log.type || "Essay Evaluation"}
                      </span>
                      <span className="text-[10px] text-theme-muted font-mono">{log.time || "Just now"}</span>
                    </div>
                    <span className="font-mono font-bold text-theme-accent">
                      +{Number(log.tokens || 1200).toLocaleString()} tokens
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
