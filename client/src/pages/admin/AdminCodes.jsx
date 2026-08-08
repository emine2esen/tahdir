import { useEffect, useState } from 'react';
import { api } from '../../api';

const DURATIONS = [
  { value: 1, label: '1 jour' },
  { value: 2, label: '2 jours' },
  { value: 7, label: '1 semaine' },
  { value: 30, label: '1 mois' },
];

export default function AdminCodes() {
  const [rows, setRows] = useState([]);
  const [profils, setProfils] = useState([]);
  const [count, setCount] = useState(5);
  const [label, setLabel] = useState('');
  const [profilId, setProfilId] = useState('');
  const [durationDays, setDurationDays] = useState(7);
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
        duration_days: Number(durationDays),
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

  function durationLabel(days) {
    return DURATIONS.find((d) => d.value === Number(days))?.label || `${days} j`;
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-2">Codes d&apos;accès</h1>
      <p className="text-muted mb-6">
        Le code reste valable pendant la durée choisie. Une seule session active à
        la fois (nouvelle connexion déconnecte l&apos;ancienne).
      </p>
      {error && <p className="text-red-700 mb-4">{error}</p>}

      <form
        onSubmit={generate}
        className="rounded-xl border border-brand/10 bg-white/70 p-5 mb-6 grid gap-3 md:grid-cols-5"
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
          Durée
          <select
            className="mt-1 w-full rounded-lg border border-brand/20 px-3 py-2"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
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
          className="md:col-span-5 rounded-lg bg-brand text-white px-4 py-2.5 font-medium"
        >
          Générer
        </button>
      </form>

      {created.length > 0 && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold-soft/30 p-4">
          <div className="font-semibold mb-2">Derniers codes générés</div>
          <div className="font-mono text-sm space-y-1">
            {created.map((c) => (
              <div key={c.id}>
                {c.code} · {durationLabel(c.duration_days)}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-brand/10 bg-white/60">
        <table className="w-full text-sm">
          <thead className="bg-brand/5 text-left">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Durée</th>
              <th className="px-3 py-2">Profil</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Expire</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expired =
                row.expires_at && new Date(row.expires_at).getTime() < Date.now();
              return (
                <tr key={row.id} className="border-t border-brand/5">
                  <td className="px-3 py-2 font-mono">{row.code}</td>
                  <td className="px-3 py-2">{durationLabel(row.duration_days)}</td>
                  <td className="px-3 py-2">{row.profil_title || 'Tous'}</td>
                  <td className="px-3 py-2">
                    {!row.is_used ? (
                      <span className="text-emerald-700">Disponible</span>
                    ) : expired ? (
                      <span className="text-red-700">Expiré</span>
                    ) : (
                      <span className="text-amber-700">Actif</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted text-xs">
                    {row.expires_at
                      ? new Date(row.expires_at).toLocaleString()
                      : '—'}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
