'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', confirm_password: '', full_name: '', city: '', department: '' });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const validateStep0 = () => {
    if (!form.email.includes('@')) { setError('Email invalide'); return false; }
    if (form.password.length < 8) { setError('Mot de passe trop court (8 caractères minimum)'); return false; }
    if (form.password !== form.confirm_password) { setError('Les mots de passe ne correspondent pas'); return false; }
    setError(''); return true;
  };

  const validateStep1 = () => {
    if (form.full_name.length < 2) { setError('Nom trop court'); return false; }
    if (!form.city) { setError('Ville requise'); return false; }
    setError(''); return true;
  };

  const register = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, city: form.city, department: form.department }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du compte');
      } else {
        setStep(2);
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength();
  const strengthColor = strength <= 1 ? '#E24B4A' : strength === 2 ? '#BA7517' : strength === 3 ? '#378ADD' : '#1D9E75';
  const strengthLabel = strength <= 1 ? 'Faible' : strength === 2 ? 'Moyen' : strength === 3 ? 'Bon' : 'Fort';

  if (step === 2) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>France<span style={{ color: '#E8460A' }}>Occas</span>.fr</Link>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '20px', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A18', marginBottom: '8px' }}>Compte créé !</h1>
            <p style={{ fontSize: '14px', color: '#6B6B66', lineHeight: 1.7, marginBottom: '24px' }}>
              Bienvenue sur FranceOccas.fr, <strong>{form.full_name}</strong> !
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => router.push('/compte')}
                style={{ display: 'block', width: '100%', background: '#E8460A', color: '#fff', borderRadius: '10px', padding: '13px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Accéder à mon compte →
              </button>
              <button onClick={() => router.push('/vendre')}
                style={{ display: 'block', width: '100%', background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '10px', padding: '12px', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}>
                📸 Déposer ma première annonce
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <Link href="/auth/connexion" style={{ fontSize: '13px', color: '#8A8A85', textDecoration: 'none' }}>
          Déjà un compte ? <span style={{ color: '#E8460A', fontWeight: 600 }}>Se connecter</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Créer votre compte</h1>
            <p style={{ fontSize: '13px', color: '#6B6B66' }}>Gratuit · Sans engagement · En 2 minutes</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px' }}>
            {['Identifiants', 'Profil'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, background: i < step ? '#1D9E75' : i === step ? '#E8460A' : '#E2DDD6', color: i <= step ? '#fff' : '#6B6B66' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '4px', color: i === step ? '#E8460A' : '#6B6B66', fontWeight: i === step ? 600 : 400 }}>{s}</div>
                </div>
                {i === 0 && <div style={{ flex: 1, height: '2px', background: step > 0 ? '#1D9E75' : '#E2DDD6', marginBottom: '16px' }} />}
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '16px', padding: '28px' }}>
            {error && (
              <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: '9px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#791F1F' }}>
                ⚠️ {error}
              </div>
            )}

            {step === 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px' }}>Vos identifiants</h2>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="vous@exemple.fr"
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Mot de passe</label>
                  <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Minimum 8 caractères"
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  {form.password && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#E2DDD6', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strength * 25}%`, background: strengthColor, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Confirmer le mot de passe</label>
                  <input type="password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} placeholder="Retapez votre mot de passe"
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => { if (validateStep0()) setStep(1); }}
                  style={{ width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginTop: '20px' }}>
                  Continuer →
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px' }}>Votre profil</h2>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Prénom et nom</label>
                  <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Jean Dupont"
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Ville</label>
                    <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Nîmes"
                      style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Dépt.</label>
                    <input type="text" value={form.department} onChange={e => update('department', e.target.value)} placeholder="30" maxLength={3}
                      style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setError(''); setStep(0); }}
                    style={{ flex: 1, background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>
                    ← Retour
                  </button>
                  <button onClick={register} disabled={loading}
                    style={{ flex: 2, background: loading ? '#AEABA3' : '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? '⏳ Création…' : 'Créer mon compte →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6B6B66' }}>
            Déjà un compte ? <Link href="/auth/connexion" style={{ color: '#E8460A', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
