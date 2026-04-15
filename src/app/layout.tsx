import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'FranceOccas.fr — Vendez au juste prix',
    template: '%s | FranceOccas.fr',
  },
  description:
    'La marketplace des particuliers qui vendent au juste prix. Outillage, automobile, jardinage, électroménager — annonces gratuites, paiement sécurisé, livraison assurée.',
  keywords: ['vente occasion', 'achat occasion', 'annonces gratuites', 'outillage', 'automobile'],
  authors: [{ name: 'FranceOccas.fr' }],
  creator: 'FranceOccas.fr',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://franceoccas.fr',
    siteName: 'FranceOccas.fr',
    title: 'FranceOccas.fr — Vendez ce qui vaut de l\'argent',
    description: 'La première marketplace dédiée aux objets de valeur entre particuliers.',
    images: [{ url: 'https://franceoccas.fr/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FranceOccas.fr',
    description: 'Vendez au juste prix, sans intermédiaire.',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://franceoccas.fr'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#E8460A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-fo-bg`}>
        {children}
      </body>
    </html>
  );
}
