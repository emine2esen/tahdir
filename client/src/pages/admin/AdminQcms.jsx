import { useEffect, useState } from 'react';
import { api } from '../../api';

const empty = {
  profil_id: '',
  title: '',
  level: 1,
  duration_minutes: 60,
  is_active: true,
};

export default function AdminQcms() {
  const [profils, setProfils] = useState([]);
  const [profilId, setProfilId] = useState('');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [duplicateId, setDuplicateId] = useState(null);
  const [duplicateForm, setDuplicateForm] = useState({ profil_id: '', level: 1 });
  const [duplicateError, setDuplicateError] = useState('');
  const [duplicateSuccess, setDuplicateSuccess] = useState('');

  useEffect(() => {
    api.getProfils().then((p) => {
      setProfils(p);
      if (p[0]) {
        setProfilId(String(p[0].id));
        setForm((f) => ({ ...f, profil_id: String(p[0].id) }));
      }
    });
  }, []);

  useEffect(() => {
    if (!profilId) return;
    api
      .getQcms(profilId)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [profilId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        profil_id: Number(form.profil_id || profilId),
        level: Number(form.level),
        duration_minutes: Number(form.duration_minutes),
      };
      if (editId) await api.updateQcm(editId, payload);
      else await api.createQcm(payload);
      setForm({ ...empty, profil_id: profilId });
      setEditId(null);
      setRows(await api.getQcms(profilId));
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(row) {
    setEditId(row.id);
    setForm({
      profil_id: String(row.profil_id),
      title: row.title,
      level: row.level,
      duration_minutes: row.duration_minutes,
      is_active: !!row.is_active,
    });
  }

  async function remove(id) {
    if (!confirm('Supprimer ce QCM et ses questions ?')) return;
    await api.deleteQcm(id);
    setRows(await api.getQcms(profilId));
  }

  function startDuplicate(row) {
    setEditId(null);
    setDuplicateError('');
    setDuplicateSuccess('');
    setDuplicateId(row.id);
    const other = profils.find((p) => String(p.id) !== String(row.profil_id));
    setDuplicateForm({ profil_id: other ? String(other.id) : '', level: row.level });
  }

  async function submitDuplicate(row) {
    if (!duplicateForm.profil_id) {
      setDuplicateError('Choisissez un profil cible');
      return;
    }
    setDuplicateError('');
    try {
      await api.duplicateQcm(row.id, {
        profil_id: Number(duplicateForm.profil_id),
        level: Number(duplicateForm.level),
      });
      setDuplicateId(null);
      setDuplicateSuccess('QCM dupliqué avec succès.');
    } catch (err) {
      setDuplicateError(err.message);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-2">QCM</h1>
      <p className="text-muted mb-6">Maximum 10 QCM par profil (niveaux 1 à 10).</p>
      {error && <p className="text-red-700 mb-4">{error}</p>}
      {duplicateSuccess && (
        <p className="text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4 text-sm">
          {duplicateSuccess}
        </p>
      )}

      <select
        className="rounded-lg border border-brand/20 px-3 py-2 bg-white mb-4"
        value={profilId}
        onChange={(e) => {
          setProfilId(e.target.value);
          setForm((f) => ({ ...f, profil_id: e.target.value }));
          setEditId(null);
        }}
      >
        {profils.map((p) => (
          <option key={p.id} value={p.id}>
            {p.concours_title} — {p.title}
          </option>
        ))}
      </select>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-8 grid gap-3 md:grid-cols-2"
      >
        <input
          className="rounded-lg border border-brand/20 px-3 py-2 md:col-span-2"
          placeholder="Titre du QCM"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <label className="text-sm">
          Niveau (1–10)
          <input
            type="number"
            min={1}
            max={10}
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            required
          />
        </label>
        <label className="text-sm">
          Durée (minutes)
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={form.duration_minutes}
            onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Actif
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="rounded-lg bg-brand text-white px-4 py-2">
            {editId ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editId && (
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() => {
                setEditId(null);
                setForm({ ...empty, profil_id: profilId });
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-brand/10 bg-white/60 p-4"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="font-semibold">
                  Niv. {row.level} — {row.title}
                </div>
                <div className="text-sm text-muted">
                  {row.duration_minutes} min · {row.questions_count} questions
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(row)} className="text-sm border rounded-lg px-3 py-1.5">
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => startDuplicate(row)}
                  className="text-sm border border-brand/30 text-brand rounded-lg px-3 py-1.5"
                >
                  Dupliquer vers un autre profil
                </button>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  className="text-sm border border-red-200 text-red-700 rounded-lg px-3 py-1.5"
                >
                  Supprimer
                </button>
              </div>
            </div>

            {duplicateId === row.id && (
              <div className="mt-3 pt-3 border-t border-brand/10 flex flex-wrap items-end gap-3">
                <p className="text-xs text-muted w-full">
                  Crée une copie indépendante de ce QCM (et de ses questions) dans un
                  autre profil. Le QCM d'origine n'est pas modifié.
                </p>
                <label className="text-sm">
                  Profil cible
                  <select
                    className="mt-1 rounded-lg border border-brand/20 px-3 py-2 bg-white"
                    value={duplicateForm.profil_id}
                    onChange={(e) =>
                      setDuplicateForm({ ...duplicateForm, profil_id: e.target.value })
                    }
                  >
                    <option value="">Choisir un profil</option>
                    {profils
                      .filter((p) => String(p.id) !== String(row.profil_id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.concours_title} — {p.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm">
                  Ordre (niveau 1–10) dans le profil cible
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="mt-1 w-24 rounded-lg border border-brand/20 px-3 py-2"
                    value={duplicateForm.level}
                    onChange={(e) =>
                      setDuplicateForm({ ...duplicateForm, level: e.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => submitDuplicate(row)}
                  className="rounded-lg bg-brand text-white px-4 py-2 text-sm"
                >
                  Confirmer la copie
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateId(null)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Annuler
                </button>
                {duplicateError && (
                  <p className="text-red-700 text-sm w-full">{duplicateError}</p>
                )}
              </div>
            )}
          </div>
        ))}
        {!rows.length && <p className="text-muted">Aucun QCM pour ce profil.</p>}
      </div>
    </div>
  );
}
