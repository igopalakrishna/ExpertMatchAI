"use client";
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useEffect } from 'react';

export default function AdminPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{ experts: number; searches: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => setStats(null));
  }, []);

  async function rebuildIndex() {
    setStatus('Rebuilding index...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.FASTAPI_URL || 'http://localhost:8000'}/index/build`, {
        method: 'POST'
      });
      setStatus(res.ok ? 'Index rebuild triggered' : 'Failed to trigger rebuild');
    } catch (e) {
      setStatus('Error triggering rebuild');
    }
  }

  async function uploadCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('Uploading CSV...');
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setStatus(`Upload complete. created=${data.created} updated=${data.updated}`);
      // refresh stats
      fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {});
    } catch (err) {
      setStatus('Upload failed');
    }
  }

  if (!session) {
    return (
      <main className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Admin</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await signIn('credentials', { email, password, redirect: false });
          }}
          className="space-y-3"
        >
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="rounded-xl bg-gray-900 text-white px-4 py-2" type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">Stats</h2>
        <p className="text-sm text-gray-700">Experts: {stats?.experts ?? '—'} • Searches: {stats?.searches ?? '—'}</p>
      </div>
      <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-3">
        <h2 className="font-semibold">Rebuild Index</h2>
        <button onClick={rebuildIndex} className="rounded-xl bg-blue-600 text-white px-4 py-2">Rebuild now</button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </div>
      <div className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="font-semibold mb-2">Upload CSV</h2>
        <form onSubmit={uploadCsv} className="space-y-3">
          <input type="file" name="file" accept=".csv" className="block" required />
          <button className="rounded-xl bg-gray-900 text-white px-4 py-2" type="submit">Upload</button>
        </form>
      </div>
    </main>
  );
}

