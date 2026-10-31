import React, { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Bot, Check, CheckCheck, Sparkles, User, GraduationCap } from 'lucide-react';

export default function TelegramSimulator({ botHandle }) {
  const [role, setRole] = useState('student');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Welcome to IELTS Prep Bot, Azamat! 🎯\n\nPlease select your role. Note: This choice is permanent for your account.",
      options: ["👨‍🎓 I am a Student", "👨‍🏫 I am a Teacher"],
      time: "22:45"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleAction = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Append user message
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text, time }
    ]);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (text.includes("I am a Student")) {
        setRole('student');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "You are now registered as a Student! 👨‍🎓\n\nWelcome back, Azamat! 🎯\n🤖 Current model: Gemini 2.5 Flash\n⚡ Speed: ⚡⚡⚡ | ⭐ Quality: ⭐⭐⭐⭐⭐\n\nChoose an option below to start your IELTS prep:",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("I am a Teacher")) {
        setRole('teacher');
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "Welcome back, Teacher! 👨‍🏫\n\nYou can manage classes, assign daily essays, track student progress, and append manual band corrections.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Write Essay")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "✍️ Choose your writing task type:",
            options: ["📝 Task 1 (Academic Report)", "📑 Task 2 (Essay)"],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Task 2 (Essay)")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "🎯 Task 2 — Selected Prompt:\n\n*\"In many countries, the gap between the rich and the poor is increasing. What problems does this cause, and what solutions can you suggest?\"*\n\nMinimum: 250 words\nRecommended time: 40 minutes\n\n✍️ Paste or type your response now:",
            options: ["⚡ Send Simulated Band 7.5 Essay"],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Send Simulated Band 7.5 Essay") || text.includes("Simulated")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "🔄 Assessing with Gemini 2.5 Flash... Please wait.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 2,
              sender: 'bot',
              text: `========================================
📊 IELTS WRITING ASSESSMENT
========================================

✨ Overall Band Score: 7.5 (Very Good)
📝 Word Count: 284 words
📋 Task Type: Task 2 - Essay
🤖 Assessed by: Gemini 2.5 Flash
🪙 Tokens used: 1,420

────────────────────────────────────────
📈 CRITERIA SCORES:
────────────────────────────────────────

✅ Task Achievement: 8/9
Well-developed response addressing both economic problems and progressive tax solutions with concrete examples.

✅ Coherence & Cohesion: 8/9
Logical progression with well-defined paragraph topic sentences and cohesive links (e.g. 'Furthermore', 'First and foremost').

✅ Lexical Resource: 7/9
Broad vocabulary with natural collocations ('economic disparity', 'diminished social mobility', 'capital accumulation').

✅ Grammatical Range: 7/9
Accurate complex sentence structures. Minor preposition slips in concluding sentence.

────────────────────────────────────────
💪 STRENGTHS:
────────────────────────────────────────
• Clear, persuasive thesis statement in the introduction.
• Robust academic tone throughout with sophisticated vocabulary.
• Directly answers both elements of the two-part prompt.

────────────────────────────────────────
🎯 SUGGESTIONS FOR IMPROVEMENT:
────────────────────────────────────────
1. Balance the fiscal policy argument with potential economic counter-perspectives.
2. Incorporate mixed conditional clauses to boost Grammatical Range to Band 8.0+.
========================================`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 1100);
        return;
      }

      if (text.includes("Log Time") || text.includes("Log Practice")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "⏱️ What activity did you practice today?",
            options: ["🎧 Listening Practice", "📖 Reading Practice"],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Listening Practice") || text.includes("Reading Practice")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `⏱️ Great work! How many minutes did you spend?`,
            options: ["30 minutes", "45 minutes", "60 minutes"],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("minutes")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "✅ Logged practice time!\n\n📊 Your Weekly Progress:\n🎧 Listening: 135/180 min (75%)\n📖 Reading: 160/180 min (88%)\n🔥 Current Streak: 5 Days in a row!\n\nKeep going! You're on track for Band 8.0!",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Token Usage") || text.includes("Tokens")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📈 Your Gemini API Usage:

📅 Today: 2,840 tokens
🗓️ This Month: 34,180 tokens
📊 Total All-Time: 148,920 tokens
🔄 Total AI Assessments: 104 essays

💵 Estimated Cost: $0.00 (Free Google AI Studio Tier)
🔑 Active Model: Gemini 2.5 Flash`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Progress")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📊 Student Progress Report — Azamat

📈 Recent Essay Scores:
• Task 2: Band 7.5 (Today)
• Task 1: Band 7.0 (2 days ago)
• Task 2: Band 7.0 (4 days ago)

🎯 Target Goal: Band 8.0
⏱️ Total Study Time: 18h 40m
🏫 Class: Advanced IELTS Masterclass (Code: #ENG808)`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      if (text.includes("Homework")) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: `📋 Assigned Homework:

1️⃣ Task 2 Essay: Wealth Inequality Solutions
   👨‍🏫 Instructor: Mr. Bayadilov
   📅 Deadline: Tomorrow at 23:59
   Status: ⏳ Pending

2️⃣ Cambridge 18 Reading Practice Section
   Status: ✅ Completed`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      // Default response
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Command "${text}" processed. Use the keyboard buttons below to explore features.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 450);
  };

  const handleReset = () => {
    setRole('student');
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: "Welcome to IELTS Prep Bot, Azamat! 🎯\n\nPlease select your role. Note: This choice is permanent for your account.",
        options: ["👨‍🎓 I am a Student", "👨‍🏫 I am a Teacher"],
        time: "22:45"
      }
    ]);
  };

  const studentButtons = [
    ["✍️ Write Essay", "📝 Log Time"],
    ["📊 My Progress", "📈 Token Usage"],
    ["📋 Homework", "⚙️ Settings"]
  ];

  const teacherButtons = [
    ["✏️ Assign Essay", "📋 Give Homework"],
    ["📊 Student Progress", "📢 Send Lesson"],
    ["📝 Assess Essays", "🏫 My Classes"]
  ];

  const activeButtons = role === 'teacher' ? teacherButtons : studentButtons;

  return (
    <section id="simulator" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Bot className="w-3.5 h-3.5" />
            <span>Interactive Demo</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Test the Telegram Bot Live in Your Browser
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Experience the real conversational workflow. Tap buttons in the phone simulator to see instant essay evaluations, practice logging, and teacher assignments.
          </p>
        </div>

        {/* Mockup Container */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 max-w-5xl mx-auto">
          {/* Smartphone Frame */}
          <div className="phone-mockup w-full max-w-[390px] h-[680px] flex flex-col bg-[#0f172a] rounded-[40px] border-[10px] border-slate-800 shadow-2xl relative">
            {/* Top Speaker / Notch */}
            <div className="w-32 h-5 bg-slate-800 mx-auto rounded-b-xl flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Telegram Header */}
            <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  🎯
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>IELTS Prep Bot</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <div className="text-[11px] text-slate-400">bot • @{botHandle}</div>
                </div>
              </div>

              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
              {messages.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <div
                    className={
                      m.sender === 'user'
                        ? 'chat-bubble-user p-3 bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm'
                        : 'chat-bubble-bot p-3 bg-slate-800/95 text-slate-100 border border-slate-700/60 rounded-2xl rounded-tl-sm shadow-sm leading-relaxed whitespace-pre-wrap font-sans'
                    }
                  >
                    <div>{m.text}</div>
                    <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                      <span>{m.time}</span>
                      {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                    </div>
                  </div>

                  {/* Inline Option Buttons if present */}
                  {m.options && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(opt)}
                          className="text-[11px] bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 py-1.5 px-3 rounded-lg font-medium transition active:scale-95 text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="chat-bubble-bot p-2.5 bg-slate-800/90 text-slate-300 rounded-2xl rounded-tl-sm w-16">
                  <div className="typing-dots flex items-center justify-center">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Telegram Persistent Reply Keyboard */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800">
              <div className="space-y-1.5">
                {activeButtons.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-2 gap-1.5">
                    {row.map((btnText, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleAction(btnText)}
                        className="text-[11px] font-semibold py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/70 transition active:scale-95 text-center truncate shadow-sm"
                      >
                        {btnText}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Role Indicator Pill */}
              <div className="mt-2 text-center flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Mode: <strong className="text-indigo-400 uppercase">{role}</strong></span>
                <button
                  onClick={() => handleAction(role === 'student' ? '👨‍🏫 I am a Teacher' : '👨‍🎓 I am a Student')}
                  className="text-indigo-400 hover:underline"
                >
                  Switch to {role === 'student' ? 'Teacher' : 'Student'}
                </button>
              </div>
            </div>
          </div>

          {/* Explanation Cards next to simulator */}
          <div className="flex-1 space-y-4 max-w-lg">
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-white text-base">Bring Your Own Key (BYOK)</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Students connect their personal Google Gemini API key during <code>/setup</code>. API keys are completely isolated in Firestore and never shared, guaranteeing zero host bill and complete privacy.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-white text-base">Official 4-Criteria Diagnostic</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Essays receive an overall band score alongside exact sub-scores for Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy with actionable corrections.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-white text-base">Teacher Classrooms & Codes</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Instructors generate 6-character class codes (e.g. <code>/join ENG808</code>), assign homework with deadlines, monitor student minutes logged, and append custom teacher commentary to AI reviews.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
