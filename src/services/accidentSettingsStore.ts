import * as SQLite from 'expo-sqlite';

export type AccidentRole = 'customer' | 'driver';

export interface AccidentSettings {
  enabled: boolean;
  contactPhone: string;
  emergencyPhone: string;
  ownerPhone: string;
  sendEmergencyContact: boolean;
  sendNearbyMechanics: boolean;
  sendOwner: boolean;
}

export const DEFAULT_ACCIDENT_SETTINGS: AccidentSettings = {
  enabled: true,
  contactPhone: '',
  emergencyPhone: '',
  ownerPhone: '',
  sendEmergencyContact: true,
  sendNearbyMechanics: true,
  sendOwner: true,
};

const db = SQLite.openDatabaseSync('car_rescue_accident.db');
let initialized = false;

function init() {
  if (initialized) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS accident_settings (
      setting_key TEXT PRIMARY KEY NOT NULL,
      role TEXT NOT NULL,
      user_id TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accident_events (
      signal_id TEXT PRIMARY KEY NOT NULL,
      role TEXT NOT NULL,
      user_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  initialized = true;
}

function keyFor(role: AccidentRole, userId?: string) {
  return `${role}:${userId || 'demo'}`;
}

export function loadAccidentSettings(role: AccidentRole, userId?: string): AccidentSettings {
  init();
  const row = db.getFirstSync<{ settings_json: string }>(
    'SELECT settings_json FROM accident_settings WHERE setting_key = ? LIMIT 1',
    [keyFor(role, userId)],
  );
  if (!row?.settings_json) return { ...DEFAULT_ACCIDENT_SETTINGS };

  try {
    return {
      ...DEFAULT_ACCIDENT_SETTINGS,
      ...JSON.parse(row.settings_json),
    };
  } catch {
    return { ...DEFAULT_ACCIDENT_SETTINGS };
  }
}

export function saveAccidentSettings(role: AccidentRole, userId: string | undefined, settings: AccidentSettings) {
  init();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO accident_settings (setting_key, role, user_id, settings_json, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       settings_json = excluded.settings_json,
       updated_at = excluded.updated_at`,
    [keyFor(role, userId), role, userId || 'demo', JSON.stringify(settings), now],
  );
}

export function recordAccidentEvent(
  signalId: string,
  role: AccidentRole,
  userId: string | undefined,
  status: 'monitoring' | 'cancelled' | 'sent' | 'test-complete' | 'no-recipients' | 'failed',
) {
  init();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO accident_events (signal_id, role, user_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(signal_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
    [signalId, role, userId || null, status, now, now],
  );
}

export function wasAccidentAlertSent(signalId: string) {
  init();
  const row = db.getFirstSync<{ status: string }>(
    'SELECT status FROM accident_events WHERE signal_id = ? LIMIT 1',
    [signalId],
  );
  return row?.status === 'sent';
}
