const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'tahdir.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS concours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    year INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profils (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concours_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS qcms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profil_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    level INTEGER NOT NULL CHECK(level >= 1 AND level <= 10),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profil_id, level),
    FOREIGN KEY (profil_id) REFERENCES profils(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qcm_id INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    text_fr TEXT DEFAULT '',
    text_ar TEXT DEFAULT '',
    image_url TEXT,
    explanation TEXT DEFAULT '',
    explanation_fr TEXT DEFAULT '',
    explanation_ar TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(qcm_id, order_num),
    FOREIGN KEY (qcm_id) REFERENCES qcms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    label TEXT NOT NULL CHECK(label IN ('A','B','C','D','E','F')),
    text TEXT NOT NULL DEFAULT '',
    text_fr TEXT DEFAULT '',
    text_ar TEXT DEFAULT '',
    is_correct INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(question_id, label)
  );

  CREATE TABLE IF NOT EXISTS access_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    label TEXT DEFAULT '',
    profil_id INTEGER,
    duration_days INTEGER NOT NULL DEFAULT 7,
    is_used INTEGER NOT NULL DEFAULT 0,
    used_at TEXT,
    expires_at TEXT,
    active_jti TEXT,
    active_device_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (profil_id) REFERENCES profils(id) ON DELETE SET NULL
  );
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('access_codes', 'duration_days', 'INTEGER NOT NULL DEFAULT 7');
ensureColumn('access_codes', 'expires_at', 'TEXT');

const hadDurationHours = db
  .prepare(`PRAGMA table_info(access_codes)`)
  .all()
  .some((c) => c.name === 'duration_hours');
ensureColumn('access_codes', 'duration_hours', 'INTEGER NOT NULL DEFAULT 168');
if (!hadDurationHours) {
  // Migration : les anciens codes stockaient une durée en jours. On la convertit
  // une fois en heures (nouvelle unité, pour permettre des durées comme 3h/5h).
  db.exec(`UPDATE access_codes SET duration_hours = duration_days * 24`);
}
ensureColumn('questions', 'text_fr', "TEXT DEFAULT ''");
ensureColumn('questions', 'text_ar', "TEXT DEFAULT ''");
ensureColumn('questions', 'explanation_fr', "TEXT DEFAULT ''");
ensureColumn('questions', 'explanation_ar', "TEXT DEFAULT ''");
ensureColumn('questions', 'is_simulation', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('choices', 'text_fr', "TEXT DEFAULT ''");
ensureColumn('choices', 'text_ar', "TEXT DEFAULT ''");

/**
 * Anciennes bases : la table choices limitait les labels à A-D via une contrainte
 * CHECK. SQLite ne permet pas de modifier une CHECK existante avec ALTER TABLE,
 * donc on recrée la table (copie des données) pour autoriser jusqu'à 6 choix (A-F).
 */
function ensureChoiceLabelRange() {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'choices'`)
    .get();
  if (!row || row.sql.includes("'E'")) return;

  db.pragma('foreign_keys = OFF');
  const tx = db.transaction(() => {
    db.exec(`
      CREATE TABLE choices_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL,
        label TEXT NOT NULL CHECK(label IN ('A','B','C','D','E','F')),
        text TEXT NOT NULL DEFAULT '',
        text_fr TEXT DEFAULT '',
        text_ar TEXT DEFAULT '',
        is_correct INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        UNIQUE(question_id, label)
      );
      INSERT INTO choices_new (id, question_id, label, text, text_fr, text_ar, is_correct)
        SELECT id, question_id, label, text, text_fr, text_ar, is_correct FROM choices;
      DROP TABLE choices;
      ALTER TABLE choices_new RENAME TO choices;
    `);
  });
  tx();
  db.pragma('foreign_keys = ON');
  console.log('Migration : la table choices accepte désormais jusqu\'à 6 choix (A-F).');
}

ensureChoiceLabelRange();

// Migrer l'ancien contenu vers FR si besoin
db.exec(`
  UPDATE questions
  SET text_fr = text
  WHERE (text_fr IS NULL OR text_fr = '') AND text IS NOT NULL AND text != '';
`);
db.exec(`
  UPDATE questions
  SET explanation_fr = explanation
  WHERE (explanation_fr IS NULL OR explanation_fr = '')
    AND explanation IS NOT NULL AND explanation != '';
`);
db.exec(`
  UPDATE choices
  SET text_fr = text
  WHERE (text_fr IS NULL OR text_fr = '') AND text IS NOT NULL AND text != '';
`);

function ensureDefaultAdmin() {
  const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('Admin par défaut créé: admin / admin123');
  }
}

ensureDefaultAdmin();

/** Helper: texte selon langue (fallback FR → AR → text) */
function localized(row, field, lang) {
  const fr = row[`${field}_fr`] || '';
  const ar = row[`${field}_ar`] || '';
  const base = row[field] || '';
  if (lang === 'ar') return ar || fr || base;
  return fr || base || ar;
}

/** Langue effectivement utilisée par localized() (pour signaler un repli au client) */
function localizedLang(row, field, lang) {
  const fr = row[`${field}_fr`] || row[field] || '';
  const ar = row[`${field}_ar`] || '';
  if (lang === 'ar') return ar ? 'ar' : 'fr';
  return fr ? 'fr' : 'ar';
}

db.localized = localized;
db.localizedLang = localizedLang;
module.exports = db;
