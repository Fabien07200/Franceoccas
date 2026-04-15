'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = ['Compte', 'Profil', 'Confirmation'];

export default function InscriptionPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '',
    full_name: '', city: '', department: '',
    account_type: 'particulier',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!form.email.includes('@')) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    if (form.password !== form.confirm_password) e.confirm_password = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (form.full_name.length < 2) e.full_name = 'Nom trop court';
    if (!form.city) e.city = 'Ville requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 1) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setLoading(false);
    }
    setStep(s => s + 1);
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength();
  const strengthLabel = strength === null ? '' : strength <= 1 ? 'Faible' : strength === 2 ? 'Moyen' : strength === 3 ? 'Bon' : 'Fort';
  const strengthColor = strength === null ? '' : strength <= 1 ? '#E24B4A' : strength === 2 ? '#BA7517' : strength === 3 ? '#378ADD' : '#1D9E75';

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

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700,
                    background: i < step ? '#1D9E75' : i === step ? '#E8460A' : '#E2DDD6',
                    color: i <= step ? '#fff' : '#6B6B66' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '10px', color: i === step ? '#E8460A' : '#6B6B66', marginTop: '4px', fontWeight: i === step ? 600 : 400 }}>{s}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ height: '2px', flex: 1, background: i < step ? '#1D9E75' : '#E2DDD6', marginBottom: '16px' }} />
                )}
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '16px', padding: '28px' }}>

            {/* STEP 0 - Compte */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px' }}>Vos identifiants</h2>

                {/* Type de compte */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                  {[
                    { value: 'particulier', label: 'Particulier', icon: '👤', desc: 'Je vends mes objets' },
                    { value: 'pro', label: 'Professionnel', icon: '🏢', desc: 'Garage ou commerce' },
                  ].map(type => (
                    <button key={type.value} onClick={() => update('account_type', type.value)}
                      style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${form.account_type === type.value ? '#E8460A' : '#E2DDD6'}`, background: form.account_type === type.value ? '#FFF0EB' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{type.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A18' }}>{type.label}</div>
                      <div style={{ fontSize: '11px', color: '#6B6B66' }}>{type.desc}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="vous@exemple.fr"
                    style={{ width: '100%', border: `1px solid ${errors.email ? '#E24B4A' : '#E2DDD6'}`, borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  {errors.email && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ {errors.email}</div>}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} placeholder="Minimum 8 caractères"
                      style={{ width: '100%', border: `1px solid ${errors.password ? '#E24B4A' : '#E2DDD6'}`, borderRadius: '9px', padding: '10px 40px 10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '4px', background: '#E2DDD6', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(strength || 0) * 25}%`, background: strengthColor, borderRadius: '2px', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                    </div>
                  )}
                  {errors.password && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ {errors.password}</div>}
                </div>

                <div style={{ marginBottom: '4px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Confirmer le mot de passe</label>
                  <input type="password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)} placeholder="Retapez votre mot de passe"
                    style={{ width: '100%', border: `1px solid ${errors.confirm_password ? '#E24B4A' : '#E2DDD6'}`, borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  {errors.confirm_password && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ {errors.confirm_password}</div>}
                </div>
              </div>
            )}

            {/* STEP 1 - Profil */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '18px' }}>Votre profil</h2>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Prénom et nom</label>
                  <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Jean Dupont"
                    style={{ width: '100%', border: `1px solid ${errors.full_name ? '#E24B4A' : '#E2DDD6'}`, borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  {errors.full_name && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ {errors.full_name}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Ville</label>
                    <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Nîmes"
                      style={{ width: '100%', border: `1px solid ${errors.city ? '#E24B4A' : '#E2DDD6'}`, borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    {errors.city && <div style={{ fontSize: '11px', color: '#E24B4A', marginTop: '4px' }}>⚠️ {errors.city}</div>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Dépt.</label>
                    <input type="text" value={form.department} onChange={e => update('department', e.target.value)} placeholder="30" maxLength={3}
                      style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ background: '#E1F5EE', borderRadius: '9px', padding: '12px 14px', fontSize: '12px', color: '#085041', lineHeight: 1.6 }}>
                  ✅ Vos données sont protégées (RGPD). Seuls votre prénom et votre ville seront visibles des acheteurs.
                </div>
              </div>
            )}

            {/* STEP 2 - Confirmation */}
            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18', marginBottom: '8px' }}>Compte créé avec succès !</h2>
                <p style={{ fontSize: '13px', color: '#6B6B66', lineHeight: 1.7, marginBottom: '20px' }}>
                  Bienvenue sur FranceOccas.fr, <strong>{form.full_name}</strong> !<br />
                  Un email de confirmation a été envoyé à <strong>{form.email}</strong>.
                </p>
                <div style={{ background: '#FAEEDA', borderRadius: '10px', padding: '14px', marginBottom: '20px', textAlign: 'left', fontSize: '13px', color: '#633806' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>⚡ Pour commencer :</div>
                  <div>✓ Confirmez votre email pour activer votre compte</div>
                  <div>✓ Déposez votre première annonce gratuitement</div>
                  <div>✓ Configurez votre porte-monnaie</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link href="/vendre" style={{ display: 'block', background: '#E8460A', color: '#fff', borderRadius: '10px', padding: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                    📸 Déposer ma première annonce →
                  </Link>
                  <Link href="/annonces" style={{ display: 'block', background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '10px', padding: '12px', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
                    🔍 Explorer les annonces
                  </Link>
                </div>
              </div>
            )}

            {step < 2 && (
              <button onClick={next} disabled={loading}
                style={{ width: '100%', background: loading ? '#AEABA3' : '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px' }}>
                {loading ? '⏳ Création du compte…' : step === 1 ? 'Créer mon compte →' : 'Continuer →'}
              </button>
            )}
          </div>

          {step < 2 && (
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6B6B66' }}>
              Déjà un compte ?{' '}
              <Link href="/auth/connexion" style={{ color: '#E8460A', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
