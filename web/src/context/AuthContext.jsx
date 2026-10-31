import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Purge persistent localStorage tokens so the app NEVER opens without login
    try {
      localStorage.removeItem("ielts_current_user_v3");
      localStorage.removeItem("ielts_current_user_v2");
      localStorage.removeItem("ielts_current_user");
      
      const sessionActive = sessionStorage.getItem("ielts_session_active");
      if (sessionActive === "true") {
        const sessionUser = sessionStorage.getItem("ielts_session_user");
        if (sessionUser) return JSON.parse(sessionUser);
      }
    } catch (e) {}
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && (user.phone_number || user.user_id || user.nickname || user.username)) {
      sessionStorage.setItem("ielts_session_active", "true");
      sessionStorage.setItem("ielts_session_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("ielts_session_active");
      sessionStorage.removeItem("ielts_session_user");
    }
  }, [user]);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const authUser = await apiService.login(identifier, password);
      const lookupKey = authUser.phone_number || authUser.nickname || authUser.username || identifier;
      const full = await apiService.getUserData(lookupKey);
      const merged = { ...full, ...authUser };
      sessionStorage.setItem("ielts_session_active", "true");
      sessionStorage.setItem("ielts_session_user", JSON.stringify(merged));
      setUser(merged);
      return merged;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem("ielts_session_active");
      sessionStorage.removeItem("ielts_session_user");
      localStorage.removeItem("ielts_current_user_v3");
      localStorage.removeItem("ielts_current_user_v2");
      localStorage.removeItem("ielts_current_user");
    } catch (e) {}
    setUser(null);
  };

  const updateConfig = async (apiKey, model) => {
    if (!user) return;
    await apiService.updateConfig(user.phone_number, apiKey, model);
    setUser(prev => ({ ...prev, api_key: apiKey, model }));
  };

  const logPractice = async (activity, minutes) => {
    if (!user) return;
    const updated = await apiService.logPractice(user.phone_number, activity, minutes);
    setUser(prev => ({ ...prev, practice: updated }));
  };

  const joinClass = async (code) => {
    if (!user) return;
    const res = await apiService.joinClass(user.phone_number, code);
    if (res.class) {
      setUser(prev => ({
        ...prev,
        enrolled_classes: [...(prev.enrolled_classes || []), res.class]
      }));
    }
    return res;
  };

  const leaveClass = async (classId) => {
    if (!user) return;
    const remaining = await apiService.leaveClass(user.phone_number, classId);
    setUser(prev => ({ ...prev, enrolled_classes: remaining }));
  };

  const createTeachingClass = async (name, lGoal = 180, rGoal = 180) => {
    if (!user) return;
    const created = await apiService.createTeachingClass(user.phone_number, name, lGoal, rGoal);
    setUser(prev => ({
      ...prev,
      teaching_classes: [...(prev.teaching_classes || []), created]
    }));
    return created;
  };

  const reviewStudentEssay = async (queueId, score, notes) => {
    if (!user) return;
    const updatedQueue = await apiService.reviewStudentEssay(user.phone_number, queueId, score, notes);
    setUser(prev => ({ ...prev, student_queue: updatedQueue }));
  };

  const assignHomework = async (classId, className, title, description, deadline, taskType) => {
    if (!user) return;
    const hw = await apiService.assignHomework(user.phone_number, classId, className, title, description, deadline, taskType);
    return hw;
  };

  const broadcastLesson = async (classId, message) => {
    if (!user) return;
    return await apiService.broadcastLesson(user.phone_number, classId, message);
  };

  const addSubmission = async (sub) => {
    if (!user) return;
    const updated = await apiService.saveSubmission(user.phone_number, sub);
    setUser(prev => ({
      ...prev,
      submissions: updated.submissions,
      tokens: updated.tokens
    }));
  };

  const getClassStats = async (classId) => {
    if (!user) return null;
    return await apiService.getClassStats(user.phone_number, classId);
  };

  const recordMockScore = async (classId, studentId, dateStr, scores) => {
    if (!user) return null;
    return await apiService.recordMockScore(user.phone_number, classId, studentId, dateStr, scores);
  };

  const getStudentMockScores = async (classId) => {
    if (!user) return [];
    return await apiService.getStudentMockScores(user.phone_number, classId);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateConfig,
      logPractice,
      joinClass,
      leaveClass,
      createTeachingClass,
      reviewStudentEssay,
      assignHomework,
      broadcastLesson,
      addSubmission,
      getClassStats,
      recordMockScore,
      getStudentMockScores
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
