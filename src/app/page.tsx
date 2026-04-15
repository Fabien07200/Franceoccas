import Link from 'next/link';

const CATEGORIES = [
  { slug: 'outillage',      name: 'Outillage',       icon: '🔧' },
  { slug: 'automobile',     name: 'Automobile',      icon: '🚗' },
  { slug: 'jardinage',      name: 'Jardinage',       icon: '🌿' },
  { slug: 'electromenager', name: 'Électroménager',  icon: '❄️' },
  { slug: 'btp-chantier',   name: 'BTP & Chantier',  icon: '🏗️' },
  { slug: 'moto-scooter',   name: 'Moto & Scooter',  icon: '🏍️' },
  { slug: 'velo',           name: 'Vélo',            icon: '🚲' },
  { slug: 'sport-loisirs',  name: 'Sport & Loisirs', icon: '🏋️' },
  { slug: 'informatique',   name: 'Informatique',    icon: '💻' },
  { slug: 'maison-deco',    name: 'Maison & Déco',   icon: '🏡' },
  { slug: 'agriculture',    name: 'Agriculture',     icon: '🌾' },
  { slug: 'divers',         name: 'Divers',          icon: '📦' },
];

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#F7F5F0', minHeight: '100vh' }}>
      <nav style={{ background: '#1A1A18', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: '20px', color: '#fff' }}>
          France<span style={{ color: '#E8460A' }}>Occas</span>.fr
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/auth/connexion" style={{ border: '1px solid #3A3A38', color: '#C8C6C0', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>
            Connexion
          </Link>
          <Link href="/vendre" style={{ background: '#E8460A', color: '#fff', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            + Déposer une annonce
          </Link>
        </div>
      </nav>

      <section style={{ padding: '64px 24px 48px', textAlign: 'center', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#E8460A', marginBottom: '14px' }}>
          Annonces gratuites entre particuliers
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.05, color: '#1A1A18', marginBottom: '16px' }}>
          Vendez ce qui prend <span style={{ color: '#E8460A' }}>de la place</span>,<br />
          au <span style={{ color: '#E8460A' }}>juste prix.</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#6B6B66', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
          Outillage, électroménager, jardinage, auto, moto — tout ce qui vaut de l&apos;argent mérite mieux qu&apos;un racheteur.
        </p>
        <div style={{ background: '#fff', border: '1.5px solid #E2DDD6', borderRadius: '14px', padding: '6px 6px 6px 18px', display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '640px', margin: '0 auto 24px' }}>
          <span>🔍</span>
          <input type="text" placeholder="Perceuse, tondeuse, frigo, vélo électrique…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', background: 'none' }} />
          <Link href="/annonces" style={{ background: '#E8460A', color: '#fff', borderRadius: '10px', padding: '10px 22px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
            Rechercher
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '13px', color: '#6B6B66' }}>
          {['🆓 Annonces gratuites', '🔒 Paiement sécurisé', '🚚 Livraison assurée', '✨ Fiche IA en 30s'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 24px 48px', maxWidth: '1160px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A18' }}>Toutes les catégories</h2>
          <Link href="/annonces" style={{ fontSize: '13px', color: '#E8460A', textDecoration: 'none' }}>Voir tout →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/annonces?category=${cat.slug}`}
              style={{ background: '#fff', border: '1px solid #E2DDD6', borderRadius: '12px', padding: '18px 10px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{cat.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A18' }}>{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: '#1A1A18', padding: '52px 24px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#E8460A', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '4px', marginBottom: '14px' }}>
              ✨ INTELLIGENCE ARTIFICIELLE
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.15 }}>
              Votre annonce rédigée par l&apos;IA en 30 secondes
            </h2>
            <p style={{ fontSize: '14px', color: '#8A8A85', lineHeight: 1.7, marginBottom: '20px' }}>
              Prenez quelques photos, décrivez l&apos;objet. Notre IA reconnaît le produit, génère la description complète et propose un prix basé sur le marché.
            </p>
            <Link href="/vendre" style={{ background: '#E8460A', color: '#fff', padding: '10px 22px', borderRadius: '9px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
              Essayer gratuitement →
            </Link>
          </div>
          <div style={{ background: '#242422', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '10px', color: '#5A5A55', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Exemple généré par IA</div>
            <div style={{ display: 'inline-block', background: '#E8460A', color: '#fff', fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', marginBottom: '10px' }}>✨ IA FranceOccas</div>
            <p style={{ fontSize: '12px', color: '#C8C6C0', lineHeight: 1.75 }}>
              <strong style={{ color: '#E8E6E0' }}>Perceuse-visseuse Makita DDF484 18V</strong><br /><br />
              Perceuse-visseuse sans fil en excellent état. Couple maxi 80 Nm. Livrée avec 2 batteries + chargeur. Idéale bricolage intensif.
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #E2DDD6', padding: '52px 24px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '40px' }}>Comment ça marche ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {[
              { step: '01', icon: '📷', title: 'Publiez gratuitement', desc: 'Photos + quelques mots. L\'IA rédige votre fiche complète avec le bon prix.' },
              { step: '02', icon: '💬', title: 'Recevez des offres', desc: 'Acheteurs vérifiés, messagerie intégrée, négociation directe.' },
              { step: '03', icon: '🚚', title: 'Livraison assurée', desc: 'FranceOccas prend tout en charge ou vous conseille sur l\'emballage.' },
              { step: '04', icon: '💳', title: 'Touchez votre argent', desc: 'Paiement sécurisé sur votre porte-monnaie. Virement SEPA en 24h.' },
            ].map(item => (
              <div key={item.step}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#E8460A', letterSpacing: '1px', marginBottom: '8px' }}>Étape {item.step}</div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#6B6B66', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ background: '#1A1A18', borderTop: '1px solid #252523', padding: '40px 24px 20px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', marginBottom: '8px' }}>
            France<span style={{ color: '#E8460A' }}>Occas</span>.fr
          </div>
          <p style={{ fontSize: '12px', color: '#5A5A55', marginBottom: '20px' }}>La plateforme des particuliers qui vendent au juste prix.</p>
          <div style={{ borderTop: '1px solid #252523', paddingTop: '16px', fontSize: '11px', color: '#3A3A38' }}>
            © 2026 FranceOccas.fr — Tous droits réservés · Fait en France 🇫🇷
          </div>
        </div>
      </footer>
    </div>
  );
}
