'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'all', name: 'Toutes', icon: '🔍' },
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
  { value: '', label: 'Tous états' },
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
];

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf', like_new: 'Comme neuf', very_good: 'Très bon état',
  good: 'Bon état', fair: 'État correct', for_parts: 'Pour pièces',
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'recent', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  city: string;
  department: string;
  photos: string[];
  boost_level: number;
  category_name: string;
  seller_name: string;
  seller_rating: number;
  created_at: string;
}

// Mock listings pour la démo
const MOCK_LISTINGS: Listing[] = [
  { id: '1', title: 'Perceuse Bosch Professional GBH 18V — Kit complet', price: 18900, condition: 'very_good', city: 'Nîmes', department: '30', photos: [], boost_level: 1, category_name: 'Outillage', seller_name: 'Jean-Michel V.', seller_rating: 4.9, created_at: new Date().toISOString() },
  { id: '2', title: 'Tondeuse autoportée Honda HF 2315 HM', price: 120000, condition: 'very_good', city: 'Montpellier', department: '34', photos: [], boost_level: 0, category_name: 'Jardinage', seller_name: 'Sophie A.', seller_rating: 4.7, created_at: new Date().toISOString() },
  { id: '3', title: 'Réfrigérateur Samsung RS68A 350L Side by Side', price: 32000, condition: 'good', city: 'Lyon', department: '69', photos: [], boost_level: 0, category_name: 'Électroménager', seller_name: 'Pierre D.', seller_rating: 4.5, created_at: new Date().toISOString() },
  { id: '4', title: 'Groupe électrogène Honda EU 5500 — 5,5 kVA', price: 78000, condition: 'very_good', city: 'Bordeaux', department: '33', photos: [], boost_level: 1, category_name: 'Outillage', seller_name: 'Marc K.', seller_rating: 4.8, created_at: new Date().toISOString() },
  { id: '5', title: 'Vélo électrique Decathlon E-ST 900 — Taille M', price: 89900, condition: 'like_new', city: 'Toulouse', department: '31', photos: [], boost_level: 1, category_name: 'Vélo', seller_name: 'Claire B.', seller_rating: 5.0, created_at: new Date().toISOString() },
  { id: '6', title: 'Renault Clio V 1.0 TCe 90 — 28 000 km — 2022', price: 1190000, condition: 'very_good', city: 'Paris', department: '75', photos: [], boost_level: 0, category_name: 'Automobile', seller_name: 'Romain T.', seller_rating: 4.6, created_at: new Date().toISOString() },
  { id: '7', title: 'Banc de musculation BH — Kit complet poids inclus', price: 45000, condition: 'good', city: 'Marseille', department: '13', photos: [], boost_level: 0, category_name: 'Sport & Loisirs', seller_name: 'Ahmed B.', seller_rating: 4.3, created_at: new Date().toISOString() },
  { id: '8', title: 'MacBook Pro 14" M3 — 16 Go RAM — 512 Go SSD', price: 189900, condition: 'like_new', city: 'Strasbourg', department: '67', photos: [], boost_level: 0, category_name: 'Informatique', seller_name: 'Laura M.', seller_rating: 4.9, created_at: new Date().toISOString() },
  { id: '9', title: 'Meuleuse d\'angle Makita GA9020 — 2200W', price: 8900, condition: 'very_good', city: 'Nantes', department: '44', photos: [], boost_level: 0, category_name: 'Outillage', seller_name: 'François L.', seller_rating: 4.4, created_at: new Date().toISOString() },
  { id: '10', title: 'Yamaha MT-07 — 18 000 km — 2020', price: 690000, condition: 'good', city: 'Rennes', department: '35', photos: [], boost_level: 1, category_name: 'Moto & Scooter', seller_name: 'Thomas P.', seller_rating: 4.7, created_at: new Date().toISOString() },
  { id: '11', title: 'Lave-linge Miele WDB020 — 7kg — Classe A+++', price: 55000, condition: 'very_good', city: 'Lille', department: '59', photos: [], boost_level: 0, category_name: 'Électroménager', seller_name: 'Isabelle R.', seller_rating: 4.8, created_at: new Date().toISOString() },
  { id: '12', title: 'Tracteur tondeuse Husqvarna TS 354D — 4WD', price: 380000, condition: 'good', city: 'Clermont-Fd', department: '63', photos: [], boost_level: 0, category_name: 'Agriculture', seller_name: 'Bernard C.', seller_rating: 4.6, created_at: new Date().toISOString() },
];

const ICONS: Record<string, string> = {
  'Outillage': '🔧', 'Automobile': '🚗', 'Jardinage': '🌿',
  'Électroménager': '❄️', 'BTP & Chantier': '🏗️', 'Moto & Scooter': '🏍️',
  'Vélo': '🚲', 'Sport & Loisirs': '🏋️', 'Informatique': '💻',
  'Maison & Déco': '🏡', 'Agriculture': '🌾', 'Divers': '📦',
};

export default function AnnoncesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('relevance');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);

  useEffect(() => {
    let filtered = [...MOCK_LISTINGS];
    if (search) filtered = filtered.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'all') filtered = filtered.filter(l => l.category_name.toLowerCase().includes(category));
    if (condition) filtered = filtered.filter(l => l.condition === condition);
    if (minPrice) filtered = filtered.filter(l => l.price >= parseInt(minPrice) * 100);
    if (maxPrice) filtered = filtered.filter(l => l.price <= parseInt(maxPrice) * 100);
    if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'recent') filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setListings(filtered);
  }, [search, category, condition, minPrice, maxPrice, sort]);

  const toggleFav = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: '20px', color: '#fff', textDecoration: 'none' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </Link>
        <div style={{ flex: 1, maxWidth: '480px', margin: '0 20px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une annonce…"
            style={{ width: '100%', background: '#2A2A28', border: '1px solid #3A3A38', borderRadius: '8px', padding: '8px 14px', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/auth/connexion" style={{ border: '1px solid #3A3A38', color: '#C8C6C0', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>Connexion</Link>
          <Link href="/vendre" style={{ background: '#E8460A', color: '#fff', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>+ Déposer</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* SIDEBAR FILTRES */}
        <aside style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '14px', padding: '18px', position: 'sticky', top: '76px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#1A1A18' }}>Filtres</h3>

          {/* Catégories */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Catégorie</div>
            {CATEGORIES.map(cat => (
              <button key={cat.slug} onClick={() => setCategory(cat.slug)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', borderRadius: '8px', border: 'none', background: category === cat.slug ? '#FFF0EB' : 'none', color: category === cat.slug ? '#E8460A' : '#6B6B66', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: category === cat.slug ? 600 : 400 }}>
                <span style={{ fontSize: '14px' }}>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* État */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>État</div>
            {CONDITIONS.map(c => (
              <button key={c.value} onClick={() => setCondition(c.value)}
                style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: '8px', border: 'none', background: condition === c.value ? '#FFF0EB' : 'none', color: condition === c.value ? '#E8460A' : '#6B6B66', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: condition === c.value ? 600 : 400 }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Prix */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#6B6B66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Prix (€)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                style={{ width: '50%', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '7px 8px', fontSize: '12px', outline: 'none' }} />
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                style={{ width: '50%', border: '1px solid #E2DDD6', borderRadius: '7px', padding: '7px 8px', fontSize: '12px', outline: 'none' }} />
            </div>
          </div>

          {/* Reset */}
          <button onClick={() => { setCategory('all'); setCondition(''); setMinPrice(''); setMaxPrice(''); setSearch(''); }}
            style={{ width: '100%', border: '1px solid #E2DDD6', background: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', color: '#6B6B66', cursor: 'pointer' }}>
            Réinitialiser les filtres
          </button>
        </aside>

        {/* RÉSULTATS */}
        <main>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6B6B66' }}>
              <strong style={{ color: '#1A1A18' }}>{listings.length}</strong> annonce{listings.length > 1 ? 's' : ''}
              {search && <span> pour &quot;{search}&quot;</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6B6B66' }}>Trier par</span>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ border: '1px solid #E2DDD6', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', outline: 'none', background: '#fff', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Grid annonces */}
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #E2DDD6' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aucune annonce trouvée</h3>
              <p style={{ color: '#6B6B66', fontSize: '14px' }}>Essayez d&apos;élargir vos filtres ou de modifier votre recherche.</p>
              <button onClick={() => { setCategory('all'); setCondition(''); setMinPrice(''); setMaxPrice(''); setSearch(''); }}
                style={{ marginTop: '16px', background: '#E8460A', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                Voir toutes les annonces
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {listings.map(listing => (
                <div key={listing.id} style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.12s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {/* Image */}
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
                    {ICONS[listing.category_name] || '📦'}
                    {listing.boost_level > 0 && (
                      <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#E8460A', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>⚡ Boosté</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleFav(listing.id); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #E2DDD6', background: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {favorites.includes(listing.id) ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Body */}
                  <Link href={`/annonces/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '12px' }}>
                    <div style={{ fontSize: '10px', color: '#6B6B66', marginBottom: '4px' }}>{listing.category_name}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A18', marginBottom: '4px', lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {listing.title}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '9px', background: '#E1F5EE', color: '#085041', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                        {CONDITION_LABELS[listing.condition]}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B6B66', marginBottom: '8px' }}>
                      📍 {listing.city} ({listing.department})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 800, fontSize: '17px', color: '#1A1A18' }}>
                        {(listing.price / 100).toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ fontSize: '10px', color: '#6B6B66' }}>
                        ⭐ {listing.seller_rating}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
