'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
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

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontWeight: 800, fontSize: '32px', color: '#1A1A18', marginBottom: '8px' }}>
              France<span style={{ color: '#E8460A' }}>Occas</span>.fr
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A18', marginBottom: '6px' }}>Connexion à votre compte</h1>
            <p style={{ fontSize: '13px', color: '#6B6B66' }}>Bon retour ! Entrez vos identifiants pour continuer.</p>
          </div>

          {/* Form card */}
          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '16px', padding: '28px' }}>

            {error && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: '9px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#791F1F' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#E8460A'}
                onBlur={e => e.target.style.borderColor = '#E2DDD6'}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mot de passe
                </label>
                <Link href="/auth/reset-password" style={{ fontSize: '12px', color: '#E8460A', textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 44px 11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#E8460A'}
                  onBlur={e => e.target.style.borderColor = '#E2DDD6'}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#6B6B66' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', background: loading ? '#AEABA3' : '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px', transition: 'background 0.15s' }}>
              {loading ? '⏳ Connexion en cours…' : 'Se connecter →'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#E2DDD6' }} />
              <span style={{ fontSize: '12px', color: '#AEABA3' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: '#E2DDD6' }} />
            </div>

            <button style={{ width: '100%', background: '#fff', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#1A1A18' }}>
              <span style={{ fontSize: '18px' }}>🔵</span> Continuer avec Google
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B6B66' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/inscription" style={{ color: '#E8460A', fontWeight: 600, textDecoration: 'none' }}>
              Créer un compte gratuitement
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#AEABA3', lineHeight: 1.6 }}>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/cgu" style={{ color: '#AEABA3', textDecoration: 'underline' }}>CGU</Link>{' '}et notre{' '}
            <Link href="/confidentialite" style={{ color: '#AEABA3', textDecoration: 'underline' }}>Politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
