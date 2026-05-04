import { session } from '../api';

export default function DashboardPage() {
  const s = session.get();
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">You're signed in</h1>
        <p className="mt-2 text-slate-600">Your JWT is stored in this browser and expires automatically.</p>
        {s && (
          <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Expires at</dt>
              <dd className="font-mono">{new Date(s.expiresAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">Token</dt>
              <dd className="font-mono break-all bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                {s.token}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
