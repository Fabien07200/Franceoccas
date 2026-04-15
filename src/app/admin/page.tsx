'use client';
import { useState } from 'react';
import Link from 'next/link';

type Tab = 'dashboard' | 'users' | 'listings' | 'moderation' | 'disputes' | 'franchises' | 'argus' | 'config';

const STATS = {
  users: { total: 2481, new_month: 184, active: 2310, pro: 127, blocked: 12 },
  listings: { total: 48200, active: 41800, boosted: 1240, new_month: 3840 },
  revenue: { commission_month: 324000, gmv_month: 10800000, commission_total: 1840000 },
  transactions: { total: 12840, in_escrow: 284, released: 12200, this_month: 287 },
  moderation: { pending: 12, urgent: 3 },
};

const MOCK_USERS = [
  { id: 'u1', email: 'jp.martin@email.fr', full_name: 'Jean-Paul Martin', role: 'pro', status: 'active', city: 'Nîmes', created_at: '12 jan. 2024', wallet_balance: 324000, rating: 4.9, sales: 34 },
  { id: 'u2', email: 'sophie.andreu@gmail.com', full_name: 'Sophie Andreu', role: 'user', status: 'active', city: 'Lyon', created_at: '03 fév. 2024', wallet_balance: 4500, rating: 5.0, sales: 8 },
  { id: 'u3', email: 'marc.lebrun@email.fr', full_name: 'Marc Lebrun', role: 'franchise_manager', status: 'active', city: 'Paris', created_at: '15 jan. 2024', wallet_balance: 0, rating: 4.7, sales: 0 },
  { id: 'u4', email: 'pierre.dup@yahoo.fr', full_name: 'Pierre Dupont', role: 'user', status: 'suspended', city: 'Bordeaux', created_at: '28 mar. 2024', wallet_balance: 0, rating: 2.1, sales: 2 },
  { id: 'u5', email: 'ahmed.b@email.fr', full_name: 'Ahmed Bensalem', role: 'user', status: 'active', city: 'Marseille', created_at: '05 avr. 2024', wallet_balance: 12000, rating: 4.3, sales: 15 },
];

const MOCK_MODERATION = [
  { id: 'mq1', listing_id: 'l1', title: 'Rolex Submariner — État neuf', price: 850000, city: 'Paris', seller: 'John D.', seller_rating: 2.1, ai_score: 42, flags: ['prix_suspect', 'photo_stock'], priority: 1, created_at: 'Il y a 5 min' },
  { id: 'mq2', listing_id: 'l2', title: 'iPhone 15 Pro Max 256Go', price: 95000, city: 'Lyon', seller: 'Marc K.', seller_rating: 4.8, ai_score: 71, flags: ['coordonnees_perso'], priority: 3, created_at: 'Il y a 20 min' },
  { id: 'mq3', listing_id: 'l3', title: 'Tracteur John Deere 6120M — 2018', price: 4800000, city: 'Toulouse', seller: 'Bernard F.', seller_rating: 4.6, ai_score: 78, flags: [], priority: 5, created_at: 'Il y a 1h' },
];

const MOCK_DISPUTES = [
  { id: 'd1', listing: 'Perceuse Makita DDF484', amount: 18900, buyer: 'Sophie A.', seller: 'Pierre D.', reason: 'Produit non conforme à la description', status: 'open', date: 'Il y a 2j' },
  { id: 'd2', listing: 'Vélo électrique Decathlon', amount: 89900, buyer: 'Marc L.', seller: 'Claire B.', reason: 'Batterie défectueuse, non mentionné', status: 'open', date: 'Il y a 4j' },
];

const MOCK_FRANCHISES = [
  { id: 'f1', name: 'Transak Auto', slug: 'transak-auto', concessions: 120, active: 118, status: 'active', commission: 1.8, contract_end: '31 déc. 2026' },
  { id: 'f2', name: 'EcoVéhicules', slug: 'ecovehicules', concessions: 34, active: 34, status: 'active', commission: 2.0, contract_end: '30 juin 2026' },
  { id: 'f3', name: 'AutoPrime Réseau', slug: 'autoprime', concessions: 0, active: 0, status: 'pending', commission: 1.8, contract_end: '—' },
];

const MOCK_ALERTS = [
  { type: 'urgent', icon: '🔴', text: 'Annonce Rolex suspecte — score IA 42/100', time: 'Il y a 5 min' },
  { type: 'warning', icon: '🟡', text: 'Quota Argus à 80% — envisager upgrade', time: 'Il y a 1h' },
  { type: 'info', icon: '🔵', text: 'Nouveau manager Transak Auto Nord en attente validation', time: 'Il y a 3h' },
  { type: 'success', icon: '🟢', text: 'Transaction #T2840 libérée — 890 € versés', time: 'Il y a 4h' },
  { type: 'warning', icon: '🟡', text: '2 litiges ouverts sans réponse admin depuis 48h', time: 'Hier' },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: '#fff', bg: '#1A1A18' },
  franchise_manager: { label: 'Manager', color: '#0C447C', bg: '#E6F1FB' },
  pro: { label: 'Pro', color: '#085041', bg: '#E1F5EE' },
  user: { label: 'Utilisateur', color: '#6B6B66', bg: '#F1EFE8' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Actif', color: '#085041', bg: '#E1F5EE' },
  suspended: { label: 'Suspendu', color: '#633806', bg: '#FAEEDA' },
  blocked: { label: 'Bloqué', color: '#791F1F', bg: '#FCEBEB' },
  pending: { label: 'En attente', color: '#633806', bg: '#FAEEDA' },
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [moderation, setModeration] = useState(MOCK_MODERATION);
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [argusTab, setArgusTab] = useState<'overview' | 'config' | 'logs'>('overview');
  const [argusConfig, setArgusConfig] = useState({ low_threshold: 70, high_threshold: 130, cache_hours: 24, block_ct_months: 6, auto_suggest: true, badge_prix_juste: true, show_cote_seller: true, show_cote_buyer: true });

  const filteredUsers = MOCK_USERS.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const moderateAction = (id: string, action: 'approve' | 'reject') => {
    setModeration(prev => prev.filter(m => m.id !== id));
  };

  const resolveDispute = (id: string, action: string) => {
    setDisputes(prev => prev.filter(d => d.id !== id));
  };

  const navItems: { id: Tab; icon: string; label: string; badge?: string | number }[] = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
    { id: 'users', icon: '👥', label: 'Utilisateurs', badge: STATS.users.total },
    { id: 'listings', icon: '📋', label: 'Annonces', badge: STATS.listings.active },
    { id: 'moderation', icon: '🔍', label: 'Modération', badge: STATS.moderation.pending },
    { id: 'disputes', icon: '⚖️', label: 'Litiges', badge: MOCK_DISPUTES.length },
    { id: 'franchises', icon: '🏢', label: 'Franchises' },
    { id: 'argus', icon: '🚗', label: 'Argus Pro' },
    { id: 'config', icon: '⚙️', label: 'Configuration' },
  ];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#0F0F0E', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#161614', borderBottom: '1px solid #252523', padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr <span style={{ color: '#3A3A38', fontSize: '12px', fontWeight: 400 }}>/ Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', background: '#E8460A18', color: '#E8460A', border: '1px solid #E8460A33', padding: '3px 10px', borderRadius: '4px', fontWeight: 600 }}>ADMIN</span>
          <Link href="/" style={{ fontSize: '12px', color: '#5A5A55', textDecoration: 'none' }}>← Retour au site</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', background: '#161614', borderRight: '1px solid #252523', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ flex: 1, padding: '8px' }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', borderRadius: '7px', border: 'none', background: tab === item.id ? '#E8460A18' : 'none', color: tab === item.id ? '#E8460A' : '#5A5A58', fontSize: '12px', cursor: 'pointer', textAlign: 'left', marginBottom: '2px', transition: 'all 0.1s' }}>
                <span style={{ fontSize: '14px' }}>{item.icon}</span>
                <span style={{ flex: 1, fontWeight: tab === item.id ? 600 : 400 }}>{item.label}</span>
                {item.badge !== undefined && (
                  <span style={{ fontSize: '9px', background: tab === item.id ? '#E8460A' : '#2A2A28', color: tab === item.id ? '#fff' : '#5A5A58', padding: '1px 6px', borderRadius: '8px', fontWeight: 600 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#F7F5F0' }}>

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Tableau de bord</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Utilisateurs', value: STATS.users.total.toLocaleString('fr'), sub: `+${STATS.users.new_month} ce mois`, color: '#E8460A' },
                  { label: 'Annonces actives', value: STATS.listings.active.toLocaleString('fr'), sub: `${STATS.listings.boosted} boostées`, color: '#378ADD' },
                  { label: 'GMV mensuel', value: `${(STATS.revenue.gmv_month / 100).toLocaleString('fr')} €`, sub: 'Volume traité', color: '#1D9E75' },
                  { label: 'Commission mois', value: `${(STATS.revenue.commission_month / 100).toLocaleString('fr')} €`, sub: '3% des ventes', color: '#1D9E75' },
                  { label: 'Transactions', value: STATS.transactions.in_escrow, sub: 'En séquestre', color: '#BA7517' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{kpi.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: kpi.color, marginBottom: '3px' }}>{kpi.value}</div>
                    <div style={{ fontSize: '10px', color: '#6B6B66' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2DDD6', fontWeight: 700, fontSize: '13px' }}>⚠️ Alertes & Actions</div>
                  <div style={{ padding: '4px 0' }}>
                    {MOCK_ALERTS.map((alert, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderBottom: i < MOCK_ALERTS.length - 1 ? '1px solid #F7F5F0' : 'none', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>{alert.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: '#1A1A18', lineHeight: 1.4 }}>{alert.text}</div>
                          <div style={{ fontSize: '10px', color: '#AEABA3', marginTop: '2px' }}>{alert.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2DDD6', fontWeight: 700, fontSize: '13px' }}>📊 Stats rapides</div>
                    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Taux conversion', value: '2.8%' },
                        { label: 'Panier moyen', value: '340 €' },
                        { label: 'Note moy. vendeurs', value: '4.7 ⭐' },
                        { label: 'Taux litiges', value: '0.3%' },
                        { label: 'Annonces boostées', value: `${((STATS.listings.boosted / STATS.listings.active) * 100).toFixed(1)}%` },
                        { label: 'Users pro', value: STATS.users.pro },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#F7F5F0', borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{s.label}</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A18' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Modérer', count: STATS.moderation.pending, urgent: STATS.moderation.urgent, tab: 'moderation' as Tab, color: '#E8460A' },
                      { label: 'Litiges', count: MOCK_DISPUTES.length, urgent: MOCK_DISPUTES.length, tab: 'disputes' as Tab, color: '#BA7517' },
                    ].map(card => (
                      <button key={card.label} onClick={() => setTab(card.tab)}
                        style={{ background: '#fff', border: `2px solid ${card.color}20`, borderRadius: '12px', padding: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: card.color, marginBottom: '2px' }}>{card.count}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A18' }}>{card.label} en attente</div>
                        {card.urgent > 0 && <div style={{ fontSize: '10px', color: card.color, marginTop: '2px' }}>{card.urgent} urgent{card.urgent > 1 ? 's' : ''}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18' }}>Utilisateurs ({STATS.users.total.toLocaleString('fr')})</h2>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="🔍 Rechercher…"
                  style={{ border: '1px solid #E2DDD6', borderRadius: '9px', padding: '8px 14px', fontSize: '13px', outline: 'none', width: '240px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Total', value: STATS.users.total, color: '#1A1A18' },
                  { label: 'Actifs', value: STATS.users.active, color: '#1D9E75' },
                  { label: 'Pro', value: STATS.users.pro, color: '#378ADD' },
                  { label: 'Bloqués', value: STATS.users.blocked, color: '#E24B4A' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '12px' }}>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{k.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F7F5F0' }}>
                      {['Utilisateur', 'Rôle', 'Statut', 'Ville', 'Wallet', 'Note', 'Ventes', 'Inscrit', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #E2DDD6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, i) => (
                      <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #E2DDD6' : 'none', background: selectedUser === user.id ? '#FFF8F6' : '#fff' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: '#1A1A18' }}>{user.full_name}</div>
                          <div style={{ fontSize: '10px', color: '#6B6B66' }}>{user.email}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: ROLE_CONFIG[user.role]?.bg, color: ROLE_CONFIG[user.role]?.color }}>
                            {ROLE_CONFIG[user.role]?.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: STATUS_CONFIG[user.status]?.bg, color: STATUS_CONFIG[user.status]?.color }}>
                            {STATUS_CONFIG[user.status]?.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6B6B66' }}>{user.city}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#1D9E75' }}>{(user.wallet_balance / 100).toFixed(0)} €</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px' }}>⭐ {user.rating}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px' }}>{user.sales}</td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B6B66' }}>{user.created_at}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button style={{ background: '#F7F5F0', border: '1px solid #E2DDD6', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: '#1A1A18' }}>Voir</button>
                            {user.status === 'active' ? (
                              <button style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: '#633806' }}>Suspendre</button>
                            ) : (
                              <button style={{ background: '#E1F5EE', border: '1px solid #9FE1CB', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', color: '#085041' }}>Réactiver</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MODERATION ── */}
          {tab === 'moderation' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>File de modération ({moderation.length})</h2>

              {moderation.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#1A1A18' }}>File vide !</div>
                  <div style={{ fontSize: '13px', color: '#6B6B66', marginTop: '4px' }}>Toutes les annonces ont été modérées.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {moderation.map(item => (
                    <div key={item.id} style={{ background: '#fff', border: `1px solid ${item.ai_score < 60 ? '#F7C1C1' : item.ai_score < 75 ? '#FAC775' : '#E2DDD6'}`, borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>📋</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A18' }}>{item.title}</div>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px',
                              background: item.ai_score < 60 ? '#FCEBEB' : item.ai_score < 75 ? '#FAEEDA' : '#E1F5EE',
                              color: item.ai_score < 60 ? '#791F1F' : item.ai_score < 75 ? '#633806' : '#085041' }}>
                              IA: {item.ai_score}/100
                            </span>
                            {item.priority <= 2 && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: '#FCEBEB', color: '#791F1F' }}>🔴 URGENT</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B6B66', marginBottom: '6px' }}>
                            {(item.price / 100).toLocaleString('fr')} € · {item.city} · Vendeur: {item.seller} (⭐{item.seller_rating}) · {item.created_at}
                          </div>
                          {item.flags.length > 0 && (
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                              {item.flags.map(flag => (
                                <span key={flag} style={{ fontSize: '9px', background: '#FAEEDA', color: '#633806', padding: '2px 7px', borderRadius: '5px', fontWeight: 600 }}>
                                  ⚠️ {flag.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => moderateAction(item.id, 'approve')}
                              style={{ background: '#E1F5EE', color: '#085041', border: '1px solid #9FE1CB', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Approuver
                            </button>
                            <button onClick={() => moderateAction(item.id, 'reject')}
                              style={{ background: '#FCEBEB', color: '#791F1F', border: '1px solid #F7C1C1', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ✕ Rejeter
                            </button>
                            <button style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer' }}>
                              Voir l'annonce →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DISPUTES ── */}
          {tab === 'disputes' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Litiges ouverts ({disputes.length})</h2>

              {disputes.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚖️</div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>Aucun litige ouvert</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {disputes.map(d => (
                    <div key={d.id} style={{ background: '#fff', border: '1px solid #FAC775', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A18', marginBottom: '4px' }}>{d.listing}</div>
                          <div style={{ fontSize: '12px', color: '#6B6B66', marginBottom: '8px' }}>
                            Acheteur: <strong>{d.buyer}</strong> vs Vendeur: <strong>{d.seller}</strong> · {d.date}
                          </div>
                          <div style={{ background: '#FAEEDA', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#633806', marginBottom: '12px' }}>
                            📋 {d.reason}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '18px', color: '#1A1A18', marginBottom: '12px' }}>
                            {(d.amount / 100).toLocaleString('fr')} € en séquestre
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => resolveDispute(d.id, 'refund')}
                              style={{ background: '#E6F1FB', color: '#0C447C', border: '1px solid #B5D4F4', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ↩ Rembourser l'acheteur
                            </button>
                            <button onClick={() => resolveDispute(d.id, 'release')}
                              style={{ background: '#E1F5EE', color: '#085041', border: '1px solid #9FE1CB', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              ✓ Libérer au vendeur
                            </button>
                            <button style={{ background: '#fff', color: '#6B6B66', border: '1px solid #E2DDD6', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
                              💬 Contacter les parties
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FRANCHISES ── */}
          {tab === 'franchises' && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18' }}>Réseaux franchisés</h2>
                <button style={{ background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  + Nouveau réseau
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {MOCK_FRANCHISES.map(f => (
                  <div key={f.id} style={{ background: '#fff', border: `1px solid ${f.status === 'pending' ? '#FAC775' : '#E2DDD6'}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#E8EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: '#1B3A6B', flexShrink: 0 }}>
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A18' }}>{f.name}</div>
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: STATUS_CONFIG[f.status]?.bg, color: STATUS_CONFIG[f.status]?.color }}>
                          {STATUS_CONFIG[f.status]?.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B6B66' }}>
                        {f.concessions} concessions ({f.active} actives) · Commission {f.commission}% · Contrat jusqu'au {f.contract_end}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {f.status === 'pending' && (
                        <button style={{ background: '#E1F5EE', color: '#085041', border: '1px solid #9FE1CB', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          ✓ Valider
                        </button>
                      )}
                      <button style={{ background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', cursor: 'pointer' }}>
                        Gérer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ARGUS ── */}
          {tab === 'argus' && (
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18' }}>Configuration Argus Pro</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#085041', border: '1px solid #9FE1CB', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>● API connectée</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#fff', border: '1px solid #E2DDD6', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
                {(['overview', 'config', 'logs'] as const).map(t => (
                  <button key={t} onClick={() => setArgusTab(t)}
                    style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: argusTab === t ? '#8B2FC9' : 'none', color: argusTab === t ? '#fff' : '#6B6B66', fontSize: '12px', fontWeight: argusTab === t ? 600 : 400, cursor: 'pointer' }}>
                    {t === 'overview' ? 'Vue d\'ensemble' : t === 'config' ? 'Configuration' : 'Logs'}
                  </button>
                ))}
              </div>

              {argusTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'Requêtes aujourd\'hui', value: '1 284', sub: 'sur 10 000/j', color: '#8B2FC9' },
                      { label: 'Temps de réponse', value: '142ms', sub: 'Excellent', color: '#1D9E75' },
                      { label: 'Taux de succès', value: '99.7%', sub: 'SLA respecté', color: '#1D9E75' },
                      { label: 'Cotes récupérées', value: '6 820', sub: 'Ce mois', color: '#378ADD' },
                    ].map(k => (
                      <div key={k.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '14px' }}>
                        <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{k.label}</div>
                        <div style={{ fontWeight: 800, fontSize: '20px', color: k.color, marginBottom: '2px' }}>{k.value}</div>
                        <div style={{ fontSize: '10px', color: '#6B6B66' }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>Consommation des quotas</div>
                    {[
                      { label: 'Cotes véhicule', used: 4820, limit: 6000, color: '#8B2FC9' },
                      { label: 'Données plaque SIV', used: 2640, limit: 5000, color: '#378ADD' },
                      { label: 'Historique CT', used: 1240, limit: 3000, color: '#1D9E75' },
                      { label: 'Historique sinistres', used: 820, limit: 2000, color: '#BA7517' },
                    ].map(q => (
                      <div key={q.label} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                          <span style={{ color: '#1A1A18' }}>{q.label}</span>
                          <span style={{ fontWeight: 700, color: q.color }}>{q.used.toLocaleString('fr')} / {q.limit.toLocaleString('fr')}</span>
                        </div>
                        <div style={{ height: '6px', background: '#F7F5F0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #E2DDD6' }}>
                          <div style={{ height: '100%', width: `${Math.round(q.used / q.limit * 100)}%`, background: q.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {argusTab === 'config' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '14px' }}>Règles de prix</div>
                    {[
                      { label: 'Alerte prix trop bas', key: 'low_threshold', unit: '% de la cote min', type: 'number' },
                      { label: 'Alerte prix trop élevé', key: 'high_threshold', unit: '% de la cote max', type: 'number' },
                      { label: 'Cache Argus', key: 'cache_hours', unit: 'heures', type: 'number' },
                      { label: 'Bloquer si CT dépassé', key: 'block_ct_months', unit: 'mois max', type: 'number' },
                    ].map(field => (
                      <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F7F5F0' }}>
                        <div style={{ fontSize: '13px', color: '#1A1A18' }}>{field.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input type="number" value={(argusConfig as Record<string, number | boolean>)[field.key] as number}
                            onChange={e => setArgusConfig(c => ({ ...c, [field.key]: parseInt(e.target.value) }))}
                            style={{ width: '64px', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '5px 8px', fontSize: '12px', fontWeight: 700, textAlign: 'center', outline: 'none' }} />
                          <span style={{ fontSize: '11px', color: '#6B6B66' }}>{field.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '14px' }}>Affichage & comportement</div>
                    {[
                      { label: 'Badge "Prix juste Argus"', key: 'badge_prix_juste' },
                      { label: 'Cote visible par le vendeur', key: 'show_cote_seller' },
                      { label: 'Cote visible par l\'acheteur', key: 'show_cote_buyer' },
                      { label: 'Suggestion prix automatique', key: 'auto_suggest' },
                    ].map(toggle => (
                      <div key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F7F5F0' }}>
                        <span style={{ fontSize: '13px', color: '#1A1A18' }}>{toggle.label}</span>
                        <button onClick={() => setArgusConfig(c => ({ ...c, [toggle.key]: !(c as Record<string, number | boolean>)[toggle.key] }))}
                          style={{ width: '40px', height: '22px', borderRadius: '11px', background: (argusConfig as Record<string, number | boolean>)[toggle.key] ? '#1D9E75' : '#E2DDD6', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: (argusConfig as Record<string, number | boolean>)[toggle.key] ? '21px' : '3px' }} />
                        </button>
                      </div>
                    ))}
                    <button style={{ marginTop: '14px', width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      Enregistrer la configuration
                    </button>
                  </div>
                </div>
              )}

              {argusTab === 'logs' && (
                <div style={{ background: '#0F0F0E', borderRadius: '12px', padding: '14px', fontFamily: 'monospace' }}>
                  {[
                    { time: '14:32:18', status: 200, method: 'GET', path: '/v3/vehicle/plate/AB-123-CD', ms: 138, color: '#9FE1CB' },
                    { time: '14:32:19', status: 200, method: 'GET', path: '/v3/vehicle/valuation', ms: 142, color: '#9FE1CB' },
                    { time: '14:31:55', status: 200, method: 'GET', path: '/v3/vehicle/plate/EF-456-GH', ms: 156, color: '#9FE1CB' },
                    { time: '14:31:44', status: 429, method: 'GET', path: '/v3/vehicle/valuation', ms: 0, color: '#FAC775' },
                    { time: '14:31:44', status: 200, method: 'POST', path: '/v3/vehicle/batch', ms: 1240, color: '#9FE1CB' },
                    { time: '14:29:38', status: 500, method: 'GET', path: '/v3/vehicle/history', ms: 0, color: '#F09595' },
                    { time: '14:28:55', status: 0, method: 'CACHE', path: '/v3/vehicle/plate/IJ-789-KL', ms: 0, color: '#85B7EB' },
                  ].map((log, i) => (
                    <div key={i} style={{ fontSize: '11px', lineHeight: 2, display: 'flex', gap: '12px' }}>
                      <span style={{ color: '#3A3A38' }}>{log.time}</span>
                      <span style={{ color: log.color, fontWeight: 700, minWidth: '28px' }}>{log.status || 'HIT'}</span>
                      <span style={{ color: '#C4A0E8', minWidth: '40px' }}>{log.method}</span>
                      <span style={{ color: '#9FE1CB', flex: 1 }}>{log.path}</span>
                      {log.ms > 0 && <span style={{ color: log.ms > 1000 ? '#FAC775' : '#5A5A58' }}>{log.ms}ms</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONFIG ── */}
          {tab === 'config' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Configuration plateforme</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { title: '💰 Commissions', fields: [{ label: 'Commission standard', value: '3%' }, { label: 'Commission pro', value: '2%' }, { label: 'Commission franchise', value: '1.8%' }] },
                  { title: '⚡ Boosts', fields: [{ label: 'Boost 3 jours', value: '2.90 €' }, { label: 'Boost 7 jours', value: '4.90 €' }, { label: 'Boost 15 jours', value: '8.90 €' }] },
                  { title: '🚚 Livraison', fields: [{ label: 'Colissimo', value: '8.90 €' }, { label: 'Mondial Relay', value: '4.90 €' }, { label: 'Palette FO', value: '39.00 €' }] },
                  { title: '📦 Kit emballage', fields: [{ label: 'Prix kit palette', value: '24.00 €' }, { label: 'Délai livraison', value: 'J+1' }, { label: 'Poids max', value: '150 kg' }] },
                ].map(section => (
                  <div key={section.title} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A18', marginBottom: '12px' }}>{section.title}</div>
                    {section.fields.map(field => (
                      <div key={field.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F7F5F0' }}>
                        <span style={{ fontSize: '13px', color: '#6B6B66' }}>{field.label}</span>
                        <input defaultValue={field.value}
                          style={{ border: '1px solid #E2DDD6', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', fontWeight: 700, textAlign: 'right', outline: 'none', width: '100px' }} />
                      </div>
                    ))}
                    <button style={{ marginTop: '12px', width: '100%', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Enregistrer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTINGS ── */}
          {tab === 'listings' && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Annonces ({STATS.listings.total.toLocaleString('fr')})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Total', value: STATS.listings.total.toLocaleString('fr'), color: '#1A1A18' },
                  { label: 'Actives', value: STATS.listings.active.toLocaleString('fr'), color: '#1D9E75' },
                  { label: 'Boostées', value: STATS.listings.boosted, color: '#E8460A' },
                  { label: 'Ce mois', value: `+${STATS.listings.new_month}`, color: '#378ADD' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '11px', padding: '14px' }}>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>{k.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#6B6B66', fontSize: '13px' }}>
                Tableau de gestion des annonces — connecté à la base de données en production
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
