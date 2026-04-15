'use client';
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'outillage', name: 'Outillage', icon: '🔧', count: '12 840' },
  { slug: 'automobile', name: 'Automobile', icon: '🚗', count: '8 420' },
  { slug: 'jardinage', name: 'Jardinage', icon: '🌿', count: '4 210' },
  { slug: 'electromenager', name: 'Électroménager', icon: '❄️', count: '6 180' },
  { slug: 'btp-chantier', name: 'BTP & Chantier', icon: '🏗️', count: '2 940' },
  { slug: 'moto-scooter', name: 'Moto & Scooter', icon: '🏍️', count: '3 620' },
  { slug: 'velo', name: 'Vélo', icon: '🚲', count: '5 480' },
  { slug: 'informatique', name: 'Informatique', icon: '💻', count: '9 320' },
];

const LISTINGS = [
  { id: '1', title: 'Perceuse Bosch GBH 18V Pro', price: 18900, city: 'Nîmes', condition: 'Très bon état', category: '🔧', days: 2 },
  { id: '2', title: 'Renault Clio V 1.0 TCe 90 — 2022', price: 1190000, city: 'Lyon', condition: 'Très bon état', category: '🚗', days: 3 },
  { id: '3', title: 'MacBook Pro 14" M3 16Go', price: 189900, city: 'Paris', condition: 'Comme neuf', category: '💻', days: 1 },
  { id: '4', title: 'Tondeuse Honda HF 2315 HM', price: 120000, city: 'Bordeaux', condition: 'Bon état', category: '🌿', days: 5 },
  { id: '5', title: 'Vélo électrique Decathlon E-ST 900', price: 89900, city: 'Toulouse', condition: 'Comme neuf', category: '🚲', days: 1 },
  { id: '6', title: 'Groupe électrogène Honda EU 5500', price: 78000, city: 'Marseille', condition: 'Très bon état', category: '🔧', days: 4 },
  { id: '7', title: 'Yamaha MT-07 — 18 000 km — 2020', price: 690000, city: 'Rennes', condition: 'Bon état', category: '🏍️', days: 2 },
  { id: '8', title: 'Samsung TV QLED 65" 4K 2023', price: 55000, city: 'Lille', condition: 'Comme neuf', category: '💻', days: 6 },
  { id: '9', title: 'Lave-linge Miele WDB020 7kg', price: 42000, city: 'Strasbourg', condition: 'Très bon état', category: '❄️', days: 3 },
  { id: '10', title: 'Meuleuse Makita GA9020 2200W', price: 8900, city: 'Nantes', condition: 'Bon état', category: '🔧', days: 7 },
];

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', background: '#fff', minHeight: '100vh', color: '#0A0A0A' }}>

      {/* NAV */}
      <nav style={{ height: '60px', borderBottom: '1px solid #EBEBEB', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#0A0A0A' }}>
            France<span style={{ color: '#FF4D00' }}>Occas</span>
          </Link>
          <div style={{ flex: 1, maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F5F5F5', borderRadius: '10px', padding: '0 14px', height: '38px', gap: '8px' }}>
              <span style={{ color: '#737373', fontSize: '14px' }}>🔍</span>
              <input type="text" placeholder="Rechercher une annonce…"
                style={{ border: 'none', outline: 'none', background: 'none', fontSize: '14px', flex: 1, color: '#0A0A0A' }} />
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/annonces" style={{ fontSize: '14px', color: '#737373', padding: '7px 12px', borderRadius: '8px' }}>
              Annonces
            </Link>
            <Link href="/auth/connexion" style={{ fontSize: '14px', color: '#737373', padding: '7px 12px', borderRadius: '8px' }}>
              Connexion
            </Link>
            <Link href="/vendre" style={{ fontSize: '14px', fontWeight: 600, background: '#FF4D00', color: 'white', padding: '8px 16px', borderRadius: '10px' }}>
              + Déposer
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 24px 64px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF4F0', borderRadius: '20px', padding: '5px 12px', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF4D00', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF4D00' }}>48 200 annonces · Gratuit</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '20px', color: '#0A0A0A' }}>
            Vendez ce qui vaut<br />
            de l'<span style={{ color: '#FF4D00' }}>argent.</span>
          </h1>
          <p style={{ fontSize: '17px', color: '#737373', lineHeight: 1.65, marginBottom: '36px', maxWidth: '520px' }}>
            La marketplace des objets qui méritent mieux qu'un racheteur. Outillage, auto, électroménager — annonces gratuites, paiement sécurisé.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link href="/vendre" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF4D00', color: 'white', fontSize: '15px', fontWeight: 600, padding: '13px 24px', borderRadius: '12px' }}>
              Déposer une annonce gratuitement →
            </Link>
            <Link href="/annonces" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F5F5F5', color: '#0A0A0A', fontSize: '15px', fontWeight: 500, padding: '13px 24px', borderRadius: '12px' }}>
              Explorer les annonces
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '32px', flexWrap: 'wrap' }}>
            {[
              { icon: '🆓', label: 'Annonces gratuites' },
              { icon: '🔒', label: 'Paiement sécurisé' },
              { icon: '✨', label: 'Fiche IA en 30s' },
              { icon: '🚚', label: 'Livraison assurée' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#737373' }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '0 24px 64px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>Catégories</h2>
          <Link href="/annonces" style={{ fontSize: '13px', color: '#FF4D00', fontWeight: 500 }}>Voir tout →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/annonces?category=${cat.slug}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 8px', background: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #EBEBEB', transition: 'all 0.15s', textAlign: 'center' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#FF4D00'; (e.currentTarget as HTMLAnchorElement).style.background = '#FFF4F0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#EBEBEB'; (e.currentTarget as HTMLAnchorElement).style.background = '#FAFAFA'; }}>
              <span style={{ fontSize: '24px' }}>{cat.icon}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{cat.name}</span>
              <span style={{ fontSize: '10px', color: '#737373' }}>{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* LISTINGS */}
      <section style={{ padding: '0 24px 64px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>Annonces récentes</h2>
          <Link href="/annonces" style={{ fontSize: '13px', color: '#FF4D00', fontWeight: 500 }}>Voir tout →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {LISTINGS.map(listing => (
            <Link key={listing.id} href={`/annonces/${listing.id}`}
              style={{ display: 'block', background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#D4D4D4'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#EBEBEB'; (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}>
              <div style={{ aspectRatio: '4/3', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                {listing.category}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#737373', marginBottom: '4px' }}>{listing.condition}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0A', marginBottom: '8px', lineHeight: 1.3,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                  {listing.title}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
                  {(listing.price / 100).toLocaleString('fr-FR')} €
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#737373' }}>📍 {listing.city}</span>
                  <span style={{ fontSize: '10px', color: '#737373' }}>il y a {listing.days}j</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI SECTION */}
      <section style={{ margin: '0 24px 64px', maxWidth: '1112px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ background: '#0A0A0A', borderRadius: '24px', padding: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF4D0018', borderRadius: '20px', padding: '5px 12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF4D00' }}>✨ Intelligence Artificielle</span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px', color: 'white', lineHeight: 1.15, marginBottom: '14px' }}>
              Votre annonce rédigée<br />en 30 secondes.
            </h2>
            <p style={{ fontSize: '14px', color: '#737373', lineHeight: 1.7, marginBottom: '24px' }}>
              Prenez quelques photos. Notre IA reconnaît le produit, rédige la description et propose le bon prix.
            </p>
            <Link href="/vendre" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF4D00', color: 'white', fontSize: '14px', fontWeight: 600, padding: '11px 20px', borderRadius: '10px' }}>
              Essayer gratuitement →
            </Link>
          </div>
          <div style={{ background: '#161616', borderRadius: '16px', padding: '20px', border: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FF4D00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✨</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#737373' }}>Généré par FranceOccas IA</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              Perceuse-visseuse Makita DDF484 18V
            </div>
            <div style={{ fontSize: '12px', color: '#737373', lineHeight: 1.7, marginBottom: '14px' }}>
              Sans fil, excellent état. 2 batteries BL1830B + chargeur DC18RC + mallette. Couple 80 Nm, mandrin 13mm auto-serrant. Peu utilisée, comme neuve.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ background: '#1F1F1F', borderRadius: '8px', padding: '8px 12px' }}>
                <div style={{ fontSize: '10px', color: '#737373', marginBottom: '2px' }}>Prix conseillé</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>189 €</div>
              </div>
              <div style={{ background: '#1F1F1F', borderRadius: '8px', padding: '8px 12px' }}>
                <div style={{ fontSize: '10px', color: '#737373', marginBottom: '2px' }}>État détecté</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#00A86B' }}>Très bon état</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1160px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '40px', textAlign: 'center' }}>
          Simple comme bonjour
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { step: '01', icon: '📷', title: 'Photo', desc: 'Prenez quelques photos de votre objet' },
            { step: '02', icon: '✨', title: 'IA', desc: 'L\'IA génère votre fiche complète avec le bon prix' },
            { step: '03', icon: '💬', title: 'Échange', desc: 'Recevez des offres et négociez directement' },
            { step: '04', icon: '💳', title: 'Paiement', desc: 'Encaissez de façon sécurisée sur votre wallet' },
          ].map(item => (
            <div key={item.step}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF4D00', letterSpacing: '1px', marginBottom: '12px' }}>{item.step}</div>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: '#737373', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #EBEBEB', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            France<span style={{ color: '#FF4D00' }}>Occas</span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#737373' }}>
            <Link href="/annonces">Annonces</Link>
            <Link href="/vendre">Vendre</Link>
            <Link href="/pro-auto">Pro Auto</Link>
            <Link href="/admin">Admin</Link>
          </div>
          <div style={{ fontSize: '12px', color: '#737373' }}>
            © 2026 FranceOccas · Fait en France 🇫🇷
          </div>
        </div>
      </footer>
    </div>
  );
}
