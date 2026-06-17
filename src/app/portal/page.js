import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import Link from 'next/link';

export default async function PortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ems_vault_token');

  let isAuthenticated = false;
  if (token) {
    const value = token.value;
    const parts = value.split(':');
    if (parts.length === 2) {
      const [username, hmac] = parts;
      const expectedHmac = crypto.createHmac('sha256', 'ems_vault_jwt_secret_2026').update(username).digest('hex');
      if (hmac === expectedHmac) {
        isAuthenticated = true;
      }
    }
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <main className="portal-container">
      <header className="portal-header">
         <div className="portal-shield" style={{ fontSize: '4.5rem' }}>
           ☁️
         </div>
         <h1 className="portal-title">UnVault Car Storage</h1>
         <p className="portal-subtitle">
           Selecteer uw operationele omgeving om uw hulpverleningsvoertuigen te bekijken, te zoeken en te catalogiseren.
         </p>
      </header>

      <section className="portal-grid">
        <Link href="/dashboard/irl/politie" className="portal-card glass">
          <div className="portal-icon">
            📸
          </div>
          <h2 className="portal-card-title">Echte Wereld Voertuigen</h2>
          <p className="portal-card-desc">
            Foto's, locaties en beschrijvingen van in de echte wereld gespotte of gecatalogiseerde hulpverleningsvoertuigen.
          </p>
        </Link>

        <Link href="/dashboard/rp/politie" className="portal-card glass">
          <div className="portal-icon">
            🎮
          </div>
          <h2 className="portal-card-title">In-Game / RP Voertuigen</h2>
          <p className="portal-card-desc">
            Virtuele voertuigcollecties, aangepaste server-hulpverleningsvoertuigen mods en hoogwaardige screenshot-galerij.
          </p>
        </Link>
      </section>

      <footer className="portal-footer">
        BEVEILIGDE UNRAID NODE • UNVAULT v2.3.0
      </footer>
    </main>
  );
}
