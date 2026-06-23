"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verificatie mislukt');
      } else {
        router.push('/portal');
        router.refresh();
      }
    } catch (err) {
      setError('Verbindingsfout. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container relative overflow-hidden min-h-screen flex items-center justify-center">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -10, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', filter: 'blur(120px)', backgroundColor: 'rgba(173, 198, 255, 0.08)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', filter: 'blur(120px)', backgroundColor: 'rgba(221, 183, 255, 0.08)' }}></div>
      </div>

      <div className="auth-card glass glow-shadow" style={{ backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-box" style={{
            width: '80px',
            height: '80px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--accent-blue)', fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
          </div>
        </div>

        <h1 className="auth-title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
          UnVault <span className="gradient-text">Car Storage</span>
        </h1>
        <p className="auth-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '2rem' }}>
          Beheer uw exclusieve voertuigcollectie met digitale precisie
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="username" style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Gebruikersnaam</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="bijv. officer"
              required
              disabled={loading}
              autoComplete="username"
              style={{ fontFamily: 'var(--font-sans)', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', padding: '0.75rem 1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="password" style={{ fontFamily: 'var(--font-label)', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Beveiligingssleutel</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
              style={{ fontFamily: 'var(--font-sans)', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', padding: '0.75rem 1rem' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? 'Toegang ontsleutelen...' : (
              <>
                <span>Inloggen</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
