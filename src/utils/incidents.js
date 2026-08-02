const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');

let store = { nextCaseId: 1, records: [] };

function load() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      store = JSON.parse(fs.readFileSync(INCIDENTS_FILE, 'utf8'));
      if (!store.nextCaseId) store.nextCaseId = 1;
      if (!Array.isArray(store.records)) store.records = [];
    }
  } catch (err) {
    console.error('[GUARD] incidents.json okunamadı:', err.message);
    store = { nextCaseId: 1, records: [] };
  }
}

function save() {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[GUARD] incidents.json yazılamadı:', err.message);
  }
}

load();

// { userId, userTag, guildId, type, reason, result } -> case numarasını döner
function addIncident({ userId, userTag, guildId, type, reason, result }) {
  const caseId = store.nextCaseId;
  store.nextCaseId += 1;
  store.records.push({
    caseId,
    userId,
    userTag,
    guildId,
    type,
    reason,
    result,
    timestamp: Date.now(),
  });
  save();
  return caseId;
}

function getIncidentsForUser(userId) {
  return store.records
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

module.exports = { addIncident, getIncidentsForUser };
