"use client";

export default function ShareClient({ photo, expiresAt }) {
  return (
    <main className="portal-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem', boxSizing: 'border-box' }}>
      <header className="portal-header" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="portal-shield" style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>
          🛡️
        </div>
        <h1 className="portal-title">UnVault Gedeelde Weergave</h1>
        <p className="portal-subtitle">
          Tijdelijke gasttoegang tot voertuigspecificaties. Verlopen op: {new Date(expiresAt).toLocaleString('nl-NL')}
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', flex: 1, alignItems: 'center' }}>
        <div className="modal-content glass" style={{ maxWidth: '960px', width: '100%', animation: 'none', margin: 'auto' }}>
          <div className="modal-header">
            <h2 className="modal-title">🖼️ Voertuigspecificaties</h2>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
              LEZEN-ALLEEN GASTTOEGANG
            </div>
          </div>
          
          <div className="modal-body" style={{ padding: 0 }}>
            <div className="editor-modal-container">
              {/* Left Column: Visual Preview */}
              <div className="editor-modal-preview" style={{ background: '#05070a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photo.filetype === 'image' ? (
                  <img 
                    src={photo.filepath} 
                    alt={photo.name} 
                    className="editor-modal-img" 
                    style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }}
                  />
                ) : (
                  <video 
                    src={photo.filepath} 
                    controls 
                    className="editor-modal-img" 
                    style={{ width: '100%', maxHeight: '55vh', background: 'black' }}
                  />
                )}
              </div>

              {/* Right Column: Spec details */}
              <div className="editor-modal-form" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-display)' }}>
                  {photo.name}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.125rem' }}>Locatie:</strong> 
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{photo.location}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.125rem' }}>Datum genomen:</strong> 
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{photo.date_taken}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.125rem' }}>Categorie:</strong> 
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{photo.category === 'politie' ? '👮 Politie' : photo.category === 'brandweer' ? '🚒 Brandweer' : '🚑 Ambulance'}</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.125rem' }}>Omgeving:</strong> 
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{photo.env === 'irl' ? 'Echte Wereld' : 'Roleplay Server'}</span>
                  </div>
                </div>

                {photo.description && (
                  <div>
                    <strong style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Waarneming / Beschrijving:</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {photo.description}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                  Bestandsnaam: {photo.filename} • Grootte: {(photo.filesize / 1024).toFixed(0)} KB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="portal-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
        VEILIGE GASTTOEGANG NODE • UNVAULT SHARE CLIENT
      </footer>
    </main>
  );
}
