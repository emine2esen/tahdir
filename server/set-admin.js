const bcrypt = require('bcryptjs');
const db = require('./db');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Usage : node server/set-admin.js <nom_utilisateur> <mot_de_passe>');
  process.exit(1);
}
if (password.length < 6) {
  console.error('Le mot de passe doit contenir au moins 6 caractères.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();

if (existing) {
  db.prepare('UPDATE admins SET username = ?, password_hash = ? WHERE id = ?').run(
    username,
    hash,
    existing.id
  );
  console.log(`Compte admin mis à jour : ${username}`);
} else {
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`Compte admin créé : ${username}`);
}
