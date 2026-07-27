import { useEffect, useState } from 'react';
import { api } from '../../api';

const empty = { title: '', description: '', year: new Date().getFullYear(), is_active: true };

export default function AdminConcours() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setRows(await api.getConcours());
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editId) await api.updateConcours(editId, form);
      else await api.createConcours(form);
      setForm(empty);
      setEditId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(row) {
    setEditId(row.id);
    setForm({
      title: row.title,
      description: row.description || '',
      year: row.year || '',
      is_active: !!row.is_active,
    });
  }

  async function remove(id) {
    if (!confirm('Supprimer ce concours et tout son contenu ?')) return;
    await api.deleteConcours(id);
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-6">Concours</h1>
      {error && <p className="text-red-700 mb-4">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-8 grid gap-3 md:grid-cols-2"
      >
        <input
          className="rounded-lg border border-brand/20 px-3 py-2 md:col-span-2"
          placeholder="Titre (ex: Concours ENF 2026)"
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
        <input
          type="number"
          className="rounded-lg border border-brand/20 px-3 py-2"
          placeholder="Année"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
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
            className="rounded-xl border border-brand/10 bg-white/60 p-4 flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <div className="font-semibold text-brand-dark">{row.title}</div>
              <div className="text-sm text-muted">
                {row.year || '—'} · {row.profils_count} profil(s) ·{' '}
                {row.is_active ? 'Actif' : 'Inactif'}
              </div>
              {row.description && (
                <p className="text-sm text-muted mt-1">{row.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="text-sm rounded-lg border px-3 py-1.5"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="text-sm rounded-lg border border-red-200 text-red-700 px-3 py-1.5"
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
