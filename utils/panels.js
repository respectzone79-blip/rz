const { readJSON, writeJSON } = require("./storage");

const PANELS_FILE = "config/panels.json";

function getPanels() {
  return readJSON(PANELS_FILE, {
    admin: { label: "الإدارة", color: "#6A0DAD", panelChannelId: null, logChannelId: null, messageId: null },
    oversight: { label: "الرقابة", color: "#8A2BE2", panelChannelId: null, logChannelId: null, messageId: null },
  });
}

function getPanel(type) {
  const panels = getPanels();
  return panels[type] || null;
}

function updatePanel(type, updates) {
  const panels = getPanels();
  if (!panels[type]) return false;
  panels[type] = { ...panels[type], ...updates };
  writeJSON(PANELS_FILE, panels);
  return true;
}

module.exports = { getPanels, getPanel, updatePanel };
