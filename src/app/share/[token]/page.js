import { query, initDB } from '@/lib/db';
import ShareClient from './ShareClient';

export default async function SharePage({ params }) {
  const { token } = await params;
  
  await initDB();
  
  const tokens = await query('SELECT * FROM share_tokens WHERE token = ? AND revoked = 0', [token]);
  const isValid = tokens && tokens.length > 0 && new Date(tokens[0].expires_at) > new Date();

  if (!isValid) {
    return (
      <main className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="auth-card glass" style={{ textAlign: 'center', padding: '3rem', maxWidth: '480px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
          <h1 className="auth-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>Gedeelde Link Verlopen</h1>
          <p className="auth-subtitle" style={{ marginTop: '0.75rem', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
            Deze gedeelde link is niet meer geldig, is handmatig ingetrokken door een beheerder of is verlopen na 3 dagen.
          </p>
          <a href="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', lineHeight: '42px', height: '42px', padding: '0 1.5rem', borderRadius: '8px', background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold' }}>
            Naar Inloggen
          </a>
        </div>
      </main>
    );
  }

  // Fetch target photo details
  const photoId = tokens[0].photo_id;
  const photoRecords = await query('SELECT * FROM car_photos WHERE id = ?', [photoId]);

  if (!photoRecords || photoRecords.length === 0) {
    return (
      <main className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="auth-card glass" style={{ textAlign: 'center', padding: '3rem', maxWidth: '480px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>❌</div>
          <h1 className="auth-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>Voertuig Niet Gevonden</h1>
          <p className="auth-subtitle" style={{ marginTop: '0.75rem', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: '1.5' }}>
            Het voertuig behorende bij deze deellink is permanent verwijderd uit de Vault.
          </p>
          <a href="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', lineHeight: '42px', height: '42px', padding: '0 1.5rem', borderRadius: '8px', background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold' }}>
            Naar Inloggen
          </a>
        </div>
      </main>
    );
  }

  return <ShareClient photo={photoRecords[0]} expiresAt={tokens[0].expires_at} />;
}
