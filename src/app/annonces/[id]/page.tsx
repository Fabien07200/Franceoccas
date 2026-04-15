'use client';
import { useState } from 'react';
import Link from 'next/link';

const MOCK_LISTING = {
  id: '1',
  title: 'Renault Clio V 1.0 TCe 90 Intens — 28 000 km — 2022',
  price: 1190000,
  original_price: 1390000,
  condition: 'very_good',
  city: 'Nîmes',
  department: '30',
  category: 'Automobile',
  description: `Renault Clio V en excellent état, très peu utilisée. Achetée neuve en mars 2022, toujours entretenue chez le concessionnaire Renault.

Finition Intens avec équipements premium : écran tactile 9,3", caméra de recul, régulateur de vitesse adaptatif, aide au stationnement avant/arrière, sièges chauffants, CarPlay/Android Auto.

Motorisation 1.0 TCe 90 ch — idéale en ville et sur route. Consommation mixte : 5,5L/100km.

Couleur Gris Platine métallisé. Carrosserie impeccable, aucune rayure ni choc. Intérieur comme neuf.

Vendue avec : 2 clés, carnet d'entretien complet, factures d'entretien, CT favorable (mars 2024), 4 pneus été Michelin Primacy 4 (quasi neufs).

Je vends car je passe sur un véhicule électrique. Prix ferme mais discutable pour acheteur sérieux.`,
  photos_count: 8,
  views: 248,
  favorites: 18,
  published_at: '12 avril 2026',
  boost_level: 1,
  is_vehicle: true,
  vehicle_make: 'Renault',
  vehicle_model: 'Clio V',
  vehicle_version: '1.0 TCe 90 Intens',
  vehicle_year: 2022,
  vehicle_fuel: 'Essence',
  vehicle_gearbox: 'Manuelle 6 vitesses',
  vehicle_mileage: 28000,
  vehicle_color: 'Gris Platine',
  vehicle_doors: 5,
  argus_price_min: 10800,
  argus_price_max: 12600,
  argus_suggested: 11500,
  ct_status: 'FAVORABLE',
  ct_next_date: '2026-03-15',
  price_badge: 'prix_juste',
  seller: {
    id: 's1',
    name: 'Jean-Paul M.',
    city: 'Nîmes (30)',
    avatar: 'JP',
    rating: 4.9,
    rating_count: 28,
    sales_count: 34,
    response_rate: 98,
    response_time: '< 1h',
    member_since: 'Janvier 2024',
    is_pro: true,
    franchise: 'Transak Auto Nîmes',
    verified: true,
  },
};

const SIMILAR = [
  { id: '2', title: 'Renault Clio V 1.0 TCe 100 Zen — 2021', price: 1050000, city: 'Montpellier', km: 41000, condition: 'good' },
  { id: '3', title: 'Peugeot 208 1.2 PureTech 100 — 2022', price: 1290000, city: 'Lyon', km: 22000, condition: 'very_good' },
  { id: '4', title: 'Citroën C3 1.2 PureTech 83 — 2021', price: 980000, city: 'Bordeaux', km: 35000, condition: 'good' },
];

export default function ListingPage() {
  const listing = MOCK_LISTING;
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [message, setMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'argus' | 'seller'>('desc');

  const PHOTO_EMOJIS = ['🚗', '🪟', '🛞', '⚙️', '🎛️', '💺', '🔑', '📋'];
  const price = listing.price / 100;
  const argusMin = listing.argus_price_min;
  const argusMax = listing.argus_price_max;
  const argusSuggested = listing.argus_suggested;

  const sendMessage = async () => {
    if (!message.trim()) return;
    await new Promise(r => setTimeout(r, 800));
    setMessageSent(true);
    setMessage('');
  };

  const sendOffer = async () => {
    if (!offerAmount) return;
    await new Promise(r => setTimeout(r, 800));
    setOfferSent(true);
    setOfferAmount('');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <div style={{ fontSize: '12px', color: '#5A5A55', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link href="/annonces" style={{ color: '#8A8A85', textDecoration: 'none' }}>Annonces</Link>
          <span>›</span>
          <span style={{ color: '#8A8A85' }}>Automobile</span>
          <span>›</span>
          <span style={{ color: '#C8C6C0' }}>Renault Clio V</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <Link href="/auth/connexion" style={{ border: '1px solid #3A3A38', color: '#C8C6C0', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>Connexion</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            {/* Photo gallery */}
            <div style={{ background: '#1A1A18', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ position: 'relative', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '100px' }}>
                {PHOTO_EMOJIS[currentPhoto]}
                {listing.boost_level > 0 && (
                  <span style={{ position: 'absolute', top: '16px', left: '16px', background: '#E8460A', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '5px' }}>⚡ Boosté</span>
                )}
                <button onClick={() => setCurrentPhoto(p => Math.max(0, p - 1))}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ‹
                </button>
                <button onClick={() => setCurrentPhoto(p => Math.min(listing.photos_count - 1, p + 1))}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ›
                </button>
                <div style={{ position: 'absolute', bottom: '12px', right: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>
                  {currentPhoto + 1} / {listing.photos_count}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', overflowX: 'auto' }}>
                {PHOTO_EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => setCurrentPhoto(i)}
                    style={{ width: '56px', height: '44px', borderRadius: '7px', border: `2px solid ${currentPhoto === i ? '#E8460A' : 'transparent'}`, background: '#2A2A28', cursor: 'pointer', fontSize: '22px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title + price */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>Très bon état</span>
                    <span style={{ fontSize: '10px', background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>✓ CT Favorable</span>
                    <span style={{ fontSize: '10px', background: '#FFF0EB', color: '#993C1D', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>💰 Prix juste Argus</span>
                    {listing.seller.is_pro && (
                      <span style={{ fontSize: '10px', background: '#1B3A6B', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>🏢 Transak Auto</span>
                    )}
                  </div>
                  <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18', lineHeight: 1.25, marginBottom: '12px' }}>{listing.title}</h1>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: '32px', color: '#1A1A18' }}>
                      {price.toLocaleString('fr-FR')} €
                    </div>
                    {listing.original_price && (
                      <div style={{ fontSize: '16px', color: '#AEABA3', textDecoration: 'line-through' }}>
                        {(listing.original_price / 100).toLocaleString('fr-FR')} €
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B6B66', marginTop: '6px' }}>
                    📍 {listing.city} ({listing.department}) · 👁 {listing.views} vues · 🤍 {listing.favorites} favoris · Publié le {listing.published_at}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={() => setIsFavorite(!isFavorite)}
                    style={{ width: '42px', height: '42px', borderRadius: '10px', border: `1px solid ${isFavorite ? '#E24B4A' : '#E2DDD6'}`, background: isFavorite ? '#FCEBEB' : '#fff', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isFavorite ? '❤️' : '🤍'}
                  </button>
                  <button style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid #E2DDD6', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🔗
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #E2DDD6' }}>
                {([
                  { id: 'desc', label: '📝 Description' },
                  { id: 'specs', label: '⚙️ Caractéristiques' },
                  { id: 'argus', label: '📊 Cote Argus' },
                  { id: 'seller', label: '👤 Vendeur' },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: '12px 8px', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#E8460A' : 'transparent'}`, background: 'none', fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 400, color: activeTab === tab.id ? '#E8460A' : '#6B6B66', cursor: 'pointer' }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '20px' }}>
                {activeTab === 'desc' && (
                  <div style={{ fontSize: '14px', color: '#1A1A18', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {listing.description}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { label: 'Marque', value: listing.vehicle_make },
                      { label: 'Modèle', value: listing.vehicle_model },
                      { label: 'Version', value: listing.vehicle_version },
                      { label: 'Année', value: listing.vehicle_year },
                      { label: 'Carburant', value: listing.vehicle_fuel },
                      { label: 'Boîte', value: listing.vehicle_gearbox },
                      { label: 'Kilométrage', value: `${listing.vehicle_mileage.toLocaleString('fr')} km` },
                      { label: 'Couleur', value: listing.vehicle_color },
                      { label: 'Portes', value: listing.vehicle_doors },
                      { label: 'CT', value: `Favorable (jusqu'au 03/2026)` },
                    ].map(spec => (
                      <div key={spec.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#F7F5F0', borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6B6B66' }}>{spec.label}</span>
                        <span style={{ fontWeight: 600, color: '#1A1A18' }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'argus' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#1A1A18' }}>Cote Argus Pro — Mise à jour aujourd'hui</div>
                      <span style={{ fontSize: '9px', background: '#E6F1FB', color: '#0C447C', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>LIVE</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { label: 'Reprise min', value: `${(argusMin * 0.85 / 100).toFixed(0)} €`, color: '#6B6B66', bg: '#F7F5F0' },
                        { label: 'Prix conseillé', value: `${(argusSuggested! / 100).toFixed(0)} €`, color: '#085041', bg: '#E1F5EE' },
                        { label: 'Retail max', value: `${(argusMax! / 100).toFixed(0)} €`, color: '#6B6B66', bg: '#F7F5F0' },
                      ].map(item => (
                        <div key={item.label} style={{ background: item.bg, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#6B6B66', marginBottom: '5px' }}>{item.label}</div>
                          <div style={{ fontWeight: 800, fontSize: '20px', color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: '#E1F5EE', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>✅</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#085041', marginBottom: '2px' }}>Prix dans la fourchette Argus</div>
                        <div style={{ fontSize: '12px', color: '#085041' }}>
                          Le prix demandé ({price.toLocaleString('fr')} €) est dans la fourchette conseillée ({(argusMin! / 100).toFixed(0)} € – {(argusMax! / 100).toFixed(0)} €).
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'seller' && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1B3A6B', color: '#fff', fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {listing.seller.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A18', marginBottom: '2px' }}>{listing.seller.name}</div>
                      {listing.seller.franchise && (
                        <div style={{ fontSize: '11px', background: '#E8EEF8', color: '#1B3A6B', padding: '2px 9px', borderRadius: '10px', display: 'inline-block', marginBottom: '8px', fontWeight: 600 }}>
                          🏢 {listing.seller.franchise}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        {[
                          { label: 'Note', value: `${listing.seller.rating} ⭐` },
                          { label: 'Avis', value: listing.seller.rating_count },
                          { label: 'Ventes', value: listing.seller.sales_count },
                          { label: 'Réponse', value: listing.seller.response_time },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: '#F7F5F0', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#1A1A18' }}>{stat.value}</div>
                            <div style={{ fontSize: '10px', color: '#6B6B66' }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                        📍 {listing.seller.city} · Membre depuis {listing.seller.member_since}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Similar listings */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '18px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Annonces similaires</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {SIMILAR.map(s => (
                  <Link key={s.id} href={`/annonces/${s.id}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #E2DDD6', borderRadius: '10px', overflow: 'hidden', display: 'block' }}>
                    <div style={{ height: '100px', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🚗</div>
                    <div style={{ padding: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A18', marginBottom: '4px', lineHeight: 1.3 }}>{s.title}</div>
                      <div style={{ fontSize: '10px', color: '#6B6B66', marginBottom: '6px' }}>{s.km.toLocaleString('fr')} km · {s.city}</div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#E8460A' }}>{(s.price / 100).toLocaleString('fr')} €</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky CTA */}
          <div style={{ position: 'sticky', top: '76px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Price card */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>
                {price.toLocaleString('fr-FR')} €
              </div>
              <div style={{ fontSize: '12px', color: '#6B6B66', marginBottom: '16px' }}>
                Prix ferme · Négociable
              </div>

              {messageSent || offerSent ? (
                <div style={{ background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#085041' }}>
                    {messageSent ? 'Message envoyé !' : 'Offre envoyée !'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#085041', marginTop: '4px' }}>
                    Le vendeur vous répondra sous {listing.seller.response_time}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setShowContact(true); setShowOffer(false); }}
                    style={{ width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    💬 Contacter le vendeur
                  </button>
                  <button onClick={() => { setShowOffer(true); setShowContact(false); }}
                    style={{ width: '100%', background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    💰 Faire une offre
                  </button>
                  <button style={{ width: '100%', background: '#1A1A18', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    🔒 Acheter · Paiement sécurisé
                  </button>
                </div>
              )}

              {showContact && !messageSent && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #E2DDD6', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A18', marginBottom: '8px' }}>Message au vendeur</div>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Bonjour, je suis intéressé par votre annonce. Est-elle toujours disponible ?"
                    rows={4}
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }} />
                  <button onClick={sendMessage}
                    style={{ width: '100%', marginTop: '8px', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Envoyer le message
                  </button>
                </div>
              )}

              {showOffer && !offerSent && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #E2DDD6', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A18', marginBottom: '8px' }}>Votre offre</div>
                  <div style={{ background: '#F7F5F0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#6B6B66', marginBottom: '8px' }}>
                    Prix demandé : <strong>{price.toLocaleString('fr')} €</strong><br />
                    Cote Argus : {(argusMin! / 100).toFixed(0)} – {(argusMax! / 100).toFixed(0)} €
                  </div>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                      placeholder={`Ex: ${Math.round(price * 0.92)}`}
                      style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 40px 10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#6B6B66', fontWeight: 600 }}>€</span>
                  </div>
                  <button onClick={sendOffer}
                    style={{ width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Envoyer l'offre
                  </button>
                  <div style={{ fontSize: '11px', color: '#6B6B66', marginTop: '6px', textAlign: 'center' }}>L'offre expire automatiquement après 24h</div>
                </div>
              )}
            </div>

            {/* Seller mini card */}
            <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1B3A6B', color: '#fff', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {listing.seller.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A1A18' }}>{listing.seller.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B6B66' }}>⭐ {listing.seller.rating} · {listing.seller.rating_count} avis</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#6B6B66' }}>
                <span style={{ background: '#F7F5F0', padding: '4px 9px', borderRadius: '6px' }}>✅ Vérifié</span>
                <span style={{ background: '#F7F5F0', padding: '4px 9px', borderRadius: '6px' }}>⚡ Répond en {listing.seller.response_time}</span>
              </div>
            </div>

            {/* Security */}
            <div style={{ background: '#1A1A18', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>🔒 Achat sécurisé FranceOccas</div>
              {['Paiement en séquestre jusqu\'à réception', 'Remboursement si non conforme', 'Livraison assurée et trackée', 'Vendeur vérifié par FranceOccas'].map(item => (
                <div key={item} style={{ fontSize: '11px', color: '#8A8A85', marginBottom: '5px', display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#1D9E75' }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
