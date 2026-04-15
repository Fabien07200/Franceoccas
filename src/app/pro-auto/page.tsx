'use client';
import { useState } from 'react';
import Link from 'next/link';

type Tab = 'dashboard' | 'catalogue' | 'argus' | 'import' | 'stats';

const MOCK_VEHICLES = [
  { id: 'v1', plate: 'AB-123-CD', make: 'Renault', model: 'Clio V', version: '1.0 TCe 90 Intens', year: 2022, fuel: 'Essence', km: 28000, color: 'Gris Platine', price: 1190000, argus_min: 1080000, argus_max: 1260000, argus_suggested: 1150000, ct_status: 'FAVORABLE', ct_date: '03/2026', status: 'active', views: 248, messages: 12, days: 3 },
  { id: 'v2', plate: 'EF-456-GH', make: 'Peugeot', model: '3008 GT', version: '1.6 THP 165', year: 2021, fuel: 'Essence', km: 41500, color: 'Noir Perla', price: 2250000, argus_min: 2100000, argus_max: 2480000, argus_suggested: 2280000, ct_status: 'FAVORABLE', ct_date: '06/2025', status: 'active', views: 184, messages: 8, days: 5 },
  { id: 'v3', plate: 'IJ-789-KL', make: 'Ford', model: 'Transit Custom', version: '2.0 TDCi 130', year: 2020, fuel: 'Diesel', km: 62000, color: 'Blanc', price: 2890000, argus_min: 2450000, argus_max: 2900000, argus_suggested: 2700000, ct_status: 'FAVORABLE', ct_date: '11/2025', status: 'pending', views: 0, messages: 0, days: 0 },
  { id: 'v4', plate: 'MN-012-OP', make: 'Volkswagen', model: 'Golf VII', version: '1.6 TDI 115 Confortline', year: 2019, fuel: 'Diesel', km: 78000, color: 'Gris Indium', price: 1490000, argus_min: 1320000, argus_max: 1680000, argus_suggested: 1520000, ct_status: 'DEFAVORABLE', ct_date: '05/2024', status: 'paused', views: 56, messages: 2, days: 12 },
  { id: 'v5', plate: 'QR-345-ST', make: 'Toyota', model: 'Yaris', version: '1.5 Hybrid Dynamic', year: 2023, fuel: 'Hybride', km: 12000, color: 'Rouge Intense', price: 1890000, argus_min: 1750000, argus_max: 2050000, argus_suggested: 1920000, ct_status: 'FAVORABLE', ct_date: '04/2027', status: 'active', views: 421, messages: 28, days: 1 },
];

const MOCK_ARGUS_HISTORY = [
  { plate: 'AB-123-CD', make: 'Renault Clio V', timestamp: 'Il y a 2h', cost: 1, result: '11 500 €', confidence: 'HIGH' },
  { plate: 'EF-456-GH', make: 'Peugeot 3008 GT', timestamp: 'Il y a 4h', cost: 1, result: '22 800 €', confidence: 'HIGH' },
  { plate: 'IJ-789-KL', make: 'Ford Transit Custom', timestamp: 'Hier', cost: 1, result: '27 000 €', confidence: 'MEDIUM' },
  { plate: 'MN-012-OP', make: 'Volkswagen Golf VII', timestamp: 'Il y a 2j', cost: 1, result: '15 200 €', confidence: 'HIGH' },
  { plate: 'QR-345-ST', make: 'Toyota Yaris Hybrid', timestamp: 'Il y a 3j', cost: 1, result: '19 200 €', confidence: 'HIGH' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Publié', color: '#085041', bg: '#E1F5EE' },
  pending: { label: 'En attente', color: '#633806', bg: '#FAEEDA' },
  paused: { label: 'En pause', color: '#5F5E5A', bg: '#F1EFE8' },
  sold: { label: 'Vendu', color: '#0C447C', bg: '#E6F1FB' },
};

const CT_CONFIG: Record<string, { color: string; bg: string }> = {
  FAVORABLE: { color: '#085041', bg: '#E1F5EE' },
  DEFAVORABLE: { color: '#791F1F', bg: '#FCEBEB' },
};

export default function ProAutoPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [plate, setPlate] = useState('');
  const [plateLoading, setPlateLoading] = useState(false);
  const [plateResult, setPlateResult] = useState<null | { make: string; model: string; version: string; year: number; fuel: string; km: number; color: string; argus_min: number; argus_max: number; argus_suggested: number; ct_status: string; ct_date: string }>(null);
  const [importText, setImportText] = useState('AB-123-CD\nEF-456-GH\nIJ-789-KL');
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [importResults, setImportResults] = useState<{ plate: string; status: string; make: string; price: string }[]>([]);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [filterStatus, setFilterStatus] = useState('all');

  const lookupPlate = async () => {
    if (plate.length < 5) return;
    setPlateLoading(true);
    setPlateResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setPlateResult({
      make: 'Renault', model: 'Clio V', version: '1.0 TCe 90 Intens', year: 2022,
      fuel: 'Essence', km: 28000, color: 'Gris Platine',
      argus_min: 1080000, argus_max: 1260000, argus_suggested: 1150000,
      ct_status: 'FAVORABLE', ct_date: '03/2026',
    });
    setPlateLoading(false);
  };

  const runImport = async () => {
    const plates = importText.split('\n').map(p => p.trim()).filter(Boolean);
    if (plates.length === 0) return;
    setImporting(true);
    await new Promise(r => setTimeout(r, 2500));
    setImportResults(plates.map((p, i) => ({
      plate: p,
      status: i === 2 ? 'error' : 'success',
      make: i === 0 ? 'Renault Clio V' : i === 1 ? 'Peugeot 3008 GT' : 'Introuvable',
      price: i === 0 ? '11 500 €' : i === 1 ? '22 800 €' : '—',
    })));
    setImporting(false);
    setImportDone(true);
  };

  const filteredVehicles = filterStatus === 'all' ? vehicles : vehicles.filter(v => v.status === filterStatus);

  const navItems: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
    { id: 'catalogue', icon: '🚗', label: 'Catalogue' },
    { id: 'argus', icon: '💰', label: 'Argus Pro' },
    { id: 'import', icon: '📦', label: 'Import batch' },
    { id: 'stats', icon: '📈', label: 'Statistiques' },
  ];

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      <nav style={{ background: '#1B3A6B', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '18px', color: '#fff', textDecoration: 'none' }}>
            France<span style={{ color: '#E8460A' }}>Occas</span>.fr
          </Link>
          <span style={{ color: '#4A6A9B', fontSize: '13px' }}>/</span>
          <span style={{ color: '#B5D4F4', fontSize: '13px', fontWeight: 600 }}>Espace Pro Automobile</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', background: '#E8EEF8', color: '#1B3A6B', padding: '3px 10px', borderRadius: '4px', fontWeight: 600 }}>🏢 Transak Auto Nîmes</span>
          <Link href="/compte" style={{ border: '1px solid #2D5FAA', color: '#B5D4F4', padding: '5px 12px', borderRadius: '7px', textDecoration: 'none', fontSize: '12px' }}>Mon compte</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Sidebar */}
        <aside style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '76px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2DDD6', background: '#1B3A6B' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Jean-Paul Martin</div>
            <div style={{ fontSize: '10px', color: '#B5D4F4' }}>Transak Auto Nîmes · Pro vérifié</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '11px' }}>
              <span style={{ background: '#fff2', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>⭐ 4.9</span>
              <span style={{ background: '#fff2', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>✓ Vérifié</span>
            </div>
          </div>
          {navItems.map((item, i) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderBottom: i < navItems.length - 1 ? '1px solid #E2DDD6' : 'none', background: tab === item.id ? '#FFF0EB' : '#fff', color: tab === item.id ? '#E8460A' : '#1A1A18', fontSize: '13px', cursor: 'pointer', textAlign: 'left', fontWeight: tab === item.id ? 600 : 400 }}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #E2DDD6' }}>
            <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Quota Argus</div>
            <div style={{ height: '5px', background: '#F7F5F0', borderRadius: '3px', overflow: 'hidden', marginBottom: '3px', border: '1px solid #E2DDD6' }}>
              <div style={{ height: '100%', width: '48%', background: '#1B3A6B', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '10px', color: '#6B6B66' }}>480 / 1000 ce mois</div>
          </div>
        </aside>

        {/* Main */}
        <main>

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18' }}>Tableau de bord Pro</h2>
                <button onClick={() => setTab('argus')} style={{ background: '#1B3A6B', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  🚗 Saisir une plaque
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Véhicules en stock', value: vehicles.filter(v => v.status === 'active').length, color: '#1B3A6B', icon: '🚗' },
                  { label: 'Vues ce mois', value: vehicles.reduce((s, v) => s + v.views, 0), color: '#378ADD', icon: '👁' },
                  { label: 'Contacts reçus', value: vehicles.reduce((s, v) => s + v.messages, 0), color: '#E8460A', icon: '💬' },
                  { label: 'Valeur catalogue', value: `${(vehicles.reduce((s, v) => s + v.price, 0) / 100).toLocaleString('fr')} €`, color: '#1D9E75', icon: '💰' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{kpi.icon}</div>
                    <div style={{ fontSize: '9px', color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{kpi.label}</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Top performers */}
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid #E2DDD6', fontWeight: 700, fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🏆 Véhicules les plus vus</span>
                  <button onClick={() => setTab('catalogue')} style={{ background: 'none', border: 'none', color: '#E8460A', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Voir tout →</button>
                </div>
                {vehicles.filter(v => v.status === 'active').sort((a, b) => b.views - a.views).slice(0, 3).map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < 2 ? '1px solid #E2DDD6' : 'none' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#F5C518' : i === 1 ? '#C0C0C0' : '#CD7F32', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: '#fff', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: '20px' }}>🚗</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1A1A18' }}>{v.make} {v.model} {v.version}</div>
                      <div style={{ fontSize: '11px', color: '#6B6B66' }}>{v.km.toLocaleString('fr')} km · {v.year} · {v.plate}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#1B3A6B' }}>{(v.price / 100).toLocaleString('fr')} €</div>
                      <div style={{ fontSize: '11px', color: '#6B6B66' }}>👁 {v.views} vues · 💬 {v.messages}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CT alerts */}
              {vehicles.some(v => v.ct_status === 'DEFAVORABLE') && (
                <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#791F1F', marginBottom: '6px' }}>⚠️ Véhicules avec CT défavorable</div>
                  {vehicles.filter(v => v.ct_status === 'DEFAVORABLE').map(v => (
                    <div key={v.id} style={{ fontSize: '12px', color: '#791F1F' }}>
                      {v.plate} · {v.make} {v.model} — CT défavorable depuis {v.ct_date}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CATALOGUE ── */}
          {tab === 'catalogue' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18' }}>Catalogue véhicules ({vehicles.length})</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setTab('import')} style={{ background: '#fff', color: '#1A1A18', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
                    📦 Import batch
                  </button>
                  <button onClick={() => setTab('argus')} style={{ background: '#1B3A6B', color: '#fff', border: 'none', borderRadius: '9px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    + Ajouter par plaque
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {['all', 'active', 'pending', 'paused'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                      background: filterStatus === s ? '#1B3A6B' : '#fff',
                      color: filterStatus === s ? '#fff' : '#6B6B66',
                      borderColor: filterStatus === s ? '#1B3A6B' : '#E2DDD6' }}>
                    {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label}
                    {s === 'all' ? ` (${vehicles.length})` : ` (${vehicles.filter(v => v.status === s).length})`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredVehicles.map(v => {
                  const priceOk = v.price >= v.argus_min && v.price <= v.argus_max;
                  const priceLow = v.price < v.argus_min * 0.85;
                  return (
                    <div key={v.id} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#E8EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                        🚗
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1A1A18' }}>{v.make} {v.model} {v.version}</div>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: STATUS_CONFIG[v.status]?.bg, color: STATUS_CONFIG[v.status]?.color }}>
                            {STATUS_CONFIG[v.status]?.label}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: CT_CONFIG[v.ct_status]?.bg, color: CT_CONFIG[v.ct_status]?.color }}>
                            CT {v.ct_status === 'FAVORABLE' ? '✓' : '✗'} {v.ct_date}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B6B66', marginBottom: '5px' }}>
                          🔑 {v.plate} · {v.year} · {v.fuel} · {v.km.toLocaleString('fr')} km · {v.color}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6B6B66' }}>
                          <span>👁 {v.views} vues</span>
                          <span>💬 {v.messages} messages</span>
                          {v.status === 'active' && <span>📅 Publié depuis {v.days}j</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '18px', color: '#1A1A18', marginBottom: '3px' }}>
                          {(v.price / 100).toLocaleString('fr')} €
                        </div>
                        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                          {priceOk && <span style={{ color: '#1D9E75', fontWeight: 600 }}>✅ Prix juste Argus</span>}
                          {priceLow && <span style={{ color: '#E24B4A', fontWeight: 600 }}>⚠️ Sous la cote</span>}
                          {!priceOk && !priceLow && <span style={{ color: '#BA7517', fontWeight: 600 }}>↑ Au-dessus de la cote</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6B6B66' }}>
                          Cote: {(v.argus_min / 100).toLocaleString('fr')} – {(v.argus_max / 100).toLocaleString('fr')} €
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                        <button style={{ background: '#E8EEF8', color: '#1B3A6B', border: '1px solid #B5D4F4', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          ✏️ Modifier
                        </button>
                        <button style={{ background: '#E1F5EE', color: '#085041', border: '1px solid #9FE1CB', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                          🔄 Argus
                        </button>
                        {v.status === 'active' && (
                          <button style={{ background: '#FFF0EB', color: '#E8460A', border: '1px solid #F5C4B3', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            ⚡ Booster
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ARGUS PRO ── */}
          {tab === 'argus' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Argus Pro — Cote véhicule</h2>
              <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '20px' }}>Interrogez la base Argus Pro via la plaque d'immatriculation pour obtenir la cote officielle en temps réel.</p>

              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A18', marginBottom: '12px' }}>🔍 Saisie par plaque SIV</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ background: '#F5C518', borderRadius: '10px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1B3A6B' }}>🇫🇷</span>
                    <input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="AB-123-CD" maxLength={9}
                      style={{ background: 'none', border: 'none', outline: 'none', fontWeight: 800, fontSize: '20px', color: '#000', letterSpacing: '3px', width: '140px', textAlign: 'center' }} />
                  </div>
                  <button onClick={lookupPlate} disabled={plateLoading || plate.length < 5}
                    style={{ background: plate.length >= 5 && !plateLoading ? '#1B3A6B' : '#E2DDD6', color: '#fff', border: 'none', borderRadius: '10px', padding: '13px 24px', fontSize: '14px', fontWeight: 600, cursor: plate.length >= 5 ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
                    {plateLoading ? '⏳ Interrogation Argus…' : 'Obtenir la cote →'}
                  </button>
                </div>

                {plateResult && (
                  <div style={{ borderTop: '1px solid #E2DDD6', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', background: '#E8EEF8', color: '#1B3A6B', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>✓ Argus Pro · Données SIV</span>
                      <span style={{ fontSize: '10px', background: CT_CONFIG[plateResult.ct_status]?.bg, color: CT_CONFIG[plateResult.ct_status]?.color, padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                        CT {plateResult.ct_status === 'FAVORABLE' ? '✓ Favorable' : '✗ Défavorable'} · {plateResult.ct_date}
                      </span>
                      <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>Confiance : HIGH</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Informations véhicule</div>
                        {[
                          ['Marque', plateResult.make],
                          ['Modèle', plateResult.model],
                          ['Version', plateResult.version],
                          ['Année', plateResult.year],
                          ['Carburant', plateResult.fuel],
                          ['Km CT', `${plateResult.km.toLocaleString('fr')} km`],
                          ['Couleur', plateResult.color],
                        ].map(([k, v]) => (
                          <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#F7F5F0', borderRadius: '6px', marginBottom: '4px', fontSize: '12px' }}>
                            <span style={{ color: '#6B6B66' }}>{k}</span>
                            <span style={{ fontWeight: 600, color: '#1A1A18' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Cotation Argus Pro</div>
                        <div style={{ background: '#E8EEF8', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: '#4A6A9B', marginBottom: '3px' }}>Fourchette retail</div>
                          <div style={{ fontWeight: 800, fontSize: '22px', color: '#1B3A6B' }}>
                            {(plateResult.argus_min / 100).toLocaleString('fr')} – {(plateResult.argus_max / 100).toLocaleString('fr')} €
                          </div>
                        </div>
                        <div style={{ background: '#E1F5EE', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: '#085041', marginBottom: '3px' }}>Prix conseillé FranceOccas</div>
                          <div style={{ fontWeight: 800, fontSize: '26px', color: '#1D9E75' }}>
                            {(plateResult.argus_suggested / 100).toLocaleString('fr')} €
                          </div>
                        </div>
                        <div style={{ background: '#F7F5F0', borderRadius: '10px', padding: '14px' }}>
                          <div style={{ fontSize: '10px', color: '#6B6B66', marginBottom: '3px' }}>Prix reprise (trade-in)</div>
                          <div style={{ fontWeight: 800, fontSize: '18px', color: '#6B6B66' }}>
                            {((plateResult.argus_min * 0.85) / 100).toLocaleString('fr')} – {((plateResult.argus_min * 0.95) / 100).toLocaleString('fr')} €
                          </div>
                        </div>
                        <button style={{ width: '100%', marginTop: '10px', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          📋 Créer l'annonce avec ces données →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Historique */}
              <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid #E2DDD6', fontWeight: 700, fontSize: '13px' }}>📋 Historique des consultations</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F7F5F0' }}>
                      {['Plaque', 'Véhicule', 'Cote conseillée', 'Confiance', 'Date', 'Coût'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #E2DDD6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ARGUS_HISTORY.map((h, i) => (
                      <tr key={h.plate} style={{ borderBottom: i < MOCK_ARGUS_HISTORY.length - 1 ? '1px solid #E2DDD6' : 'none' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: '#F5C518', borderRadius: '5px', padding: '2px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>{h.plate}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 500, color: '#1A1A18' }}>{h.make}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, color: '#1B3A6B' }}>{h.result}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: h.confidence === 'HIGH' ? '#E1F5EE' : '#FAEEDA', color: h.confidence === 'HIGH' ? '#085041' : '#633806' }}>
                            {h.confidence}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B6B66' }}>{h.timestamp}</td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B6B66' }}>1 requête</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── IMPORT BATCH ── */}
          {tab === 'import' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18', marginBottom: '6px' }}>Import catalogue en batch</h2>
              <p style={{ fontSize: '13px', color: '#6B6B66', marginBottom: '20px' }}>Importez jusqu'à 500 véhicules en une seule opération. L'API Argus Pro récupère automatiquement les données et les cotes pour chaque plaque.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A18', marginBottom: '12px' }}>📝 Saisie des plaques</div>
                  <div style={{ fontSize: '12px', color: '#6B6B66', marginBottom: '8px' }}>Une plaque par ligne. Format : AB-123-CD ou AB123CD</div>
                  <textarea value={importText} onChange={e => setImportText(e.target.value)}
                    rows={10}
                    placeholder={'AB-123-CD\nEF-456-GH\nIJ-789-KL\n...'}
                    style={{ width: '100%', border: '1px solid #E2DDD6', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: 1.8 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#6B6B66' }}>{importText.split('\n').filter(Boolean).length} plaque{importText.split('\n').filter(Boolean).length > 1 ? 's' : ''} détectée{importText.split('\n').filter(Boolean).length > 1 ? 's' : ''}</span>
                    <button onClick={() => { setImportText(''); setImportDone(false); setImportResults([]); }}
                      style={{ background: 'none', border: 'none', color: '#6B6B66', fontSize: '11px', cursor: 'pointer' }}>Vider</button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#E8EEF8', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1B3A6B', marginBottom: '8px' }}>📊 Ce qui sera importé</div>
                    {['Données SIV (marque, modèle, version, année)', 'Kilométrage du dernier CT', 'Cote Argus (retail, reprise, conseillé)', 'Statut du contrôle technique', 'Génération automatique titre + description IA'].map(item => (
                      <div key={item} style={{ fontSize: '12px', color: '#1B3A6B', marginBottom: '4px' }}>✓ {item}</div>
                    ))}
                  </div>

                  <div style={{ background: '#FAEEDA', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#633806', marginBottom: '6px' }}>⚡ Coût en requêtes Argus</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#BA7517', marginBottom: '2px' }}>
                      {importText.split('\n').filter(Boolean).length} requêtes
                    </div>
                    <div style={{ fontSize: '11px', color: '#854F0B' }}>
                      Il vous reste 520 requêtes ce mois (quota 1000/mois)
                    </div>
                  </div>

                  <button onClick={runImport} disabled={importing || importText.split('\n').filter(Boolean).length === 0}
                    style={{ background: importing ? '#AEABA3' : '#1B3A6B', color: '#fff', border: 'none', borderRadius: '11px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                    {importing ? '⏳ Import en cours…' : `🚀 Importer ${importText.split('\n').filter(Boolean).length} véhicule${importText.split('\n').filter(Boolean).length > 1 ? 's' : ''}`}
                  </button>

                  <div style={{ fontSize: '11px', color: '#6B6B66', textAlign: 'center' }}>
                    Les annonces seront créées en statut "En attente de validation"
                  </div>
                </div>
              </div>

              {importDone && importResults.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '13px 16px', borderBottom: '1px solid #E2DDD6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>Résultats de l'import</span>
                    <span style={{ fontSize: '10px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                      {importResults.filter(r => r.status === 'success').length} succès
                    </span>
                    {importResults.some(r => r.status === 'error') && (
                      <span style={{ fontSize: '10px', background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        {importResults.filter(r => r.status === 'error').length} erreur{importResults.filter(r => r.status === 'error').length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {importResults.map((r, i) => (
                    <div key={r.plate} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < importResults.length - 1 ? '1px solid #E2DDD6' : 'none', background: r.status === 'error' ? '#FDFAFA' : '#fff' }}>
                      <span style={{ fontSize: '16px' }}>{r.status === 'success' ? '✅' : '❌'}</span>
                      <span style={{ background: '#F5C518', borderRadius: '5px', padding: '2px 8px', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>{r.plate}</span>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: r.status === 'error' ? '#E24B4A' : '#1A1A18' }}>{r.make}</span>
                      {r.status === 'success' && <span style={{ fontWeight: 800, fontSize: '14px', color: '#1B3A6B' }}>{r.price}</span>}
                      {r.status === 'success' && <button style={{ background: '#E8EEF8', color: '#1B3A6B', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Voir l'annonce →</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {tab === 'stats' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A18', marginBottom: '16px' }}>Statistiques</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>📊 Performance ce mois</div>
                  {[
                    { label: 'Taux de complétion profils', pct: 87, color: '#1D9E75' },
                    { label: 'Annonces avec photos qualité', pct: 92, color: '#1D9E75' },
                    { label: 'Taux de réponse moyen', pct: 78, color: '#BA7517' },
                    { label: 'Note moyenne réseau', pct: 96, color: '#1D9E75' },
                  ].map(s => (
                    <div key={s.label} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                        <span style={{ color: '#1A1A18' }}>{s.label}</span>
                        <span style={{ fontWeight: 700, color: s.color }}>{s.pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#F7F5F0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #E2DDD6' }}>
                        <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '14px' }}>💰 Revenus & transactions</div>
                  {[
                    { label: 'CA total ce mois', value: '84 200 €', color: '#1D9E75' },
                    { label: 'Panier moyen', value: '16 840 €', color: '#1B3A6B' },
                    { label: 'Nombre de ventes', value: '5', color: '#1A1A18' },
                    { label: 'En séquestre', value: '11 900 €', color: '#BA7517' },
                    { label: 'Commission FO payée', value: '2 526 €', color: '#E8460A' },
                    { label: 'Net encaissé', value: '81 674 €', color: '#1D9E75' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F7F5F0', fontSize: '13px' }}>
                      <span style={{ color: '#6B6B66' }}>{s.label}</span>
                      <span style={{ fontWeight: 800, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#1B3A6B', borderRadius: '14px', padding: '18px', gridColumn: '1 / -1' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '14px' }}>🏆 Badge & certification</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {[
                      { icon: '🏢', label: 'Transak Auto', desc: 'Réseau certifié', ok: true },
                      { icon: '✅', label: 'Pro vérifié', desc: 'SIRET + KYB validés', ok: true },
                      { icon: '⭐', label: 'Top vendeur', desc: 'Note 4.9/5', ok: true },
                      { icon: '📊', label: 'Argus Pro', desc: 'Cotes en temps réel', ok: true },
                    ].map(b => (
                      <div key={b.label} style={{ background: '#fff2', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{b.icon}</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{b.label}</div>
                        <div style={{ fontSize: '10px', color: '#B5D4F4' }}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
