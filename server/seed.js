const db = require('./db');

const CNC_TITLE =
  'مسابقة خارجية لاكتتاب 310 عنصر للولوج لمدارس التكوين';

const CNC_DESCRIPTION = [
  'Concours externe — Commission Nationale des Concours (CNC).',
  'Recrutement de 310 éléments pour l’accès aux écoles de formation.',
  'Période de candidature : 23/07/2026 — 30/07/2026 · Statut : ouvert.',
].join(' ');

/** الشُّعب — profils du concours CNC (sans QCM) */
const CNC_PROFILS = [
  { title: 'كاتب ضبط رئيسي', description: 'âge 18–37 · externe · écrit · postes : 30' },
  { title: 'كتاب ضبط', description: 'âge 18–37 · externe · écrit · postes : 30' },
  { title: 'مفتش خزينة رئيسي', description: 'âge 18–37 · externe · écrit · postes : 30' },
  { title: 'مفتش ضرائب', description: 'âge 18–37 · externe · écrit · postes : 20' },
  { title: 'مراقب خزينة', description: 'âge 18–37 · externe · écrit · postes : 20' },
  { title: 'مراقب ضرائب', description: 'âge 18–37 · externe · écrit · postes : 20' },
  { title: 'قانونيين', description: 'âge 18–37 · externe · écrit · postes : 60' },
  { title: 'محرر إدارة', description: 'âge 18–37 · externe · écrit · postes : 20' },
  { title: 'مكون إشارة وبرايل', description: 'âge 18–37 · externe · écrit · postes : 25' },
  { title: 'مكون للترقية النسوية', description: 'âge 18–37 · externe · écrit · postes : 25' },
  { title: 'مراقب حدائق أطفال', description: 'âge 18–37 · externe · écrit · postes : 20' },
  { title: 'مفوض شباب', description: 'âge 18–37 · externe · écrit · postes : 10' },
];

function ensureCncConcours() {
  let concours = db.prepare('SELECT * FROM concours WHERE title = ?').get(CNC_TITLE);

  if (!concours) {
    const result = db
      .prepare(
        `INSERT INTO concours (title, description, year, is_active)
         VALUES (?, ?, ?, 1)`
      )
      .run(CNC_TITLE, CNC_DESCRIPTION, 2026);
    concours = db.prepare('SELECT * FROM concours WHERE id = ?').get(result.lastInsertRowid);
    console.log(`Concours CNC créé (id=${concours.id}).`);
  } else {
    db.prepare(
      `UPDATE concours SET description = ?, year = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?`
    ).run(CNC_DESCRIPTION, 2026, concours.id);
    console.log(`Concours CNC déjà présent (id=${concours.id}) — mis à jour.`);
  }

  const insertProfil = db.prepare(
    `INSERT INTO profils (concours_id, title, description, is_active)
     VALUES (?, ?, ?, 1)`
  );
  const findProfil = db.prepare(
    `SELECT id FROM profils WHERE concours_id = ? AND title = ?`
  );
  const updateProfil = db.prepare(
    `UPDATE profils SET description = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?`
  );

  let created = 0;
  let updated = 0;

  const tx = db.transaction(() => {
    for (const p of CNC_PROFILS) {
      const existing = findProfil.get(concours.id, p.title);
      if (existing) {
        updateProfil.run(p.description, existing.id);
        updated += 1;
      } else {
        insertProfil.run(concours.id, p.title, p.description);
        created += 1;
      }
    }
  });
  tx();

  console.log(`Profils CNC : ${created} créé(s), ${updated} mis à jour. Aucun QCM ajouté.`);
  return concours;
}

function ensureDemoCodes() {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO access_codes (code, label, profil_id) VALUES (?, ?, NULL)`
  );
  insert.run('CONCOURS-DEMO01', 'Code démo libre (tous profils)');
  insert.run('CONCOURS-CNC310', 'Code démo concours CNC 310');
}

function seed() {
  ensureCncConcours();
  ensureDemoCodes();

  const admin = db.prepare('SELECT username FROM admins LIMIT 1').get();
  console.log('Seed CNC terminé.');
  console.log(`Admin: ${admin?.username || 'admin'} / admin123`);
  console.log('Codes: CONCOURS-DEMO01, CONCOURS-CNC310');
}

seed();
