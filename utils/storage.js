const fs = require("fs");
const path = require("path");

function readJSON(filePath, fallback) {
  try {
    const full = path.join(__dirname, "..", filePath);
    if (!fs.existsSync(full)) return fallback;
    const raw = fs.readFileSync(full, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`خطأ في قراءة الملف ${filePath}:`, err);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    const full = path.join(__dirname, "..", filePath);
    fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`خطأ في كتابة الملف ${filePath}:`, err);
    return false;
  }
}

module.exports = { readJSON, writeJSON };
