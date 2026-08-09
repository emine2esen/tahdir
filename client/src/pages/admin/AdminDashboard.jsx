import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getConcours(),
      api.getProfils(undefined, { all: true }),
      api.getCodes(),
    ]).then(([concours, profils, codes]) => {
      setStats({
        concours: concours.length,
        profils: profils.length,
        codes: codes.length,
        unused: codes.filter((c) => !c.is_used).length,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-brand-dark mb-2">
        Tableau de bord
      </h1>
      <p className="text-muted mb-8">
        Gérez les concours, profils, QCM, questions et codes d&apos;accès.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Concours', value: stats?.concours ?? '…', to: '/admin/concours' },
          { label: 'Profils', value: stats?.profils ?? '…', to: '/admin/profils' },
          { label: 'Codes totaux', value: stats?.codes ?? '…', to: '/admin/codes' },
          { label: 'Codes disponibles', value: stats?.unused ?? '…', to: '/admin/codes' },
        ].map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-xl border border-brand/10 bg-white/70 p-5 hover:border-brand/30 transition"
          >
            <div className="text-sm text-muted">{s.label}</div>
            <div className="font-display text-3xl text-brand mt-1">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-brand/10 bg-white/60 p-5 text-sm text-muted space-y-2">
        <p>
          Hiérarchie : <strong>Concours → Profil → QCM (10 niveaux) → Questions (illimité)</strong>
        </p>
        <p>
          Les scores candidats sont calculés dans le navigateur et ne sont pas
          stockés en base.
        </p>
      </div>
    </div>
  );
}
