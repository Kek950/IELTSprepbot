import React, { useState } from 'react';
import { TrendingUp, BarChart3, AreaChart, PieChart, Info, Award, Calendar, CheckCircle2 } from 'lucide-react';

export default function MockScoreGraph({ scores = [], targetBand = 7.5, title = "Practice Month Mock Exam Trajectory" }) {
  const [graphType, setGraphType] = useState('line'); // 'line' | 'bar' | 'area' | 'radar'
  const [metric, setMetric] = useState('overall'); // 'overall' | 'listening' | 'reading' | 'writing' | 'speaking' | 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // If no scores, provide an empty state fallback
  if (!scores || scores.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-theme-surface border border-theme-subtle text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-xl bg-theme-elevated flex items-center justify-center text-theme-muted">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-theme-primary">No Mock Test Scores Logged Yet</h4>
          <p className="text-xs text-theme-secondary max-w-sm mx-auto">
            During the Practice Month, your instructor logs your daily full mock exam results here. They will appear as an interactive line graph with skill breakdown.
          </p>
        </div>
      </div>
    );
  }

  // Dimensions for SVG chart
  const width = 640;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Band range from 4.0 to 9.0
  const minBand = 4.0;
  const maxBand = 9.0;

  const getY = (band) => {
    const clamped = Math.max(minBand, Math.min(maxBand, band || minBand));
    return padding.top + chartHeight - ((clamped - minBand) / (maxBand - minBand)) * chartHeight;
  };

  const getX = (index) => {
    if (scores.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (scores.length - 1)) * chartWidth;
  };

  // Target reference line Y
  const targetY = getY(targetBand);

  // Colors for skills
  const METRIC_CONFIG = {
    overall: { label: 'Overall Band', color: '#10b981', fill: 'url(#emeraldGrad)' },
    listening: { label: 'Listening', color: '#06b6d4', fill: 'url(#cyanGrad)' },
    reading: { label: 'Reading', color: '#3b82f6', fill: 'url(#blueGrad)' },
    writing: { label: 'Writing', color: '#a855f7', fill: 'url(#purpleGrad)' },
    speaking: { label: 'Speaking', color: '#f59e0b', fill: 'url(#amberGrad)' }
  };

  // Build SVG path
  const buildPath = (key) => {
    return scores.map((s, idx) => {
      const x = getX(idx);
      const val = parseFloat(s[key] ?? s.overall ?? 6.0);
      const y = getY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Build Area Closed Path
  const buildAreaPath = (key) => {
    const linePath = buildPath(key);
    const startX = getX(0);
    const endX = getX(scores.length - 1);
    const bottomY = padding.top + chartHeight;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  // Calculate skill averages for Radar View
  const avgListening = scores.reduce((a, b) => a + (parseFloat(b.listening) || 6.5), 0) / scores.length;
  const avgReading = scores.reduce((a, b) => a + (parseFloat(b.reading) || 6.5), 0) / scores.length;
  const avgWriting = scores.reduce((a, b) => a + (parseFloat(b.writing) || 6.5), 0) / scores.length;
  const avgSpeaking = scores.reduce((a, b) => a + (parseFloat(b.speaking) || 6.5), 0) / scores.length;
  const avgOverall = scores.reduce((a, b) => a + (parseFloat(b.overall) || 6.5), 0) / scores.length;

  return (
    <div className="p-5 rounded-2xl bg-theme-card border border-theme-subtle space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-theme-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-theme-accent" />
              <span>{title}</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-theme-accent">
              {scores.length} Mock{scores.length === 1 ? '' : 's'} Recorded
            </span>
          </div>
          <p className="text-xs text-theme-secondary mt-0.5">
            Daily practice performance tracking across all 4 IELTS test modules.
          </p>
        </div>

        {/* Graph Type Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-theme-base border border-theme-subtle text-xs">
          <button
            onClick={() => setGraphType('line')}
            className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition ${graphType === 'line' ? 'bg-theme-accent text-theme-base font-bold' : 'text-theme-secondary hover:text-theme-primary'}`}
            title="Line Graph Trend"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Line</span>
          </button>
          <button
            onClick={() => setGraphType('area')}
            className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition ${graphType === 'area' ? 'bg-theme-accent text-theme-base font-bold' : 'text-theme-secondary hover:text-theme-primary'}`}
            title="Area Curve"
          >
            <AreaChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Area</span>
          </button>
          <button
            onClick={() => setGraphType('bar')}
            className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition ${graphType === 'bar' ? 'bg-theme-accent text-theme-base font-bold' : 'text-theme-secondary hover:text-theme-primary'}`}
            title="Bar Columns"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bar</span>
          </button>
          <button
            onClick={() => setGraphType('radar')}
            className={`p-1.5 px-2.5 rounded-lg flex items-center gap-1.5 transition ${graphType === 'radar' ? 'bg-theme-accent text-theme-base font-bold' : 'text-theme-secondary hover:text-theme-primary'}`}
            title="Skill Radar"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Pills (if not Radar) */}
      {graphType !== 'radar' && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-theme-muted mr-1">Display:</span>
          {Object.entries(METRIC_CONFIG).map(([k, cfg]) => {
            const isActive = metric === k;
            return (
              <button
                key={k}
                onClick={() => setMetric(k)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                  isActive
                    ? 'border-theme-accent bg-theme-accent-subtle text-theme-accent font-bold'
                    : 'border-theme-subtle bg-theme-surface text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMetric('all')}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
              metric === 'all'
                ? 'border-theme-accent bg-theme-accent-subtle text-theme-accent font-bold'
                : 'border-theme-subtle bg-theme-surface text-theme-secondary hover:text-theme-primary'
            }`}
          >
            All 4 Skills
          </button>
        </div>
      )}

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-x-auto rounded-xl bg-theme-base/80 border border-theme-subtle p-2">
        {graphType === 'radar' ? (
          /* RADAR / SPIDER WEB SKILL BALANCE VIEW */
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <svg viewBox="0 0 320 220" className="w-full max-w-sm h-52">
              {/* Axes & Diamond Grids */}
              {[4, 6, 8, 9].map((lvl) => {
                const r = (lvl / 9) * 80;
                return (
                  <polygon
                    key={lvl}
                    points={`160,${110 - r} ${160 + r},110 160,${110 + r} ${160 - r},110`}
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth="1"
                    strokeDasharray={lvl === 9 ? "none" : "2,2"}
                  />
                );
              })}

              {/* Axis Cross Lines */}
              <line x1="160" y1="25" x2="160" y2="195" stroke="#3f3f46" strokeWidth="1" />
              <line x1="75" y1="110" x2="245" y2="110" stroke="#3f3f46" strokeWidth="1" />

              {/* Data Polygon for Skill Averages */}
              {(() => {
                const pL = (avgListening / 9) * 80;
                const pR = (avgReading / 9) * 80;
                const pW = (avgWriting / 9) * 80;
                const pS = (avgSpeaking / 9) * 80;
                // Top: Listening, Right: Reading, Bottom: Writing, Left: Speaking
                const points = `160,${110 - pL} ${160 + pR},110 160,${110 + pW} ${160 - pS},110`;
                return (
                  <>
                    <polygon
                      points={points}
                      fill="rgba(16, 185, 129, 0.25)"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />
                    <circle cx="160" cy={110 - pL} r="4" fill="#06b6d4" />
                    <circle cx={160 + pR} cy="110" r="4" fill="#3b82f6" />
                    <circle cx="160" cy={110 + pW} r="4" fill="#a855f7" />
                    <circle cx={160 - pS} cy="110" r="4" fill="#f59e0b" />
                  </>
                );
              })()}

              {/* Axis Labels */}
              <text x="160" y="18" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold">Listening ({avgListening.toFixed(1)})</text>
              <text x="252" y="114" textAnchor="start" fill="#3b82f6" fontSize="10" fontWeight="bold">Reading ({avgReading.toFixed(1)})</text>
              <text x="160" y="210" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">Writing ({avgWriting.toFixed(1)})</text>
              <text x="68" y="114" textAnchor="end" fill="#f59e0b" fontSize="10" fontWeight="bold">Speaking ({avgSpeaking.toFixed(1)})</text>
            </svg>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-theme-secondary">Cohort Average: <strong className="text-theme-primary">Band {avgOverall.toFixed(1)}</strong></span>
              <span className="text-theme-secondary">Target: <strong className="text-theme-accent">Band {targetBand}</strong></span>
            </div>
          </div>
        ) : (
          /* LINE / AREA / BAR CHART */
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 select-none">
            <defs>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[4.0, 5.0, 6.0, 7.0, 8.0, 9.0].map((b) => {
              const y = getY(b);
              return (
                <g key={b}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray={b === targetBand ? "4,4" : "none"}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill={b === targetBand ? "#10b981" : "#71717a"}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {b.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Target Band Reference Line */}
            {targetBand >= minBand && targetBand <= maxBand && (
              <g>
                <line
                  x1={padding.left}
                  y1={targetY}
                  x2={width - padding.right}
                  y2={targetY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.75"
                />
                <text
                  x={width - padding.right}
                  y={targetY - 6}
                  textAnchor="end"
                  fill="#10b981"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  TARGET BAND {targetBand}
                </text>
              </g>
            )}

            {/* BAR CHART RENDERING */}
            {graphType === 'bar' && scores.map((s, idx) => {
              const barWidth = Math.min(28, (chartWidth / scores.length) * 0.6);
              const cx = getX(idx);
              const val = parseFloat(s[metric === 'all' ? 'overall' : metric] ?? s.overall ?? 6.0);
              const y = getY(val);
              const barHeight = (padding.top + chartHeight) - y;
              const isHovered = hoveredPoint?.index === idx;

              return (
                <g key={s.id || idx}>
                  <rect
                    x={cx - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    fill={isHovered ? "#34d399" : (METRIC_CONFIG[metric]?.color || "#10b981")}
                    opacity={isHovered ? 1 : 0.85}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint({ ...s, index: idx, cx, cy: y })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={cx}
                    y={y - 5}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* AREA CHART FILL */}
            {graphType === 'area' && (
              <path
                d={buildAreaPath(metric === 'all' ? 'overall' : metric)}
                fill={METRIC_CONFIG[metric === 'all' ? 'overall' : metric]?.fill || 'url(#emeraldGrad)'}
              />
            )}

            {/* MULTI-SKILL LINES (If metric === 'all') */}
            {metric === 'all' && ['listening', 'reading', 'writing', 'speaking'].map((sk) => (
              <path
                key={sk}
                d={buildPath(sk)}
                fill="none"
                stroke={METRIC_CONFIG[sk].color}
                strokeWidth="1.75"
                strokeDasharray="2,2"
                opacity="0.8"
              />
            ))}

            {/* MAIN LINE PATH */}
            {(graphType === 'line' || graphType === 'area') && (
              <path
                d={buildPath(metric === 'all' ? 'overall' : metric)}
                fill="none"
                stroke={METRIC_CONFIG[metric === 'all' ? 'overall' : metric]?.color || '#10b981'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* DATA POINTS & HOVER CIRCLES */}
            {(graphType === 'line' || graphType === 'area') && scores.map((s, idx) => {
              const cx = getX(idx);
              const val = parseFloat(s[metric === 'all' ? 'overall' : metric] ?? s.overall ?? 6.0);
              const cy = getY(val);
              const isHovered = hoveredPoint?.index === idx;

              return (
                <g key={s.id || idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 4.5}
                    fill="#18181b"
                    stroke={METRIC_CONFIG[metric === 'all' ? 'overall' : metric]?.color || '#10b981'}
                    strokeWidth={isHovered ? 3 : 2}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint({ ...s, index: idx, cx, cy })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Score pill on top of data point */}
                  <text
                    x={cx}
                    y={cy - 9}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* X-AXIS DATES */}
            {scores.map((s, idx) => {
              const cx = getX(idx);
              const label = s.date?.includes('-') ? s.date.slice(5) : (s.date || `Day ${idx + 1}`);
              return (
                <text
                  key={idx}
                  x={cx}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-xl bg-zinc-900/95 border border-theme-accent shadow-2xl text-xs space-y-1.5 transition-all animate-fadeIn"
            style={{
              left: Math.max(10, Math.min(hoveredPoint.cx - 80, width - 180)),
              top: Math.max(10, hoveredPoint.cy - 75)
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-1">
              <span className="font-mono text-zinc-400">{hoveredPoint.date}</span>
              <span className="font-bold text-emerald-400 font-mono">Band {hoveredPoint.overall}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono">
              <span className="text-cyan-400">L: {hoveredPoint.listening}</span>
              <span className="text-blue-400">R: {hoveredPoint.reading}</span>
              <span className="text-purple-400">W: {hoveredPoint.writing}</span>
              <span className="text-amber-400">S: {hoveredPoint.speaking}</span>
            </div>
            {hoveredPoint.notes && (
              <p className="text-[10px] text-zinc-300 italic pt-1 border-t border-zinc-800 line-clamp-2">
                "{hoveredPoint.notes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Trajectory Summary Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-subtle">
          <span className="text-[10px] text-theme-muted block">First Mock Band</span>
          <span className="font-mono font-bold text-sm text-theme-primary">
            {scores[0]?.overall?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-subtle">
          <span className="text-[10px] text-theme-muted block">Latest Mock Band</span>
          <span className="font-mono font-bold text-sm text-emerald-400">
            {scores[scores.length - 1]?.overall?.toFixed(1) || 'N/A'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-subtle">
          <span className="text-[10px] text-theme-muted block">Score Gain</span>
          <span className="font-mono font-bold text-sm text-theme-accent">
            {scores.length > 1
              ? `+${((scores[scores.length - 1]?.overall || 0) - (scores[0]?.overall || 0)).toFixed(1)} Band`
              : 'Baseline'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-theme-surface border border-theme-subtle">
          <span className="text-[10px] text-theme-muted block">Exam Target Status</span>
          <span className="font-mono font-bold text-sm text-theme-primary flex items-center gap-1">
            {(scores[scores.length - 1]?.overall || 0) >= targetBand ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Met
              </span>
            ) : (
              <span className="text-amber-400">
                {(targetBand - (scores[scores.length - 1]?.overall || 0)).toFixed(1)} to go
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
