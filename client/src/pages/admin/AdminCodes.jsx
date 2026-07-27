import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function AdminCodes() {
  const [rows, setRows] = useState([]);
  const [profils, setProfils] = useState([]);
  const [count, setCount] = useState(5);
  const [label, setLabel] = useState('');
  const [profilId, setProfilId] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState([]);

  async function load() {
    const [codes, p] = await Promise.all([api.getCodes(), api.getProfils()]);
    setRows(codes);
    setProfils(p);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function generate(e) {
    e.preventDefault();
    setError('');
    try {
      const codes = await api.createCodes({
        count: Number(count),
        label,
        profil_id: profilId ? Number(profilId) : null,
      });
      setCreated(codes);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer ce code ?')) return;
    await api.deleteCode(id);
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-2">Codes d&apos;accès</h1>
      <p className="text-muted mb-6">
        Usage unique : dès qu&apos;un candidat se connecte, le code devient invalide.
      </p>
      {error && <p className="text-red-700 mb-4">{error}</p>}

      <form
        onSubmit={generate}
        className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-6 grid gap-3 md:grid-cols-4"
      >
        <label className="text-sm">
          Quantité
          <input
            type="number"
            min={1}
            max={100}
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <label className="text-sm md:col-span-2">
          Libellé
          <input
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Lot mars 2026"
          />
        </label>
        <label className="text-sm">
          Profil (optionnel)
          <select
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={profilId}
            onChange={(e) => setProfilId(e.target.value)}
          >
            <option value="">Tous les profils</option>
            {profils.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="md:col-span-4 rounded-lg bg-brand text-white px-4 py-2.5 font-medium"
        >
          Générer
        </button>
      </form>

      {created.length > 0 && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold-soft/30 p-4">
          <div className="font-semibold mb-2">Derniers codes générés</div>
          <div className="font-mono text-sm space-y-1">
            {created.map((c) => (
              <div key={c.id}>{c.code}</div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-brand/10 bg-white/60">
        <table className="w-full text-sm">
          <thead className="bg-brand/5 text-left">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Profil</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Libellé</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-brand/5">
                <td className="px-3 py-2 font-mono">{row.code}</td>
                <td className="px-3 py-2">{row.profil_title || 'Tous'}</td>
                <td className="px-3 py-2">
                  {row.is_used ? (
                    <span className="text-red-700">Utilisé</span>
                  ) : (
                    <span className="text-emerald-700">Disponible</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted">{row.label || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="text-red-700 text-xs border border-red-200 rounded px-2 py-1"
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
