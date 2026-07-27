const DEVICE_KEY = 'tahdir_device_id';
const CANDIDATE_TOKEN_KEY = 'tahdir_candidate_token';
const ADMIN_TOKEN_KEY = 'tahdir_admin_token';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getCandidateToken() {
  return localStorage.getItem(CANDIDATE_TOKEN_KEY);
}

export function setCandidateToken(token) {
  if (token) localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
  else localStorage.removeItem(CANDIDATE_TOKEN_KEY);
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request(path, { method = 'GET', body, token, admin = false } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId(),
  };
  const auth = token ?? (admin ? getAdminToken() : getCandidateToken());
  if (auth) headers.Authorization = `Bearer ${auth}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const err = new Error(data?.error || 'Erreur réseau');
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/api/health'),
  candidateLogin: (code) =>
    request('/api/auth/candidate/login', {
      method: 'POST',
      body: { code, deviceId: getDeviceId() },
    }),
  candidateClaim: () =>
    request('/api/auth/candidate/claim', {
      method: 'POST',
      body: { deviceId: getDeviceId() },
    }),
  candidateMe: () => request('/api/auth/candidate/me'),
  candidateLogout: () => request('/api/auth/candidate/logout', { method: 'POST' }),
  catalog: () => request('/api/candidate/catalog'),
  getQcm: (id) => request(`/api/candidate/qcms/${id}`),

  adminLogin: (username, password) =>
    request('/api/auth/admin/login', {
      method: 'POST',
      body: { username, password },
      admin: true,
    }),
  adminMe: () => request('/api/auth/admin/me', { admin: true }),

  getConcours: () => request('/api/admin/concours', { admin: true }),
  createConcours: (body) =>
    request('/api/admin/concours', { method: 'POST', body, admin: true }),
  updateConcours: (id, body) =>
    request(`/api/admin/concours/${id}`, { method: 'PUT', body, admin: true }),
  deleteConcours: (id) =>
    request(`/api/admin/concours/${id}`, { method: 'DELETE', admin: true }),

  getProfils: (concoursId) =>
    request(
      concoursId ? `/api/admin/profils?concours_id=${concoursId}` : '/api/admin/profils',
      { admin: true }
    ),
  createProfil: (body) =>
    request('/api/admin/profils', { method: 'POST', body, admin: true }),
  updateProfil: (id, body) =>
    request(`/api/admin/profils/${id}`, { method: 'PUT', body, admin: true }),
  deleteProfil: (id) =>
    request(`/api/admin/profils/${id}`, { method: 'DELETE', admin: true }),

  getQcms: (profilId) =>
    request(`/api/admin/qcms?profil_id=${profilId}`, { admin: true }),
  createQcm: (body) => request('/api/admin/qcms', { method: 'POST', body, admin: true }),
  updateQcm: (id, body) =>
    request(`/api/admin/qcms/${id}`, { method: 'PUT', body, admin: true }),
  deleteQcm: (id) =>
    request(`/api/admin/qcms/${id}`, { method: 'DELETE', admin: true }),

  getQuestions: (qcmId) =>
    request(`/api/admin/qcms/${qcmId}/questions`, { admin: true }),
  createQuestion: (qcmId, body) =>
    request(`/api/admin/qcms/${qcmId}/questions`, { method: 'POST', body, admin: true }),
  importQuestions: (qcmId, body) =>
    request(`/api/admin/qcms/${qcmId}/questions/import`, {
      method: 'POST',
      body,
      admin: true,
    }),
  updateQuestion: (id, body) =>
    request(`/api/admin/questions/${id}`, { method: 'PUT', body, admin: true }),
  deleteQuestion: (id) =>
    request(`/api/admin/questions/${id}`, { method: 'DELETE', admin: true }),

  getCodes: () => request('/api/admin/codes', { admin: true }),
  createCodes: (body) =>
    request('/api/admin/codes', { method: 'POST', body, admin: true }),
  deleteCode: (id) =>
    request(`/api/admin/codes/${id}`, { method: 'DELETE', admin: true }),

  uploadImage: async (file) => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
        'X-Device-Id': getDeviceId(),
      },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload échoué');
    return data;
  },
};

/** Score 100% côté navigateur — aucune persistance serveur */
export function scoreQuiz(questions, answers) {
  let correct = 0;
  const details = questions.map((q) => {
    const selected = new Set(answers[q.id] || []);
    const correctLabels = new Set(
      q.choices.filter((c) => c.is_correct).map((c) => c.label)
    );
    const isCorrect =
      selected.size === correctLabels.size &&
      [...correctLabels].every((l) => selected.has(l));
    if (isCorrect) correct += 1;
    return {
      question: q,
      selected: [...selected],
      correctLabels: [...correctLabels],
      isCorrect,
    };
  });
  return { score: correct, total: questions.length, details };
}
