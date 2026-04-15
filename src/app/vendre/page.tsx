'use client';
import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'outillage', name: 'Outillage', icon: '🔧' },
  { slug: 'automobile', name: 'Automobile', icon: '🚗' },
  { slug: 'jardinage', name: 'Jardinage', icon: '🌿' },
  { slug: 'electromenager', name: 'Électroménager', icon: '❄️' },
  { slug: 'btp-chantier', name: 'BTP & Chantier', icon: '🏗️' },
  { slug: 'moto-scooter', name: 'Moto & Scooter', icon: '🏍️' },
  { slug: 'velo', name: 'Vélo', icon: '🚲' },
  { slug: 'sport-loisirs', name: 'Sport & Loisirs', icon: '🏋️' },
  { slug: 'informatique', name: 'Informatique', icon: '💻' },
  { slug: 'maison-deco', name: 'Maison & Déco', icon: '🏡' },
  { slug: 'agriculture', name: 'Agriculture', icon: '🌾' },
  { slug: 'divers', name: 'Divers', icon: '📦' },
];

const CONDITIONS = [
  { value: 'new', label: 'Neuf', desc: 'Jamais utilisé, emballage d\'origine' },
  { value: 'like_new', label: 'Comme neuf', desc: 'Utilisé 1-2 fois, parfait état' },
  { value: 'very_good', label: 'Très bon état', desc: 'Légères traces d\'utilisation' },
  { value: 'good', label: 'Bon état', desc: 'Quelques marques d\'usage' },
  { value: 'fair', label: 'État correct', desc: 'Fonctionne bien, traces visibles' },
  { value: 'for_parts', label: 'Pour pièces', desc: 'Ne fonctionne plus / incomplet' },
];

const AI_STEPS = [
  { icon: '📷', label: 'Analyse des photos' },
  { icon: '🔍', label: 'Reconnaissance du produit' },
  { icon: '✍️', label: 'Rédaction de la fiche' },
  { icon: '💰', label: 'Estimation du prix marché' },
  { icon: '✅', label: 'Fiche prête !' },
];

type Step = 'photos' | 'ai' | 'details' | 'localisation' | 'preview';

export default function VendrePage() {
  const [step, setStep] = useState<Step>('photos');
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiStep, setAiStep] = useState(-1);
  const [aiDone, setAiDone] = useState(false);
  const [isVehicle, setIsVehicle] = useState(false);
  const [plate, setPlate] = useState('');
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateDone, setPlateDone] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    price: '',
    price_negotiable: true,
    city: '',
    department: '',
    postal_code: '',
    hint: '',
  });
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const update = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const addPhoto = () => {
    if (photos.length >= 8) return;
    const emojis = ['🔧', '🚗', '❄️', '💻', '🌿', '🏋️', '📱', '🛋️'];
    setPhotos(p => [...p, emojis[p.length % emojis.length]]);
  };

  const removePhoto = (i: number) => setPhotos(p => p.filter((_, idx) => idx !== i));

  const runAI = async () => {
    if (photos.length === 0) return;
    setStep('ai');
    setAiStep(0);
    for (let i = 0; i < AI_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setAiStep(i);
    }
    await new Promise(r => setTimeout(r, 600));
    setAiDone(true);
    setForm(f => ({
      ...f,
      title: 'Perceuse-visseuse Makita DDF484 18V — Kit complet',
      description: `Perceuse-visseuse sans fil Makita DDF484 en excellent état, très peu utilisée. Achetée neuve il y a 18 mois, utilisée uniquement pour des travaux ponctuels à domicile.

Livrée avec :
- 2 batteries BL1830B 18V 3Ah
- Chargeur rapide DC18RC
- Mallette de transport rigide d'origine
- Manuel d'utilisation

Caractéristiques techniques :
- Couple maxi : 80 Nm
- Vitesses : 2 plages (0-550 / 0-2100 tr/min)
- Mandrin : 13mm auto-serrant
- Éclairage LED intégré
- Poids : 1,7 kg (sans batterie)

Idéale pour bricolage intensif. Fonctionne parfaitement, aucune réparation. Je vends car je passe sur de l'outillage pneumatique.`,
      category: 'outillage',
      condition: 'very_good',
      price: '189',
    }));
    setTimeout(() => setStep('details'), 800);
  };

  const lookupPlate = async () => {
    if (!plate || plate.length < 5) return;
    setPlateLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setPlateLoading(false);
    setPlateDone(true);
    setForm(f => ({
      ...f,
      title: 'Renault Clio V 1.0 TCe 90 Intens — 28 000 km — 2022',
      description: `Renault Clio V en excellent état général. Carrosserie impeccable, intérieur comme neuf. Entretien régulier chez le concessionnaire. CT favorable.

Équipements : écran tactile 9,3", caméra de recul, régulateur adaptatif, sièges chauffants, CarPlay/Android Auto, aide au stationnement.

Vendue avec carnet d'entretien complet, 2 clés, 4 pneus été Michelin quasi neufs.`,
      category: 'automobile',
      condition: 'very_good',
      price: '11900',
    }));
  };

  const publish = async () => {
    setPublishing(true);
    await new Promise(r => setTimeout(r, 2000));
    setPublishing(false);
    setPublished(true);
  };

  const STEPS_NAV = ['Photos', 'Détails', 'Localisation', 'Publication'];
  const stepIndex = step === 'photos' || step === 'ai' ? 0 : step === 'details' ? 1 : step === 'localisation' ? 2 : 3;

  if (published) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
        <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>France<span style={{ color: '#E8460A' }}>Occas</span>.fr</Link>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A18', marginBottom: '8px' }}>Annonce publiée !</h1>
            <p style={{ fontSize: '14px', color: '#6B6B66', lineHeight: 1.7, marginBottom: '24px' }}>
              Votre annonce <strong>{form.title}</strong> est maintenant en ligne et visible par des milliers d'acheteurs.
            </p>
            <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#085041', marginBottom: '8px' }}>Conseils pour vendre plus vite :</div>
              {['Répondez rapidement aux messages', 'Boostez votre annonce pour 10× plus de vues', 'Ajoutez votre numéro de téléphone dans le profil'].map(tip => (
                <div key={tip} style={{ fontSize: '12px', color: '#085041', marginBottom: '4px' }}>✓ {tip}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/annonces/1" style={{ display: 'block', background: '#E8460A', color: '#fff', borderRadius: '10px', padding: '13px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                Voir mon annonce →
              </Link>
              <Link href="/compte" style={{ display: 'block', background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '10px', padding: '12px', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
                Gérer mes annonces
              </Link>
              <button onClick={() => { setPublished(false); setStep('photos'); setPhotos([]); setAiDone(false); setAiStep(-1); setPlateDone(false); setPlate(''); setForm({ title: '', description: '', category: '', condition: '', price: '', price_negotiable: true, city: '', department: '', postal_code: '', hint: '' }); }}
                style={{ background: 'none', border: 'none', color: '#6B6B66', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
                + Déposer une autre annonce
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <div style={{ fontSize: '13px', color: '#8A8A85' }}>Déposer une annonce — Gratuit</div>
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Progress bar */}
        {step !== 'ai' && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {STEPS_NAV.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: i < stepIndex ? '#1D9E75' : i === stepIndex ? '#E8460A' : '#E2DDD6',
                    color: i <= stepIndex ? '#fff' : '#6B6B66' }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '4px', color: i === stepIndex ? '#E8460A' : '#6B6B66', fontWeight: i === stepIndex ? 600 : 400 }}>{s}</div>
                </div>
                {i < STEPS_NAV.length - 1 && <div style={{ flex: 1, height: '2px', background: i < stepIndex ? '#1D9E75' : '#E2DDD6', marginBottom: '16px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP PHOTOS ── */}
        {step === 'photos' && (
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Ajoutez vos photos</h1>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '20px' }}>L'IA analysera vos photos pour rédiger la fiche automatiquement. Minimum 1 photo, maximum 8.</p>

            {/* Vehicle toggle */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A18' }}>C'est un véhicule ?</div>
                <div style={{ fontSize: '11px', color: '#6B6B66' }}>Activer pour saisir par plaque d'immatriculation</div>
              </div>
              <button onClick={() => setIsVehicle(!isVehicle)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isVehicle ? '#E8460A' : '#E2DDD6', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: isVehicle ? '23px' : '3px' }} />
              </button>
            </div>

            {/* Plate lookup */}
            {isVehicle && (
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A18', marginBottom: '10px' }}>🚗 Saisie par plaque d'immatriculation</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ background: '#F5C518', borderRadius: '8px', padding: '10px 16px', fontWeight: 800, fontSize: '18px', color: '#000', letterSpacing: '2px', flex: 1, textAlign: 'center' }}>
                    <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="AB-123-CD" maxLength={9}
                      style={{ background: 'none', border: 'none', outline: 'none', fontWeight: 800, fontSize: '18px', color: '#000', letterSpacing: '2px', textAlign: 'center', width: '100%' }} />
                  </div>
                  <button onClick={lookupPlate} disabled={plateLoading || plate.length < 5}
                    style={{ background: plate.length >= 5 ? '#E8460A' : '#E2DDD6', color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 18px', fontSize: '13px', fontWeight: 600, cursor: plate.length >= 5 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                    {plateLoading ? '⏳ Recherche…' : 'Interroger Argus →'}
                  </button>
                </div>
                {plateDone && (
                  <div style={{ background: '#E1F5EE', borderRadius: '9px', padding: '12px', fontSize: '12px', color: '#085041' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>✅ Véhicule identifié via Argus Pro</div>
                    <div>Renault Clio V · 1.0 TCe 90 Intens · 2022 · Gris Platine · 28 000 km</div>
                    <div style={{ marginTop: '4px' }}>Cote marché : 10 800 – 12 600 € · CT Favorable jusqu'en mars 2026</div>
                  </div>
                )}
              </div>
            )}

            {/* Photo grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {photos.map((emoji, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', background: '#fff', border: '1px solid #E2DDD6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                  {emoji}
                  {i === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#E8460A', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>PRINCIPALE</span>}
                  <button onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#E24B4A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < 8 && (
                <button onClick={addPhoto}
                  style={{ aspectRatio: '1', background: '#fff', border: '2px dashed #E2DDD6', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', color: '#6B6B66' }}>
                  <span style={{ fontSize: '24px' }}>📷</span>
                  <span style={{ fontSize: '11px' }}>Ajouter</span>
                </button>
              )}
            </div>

            {photos.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Informations complémentaires pour l'IA (optionnel)</div>
                <textarea value={form.hint} onChange={e => update('hint', e.target.value)} placeholder="Ex: Makita 18V, acheté neuf il y a 2 ans, très peu utilisé, livré avec 2 batteries..."
                  rows={2}
                  style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial' }} />
              </div>
            )}

            <button onClick={photos.length > 0 ? runAI : addPhoto}
              style={{ width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '11px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
              {photos.length > 0 ? `✨ Analyser ${photos.length} photo${photos.length > 1 ? 's' : ''} avec l'IA →` : '📷 Ajouter des photos'}
            </button>

            {photos.length === 0 && (
              <button onClick={() => setStep('details')} style={{ width: '100%', marginTop: '8px', background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '12px', fontSize: '13px', cursor: 'pointer' }}>
                Continuer sans l'IA →
              </button>
            )}
          </div>
        )}

        {/* ── STEP AI ── */}
        {step === 'ai' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✨</div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '8px' }}>L'IA analyse vos photos…</h2>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '36px' }}>Patientez quelques secondes, nous préparons votre fiche complète.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', margin: '0 auto' }}>
              {AI_STEPS.map((s, i) => {
                const isDone = i < aiStep;
                const isActive = i === aiStep;
                return (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: isDone ? '#E1F5EE' : isActive ? '#FFF0EB' : '#fff', border: `1px solid ${isDone ? '#9FE1CB' : isActive ? '#F5C4B3' : '#E2DDD6'}`, transition: 'all 0.3s' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      background: isDone ? '#1D9E75' : isActive ? '#E8460A' : '#F7F5F0' }}>
                      {isDone ? <span style={{ color: '#fff', fontWeight: 700 }}>✓</span> : isActive ? <span style={{ color: '#fff' }}>⟳</span> : s.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isDone ? '#085041' : isActive ? '#993C1D' : '#6B6B66' }}>
                      {s.label}
                    </span>
                    {isActive && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#E8460A' }}>En cours…</span>}
                    {isDone && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#1D9E75', fontWeight: 600 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            {aiDone && (
              <div style={{ marginTop: '24px', background: '#E1F5EE', borderRadius: '12px', padding: '16px', maxWidth: '360px', margin: '24px auto 0' }}>
                <div style={{ fontWeight: 700, color: '#085041', marginBottom: '4px' }}>🎉 Fiche générée avec succès !</div>
                <div style={{ fontSize: '12px', color: '#085041' }}>Vérifiez et ajustez si besoin avant publication.</div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP DETAILS ── */}
        {step === 'details' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '4px' }}>Détails de l'annonce</h2>
                <p style={{ fontSize: '13px', color: '#6B6B66' }}>Vérifiez et complétez les informations générées par l'IA.</p>
              </div>
              {aiDone && (
                <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>✨ Rempli par l'IA</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Titre de l'annonce *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ex: Perceuse-visseuse Makita DDF484 18V — Kit complet"
                  style={{ width: '100%', border: `1px solid ${form.title ? '#1D9E75' : '#E2DDD6'}`, borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '11px', color: form.title.length > 70 ? '#E24B4A' : '#6B6B66', marginTop: '3px', textAlign: 'right' }}>{form.title.length}/80</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Catégorie *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.slug} onClick={() => update('category', cat.slug)}
                      style={{ padding: '10px 6px', borderRadius: '8px', border: `2px solid ${form.category === cat.slug ? '#E8460A' : '#E2DDD6'}`, background: form.category === cat.slug ? '#FFF0EB' : '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: form.category === cat.slug ? 600 : 400, color: form.category === cat.slug ? '#E8460A' : '#6B6B66', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', marginBottom: '3px' }}>{cat.icon}</div>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>État *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {CONDITIONS.map(c => (
                    <button key={c.value} onClick={() => update('condition', c.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '9px', border: `2px solid ${form.condition === c.value ? '#E8460A' : '#E2DDD6'}`, background: form.condition === c.value ? '#FFF0EB' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${form.condition === c.value ? '#E8460A' : '#E2DDD6'}`, background: form.condition === c.value ? '#E8460A' : 'none', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A18' }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: '#6B6B66' }}>{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Description *</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="Décrivez votre objet : état, caractéristiques, accessoires inclus, raison de la vente…"
                  rows={8}
                  style={{ width: '100%', border: `1px solid ${form.description ? '#1D9E75' : '#E2DDD6'}`, borderRadius: '9px', padding: '11px 14px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial', lineHeight: 1.7 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Prix *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="0"
                      style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 40px 11px 14px', fontSize: '16px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#6B6B66' }}>€</span>
                  </div>
                  <button onClick={() => update('price_negotiable', !form.price_negotiable)}
                    style={{ padding: '11px 14px', borderRadius: '9px', border: `2px solid ${form.price_negotiable ? '#E8460A' : '#E2DDD6'}`, background: form.price_negotiable ? '#FFF0EB' : '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: form.price_negotiable ? '#E8460A' : '#6B6B66', whiteSpace: 'nowrap' }}>
                    {form.price_negotiable ? '✓ Négociable' : 'Prix ferme'}
                  </button>
                </div>
                {form.price && aiDone && (
                  <div style={{ background: '#E1F5EE', borderRadius: '8px', padding: '10px 12px', marginTop: '8px', fontSize: '12px', color: '#085041' }}>
                    💰 Cote Argus conseillée : <strong>170 – 210 €</strong> — Votre prix est dans la bonne fourchette ✓
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep('photos')}
                  style={{ flex: 1, background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '13px', fontSize: '14px', cursor: 'pointer' }}>
                  ← Retour
                </button>
                <button onClick={() => setStep('localisation')} disabled={!form.title || !form.category || !form.condition || !form.price}
                  style={{ flex: 3, background: form.title && form.category && form.condition && form.price ? '#E8460A' : '#E2DDD6', color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: form.title && form.category && form.condition && form.price ? 'pointer' : 'not-allowed' }}>
                  Continuer → Localisation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP LOCALISATION ── */}
        {step === 'localisation' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Localisation</h2>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '24px' }}>Seule la ville sera visible des acheteurs, pas votre adresse exacte.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Ville *</label>
                <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Ex: Nîmes"
                  style={{ width: '100%', border: `1px solid ${form.city ? '#1D9E75' : '#E2DDD6'}`, borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Département</label>
                  <input value={form.department} onChange={e => update('department', e.target.value)} placeholder="30" maxLength={3}
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Code postal</label>
                  <input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="30000"
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Livraison */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A18', marginBottom: '12px' }}>🚚 Options de livraison</div>
              {[
                { icon: '📦', label: 'Colissimo', desc: 'Jusqu\'à 30 kg — 8,90 €', checked: true },
                { icon: '🏪', label: 'Mondial Relay', desc: 'Point relais — 4,90 €', checked: true },
                { icon: '🚛', label: 'Palette FranceOccas', desc: 'Gros objets — 39 €', checked: false },
                { icon: '🤝', label: 'Remise en main propre', desc: 'Gratuit — Code de sécurité', checked: true },
              ].map(opt => (
                <div key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F7F5F0' }}>
                  <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A18' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: '#6B6B66' }}>{opt.desc}</div>
                  </div>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: opt.checked ? '#E8460A' : '#fff', border: `2px solid ${opt.checked ? '#E8460A' : '#E2DDD6'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {opt.checked && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep('details')}
                style={{ flex: 1, background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '13px', fontSize: '14px', cursor: 'pointer' }}>
                ← Retour
              </button>
              <button onClick={() => setStep('preview')} disabled={!form.city}
                style={{ flex: 3, background: form.city ? '#E8460A' : '#E2DDD6', color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: form.city ? 'pointer' : 'not-allowed' }}>
                Continuer → Aperçu
              </button>
            </div>
          </div>
        )}

        {/* ── STEP PREVIEW ── */}
        {step === 'preview' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Aperçu avant publication</h2>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '20px' }}>Voici comment votre annonce apparaîtra aux acheteurs.</p>

            {/* Preview card */}
            <div style={{ background: '#fff', border: '2px solid #E8460A', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ background: '#1A1A18', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px' }}>
                {photos[0] || '📦'}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {CONDITIONS.find(c => c.value === form.condition)?.label || 'État non défini'}
                  </span>
                  {aiDone && <span style={{ fontSize: '10px', background: '#FFF0EB', color: '#993C1D', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>💰 Prix juste Argus</span>}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '8px', lineHeight: 1.25 }}>
                  {form.title || 'Titre de votre annonce'}
                </h3>
                <div style={{ fontWeight: 800, fontSize: '26px', color: '#1A1A18', marginBottom: '8px' }}>
                  {form.price ? `${parseInt(form.price).toLocaleString('fr-FR')} €` : '0 €'}
                  {form.price_negotiable && <span style={{ fontSize: '13px', color: '#6B6B66', fontWeight: 400, marginLeft: '8px' }}>Négociable</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#6B6B66', marginBottom: '12px' }}>
                  📍 {form.city || 'Ville'} ({form.department}) · {CATEGORIES.find(c => c.slug === form.category)?.icon} {CATEGORIES.find(c => c.slug === form.category)?.name}
                </div>
                <div style={{ fontSize: '13px', color: '#6B6B66', lineHeight: 1.7, maxHeight: '120px', overflow: 'hidden' }}>
                  {form.description || 'Description de votre annonce…'}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A18', marginBottom: '10px' }}>Récapitulatif</div>
              {[
                { label: 'Photos', value: `${photos.length} photo${photos.length > 1 ? 's' : ''}` },
                { label: 'Catégorie', value: CATEGORIES.find(c => c.slug === form.category)?.name || '—' },
                { label: 'État', value: CONDITIONS.find(c => c.value === form.condition)?.label || '—' },
                { label: 'Prix', value: form.price ? `${parseInt(form.price).toLocaleString('fr')} €` : '—' },
                { label: 'Ville', value: form.city || '—' },
                { label: 'Commission FO', value: `${form.price ? Math.round(parseInt(form.price) * 0.03) : 0} € (3%)` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F7F5F0', fontSize: '13px' }}>
                  <span style={{ color: '#6B6B66' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: '#1A1A18' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#E1F5EE', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#085041', lineHeight: 1.6 }}>
              ✅ Votre annonce est <strong>gratuite</strong>. La commission de 3% n'est prélevée qu'en cas de vente via le paiement sécurisé FranceOccas.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep('localisation')}
                style={{ flex: 1, background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '13px', fontSize: '14px', cursor: 'pointer' }}>
                ← Modifier
              </button>
              <button onClick={publish} disabled={publishing}
                style={{ flex: 3, background: publishing ? '#AEABA3' : '#E8460A', color: '#fff', border: 'none', borderRadius: '11px', padding: '13px', fontSize: '15px', fontWeight: 700, cursor: publishing ? 'not-allowed' : 'pointer' }}>
                {publishing ? '⏳ Publication en cours…' : '🚀 Publier l\'annonce gratuitement'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
