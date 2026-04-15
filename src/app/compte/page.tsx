'use client';
import { useState } from 'react';
import Link from 'next/link';

const MOCK_USER = {
  name: 'Jean-Paul Martin',
  email: 'jp.martin@email.fr',
  city: 'Nîmes (30)',
  avatar: 'JP',
  rating: 4.9,
  rating_count: 28,
  sales_count: 34,
  member_since: 'Janvier 2024',
  wallet_balance: 324000,
  wallet_pending: 86400,
  role: 'pro',
  franchise: 'Transak Auto Nîmes',
};

const MOCK_LISTINGS = [
  { id: '1', title: 'Renault Clio V 1.0 TCe 90 — 2022', price: 1190000, status: 'active', views: 248, messages: 12, favorites: 18, boost_level: 1, boost_days: 5, category: 'Automobile', created_at: '12 avr. 2026' },
  { id: '2', title: 'Peugeot 3008 GT 1.6 THP — 2021', price: 2250000, status: 'active', views: 184, messages: 8, favorites: 22, boost_level: 2, boost_days: 3, category: 'Automobile', created_at: '10 avr. 2026' },
  { id: '3', title: 'Ford Transit Custom 2.0 TDCi — 2020', price: 2890000, status: 'pending', views: 0, messages: 0, favorites: 0, boost_level: 0, boost_days: 0, category: 'Automobile', created_at: '15 avr. 2026' },
  { id: '4', title: 'Perceuse Bosch Professional GBH 18V', price: 18900, status: 'sold', views: 892, messages: 34, favorites: 45, boost_level: 0, boost_days: 0, category: 'Outillage', created_at: '01 mar. 2026' },
  { id: '5', title: 'Tondeuse Honda HF 2315 HM', price: 120000, status: 'paused', views: 124, messages: 3, favorites: 9, boost_level: 0, boost_days: 0, category: 'Jardinage', created_at: '20 fév. 2026' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', listing: 'Renault Clio V', amount: 1190000, status: 'escrow', buyer: 'Marc L.', date: '14 avr. 2026', delivery: 'Colissimo' },
  { id: 't2', listing: 'Perceuse Bosch', amount: 18900, status: 'released', buyer: 'Sophie A.', date: '02 mar. 2026', delivery: 'Main propre' },
  { id: 't3', listing: 'Meuleuse Makita', amount: 8900, status: 'released', buyer: 'Pierre D.', date: '15 jan. 2026', delivery: 'Mondial Relay' },
];

const MOCK_WALLET = [
  { id: 'w1', type: 'credit', amount: 86400, description: 'Vente Perceuse Bosch', date: '02 mar. 2026' },
  { id: 'w2', type: 'debit', amount: -490, description: 'Boost annonce 7 jours', date: '10 avr. 2026' },
  { id: 'w3', type: 'credit', amount: 8900, description: 'Vente Meuleuse Makita', date: '15 jan. 2026' },
  { id: 'w4', type: 'recharge', amount: 5000, description: 'Recharge porte-monnaie + bonus 3€', date: '05 jan. 2026' },
  { id: 'w5', type: 'debit', amount: -290, description: 'Boost annonce 3 jours', date: '28 déc. 2025' },
];

type Tab = 'annonces' | 'ventes' | 'wallet' | 'profil' | 'notifications';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: 'Actif',         color: '#085041', bg: '#E1F5EE' },
  pending: { label: 'En attente',    color: '#633806', bg: '#FAEEDA' },
  sold:    { label: 'Vendu',         color: '#0C447C', bg: '#E6F1FB' },
  paused:  { label: 'En pause',      color: '#5F5E5A', bg: '#F1EFE8' },
  escrow:  { label: 'En séquestre',  color: '#633806', bg: '#FAEEDA' },
  released:{ label: 'Libéré',        color: '#085041', bg: '#E1F5EE' },
};

export default function ComptePage() {
  const [tab, setTab] = useState<Tab>('annonces');
  const [showBoostModal, setShowBoostModal] = useState<string | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [listingFilter, setListingFilter] = useState('all');

  const filteredListings = listingFilter === 'all'
    ? MOCK_LISTINGS
    : MOCK_LISTINGS.filter(l => l.status === listingFilter);

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'annonces', icon: '📋', label: 'Mes annonces' },
    { id: 'ventes', icon: '💰', label: 'Ventes' },
    { id: 'wallet', icon: '👛', label: 'Porte-monnaie' },
    { id: 'profil', icon: '👤', label: 'Mon profil' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
  ];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#8A8A85' }}>
            👛 {(MOCK_USER.wallet_balance / 100).toLocaleString('fr-FR')} €
          </span>
          <Link href="/vendre" style={{ background: '#E8460A', color: '#fff', padding: '7px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            + Déposer
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* SIDEBAR */}
        <aside>
          {/* Profil card */}
          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px', marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1B3A6B', color: '#fff', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              {MOCK_USER.avatar}
            </div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A18', marginBottom: '2px' }}>{MOCK_USER.name}</div>
            <div style={{ fontSize: '11px', color: '#6B6B66', marginBottom: '8px' }}>{MOCK_USER.city}</div>
            {MOCK_USER.franchise && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#E8EEF8', borderRadius: '20px', padding: '3px 10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#1B3A6B' }}>🏢 {MOCK_USER.franchise}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: '#6B6B66', borderTop: '1px solid #E2DDD6', paddingTop: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1A18' }}>{MOCK_USER.rating}</div>
                <div style={{ fontSize: '10px' }}>⭐ Note</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1A18' }}>{MOCK_USER.rating_count}</div>
                <div style={{ fontSize: '10px' }}>Avis</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1A18' }}>{MOCK_USER.sales_count}</div>
                <div style={{ fontSize: '10px' }}>Ventes</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden' }}>
            {navItems.map((item, i) => (
              <button key={item.id} onClick={() => setTab(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '13px 16px', border: 'none', borderBottom: i < navItems.length - 1 ? '1px solid #E2DDD6' : 'none', background: tab === item.id ? '#FFF0EB' : '#fff', color: tab === item.id ? '#E8460A' : '#1A1A18', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: tab === item.id ? 600 : 400 }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
                {item.id === 'wallet' && (
                  <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '12px', color: '#1D9E75' }}>
                    {(MOCK_USER.wallet_balance / 100).toFixed(0)} €
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Déconnexion */}
          <button style={{ width: '100%', marginTop: '10px', border: '1px solid #E2DDD6', background: '#fff', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#6B6B66', cursor: 'pointer' }}>
            🚪 Déconnexion
          </button>
        </aside>

        {/* MAIN */}
        <main>

          {/* ── ANNONCES ── */}
          {tab === 'annonces' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18' }}>Mes annonces</h2>
                <Link href="/vendre" style={{ background: '#E8460A', color: '#fff', padding: '8px 16px', borderRadius: '9px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                  + Nouvelle annonce
                </Link>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Annonces actives', value: MOCK_LISTINGS.filter(l => l.status === 'active').length, color: '#1D9E75' },
                  { label: 'Vues totales', value: MOCK_LISTINGS.reduce((s, l) => s + l.views, 0), color: '#378ADD' },
                  { label: 'Messages reçus', value: MOCK_LISTINGS.reduce((s, l) => s + l.messages, 0), color: '#E8460A' },
                  { label: 'En favoris', value: MOCK_LISTINGS.reduce((s, l) => s + l.favorites, 0), color: '#BA7517' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '14px' }}>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{kpi.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '24px', color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Filtres status */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {['all', 'active', 'pending', 'paused', 'sold'].map(s => (
                  <button key={s} onClick={() => setListingFilter(s)}
                    style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      background: listingFilter === s ? '#1A1A18' : '#fff',
                      color: listingFilter === s ? '#fff' : '#6B6B66',
                      borderColor: listingFilter === s ? '#1A1A18' : '#E2DDD6' }}>
                    {s === 'all' ? 'Toutes' : STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>

              {/* Liste */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredListings.map(listing => (
                  <div key={listing.id} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                      🚗
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A18', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.title}</div>
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
                          background: STATUS_CONFIG[listing.status]?.bg,
                          color: STATUS_CONFIG[listing.status]?.color }}>
                          {STATUS_CONFIG[listing.status]?.label}
                        </span>
                        {listing.boost_level > 0 && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: '#FFF0EB', color: '#993C1D', flexShrink: 0 }}>
                            ⚡ Boosté {listing.boost_days}j
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1A18', marginBottom: '6px' }}>
                        {(listing.price / 100).toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#6B6B66' }}>
                        <span>👁 {listing.views} vues</span>
                        <span>💬 {listing.messages} messages</span>
                        <span>🤍 {listing.favorites} favoris</span>
                        <span>📅 {listing.created_at}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {listing.status === 'active' && (
                        <button onClick={() => setShowBoostModal(listing.id)}
                          style={{ background: '#FFF0EB', color: '#E8460A', border: '1px solid #F5C4B3', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          ⚡ Booster
                        </button>
                      )}
                      <button style={{ background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }}>
                        ✏️ Modifier
                      </button>
                      {listing.status === 'active' && (
                        <button style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>
                          ⏸
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VENTES ── */}
          {tab === 'ventes' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Mes ventes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Chiffre d\'affaires', value: `${(MOCK_TRANSACTIONS.reduce((s, t) => s + t.amount, 0) / 100).toLocaleString('fr')} €`, color: '#1D9E75' },
                  { label: 'En séquestre', value: `${(MOCK_TRANSACTIONS.filter(t => t.status === 'escrow').reduce((s, t) => s + t.amount, 0) / 100).toLocaleString('fr')} €`, color: '#BA7517' },
                  { label: 'Transactions', value: MOCK_TRANSACTIONS.length, color: '#378ADD' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '14px' }}>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{k.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MOCK_TRANSACTIONS.map(tx => (
                  <div key={tx.id} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: STATUS_CONFIG[tx.status]?.bg || '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      💰
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{tx.listing}</div>
                      <div style={{ fontSize: '11px', color: '#6B6B66' }}>Acheteur : {tx.buyer} · {tx.delivery} · {tx.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: '#1A1A18', marginBottom: '4px' }}>
                        {(tx.amount / 100).toLocaleString('fr')} €
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                        background: STATUS_CONFIG[tx.status]?.bg, color: STATUS_CONFIG[tx.status]?.color }}>
                        {STATUS_CONFIG[tx.status]?.label}
                      </span>
                    </div>
                    {tx.status === 'escrow' && (
                      <button style={{ background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Confirmer réception
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WALLET ── */}
          {tab === 'wallet' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Porte-monnaie</h2>

              <div style={{ background: '#1A1A18', borderRadius: '16px', padding: '24px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#5A5A58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Solde disponible</div>
                  <div style={{ fontWeight: 800, fontSize: '36px', color: '#fff' }}>{(MOCK_USER.wallet_balance / 100).toLocaleString('fr-FR')} €</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#5A5A58', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>En attente (séquestre)</div>
                  <div style={{ fontWeight: 800, fontSize: '36px', color: '#FA C775' }}>
                    <span style={{ color: '#FAC775' }}>{(MOCK_USER.wallet_pending / 100).toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1' }}>
                  <button onClick={() => setShowWithdraw(true)}
                    style={{ background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    💳 Virer sur mon compte
                  </button>
                  <button style={{ background: '#2A2A28', color: '#fff', border: '1px solid #3A3A38', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer' }}>
                    + Recharger
                  </button>
                </div>
              </div>

              {showWithdraw && (
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Virement SEPA — crédit sous 24h</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', marginBottom: '4px' }}>MONTANT (€)</div>
                      <input type="number" placeholder="Ex: 200" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                        style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', marginBottom: '4px' }}>IBAN</div>
                      <input type="text" placeholder="FR76 xxxx xxxx xxxx"
                        style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: '#E8460A', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Confirmer le virement
                    </button>
                    <button onClick={() => setShowWithdraw(false)}
                      style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer' }}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Historique</h3>
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', overflow: 'hidden' }}>
                {MOCK_WALLET.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderBottom: i < MOCK_WALLET.length - 1 ? '1px solid #E2DDD6' : 'none' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      background: tx.type === 'credit' ? '#E1F5EE' : tx.type === 'recharge' ? '#E6F1FB' : '#FFF0EB' }}>
                      {tx.type === 'credit' ? '↓' : tx.type === 'recharge' ? '⚡' : '↑'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A1A18' }}>{tx.description}</div>
                      <div style={{ fontSize: '11px', color: '#6B6B66' }}>{tx.date}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '15px',
                      color: tx.amount > 0 ? '#1D9E75' : '#E24B4A' }}>
                      {tx.amount > 0 ? '+' : ''}{(tx.amount / 100).toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROFIL ── */}
          {tab === 'profil' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Mon profil</h2>
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { label: 'Prénom et nom', value: MOCK_USER.name },
                    { label: 'Email', value: MOCK_USER.email },
                    { label: 'Ville', value: 'Nîmes' },
                    { label: 'Téléphone', value: '06 xx xx xx xx' },
                  ].map(field => (
                    <div key={field.label}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{field.label}</div>
                      <input defaultValue={field.value}
                        style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                  ))}
                </div>
                <button style={{ marginTop: '16px', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Enregistrer les modifications
                </button>
              </div>

              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px', marginTop: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Sécurité</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #E2DDD6', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <span>🔒 Changer le mot de passe</span>
                    <span style={{ color: '#6B6B66' }}>→</span>
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #E2DDD6', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <span>📱 Double authentification (2FA)</span>
                    <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>Activé</span>
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #E2DDD6', borderRadius: '9px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <span>🏦 Coordonnées bancaires (IBAN)</span>
                    <span style={{ color: '#6B6B66' }}>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {tab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Notifications</h2>
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden' }}>
                {[
                  { icon: '💬', title: 'Nouveau message', desc: 'Marc L. vous a envoyé un message concernant Renault Clio V', time: 'Il y a 10 min', unread: true },
                  { icon: '💰', title: 'Paiement reçu en séquestre', desc: '11 900 € sécurisés pour la vente de Renault Clio V', time: 'Il y a 2h', unread: true },
                  { icon: '⚡', title: 'Boost expirant bientôt', desc: 'Le boost de votre annonce Peugeot 3008 expire dans 3 jours', time: 'Il y a 5h', unread: false },
                  { icon: '⭐', title: 'Nouvel avis reçu', desc: 'Sophie A. vous a laissé un avis 5 étoiles', time: 'Hier', unread: false },
                  { icon: '🤍', title: 'Annonce en favoris', desc: '5 personnes ont ajouté Peugeot 3008 GT en favoris', time: 'Il y a 2j', unread: false },
                ].map((notif, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: i < 4 ? '1px solid #E2DDD6' : 'none', background: notif.unread ? '#FDFCFA' : '#fff' }}>
                    {notif.unread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#E8460A', marginTop: '6px', flexShrink: 0 }} />}
                    {!notif.unread && <div style={{ width: '7px', flexShrink: 0 }} />}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {notif.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: notif.unread ? 600 : 400, color: '#1A1A18', marginBottom: '3px' }}>{notif.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B6B66', lineHeight: 1.4 }}>{notif.desc}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#AEABA3', whiteSpace: 'nowrap', flexShrink: 0 }}>{notif.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* BOOST MODAL */}
      {showBoostModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>⚡ Booster cette annonce</h3>
            <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '18px' }}>Multipliez vos vues et remontez en tête des résultats.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { level: 1, days: 3, price: 2.90, label: 'Boost 3 jours', multiplier: '3×' },
                { level: 2, days: 7, price: 4.90, label: 'Boost 7 jours', multiplier: '7×', popular: true },
                { level: 3, days: 15, price: 8.90, label: 'Boost 15 jours', multiplier: '15×' },
              ].map(opt => (
                <div key={opt.level} style={{ border: `2px solid ${opt.popular ? '#E8460A' : '#E2DDD6'}`, borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}>
                  {opt.popular && <span style={{ position: 'absolute', top: '-8px', right: '10px', background: '#E8460A', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>POPULAIRE</span>}
                  <div style={{ fontSize: '24px' }}>⚡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: '#6B6B66' }}>{opt.multiplier} plus de visibilité</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#E8460A' }}>{opt.price} €</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Payer depuis mon wallet
              </button>
              <button onClick={() => setShowBoostModal(null)}
                style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '11px 16px', fontSize: '13px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
