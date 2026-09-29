const { readJSON, writeJSON } = require("./storage");

const SESSIONS_FILE = "data/sessions.json";

function getAllSessions() {
  return readJSON(SESSIONS_FILE, { admin: {}, oversight: {} });
}

function saveAllSessions(data) {
  writeJSON(SESSIONS_FILE, data);
}

// يرجع بيانات الجلسة النشطة للمستخدم بنوع اللوحة المحدد، أو null إذا ما كان مسجل دخول
function getActiveSession(type, userId) {
  const sessions = getAllSessions();
  if (!sessions[type]) sessions[type] = {};
  return sessions[type][userId] || null;
}

// يبدأ جلسة جديدة (تسجيل دخول). يرجع false إذا كان مسجل دخول أصلاً
function startSession(type, userId, username) {
  const sessions = getAllSessions();
  if (!sessions[type]) sessions[type] = {};
  if (sessions[type][userId]) return false; // مسجل دخول بالفعل

  sessions[type][userId] = {
    username,
    startTime: Date.now(),
  };
  saveAllSessions(sessions);
  return true;
}

// ينهي الجلسة (تسجيل خروج). يرجع بيانات الجلسة المنتهية أو null إذا ما كان مسجل دخول أصلاً
function endSession(type, userId) {
  const sessions = getAllSessions();
  if (!sessions[type] || !sessions[type][userId]) return null;

  const session = sessions[type][userId];
  delete sessions[type][userId];
  saveAllSessions(sessions);

  return {
    ...session,
    endTime: Date.now(),
    durationMs: Date.now() - session.startTime,
  };
}

module.exports = { getAllSessions, getActiveSession, startSession, endSession };
