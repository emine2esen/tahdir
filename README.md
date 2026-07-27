# Tahdir — Préparation aux concours (Mauritanie)

Plateforme web pour s'entraîner aux concours via des QCM, avec back-office d'administration.

## Stack

- **Frontend** : React + Vite + Tailwind CSS (scoring & chronomètre côté navigateur)
- **Backend** : Node.js + Express
- **Base** : SQLite (`better-sqlite3`)

## Démarrage

```bash
npm install
cd client && npm install && cd ..
npm run seed
npm run dev
```

- Candidat : http://localhost:5173
- API : http://localhost:3001
- Admin : http://localhost:5173/admin

### Comptes / codes de démo

| Rôle | Accès |
|------|--------|
| Admin | `admin` / `admin123` |
| Code libre | `CONCOURS-DEMO01` |
| Code Inspecteur | `CONCOURS-DEMO02` |
| Code Infirmier | `CONCOURS-DEMO03` |

> Les codes sont **à usage unique**. Après un premier login, régénérez-en depuis l’admin.

## Fonctionnalités

### Hiérarchie
Concours → Profil → QCM (niveaux 1–10) → Questions (jusqu’à 50, 4 choix, multi-réponses possibles)

### Candidat
- Connexion par code unique → JWT
- Une seule session active par code (nouvel appareil = déconnexion de l’ancien)
- Timer paramétrable, progression, correction détaillée
- **Score calculé dans le navigateur** — rien n’est sauvegardé en base ; un refresh remet le QCM à zéro

### Admin
CRUD concours, profils, QCM, questions, génération de codes, upload d’images

## Production

```bash
cd client && npm run build && cd ..
set NODE_ENV=production
node server/index.js
```

Sous Linux/macOS : `NODE_ENV=production node server/index.js`
