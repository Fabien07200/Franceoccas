# FranceOccas.fr — Code source complet

> La marketplace des particuliers qui vendent au juste prix.  
> Outillage, automobile, jardinage, électroménager — annonces gratuites, paiement sécurisé, livraison assurée.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **Backend** | API Routes Next.js (Node.js) |
| **Base de données** | PostgreSQL 16 (AWS RDS) + Row Level Security |
| **Cache** | Redis 7 (AWS ElastiCache) |
| **Recherche** | Elasticsearch 8 |
| **Paiement** | MangoPay (séquestre, wallets, virements) |
| **IA** | Claude API (Anthropic) — vision + génération |
| **Cotation auto** | Argus Pro API + SIV national |
| **Stockage médias** | AWS S3 + CloudFront CDN |
| **Email** | SendGrid |
| **Livraison** | Colissimo API + Mondial Relay API |
| **Auth** | JWT (ECDSA) + cookies HttpOnly |
| **Monitoring** | Sentry |
| **Infrastructure** | AWS (ECS, RDS, ElastiCache, S3) + Cloudflare |

---

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                    ← Homepage
│   ├── layout.tsx                  ← Layout global
│   ├── globals.css
│   ├── annonces/                   ← Listings / recherche
│   ├── vendre/                     ← Dépôt d'annonce + IA
│   ├── compte/                     ← Dashboard vendeur
│   ├── messages/                   ← Chat + négociation
│   ├── admin/                      ← Espace admin
│   ├── franchise/                  ← Espace franchise
│   ├── pro-auto/                   ← Espace pro automobile
│   └── api/
│       ├── auth/route.ts           ← Auth (login, register, logout)
│       ├── listings/route.ts       ← CRUD annonces + boost + search
│       ├── messages/route.ts       ← Chat + offres + négociation
│       ├── payments/route.ts       ← MangoPay + wallet + séquestre
│       ├── ai/route.ts             ← Claude API (analyse, description, prix)
│       ├── argus/route.ts          ← Argus Pro (cote, plaque, batch)
│       ├── reviews/route.ts        ← Avis et notation
│       ├── franchise/route.ts      ← Gestion franchises + concessions
│       ├── admin/route.ts          ← Admin dashboard + modération
│       └── webhooks/               ← MangoPay, Colissimo
├── lib/
│   ├── db/index.ts                 ← PostgreSQL pool + RLS
│   ├── auth/index.ts               ← JWT + password + rate limiting
│   ├── payment/index.ts            ← MangoPay complet
│   ├── ai/index.ts                 ← Claude API (vision + NLP)
│   ├── argus/index.ts              ← Argus Pro + cache + batch
│   ├── email/index.ts              ← SendGrid templates
│   └── storage/index.ts            ← AWS S3 upload/delete
├── middleware.ts                   ← Auth guard + rate limiting
└── components/                     ← Composants React réutilisables
scripts/
└── migration.sql                   ← Schéma complet PostgreSQL
```

---

## Démarrage rapide

### 1. Prérequis
- Node.js 18+
- Docker & Docker Compose
- Comptes : MangoPay (sandbox), Anthropic, AWS, SendGrid

### 2. Installation
```bash
git clone git@github.com:votre-org/franceoccas.git
cd franceoccas

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local
# ⚠️ Remplir TOUTES les variables avec vos clés API
```

### 3. Base de données locale
```bash
# Démarrer PostgreSQL, Redis, Elasticsearch
docker-compose up -d

# La migration SQL s'exécute automatiquement au démarrage de PostgreSQL
# Vérifier avec :
docker exec fo_postgres psql -U fo_app -d franceoccas -c "\dt"
```

### 4. Lancer le serveur de développement
```bash
npm run dev
# → http://localhost:3000
```

---

## Variables d'environnement critiques

Toutes les variables sont dans `.env.example`. Les **critiques** pour le démarrage :

```bash
# Base de données (local avec Docker)
DATABASE_URL=postgresql://fo_app:password@localhost:5432/franceoccas

# JWT (générer avec: openssl rand -hex 64)
JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<64-char-random-hex>

# MangoPay sandbox
MANGOPAY_CLIENT_ID=<votre_client_id_sandbox>
MANGOPAY_API_KEY=<votre_api_key_sandbox>
MANGOPAY_BASE_URL=https://api.sandbox.mangopay.com/v2.01

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-<votre_cle>

# Argus Pro (en développement, le mock est utilisé si clé absente)
ARGUS_API_KEY=<votre_cle_argus>
```

---

## Fonctionnalités implémentées

### Plateforme généraliste
- [x] 12+ catégories avec sous-catégories détaillées
- [x] Annonces gratuites et illimitées
- [x] Recherche full-text (PostgreSQL + Elasticsearch)
- [x] Filtres avancés (prix, état, département, livraison)
- [x] Boost d'annonces (3j / 7j / 15j) depuis le porte-monnaie
- [x] Favoris et alertes de recherche

### Intelligence Artificielle (Claude)
- [x] Reconnaissance produit depuis photos (Vision)
- [x] Génération automatique : titre, description, caractéristiques
- [x] Estimation prix marché (3 fourchettes)
- [x] Score de modération automatique (0-100)
- [x] Détection coordonnées personnelles dans les messages
- [x] Génération fiches véhicule pour import catalogue

### Paiement & Porte-monnaie (MangoPay)
- [x] Système de séquestre complet (acheteur → FO → vendeur)
- [x] Porte-monnaie utilisateur avec historique
- [x] Recharge CB / virement / PayPal (avec bonus)
- [x] Virement SEPA (24h) vers compte bancaire
- [x] Paiement 3D Secure (DSP2)
- [x] Remboursements et litiges
- [x] Webhooks avec vérification HMAC-SHA256

### Messagerie & Négociation
- [x] Chat temps réel par annonce
- [x] Offres intégrées dans le chat (faire / accepter / refuser / contre-offrir)
- [x] Paiement depuis l'offre acceptée en 1 clic
- [x] Expiration automatique des offres (24h)
- [x] Détection et masquage des coordonnées

### Livraison
- [x] Colissimo (génération étiquette)
- [x] Mondial Relay (choix point relais)
- [x] Palette FranceOccas (service complet)
- [x] Remise en main propre avec code de sécurité
- [x] Kit d'emballage à 24€ livré J+1

### Avis & Notation
- [x] Notation bilatérale (acheteur → vendeur ET vendeur → acheteur)
- [x] 4 critères détaillés (description, réactivité, emballage, valeur)
- [x] Tags positifs/négatifs
- [x] Réponse vendeur aux avis
- [x] Vote "Utile" anti-doublon
- [x] Calcul automatique note globale (trigger PostgreSQL)

### Pro Automobile
- [x] Saisie par plaque d'immatriculation (SIV)
- [x] Cote Argus en temps réel (retail, reprise, conseillé)
- [x] Import catalogue en batch (jusqu'à 500 véhicules)
- [x] Cache Argus 24h pour économiser les quotas
- [x] Badge "Prix juste Argus" sur les annonces
- [x] Historique CT récupéré automatiquement
- [x] Génération description véhicule par IA

### Système Franchise
- [x] Double validation obligatoire (FranceOccas + Manager)
- [x] 3 niveaux d'accès (Admin FO / Manager / Concessionnaire)
- [x] Invitation par email avec token sécurisé
- [x] Espace manager : gestion concessions, stats réseau
- [x] Badge franchise visible sur toutes les annonces
- [x] Page marque dédiée par franchise

### Admin
- [x] Dashboard temps réel (KPIs, alertes, logs)
- [x] Gestion utilisateurs (bloquer, promouvoir, KYC)
- [x] File de modération IA avec actions rapides
- [x] Gestion des litiges (rembourser / libérer)
- [x] Panneau Argus Pro (config, tests, quotas, mapping)
- [x] Configuration tarifs (boosts, commissions, kit)
- [x] 8 emails automatiques configurables

### Sécurité
- [x] JWT ES256 (access 15min + refresh 30j en cookie HttpOnly)
- [x] Argon2id pour les mots de passe
- [x] Rate limiting par IP et par endpoint
- [x] Row Level Security PostgreSQL
- [x] CSP headers complets
- [x] HSTS, X-Frame-Options, X-Content-Type
- [x] Validation Zod sur toutes les entrées
- [x] Détection coordonnées personnelles (RGPD)
- [x] Vérification HMAC sur les webhooks

---

## Roadmap post-lancement

- [ ] Application mobile React Native (iOS + Android)
- [ ] Notifications push (Firebase FCM)
- [ ] Websockets temps réel (Socket.io)
- [ ] Alertes de recherche sauvegardées
- [ ] Intégration Carfax pour l'historique véhicule
- [ ] Module financement / LOA auto
- [ ] Programme de parrainage

---

## Déploiement production

### AWS (recommandé)
1. **RDS PostgreSQL** — eu-west-3, Multi-AZ, backup 6h
2. **ElastiCache Redis** — cluster mode, TLS
3. **ECS Fargate** — conteneurs Docker avec autoscaling
4. **S3 + CloudFront** — médias avec cache 1 an
5. **Secrets Manager** — toutes les clés API
6. **Cloudflare** — DNS, WAF, DDoS, Turnstile

### Checklist avant lancement
- [ ] Audit OWASP ZAP automatisé
- [ ] Tests de pénétration
- [ ] SSL Labs Score A+
- [ ] KYB MangoPay validé (délai 5-10j)
- [ ] CGU/CGV signées par juriste
- [ ] DPO désigné (RGPD)
- [ ] Assurance RC Pro souscrite
- [ ] Tests restauration backups

---

## Licence

Propriétaire — © 2026 FranceOccas.fr — Tous droits réservés.
