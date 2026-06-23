"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PortalClient() {
  const [glowStyle, setGlowStyle] = useState({
    background: 'radial-gradient(circle at 50% 50%, rgba(173, 198, 255, 0.08) 0%, transparent 60%)'
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setGlowStyle({
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(173, 198, 255, 0.08) 0%, transparent 60%)`
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="font-body-md text-body-md antialiased min-h-screen flex flex-col items-center justify-center relative px-sm md:px-lg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', overflowX: 'hidden', padding: '2rem' }}>
      {/* Atmospheric Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -10, pointerEvents: 'none' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', filter: 'blur(120px)', backgroundColor: 'rgba(173, 198, 255, 0.1)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', filter: 'blur(120px)', backgroundColor: 'rgba(221, 183, 255, 0.1)' }}></div>
        <div className="absolute inset-0 radial-glow" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...glowStyle }}></div>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-6xl flex flex-col items-center py-xl" style={{ width: '100%', maxWidth: '1152px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
        {/* Header / Identity */}
        <header className="text-center mb-xl animate-fade-in" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="mb-md flex justify-center" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
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
          
          <h1 className="auth-title" style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            UnVault <span className="gradient-text">Car Storage</span>
          </h1>
          <p className="portal-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '480px', margin: '0 auto', opacity: 0.8 }}>
            Beheer uw exclusieve voertuigcollectie met digitale precisie en beveiligde opslag.
          </p>
        </header>

        {/* Selection Grid */}
        <div className="portal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', width: '100%', maxWidth: '860px', marginBottom: '4rem' }}>
          <style jsx>{`
            @media (min-width: 640px) {
              .portal-grid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}</style>
          
          {/* Real World Vehicles Card */}
          <Link href="/dashboard/irl/politie" className="glass-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', padding: '2.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', height: '100%' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.15, pointerEvents: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>directions_car</span>
            </div>
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(173, 198, 255, 0.1)', border: '1px solid rgba(173, 198, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-blue)', fontSize: '30px' }}>precision_manufacturing</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.75rem', color: 'white' }}>Echte Wereld Voertuigen</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                Toegang tot de gecureerde bibliotheek van fysieke luxe wagens, historische klassiekers en moderne hypercars.
              </p>
              <button className="btn-primary" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', width: 'fit-content', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <span>Bibliotheek Openen</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
            </div>
          </Link>

          {/* In-Game / RP Vehicles Card */}
          <Link href="/dashboard/rp/politie" className="glass-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', padding: '2.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', height: '100%' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.15, pointerEvents: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>sports_esports</span>
            </div>
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(221, 183, 255, 0.1)', border: '1px solid rgba(221, 183, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-purple)', fontSize: '30px' }}>stadia_controller</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.75rem', color: 'white' }}>In-Game / RP Voertuigen</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6', fontSize: '0.9375rem' }}>
                Beheer uw vloot in de virtuele wereld. Gespecialiseerd voor FiveM, Roleplay en digitale verzamelingen.
              </p>
              <button className="btn-primary" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', width: 'fit-content', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <span>Garage Verkennen</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
            </div>
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '1.5rem 0' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0 2rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-label)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
            <span>BEVEILIGDE UNRAID NODE</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--border-color)' }}></div>
            <span>UNVAULT V2.3.0</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--accent-blue)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>Privacy Beleid</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--accent-blue)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>Service Status</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--accent-blue)'} onMouseOut={(e) => e.target.style.color = 'inherit'}>Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
