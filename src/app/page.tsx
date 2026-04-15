import Link from 'next/link';
import { query } from '@/lib/db';

// ─── Categories config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'outillage',       name: 'Outillage',        icon: '🔧' },
  { slug: 'automobile',      name: 'Automobile',       icon: '🚗' },
  { slug: 'jardinage',       name: 'Jardinage',        icon: '🌿' },
  { slug: 'electromenager',  name: 'Électroménager',   icon: '❄️' },
  { slug: 'btp-chantier',    name: 'BTP & Chantier',   icon: '🏗️' },
  { slug: 'moto-scooter',    name: 'Moto & Scooter',   icon: '🏍️' },
  { slug: 'velo',            name: 'Vélo',             icon: '🚲' },
  { slug: 'sport-loisirs',   name: 'Sport & Loisirs',  icon: '🏋️' },
  { slug: 'informatique',    name: 'Informatique',     icon: '💻' },
  { slug: 'audiovisuel-jeux', name: 'Audiovisuel',     icon: '🎮' },
  { slug: 'maison-deco',     name: 'Maison & Déco',    icon: '🏡' },
  { slug: 'agriculture',     name: 'Agriculture',      icon: '🌾' },
];

// ─── Featured listings ────────────────────────────────────────────────────────
async function getFeaturedListings() {
  try {
    const { rows } = await query(
      `SELECT l.id, l.title, l.price, l.condition, l.city, l.department,
        l.photos, l.boost_level, l.is_vehicle, l.created_at,
        c.name as category_name,
        u.full_name as seller_name, u.rating as seller_rating
       FROM listings l
       LEFT JOIN categories c ON c.id = l.category_id
       JOIN users u ON u.id = l.seller_id
       WHERE l.status = 'active'
       ORDER BY l.boost_level DESC, l.boost_expires_at DESC NULLS LAST, l.published_at DESC
       LIMIT 10`,
      []
    );
    return rows;
  } catch {
    // Return empty array if DB not connected during build
    return [];
  }
}

async function getStats() {
  try {
    const { rows } = await query(
      `SELECT
        (SELECT COUNT(*) FROM listings WHERE status = 'active') as listings_count,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as users_count,
        (SELECT COUNT(*) FROM transactions WHERE status = 'released') as sales_count`,
      []
    );
    return rows[0];
  } catch {
    return { listings_count: '48 200', users_count: '2 481', sales_count: '12 840' };
  }
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function HomePage() {
  const [listings, stats] = await Promise.all([getFeaturedListings(), getStats()]);

  return (
    <div>
      {/* NAV */}
      <nav className="bg-dark border-b border-[#252523] sticky top-0 z-50">
        <div className="max-w-[1160px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-syne font-black text-[18px] text-white">
            France<span className="text-orange">Occas</span>.fr
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {['Toutes les annonces', 'Vendre', 'Pro Auto', 'Livraison'].map(item => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[#8A8A85] hover:text-white text-sm px-3 py-1.5 rounded-md transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/auth/connexion" className="btn-ghost text-xs py-1.5">
              Connexion
            </Link>
            <Link href="/vendre" className="btn-primary text-xs py-1.5">
              + Déposer une annonce
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#F7F5F0] py-14 px-6">
        <div className="max-w-[1160px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-orange mb-3">
              Annonces gratuites entre particuliers
            </div>
            <h1 className="font-syne text-[42px] md:text-[52px] font-black leading-[1.05] text-dark mb-4">
              Vendez ce qui prend <span className="text-orange">de la place</span>,<br />
              au <span className="text-orange">juste prix.</span>
            </h1>
            <p className="text-base text-gray-500 font-light leading-relaxed mb-8">
              Outillage, électroménager, jardinage, auto, moto — tout ce qui vaut de l'argent mérite
              mieux qu'un racheteur.
            </p>

            {/* Search bar */}
            <div className="bg-white border-[1.5px] border-[#E2DDD6] rounded-[14px] p-1.5 flex gap-2 items-center max-w-xl mx-auto mb-4">
              <span className="text-base ml-2">🔍</span>
              <input
                type="text"
                placeholder="Perceuse, tondeuse, frigo, vélo électrique…"
                className="flex-1 border-none outline-none text-[15px] font-['DM_Sans'] bg-transparent text-dark placeholder:text-[#AEABA3]"
              />
              <select className="border-none outline-none text-sm text-gray-400 bg-transparent px-2 cursor-pointer font-['DM_Sans']">
                <option>Toute la France</option>
                <option>Occitanie</option>
                <option>Île-de-France</option>
                <option>Provence-Alpes</option>
                <option>Auvergne-Rhône</option>
              </select>
              <Link href="/annonces" className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap">
                Rechercher
              </Link>
            </div>

            {/* Quick category chips */}
            <div className="flex gap-2 justify-center flex-wrap">
              {['Outillage', 'Auto', 'Jardinage', 'Électroménager', 'Vélo', 'Informatique'].map(cat => (
                <Link
                  key={cat}
                  href={`/annonces?category=${cat.toLowerCase()}`}
                  className="text-xs text-gray-500 bg-white border border-[#E2DDD6] px-3 py-1.5 rounded-full hover:border-orange hover:text-orange transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust bar */}
          <div className="bg-white border border-[#E2DDD6] rounded-xl py-3 px-6 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: '🆓', label: `${Number(stats.listings_count).toLocaleString('fr')} annonces gratuites` },
              { icon: '🔒', label: 'Paiement sécurisé (séquestre)' },
              { icon: '🚚', label: 'Livraison assurée partout' },
              { icon: '✨', label: 'Fiche IA en 30 secondes' },
              { icon: '⭐', label: `${Number(stats.sales_count).toLocaleString('fr')} ventes réussies` },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-base">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-10 px-6 max-w-[1160px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-xl font-bold">Toutes les catégories</h2>
          <Link href="/annonces" className="text-sm text-orange hover:underline">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2.5">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/annonces?category=${cat.slug}`}
              className="bg-white border border-[#E2DDD6] rounded-xl p-3.5 text-center hover:border-orange hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="text-[11px] font-medium text-dark leading-tight">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="pb-10 px-6 max-w-[1160px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-xl font-bold">Annonces du moment 🔥</h2>
          <Link href="/annonces" className="text-sm text-orange hover:underline">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {listings.length > 0 ? listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          )) : (
            // Placeholder cards
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-[#E2DDD6]" />
                <div className="p-3">
                  <div className="h-3 bg-[#E2DDD6] rounded mb-2" />
                  <div className="h-3 bg-[#E2DDD6] rounded w-2/3 mb-3" />
                  <div className="h-5 bg-[#E2DDD6] rounded w-1/2" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* AI BANNER */}
      <section className="bg-dark py-12 px-6">
        <div className="max-w-[1160px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block bg-orange text-white text-[10px] font-semibold px-3 py-1 rounded-[4px] mb-4 tracking-wider">
              ✨ INTELLIGENCE ARTIFICIELLE
            </div>
            <h2 className="font-syne text-[28px] font-black text-white mb-3 leading-tight">
              Votre annonce rédigée par l'<span className="text-orange">IA</span>, en 30 secondes.
            </h2>
            <p className="text-[#8A8A85] text-sm leading-relaxed mb-5">
              Prenez quelques photos, décrivez l'objet en quelques mots. Notre IA reconnaît le produit,
              génère la description complète avec les caractéristiques, et propose un prix basé sur le marché.
            </p>
            <Link href="/vendre" className="btn-primary inline-block">
              Essayer gratuitement →
            </Link>
          </div>
          <div className="bg-[#242422] rounded-xl p-5">
            <div className="text-[9px] font-semibold tracking-wider text-[#5A5A55] uppercase mb-3">
              Exemple généré par IA
            </div>
            <div className="inline-block bg-orange text-white text-[9px] font-semibold px-2 py-1 rounded mb-3">
              ✨ IA FranceOccas
            </div>
            <p className="text-[#D4D2CC] text-[12px] leading-relaxed">
              <strong className="text-[#E8E6E0]">Perceuse-visseuse Makita DDF484 18V</strong>
              <br /><br />
              Perceuse-visseuse sans fil en excellent état, peu utilisée. Couple maxi : 80 Nm,
              vitesses : 2 plages. Livrée avec 2 batteries BL1830B + chargeur DC18RC.
              Mandrin 13mm auto-serrant. Idéale bricolage intensif.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 px-6 bg-white border-t border-b border-[#E2DDD6]">
        <div className="max-w-[1160px] mx-auto">
          <h2 className="font-syne text-2xl font-black text-center mb-10">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: '📷', title: 'Publiez gratuitement', desc: 'Photos + quelques mots. L\'IA rédige votre fiche complète avec le bon prix conseillé.' },
              { step: '02', icon: '💬', title: 'Recevez des offres', desc: 'Acheteurs vérifiés, messagerie intégrée, négociation directe sans no-show.' },
              { step: '03', icon: '🚚', title: 'Livraison ou remise', desc: 'FranceOccas prend tout en charge, ou conseille sur l\'emballage. Vous restez libre.' },
              { step: '04', icon: '💳', title: 'Touchez votre argent', desc: 'Paiement sécurisé sur votre porte-monnaie. Virement SEPA en 24h.' },
            ].map(item => (
              <div key={item.step}>
                <div className="text-[10px] font-bold text-orange tracking-wider mb-2">Étape {item.step}</div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-syne text-[15px] font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-dark py-12 px-6">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="font-syne font-black text-lg text-white mb-3">
                France<span className="text-orange">Occas</span>.fr
              </div>
              <p className="text-sm text-[#5A5A55] leading-relaxed">
                La plateforme des particuliers qui vendent au juste prix.
              </p>
            </div>
            {[
              { title: 'Acheter', links: ['Toutes les annonces', 'Outillage', 'Automobile', 'Jardinage'] },
              { title: 'Vendre', links: ['Déposer une annonce', 'Livraison FO', 'Booster', 'Pro Auto'] },
              { title: 'Aide', links: ['Centre d\'aide', 'CGU', 'Confidentialité', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-[9px] font-semibold tracking-wider text-[#3A3A38] uppercase mb-3">{col.title}</div>
                <div className="flex flex-col gap-2">
                  {col.links.map(link => (
                    <Link key={link} href="#" className="text-sm text-[#5A5A55] hover:text-white transition-colors">
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#252523] pt-5 flex flex-wrap gap-4 justify-between text-xs text-[#3A3A38]">
            <span>© 2026 FranceOccas.fr — Tous droits réservés</span>
            <span>Paiements sécurisés · RGPD conforme · Fait en France 🇫🇷</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Listing Card Component ───────────────────────────────────────────────────
function ListingCard({ listing }: { listing: Record<string, unknown> }) {
  const photos = (listing.photos as string[]) || [];
  const price = (listing.price as number) / 100;

  return (
    <Link href={`/annonces/${listing.id}`} className="card-hover block">
      <div className="relative aspect-square bg-[#F7F5F0] overflow-hidden">
        {photos[0] ? (
          <img
            src={photos[0]}
            alt={listing.title as string}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {listing.category_name === 'Automobile' ? '🚗' : '📦'}
          </div>
        )}
        {(listing.boost_level as number) > 0 && (
          <span className="absolute top-2 left-2 bg-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-[4px]">
            ⚡ Boosté
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-[11px] font-medium text-dark mb-1 line-clamp-2 leading-tight">
          {listing.title as string}
        </div>
        <div className="text-[10px] text-gray-400 mb-2">
          📍 {listing.city as string} ({listing.department as string})
        </div>
        <div className="flex items-center justify-between">
          <div className="font-syne font-black text-[16px] text-dark">
            {price.toLocaleString('fr-FR')} €
          </div>
          <button className="w-6 h-6 rounded-full border border-[#E2DDD6] flex items-center justify-center text-xs hover:bg-[#FFF0EB] hover:border-orange transition-colors">
            🤍
          </button>
        </div>
      </div>
    </Link>
  );
}
