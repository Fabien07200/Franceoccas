'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.replace('/compte');
      } else {
        setError(data.error || 'Erreur de connexion');
        setLoading(false);
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <Link href="/auth/inscription" style={{ fontSize: '13px', color: '#8A8A85', textDecoration: 'none' }}>
          Pas encore de compte ? <span style={{ color: '#E8460A', fontWeight: 600 }}>Créer un compte</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontWeight: 800, fontSize: '32px', color: '#1A1A18', marginBottom: '8px' }}>
              France<span style={{ color: '#E8460A' }}>Occas</span>.fr
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A18', marginBottom: '6px' }}>Connexion</h1>
            <p style={{ fontSize: '13px', color: '#6B6B66' }}>Entrez vos identifiants pour continuer.</p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '16px', padding: '28px' }}>
            {error && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: '9px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#791F1F' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Adresse email
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Mot de passe
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', background: loading ? '#AEABA3' : '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Connexion en cours…' : 'Se connecter →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6B6B66' }}>
              Pas encore de compte ?{' '}
              <Link href="/auth/inscription" style={{ color: '#E8460A', fontWeight: 600, textDecoration: 'none' }}>
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// force rebuild Wed Apr 15 22:58:47 CEST 2026
