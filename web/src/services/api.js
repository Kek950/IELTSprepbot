/**
 * IELTS Prep Platform — Unified API Service & Dual-Role Context
 * Strict Isolation: Teachers only access their own cohorts and enrolled students.
 * Single Password Authentication: Sign in via Nickname or Phone + Permanent Password.
 */

function getBackendUrl() {
  if (typeof window === "undefined" || !window.location) {
    return "http://localhost:10000/api";
  }
  const params = new URLSearchParams(window.location.search);
  const srvParam = params.get("srv") || params.get("api");
  if (srvParam) {
    const clean = srvParam.replace(/\/$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  const savedSrv = localStorage.getItem("ielts_backend_url");
  if (savedSrv) {
    const clean = savedSrv.replace(/\/$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  if (window.location.origin.includes("github.io")) {
    return "https://ieltsprepbot.onrender.com/api";
  }
  if (window.location.origin.includes("5173")) {
    return "http://localhost:10000/api";
  }
  return `${window.location.origin}/api`;
}

const BACKEND_URL = getBackendUrl();

const DEFAULT_ACCOUNTS = {
  "+15550192": {
    phone_number: "+15550192",
    user_id: 1001,
    first_name: "Azamat",
    username: "azamat",
    role: "hybrid",
    api_key: "",
    model: "gemini-2.5-flash",
    has_telegram: true,
    is_locked: true,
    
    // Classes where user is the Instructor / Teacher
    teaching_classes: [
      {
        id: "teach_azamat_1",
        teacher_phone: "+15550192",
        name: "Advanced IELTS Masterclass",
        join_code: "AZA99",
        student_count: 2,
        listening_goal: 180,
        reading_goal: 180,
        created_at: "Oct 12, 2026"
      }
    ],

    // Classes where user is enrolled as a Student (taught by Dr. Jenkins)
    enrolled_classes: [
      {
        id: "enrolled_jenkins_1",
        name: "Examiners Training Cohort",
        join_code: "EXAM88",
        teacher_name: "Dr. Sarah Jenkins",
        teacher_phone: "+15550888",
        listening_goal: 180,
        reading_goal: 180,
        joined_at: "Oct 15, 2026"
      }
    ],

    // Student queue ONLY for classes Azamat teaches ("teach_azamat_1")
    student_queue: [
      {
        id: "queue_az_1",
        class_id: "teach_azamat_1",
        class_name: "Advanced IELTS Masterclass",
        student_name: "Rustam K.",
        student_phone: "+998 90 123 4567",
        task_type: "task2",
        prompt: "Some people believe university students should be required to attend classes, while others believe attendance should be optional. Discuss both views.",
        essay: "Nowadays, university education has transformed significantly. There is a persistent debate regarding whether lectures should be mandatory or voluntary. While advocates of compulsory attendance highlight professor engagement, I believe adult undergraduates thrive with autonomy...",
        ai_score: 7.0,
        manual_score: null,
        teacher_notes: "",
        status: "pending_review",
        submitted_at: "Today at 21:15"
      },
      {
        id: "queue_az_2",
        class_id: "teach_azamat_1",
        class_name: "Advanced IELTS Masterclass",
        student_name: "Malika S.",
        student_phone: "+998 93 987 6543",
        task_type: "task2",
        prompt: "The gap between rich and poor is increasing. What problems does this cause, and what solutions can you suggest?",
        essay: "Economic inequality has been soaring in modern global economies. This essay outlines key drawbacks such as social friction and proposes progressive taxation and public education funding as viable remedies...",
        ai_score: 6.5,
        manual_score: null,
        teacher_notes: "",
        status: "pending_review",
        submitted_at: "Yesterday at 19:40"
      }
    ],

    practice: {
      listening_total: 135,
      reading_total: 160,
      listening_week: 135,
      reading_week: 160,
      streak_days: 5
    },

    tokens: {
      today: 2840,
      month: 34180,
      total: 148920,
      calls: 104
    },

    submissions: [
      {
        id: "sub_1",
        class_id: "enrolled_jenkins_1",
        class_name: "Examiners Training Cohort",
        task_type: "task2",
        prompt: "In many countries, the gap between the rich and the poor is increasing significantly. What problems does this cause, and what solutions can you suggest?",
        essay: "In contemporary society, the widening economic disparity between the wealthiest individuals and the impoverished represents one of the most pressing socio-economic challenges...",
        band_score: 7.5,
        manual_score: null,
        teacher_feedback: null,
        task_achievement: { score: 8, feedback: "Comprehensive response covering social friction and multi-generational poverty with progressive fiscal solutions." },
        coherence_cohesion: { score: 8, feedback: "Logical progression with clear topic sentences and smooth discourse transitions." },
        lexical_resource: { score: 7, feedback: "Broad academic vocabulary with precise collocations ('economic disparity', 'capital accumulation')." },
        grammatical_range: { score: 7, feedback: "Good variety of complex sentence structures with minor concluding slip." },
        strengths: ["Persuasive introductory thesis statement", "Well-balanced body paragraphs", "Formal academic register"],
        suggestions: ["Incorporate mixed conditional syntax", "Synthesize arguments more compactly in conclusion"],
        submitted_at: "Today at 18:30",
        tokens_used: 1420
      }
    ],

    homework: [
      {
        id: "hw_1",
        class_id: "enrolled_jenkins_1",
        class_name: "Examiners Training Cohort",
        teacher_name: "Dr. Sarah Jenkins",
        title: "Task 2: Compulsory University Attendance",
        description: "Write an opinion essay (250+ words) addressing whether undergraduate lecture attendance should be mandatory or optional.",
        deadline: "Tomorrow, 23:59",
        status: "pending",
        task_type: "task2"
      }
    ]
  },

  "+15550193": {
    phone_number: "+15550193",
    user_id: 2001,
    first_name: "Instructor Bayadilov",
    username: "teacher_bayadilov",
    role: "teacher",
    api_key: "",
    model: "gemini-2.5-pro",
    has_telegram: true,
    is_locked: true,
    
    // Classes strictly taught by Bayadilov
    teaching_classes: [
      { 
        id: "teach_bayadilov_1", 
        teacher_phone: "+15550193",
        name: "Band 7.0 Crash Course", 
        join_code: "CRASH7", 
        student_count: 1, 
        listening_goal: 120, 
        reading_goal: 120,
        created_at: "Oct 18, 2026"
      }
    ],
    enrolled_classes: [],
    
    // Student queue strictly for Bayadilov's class ("teach_bayadilov_1")
    student_queue: [
      {
        id: "queue_bay_1",
        class_id: "teach_bayadilov_1",
        class_name: "Band 7.0 Crash Course",
        student_name: "Dmitry V.",
        student_phone: "+7 999 111 2233",
        task_type: "task1",
        prompt: "The chart below shows household computer ownership between 1998 and 2008.",
        essay: "The bar chart compares computer possession across various income demographics over a decade. Overall, ownership expanded steadily across all brackets...",
        ai_score: 6.5,
        manual_score: null,
        teacher_notes: "",
        status: "pending_review",
        submitted_at: "Today at 14:20"
      }
    ],
    practice: { listening_total: 60, reading_total: 90, listening_week: 60, reading_week: 90, streak_days: 2 },
    tokens: { today: 4100, month: 52000, total: 210000, calls: 140 },
    submissions: [],
    homework: []
  }
};

function isPhone(val) {
  if (!val) return false;
  const s = String(val).trim();
  const digits = s.replace(/[^\d]/g, "");
  return (s.startsWith("+") || digits.length >= 7) && /^[+\d\s\-()]+$/.test(s);
}

function normalizePhone(p) {
  if (!p) return "";
  let clean = String(p).replace(/[^\d+]/g, "").trim();
  if (clean && !clean.startsWith("+")) clean = "+" + clean;
  return clean;
}

function normalizeIdentifier(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (isPhone(s)) {
    return normalizePhone(s);
  }
  return s.replace(/^@/, "").toLowerCase();
}

function getLocalStore(rawId) {
  const ident = normalizeIdentifier(rawId);
  const all = JSON.parse(localStorage.getItem("ielts_accounts_v4") || "{}");
  
  if (ident === "azamat" || ident === "student" || ident === "+15550192") {
    if (!all["+15550192"]) {
      all["+15550192"] = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS["+15550192"]));
      localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
    }
    return all["+15550192"];
  }

  if (ident === "bayadilov" || ident === "teacher" || ident === "+15550193") {
    if (!all["+15550193"]) {
      all["+15550193"] = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS["+15550193"]));
      localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
    }
    return all["+15550193"];
  }

  const key = isPhone(rawId) ? normalizePhone(rawId) : (ident || "anonymous");
  if (!all[key]) {
    if (DEFAULT_ACCOUNTS[key]) {
      all[key] = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS[key]));
    } else {
      all[key] = {
        phone_number: isPhone(rawId) ? key : "",
        nickname: !isPhone(rawId) ? key : `user_${key.slice(-4)}`,
        user_id: Date.now(),
        first_name: "Member",
        username: !isPhone(rawId) ? key : `user_${key.slice(-4)}`,
        role: "hybrid",
        api_key: "",
        model: "gemini-2.5-flash",
        has_telegram: false,
        is_locked: true,
        teaching_classes: [],
        enrolled_classes: [],
        student_queue: [],
        practice: { listening_total: 0, reading_total: 0, listening_week: 0, reading_week: 0, streak_days: 1 },
        tokens: { today: 0, month: 0, total: 0, calls: 0 },
        submissions: [],
        homework: []
      };
    }
    localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
  }
  return all[key];
}

function saveLocalStore(rawId, data) {
  const ident = normalizeIdentifier(rawId);
  let key = isPhone(rawId) ? normalizePhone(rawId) : ident;
  if (ident === "azamat" || ident === "+15550192") key = "+15550192";
  if (ident === "bayadilov" || ident === "+15550193") key = "+15550193";
  const all = JSON.parse(localStorage.getItem("ielts_accounts_v4") || "{}");
  all[key] = data;
  localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
}

export const apiService = {
  // Primary Authentication: Nickname or Phone + Password
  async login(identifier, password) {
    const ident = (identifier || "").trim();
    const pwd = (password || "").trim();
    if (!ident) throw new Error("Please enter your Nickname or Phone Number.");
    if (!pwd) throw new Error("Please enter your Password.");

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident, password: pwd })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Check your credentials.");
      }
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  async getUserData(rawKey) {
    const ident = normalizeIdentifier(rawKey) || rawKey;
    const local = getLocalStore(ident);
    try {
      const res = await fetch(`${BACKEND_URL}/user/data?identifier=${encodeURIComponent(ident)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.user) {
          local.user_id = d.user.user_id || local.user_id;
          local.first_name = d.user.first_name || local.first_name;
          local.username = d.user.username || local.username;
          local.nickname = d.user.nickname || local.nickname || local.username;
          local.phone_number = d.user.phone_number || local.phone_number;
          local.role = d.user.role || local.role;
        }
        if (d.teaching_classes) local.teaching_classes = d.teaching_classes;
        if (d.enrolled_classes) local.enrolled_classes = d.enrolled_classes;
        if (d.student_queue) local.student_queue = d.student_queue;
        if (d.submissions) local.submissions = d.submissions;
        if (d.homework) local.homework = d.homework;
        if (d.tokens) local.tokens = d.tokens;
        if (d.progress) {
          local.practice = {
            listening_total: d.progress.total_listening ?? local.practice.listening_total,
            reading_total: d.progress.total_reading ?? local.practice.reading_total,
            listening_week: d.progress.weekly_listening ?? local.practice.listening_week,
            reading_week: d.progress.weekly_reading ?? local.practice.reading_week,
            streak_days: d.progress.streak_days ?? local.practice.streak_days
          };
        }
        saveLocalStore(ident, local);
        return local;
      }
    } catch (e) {}
    return local;
  },

  async updateConfig(rawPhone, apiKey, model) {
    const phone = normalizePhone(rawPhone);
    try {
      await fetch(`${BACKEND_URL}/user/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, api_key: apiKey, model })
      });
    } catch (e) {}
    const store = getLocalStore(phone);
    store.api_key = apiKey;
    store.model = model;
    saveLocalStore(phone, store);
    return true;
  },

  async logPractice(rawPhone, activity, minutes) {
    const phone = normalizePhone(rawPhone);
    try {
      await fetch(`${BACKEND_URL}/practice/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, activity, minutes })
      });
    } catch (e) {}
    const store = getLocalStore(phone);
    if (!store.practice) store.practice = { listening_total: 0, reading_total: 0, listening_week: 0, reading_week: 0, streak_days: 1 };
    if (activity === "listening") {
      store.practice.listening_total += minutes;
      store.practice.listening_week += minutes;
    } else {
      store.practice.reading_total += minutes;
      store.practice.reading_week += minutes;
    }
    saveLocalStore(phone, store);
    return store.practice;
  },

  // Enroll in a class as student
  async joinClass(rawPhone, code) {
    const phone = normalizePhone(rawPhone);
    const cleanCode = code.trim().toUpperCase();
    try {
      const res = await fetch(`${BACKEND_URL}/class/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: cleanCode })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const store = getLocalStore(phone);
    if (!store.enrolled_classes) store.enrolled_classes = [];
    
    if (store.enrolled_classes.some(c => c.join_code === cleanCode)) {
      return { success: false, status: "already_in" };
    }

    const newEnrolled = {
      id: `enrolled_${Date.now()}`,
      name: `IELTS Prep Cohort (${cleanCode})`,
      join_code: cleanCode,
      teacher_name: "Assigned Instructor",
      listening_goal: 180,
      reading_goal: 180,
      joined_at: "Just now"
    };
    store.enrolled_classes.push(newEnrolled);
    saveLocalStore(phone, store);
    return { success: true, status: "success", class: newEnrolled };
  },

  async leaveClass(rawPhone, classId) {
    const phone = normalizePhone(rawPhone);
    try {
      await fetch(`${BACKEND_URL}/class/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, class_id: classId })
      });
    } catch (e) {}
    const store = getLocalStore(phone);
    if (store.enrolled_classes) {
      store.enrolled_classes = store.enrolled_classes.filter(c => c.id !== classId);
      saveLocalStore(phone, store);
    }
    return store.enrolled_classes;
  },

  // Create a new class user teaches - Synchronized with Firestore & Backend
  async createTeachingClass(rawPhone, name, listeningGoal = 180, readingGoal = 180) {
    const phone = normalizePhone(rawPhone);
    let created = null;
    try {
      const res = await fetch(`${BACKEND_URL}/class/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, listening_goal: listeningGoal, reading_goal: readingGoal })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.class) created = data.class;
      }
    } catch (e) {}

    const store = getLocalStore(phone);
    if (!store.teaching_classes) store.teaching_classes = [];
    if (!created) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      created = {
        id: `teach_${Date.now()}`,
        teacher_phone: phone,
        name,
        join_code: code,
        student_count: 0,
        listening_goal: listeningGoal,
        reading_goal: readingGoal,
        created_at: "Just now"
      };
    }
    store.teaching_classes.push(created);
    saveLocalStore(phone, store);
    return created;
  },

  // Grade student essay - Synchronized with Firestore & dispatches Telegram alert
  async reviewStudentEssay(rawPhone, queueId, manualScore, notes) {
    const phone = normalizePhone(rawPhone);
    try {
      await fetch(`${BACKEND_URL}/essay/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, essay_id: queueId, manual_score: manualScore, notes })
      });
    } catch (e) {}

    const store = getLocalStore(phone);
    if (store.student_queue) {
      store.student_queue = store.student_queue.map(q => {
        if (q.id === queueId) {
          return { ...q, manual_score: manualScore, teacher_notes: notes, status: "reviewed" };
        }
        return q;
      });
      saveLocalStore(phone, store);
    }
    return store.student_queue;
  },

  // Assign homework strictly to one of the teacher's own classes - Dispatches to Telegram
  async assignHomework(rawPhone, classId, className, title, description, deadline, taskType = "task2") {
    const phone = normalizePhone(rawPhone);
    const store = getLocalStore(phone);
    
    // Strict Verification: Teacher must own classId or className
    const ownsClass = (store.teaching_classes || []).some(c => c.id === classId || c.name === className);
    if (!ownsClass) {
      throw new Error("Access Denied: You cannot assign homework to a class you do not teach.");
    }

    let hwId = `hw_${Date.now()}`;
    try {
      const res = await fetch(`${BACKEND_URL}/homework/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, class_id: classId, className, title, description, deadline, task_type: taskType })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.id) hwId = d.id;
      }
    } catch (e) {}

    const hwItem = {
      id: hwId,
      class_id: classId,
      class_name: className,
      teacher_phone: phone,
      title,
      description,
      deadline,
      task_type: taskType,
      created_at: "Just now"
    };

    // Propagate to all enrolled students across local storage accounts
    const all = JSON.parse(localStorage.getItem("ielts_accounts_v4") || "{}");
    for (const [p, acc] of Object.entries(all)) {
      if ((acc.enrolled_classes || []).some(ec => ec.id === classId || ec.name === className)) {
        if (!acc.homework) acc.homework = [];
        acc.homework.unshift({ ...hwItem, status: "pending" });
        all[p] = acc;
      }
    }
    localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
    return hwItem;
  },

  async broadcastLesson(rawPhone, classId, message) {
    const phone = normalizePhone(rawPhone);
    try {
      const res = await fetch(`${BACKEND_URL}/broadcast/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, class_id: classId, message })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true };
  },

  async saveSubmission(rawPhone, submission) {
    const phone = normalizePhone(rawPhone);
    const store = getLocalStore(phone);
    if (!store.submissions) store.submissions = [];
    
    let classId = submission.class_id || null;
    if (!classId && submission.class_name && submission.class_name !== "Personal Practice") {
      const matched = (store.enrolled_classes || []).find(c => c.name === submission.class_name);
      if (matched) classId = matched.id;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/essay/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          class_id: classId,
          class_name: submission.class_name,
          task_type: submission.task_type,
          prompt: submission.prompt,
          essay: submission.essay,
          band_score: submission.band_score,
          feedback: submission,
          tokens_used: submission.tokens_used || 1200
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.essay_id) submission.id = d.essay_id;
      }
    } catch (e) {}

    store.submissions.unshift(submission);
    if (!store.tokens) store.tokens = { today: 0, month: 0, total: 0, calls: 0 };
    store.tokens.today += submission.tokens_used || 1200;
    store.tokens.month += submission.tokens_used || 1200;
    store.tokens.total += submission.tokens_used || 1200;
    store.tokens.calls += 1;
    saveLocalStore(phone, store);

    // If submitted for an enrolled class, route to that teacher's queue
    if (submission.class_name && submission.class_name !== "Personal Practice") {
      const all = JSON.parse(localStorage.getItem("ielts_accounts_v4") || "{}");
      for (const [p, acc] of Object.entries(all)) {
        const teachingMatch = (acc.teaching_classes || []).find(tc => 
          tc.name === submission.class_name || tc.id === classId
        );
        if (teachingMatch && p !== phone) {
          if (!acc.student_queue) acc.student_queue = [];
          acc.student_queue.unshift({
            id: submission.id || `queue_${Date.now()}`,
            class_id: teachingMatch.id,
            class_name: teachingMatch.name,
            student_name: store.first_name || "Student",
            student_phone: phone,
            task_type: submission.task_type,
            prompt: submission.prompt,
            essay: submission.essay,
            ai_score: submission.band_score,
            manual_score: null,
            teacher_notes: "",
            status: "pending_review",
            submitted_at: "Just now"
          });
          all[p] = acc;
        }
      }
      localStorage.setItem("ielts_accounts_v4", JSON.stringify(all));
    }

    return store;
  },

  // ── Practice Month & Cohort Statistics ─────────────────────────────
  async getClassStats(rawPhone, classId) {
    const phone = normalizePhone(rawPhone);
    try {
      const res = await fetch(`${BACKEND_URL}/class/stats?class_id=${encodeURIComponent(classId)}&phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.stats) return d.stats;
      }
    } catch (e) {}

    // Fallback synthesis from local store
    const store = getLocalStore(phone);
    const cls = (store.teaching_classes || []).find(c => c.id === classId) ||
                (store.enrolled_classes || []).find(c => c.id === classId) ||
                { id: classId, name: "IELTS Cohort", student_count: 2 };

    const mocks = JSON.parse(localStorage.getItem(`ielts_mocks_${classId}`) || "[]");
    return {
      class_id: classId,
      class_name: cls.name || "IELTS Cohort",
      join_code: cls.join_code || "CODE",
      student_count: cls.student_count || 2,
      total_homework_assigned: (store.homework || []).length || 3,
      cohort_hw_completion_rate: 85.0,
      total_hw_completed: 6,
      cohort_estimated_gpa: mocks.length ? (mocks.reduce((a, b) => a + (b.overall || 7), 0) / mocks.length).toFixed(1) : 7.0,
      avg_words_per_essay: 284,
      mock_tests_count: mocks.length,
      students: [
        {
          user_id: 1001,
          name: "Rustam K.",
          phone: "+998 90 123 4567",
          hw_assigned: 3,
          hw_completed: 3,
          hw_percentage: 100,
          essays_count: 4,
          mock_tests_count: mocks.length,
          estimated_gpa: 7.5,
          mock_history: mocks
        },
        {
          user_id: 1002,
          name: "Malika S.",
          phone: "+998 93 987 6543",
          hw_assigned: 3,
          hw_completed: 2,
          hw_percentage: 66.7,
          essays_count: 3,
          mock_tests_count: mocks.length,
          estimated_gpa: 6.5,
          mock_history: mocks
        }
      ],
      mock_scores: mocks
    };
  },

  async recordMockScore(rawPhone, classId, studentId, dateStr, scores) {
    const phone = normalizePhone(rawPhone);
    const payload = {
      phone,
      class_id: classId,
      student_id: studentId,
      date: dateStr,
      listening: parseFloat(scores.listening || 6.5),
      reading: parseFloat(scores.reading || 6.5),
      writing: parseFloat(scores.writing || 6.5),
      speaking: parseFloat(scores.speaking || 6.5),
      overall: scores.overall ? parseFloat(scores.overall) : undefined,
      notes: scores.notes || ""
    };

    let record = null;
    try {
      const res = await fetch(`${BACKEND_URL}/class/mock-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.record) record = d.record;
      }
    } catch (e) {}

    if (!record) {
      // Calculate overall band with IELTS .25 / .75 rule
      const avg = (payload.listening + payload.reading + payload.writing + payload.speaking) / 4.0;
      const rem = avg - Math.floor(avg);
      const overall = rem < 0.25 ? Math.floor(avg) : rem < 0.75 ? Math.floor(avg) + 0.5 : Math.floor(avg) + 1.0;
      record = {
        id: `mock_${classId}_${studentId}_${Date.now()}`,
        class_id: classId,
        student_id: studentId,
        date: dateStr,
        listening: payload.listening,
        reading: payload.reading,
        writing: payload.writing,
        speaking: payload.speaking,
        overall,
        notes: payload.notes
      };
    }

    const mocksKey = `ielts_mocks_${classId}`;
    const allMocks = JSON.parse(localStorage.getItem(mocksKey) || "[]");
    const existingIdx = allMocks.findIndex(m => m.student_id === studentId && m.date === dateStr);
    if (existingIdx >= 0) {
      allMocks[existingIdx] = record;
    } else {
      allMocks.push(record);
    }
    localStorage.setItem(mocksKey, JSON.stringify(allMocks));
    return record;
  },

  async recordStudentMockScore(rawIdent, mockData) {
    const ident = (rawIdent || "").trim();
    const payload = {
      identifier: ident,
      title: mockData.title || "IELTS Mock Exam",
      date: mockData.date || new Date().toISOString().split("T")[0],
      listening: parseFloat(mockData.listening ?? 6.5),
      reading: parseFloat(mockData.reading ?? 6.5),
      writing: parseFloat(mockData.writing ?? 6.5),
      speaking: parseFloat(mockData.speaking ?? 6.5),
      overall: mockData.overall ? parseFloat(mockData.overall) : undefined,
      notes: mockData.notes || "",
      class_id: mockData.class_id || "self"
    };

    let record = null;
    try {
      const res = await fetch(`${BACKEND_URL}/student/mock-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.record) record = d.record;
      }
    } catch (e) {}

    if (!record) {
      // Offline fallback
      const avg = (payload.listening + payload.reading + payload.writing + payload.speaking) / 4.0;
      const rem = avg - Math.floor(avg);
      const overall = rem < 0.25 ? Math.floor(avg) : rem < 0.75 ? Math.floor(avg) + 0.5 : Math.floor(avg) + 1.0;
      record = {
        id: `mock_self_${Date.now()}`,
        title: payload.title,
        class_id: "self",
        date: payload.date,
        listening: payload.listening,
        reading: payload.reading,
        writing: payload.writing,
        speaking: payload.speaking,
        overall: payload.overall || overall,
        notes: payload.notes
      };
    }

    const mocksKey = `ielts_student_mocks_${ident}`;
    const allMocks = JSON.parse(localStorage.getItem(mocksKey) || "[]");
    allMocks.push(record);
    localStorage.setItem(mocksKey, JSON.stringify(allMocks));
    return record;
  },

  async deleteStudentMockScore(rawIdent, mockId) {
    const ident = (rawIdent || "").trim();
    try {
      await fetch(`${BACKEND_URL}/student/mock-score/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident, mock_id: mockId })
      });
    } catch (e) {}

    const mocksKey = `ielts_student_mocks_${ident}`;
    const allMocks = JSON.parse(localStorage.getItem(mocksKey) || "[]");
    const filtered = allMocks.filter(m => m.id !== mockId);
    localStorage.setItem(mocksKey, JSON.stringify(filtered));
    return true;
  },

  async getStudentMockScores(rawIdent, classId) {
    const ident = (rawIdent || "").trim();
    try {
      const url = `${BACKEND_URL}/student/mock-scores?identifier=${encodeURIComponent(ident)}${classId ? `&class_id=${encodeURIComponent(classId)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        if (d.scores) {
          const mocksKey = `ielts_student_mocks_${ident}`;
          localStorage.setItem(mocksKey, JSON.stringify(d.scores));
          return d.scores;
        }
      }
    } catch (e) {}

    const mocksKey = `ielts_student_mocks_${ident}`;
    const cached = JSON.parse(localStorage.getItem(mocksKey) || "[]");
    return cached;
  }
};