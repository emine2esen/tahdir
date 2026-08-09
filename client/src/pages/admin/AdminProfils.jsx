import { useEffect, useState } from 'react';
import { api } from '../../api';

const empty = { concours_id: '', title: '', description: '', is_active: true };

export default function AdminProfils() {
  const [concours, setConcours] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  async function load(concoursId = filter) {
    const [c, p] = await Promise.all([
      api.getConcours(),
      api.getProfils(concoursId || undefined, { all: true }),
    ]);
    setConcours(c);
    setRows(p);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        concours_id: Number(form.concours_id),
      };
      if (editId) await api.updateProfil(editId, payload);
      else await api.createProfil(payload);
      setForm({ ...empty, concours_id: form.concours_id });
      setEditId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(row) {
    setEditId(row.id);
    setForm({
      concours_id: String(row.concours_id),
      title: row.title,
      description: row.description || '',
      is_active: !!row.is_active,
    });
  }

  async function remove(id) {
    if (!confirm('Supprimer ce profil et ses QCM ?')) return;
    await api.deleteProfil(id);
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-6">Profils</h1>
      {error && <p className="text-red-700 mb-4">{error}</p>}

      <div className="mb-4">
        <select
          className="rounded-lg border border-brand/20 px-3 py-2 bg-white"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            load(e.target.value).catch((err) => setError(err.message));
          }}
        >
          <option value="">Tous les concours</option>
          {concours.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-8 grid gap-3 md:grid-cols-2"
      >
        <select
          className="rounded-lg border border-brand/20 px-3 py-2"
          value={form.concours_id}
          onChange={(e) => setForm({ ...form, concours_id: e.target.value })}
          required
        >
          <option value="">Choisir un concours</option>
          {concours.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          className="rounded-lg border border-brand/20 px-3 py-2"
          placeholder="Titre du profil"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="rounded-lg border border-brand/20 px-3 py-2 md:col-span-2 min-h-20"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
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
                setForm(empty);
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
            className="rounded-xl border border-brand/10 bg-white/60 p-4 flex flex-wrap justify-between gap-3"
          >
            <div>
              <div className="font-semibold flex items-center gap-2">
                {row.title}
                {!row.is_active && (
                  <span className="text-xs font-normal text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                    Inactif
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">
                {row.concours_title} · {row.qcms_count}/10 QCM
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => startEdit(row)} className="text-sm border rounded-lg px-3 py-1.5">
                Modifier
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
        ))}
      </div>
    </div>
  );
}
