-- FranceOccas.fr — Migration complète
-- Version 1.0 — Avril 2026
-- Toutes les tables avec Row Level Security

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enum Types ──────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('user', 'pro', 'franchise_manager', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'blocked');
CREATE TYPE kyc_status AS ENUM ('pending', 'submitted', 'verified', 'rejected');

CREATE TYPE listing_status AS ENUM ('draft', 'pending', 'active', 'paused', 'sold', 'expired', 'rejected');
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'very_good', 'good', 'fair', 'for_parts');

CREATE TYPE transaction_status AS ENUM ('pending', 'escrow', 'released', 'refunded', 'disputed', 'cancelled');
CREATE TYPE delivery_method AS ENUM ('colissimo', 'mondial_relay', 'palette_fo', 'hand_to_hand');

CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'expired');
CREATE TYPE review_type AS ENUM ('buyer_to_seller', 'seller_to_buyer');

CREATE TYPE franchise_status AS ENUM ('pending', 'active', 'suspended', 'terminated');
CREATE TYPE concession_status AS ENUM ('invited', 'pending_fo', 'pending_manager', 'active', 'suspended');

-- ─── Table: users ────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT UNIQUE NOT NULL,
  email_verified    BOOLEAN DEFAULT FALSE,
  email_verify_token TEXT,
  password_hash     TEXT,
  phone             TEXT,
  phone_verified    BOOLEAN DEFAULT FALSE,
  full_name         TEXT NOT NULL,
  username          TEXT UNIQUE,
  avatar_url        TEXT,
  bio               TEXT,
  city              TEXT,
  department        VARCHAR(3),
  postal_code       VARCHAR(10),
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  role              user_role DEFAULT 'user',
  status            user_status DEFAULT 'pending',
  kyc_status        kyc_status DEFAULT 'pending',
  mangopay_id       TEXT UNIQUE,
  wallet_id         TEXT,
  wallet_balance    BIGINT DEFAULT 0,       -- centimes EUR
  wallet_pending    BIGINT DEFAULT 0,
  totp_secret       TEXT,
  totp_enabled      BOOLEAN DEFAULT FALSE,
  response_rate     INTEGER DEFAULT 100,
  response_time_min INTEGER,
  rating            DECIMAL(3,2),
  rating_count      INTEGER DEFAULT 0,
  sales_count       INTEGER DEFAULT 0,
  purchases_count   INTEGER DEFAULT 0,
  last_login_at     TIMESTAMPTZ,
  last_login_ip     INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until      TIMESTAMPTZ,
  blocked_reason    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_mangopay ON users(mangopay_id);

-- ─── Table: categories ───────────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES categories(id),
  icon        TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_vehicle  BOOLEAN DEFAULT FALSE,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: listings ─────────────────────────────────────────────────────────
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id       UUID REFERENCES categories(id),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  condition         listing_condition NOT NULL,
  price             INTEGER NOT NULL,       -- centimes EUR
  price_negotiable  BOOLEAN DEFAULT TRUE,
  city              TEXT NOT NULL,
  department        VARCHAR(3),
  postal_code       VARCHAR(10),
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  photos            TEXT[] DEFAULT '{}',    -- S3 URLs
  specs             JSONB DEFAULT '{}',
  status            listing_status DEFAULT 'pending',
  ai_generated      BOOLEAN DEFAULT FALSE,
  ai_score          INTEGER,
  ai_flags          TEXT[] DEFAULT '{}',
  boost_level       INTEGER DEFAULT 0,
  boost_expires_at  TIMESTAMPTZ,
  views_count       INTEGER DEFAULT 0,
  favorites_count   INTEGER DEFAULT 0,
  messages_count    INTEGER DEFAULT 0,
  -- Vehicle specific fields
  is_vehicle        BOOLEAN DEFAULT FALSE,
  vehicle_make      TEXT,
  vehicle_model     TEXT,
  vehicle_version   TEXT,
  vehicle_year      INTEGER,
  vehicle_fuel      TEXT,
  vehicle_gearbox   TEXT,
  vehicle_mileage   INTEGER,
  vehicle_color     TEXT,
  vehicle_doors     INTEGER,
  vehicle_plate     TEXT,
  vehicle_vin_hash  TEXT,
  argus_price_min   INTEGER,
  argus_price_max   INTEGER,
  argus_suggested   INTEGER,
  argus_updated_at  TIMESTAMPTZ,
  ct_status         TEXT,
  ct_next_date      DATE,
  -- Pro fields
  pro_seller        BOOLEAN DEFAULT FALSE,
  franchise_id      UUID,
  concession_id     UUID,
  -- Timestamps
  published_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  sold_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_boost ON listings(boost_level, boost_expires_at);
CREATE INDEX idx_listings_location ON listings(department, city);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_vehicle ON listings(is_vehicle, vehicle_make, vehicle_model);
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('french', title || ' ' || description));

-- ─── Table: listing_favorites ────────────────────────────────────────────────
CREATE TABLE listing_favorites (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ─── Table: conversations ────────────────────────────────────────────────────
CREATE TABLE conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_msg_at  TIMESTAMPTZ,
  buyer_unread INTEGER DEFAULT 0,
  seller_unread INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conv_buyer ON conversations(buyer_id);
CREATE INDEX idx_conv_seller ON conversations(seller_id);
CREATE INDEX idx_conv_listing ON conversations(listing_id);

-- ─── Table: messages ─────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT,
  type            TEXT DEFAULT 'text',    -- text | offer | system
  offer_amount    INTEGER,                -- centimes if type=offer
  offer_status    offer_status,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ─── Table: offers ───────────────────────────────────────────────────────────
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  seller_id       UUID NOT NULL REFERENCES users(id),
  amount          INTEGER NOT NULL,       -- centimes
  status          offer_status DEFAULT 'pending',
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  parent_offer_id UUID REFERENCES offers(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: transactions ─────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id            UUID REFERENCES listings(id),
  buyer_id              UUID REFERENCES users(id),
  seller_id             UUID REFERENCES users(id),
  offer_id              UUID REFERENCES offers(id),
  amount                INTEGER NOT NULL,  -- centimes
  commission            INTEGER DEFAULT 0,
  delivery_price        INTEGER DEFAULT 0,
  total_buyer           INTEGER NOT NULL,
  status                transaction_status DEFAULT 'pending',
  delivery_method       delivery_method,
  delivery_tracking     TEXT,
  delivery_code         TEXT,             -- Code remise main propre
  mangopay_payin_id     TEXT,
  mangopay_transfer_id  TEXT,
  mangopay_payout_id    TEXT,
  threeds_redirect_url  TEXT,
  escrow_at             TIMESTAMPTZ,
  delivery_confirmed_at TIMESTAMPTZ,
  released_at           TIMESTAMPTZ,
  dispute_opened_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_buyer ON transactions(buyer_id);
CREATE INDEX idx_tx_seller ON transactions(seller_id);
CREATE INDEX idx_tx_status ON transactions(status);
CREATE INDEX idx_tx_listing ON transactions(listing_id);

-- ─── Table: wallet_transactions ──────────────────────────────────────────────
CREATE TABLE wallet_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL,             -- credit | debit | boost | kit | recharge
  amount      INTEGER NOT NULL,          -- centimes (positif ou négatif)
  balance     INTEGER NOT NULL,          -- Solde après l'opération
  description TEXT,
  reference   TEXT,                      -- ID transaction ou boost
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);

-- ─── Table: reviews ──────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id),
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  reviewed_id     UUID NOT NULL REFERENCES users(id),
  listing_id      UUID REFERENCES listings(id),
  type            review_type NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_desc     INTEGER CHECK (rating_desc BETWEEN 1 AND 5),
  rating_response INTEGER CHECK (rating_response BETWEEN 1 AND 5),
  rating_packaging INTEGER CHECK (rating_packaging BETWEEN 1 AND 5),
  rating_value    INTEGER CHECK (rating_value BETWEEN 1 AND 5),
  title           TEXT,
  content         TEXT NOT NULL,
  tags_positive   TEXT[] DEFAULT '{}',
  tags_negative   TEXT[] DEFAULT '{}',
  helpful_count   INTEGER DEFAULT 0,
  reply           TEXT,
  reply_at        TIMESTAMPTZ,
  moderated       BOOLEAN DEFAULT FALSE,
  published       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewed ON reviews(reviewed_id, created_at DESC);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ─── Table: review_votes ─────────────────────────────────────────────────────
CREATE TABLE review_votes (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  review_id  UUID REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, review_id)
);

-- ─── Table: boosts ───────────────────────────────────────────────────────────
CREATE TABLE boosts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id),
  user_id      UUID NOT NULL REFERENCES users(id),
  level        INTEGER NOT NULL,          -- 1=3j, 2=7j, 3=15j
  duration_days INTEGER NOT NULL,
  amount       INTEGER NOT NULL,          -- centimes
  starts_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: delivery_kits ────────────────────────────────────────────────────
CREATE TABLE delivery_kits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  listing_id      UUID REFERENCES listings(id),
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  postal_code     VARCHAR(10),
  amount          INTEGER NOT NULL DEFAULT 2400,  -- 24.00€ en centimes
  status          TEXT DEFAULT 'pending',
  tracking_number TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: franchises ───────────────────────────────────────────────────────
CREATE TABLE franchises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  description     TEXT,
  website         TEXT,
  siret           TEXT,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  commission_rate DECIMAL(5,4) DEFAULT 0.018,
  status          franchise_status DEFAULT 'pending',
  contract_start  DATE,
  contract_end    DATE,
  max_concessions INTEGER DEFAULT 200,
  zone_regions    TEXT[] DEFAULT '{}',
  features        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: franchise_managers ───────────────────────────────────────────────
CREATE TABLE franchise_managers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fo_validated BOOLEAN DEFAULT FALSE,
  fo_validated_at TIMESTAMPTZ,
  fo_validated_by UUID REFERENCES users(id),
  active       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchise_id, user_id)
);

-- ─── Table: concessions ──────────────────────────────────────────────────────
CREATE TABLE concessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id      UUID NOT NULL REFERENCES franchises(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  manager_id        UUID REFERENCES franchise_managers(id),
  name              TEXT NOT NULL,
  siret             TEXT,
  kbis_url          TEXT,
  address           TEXT,
  city              TEXT,
  department        VARCHAR(3),
  postal_code       VARCHAR(10),
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  status            concession_status DEFAULT 'invited',
  fo_validated      BOOLEAN DEFAULT FALSE,
  fo_validated_at   TIMESTAMPTZ,
  fo_validated_by   UUID REFERENCES users(id),
  manager_validated BOOLEAN DEFAULT FALSE,
  manager_validated_at TIMESTAMPTZ,
  invitation_token  TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  contract_signed   BOOLEAN DEFAULT FALSE,
  training_done     BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_concessions_franchise ON concessions(franchise_id);
CREATE INDEX idx_concessions_user ON concessions(user_id);
CREATE INDEX idx_concessions_status ON concessions(status);

-- ─── Table: argus_cache ──────────────────────────────────────────────────────
CREATE TABLE argus_cache (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate        TEXT,
  vin_hash     TEXT,
  cache_key    TEXT UNIQUE NOT NULL,
  data         JSONB NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  hit_count    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_argus_plate ON argus_cache(plate);
CREATE INDEX idx_argus_expires ON argus_cache(expires_at);

-- ─── Table: notifications ────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, read, created_at DESC);

-- ─── Table: moderation_queue ─────────────────────────────────────────────────
CREATE TABLE moderation_queue (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID REFERENCES listings(id) ON DELETE CASCADE,
  ai_score    INTEGER,
  ai_flags    TEXT[] DEFAULT '{}',
  reasons     TEXT[] DEFAULT '{}',
  priority    INTEGER DEFAULT 5,
  status      TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  action      TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: disputes ─────────────────────────────────────────────────────────
CREATE TABLE disputes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID NOT NULL REFERENCES transactions(id),
  opened_by       UUID NOT NULL REFERENCES users(id),
  reason          TEXT NOT NULL,
  description     TEXT,
  evidence_urls   TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'open',
  resolution      TEXT,
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  amount_refunded INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: saved_searches ───────────────────────────────────────────────────
CREATE TABLE saved_searches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT,
  query       TEXT,
  filters     JSONB DEFAULT '{}',
  alert_email BOOLEAN DEFAULT TRUE,
  alert_push  BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table: api_configs ──────────────────────────────────────────────────────
CREATE TABLE api_configs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service     TEXT UNIQUE NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}',
  enabled     BOOLEAN DEFAULT TRUE,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: ne voient que leur propre profil complet
CREATE POLICY user_own_data ON users
  FOR ALL USING (id::text = current_setting('app.current_user_id', true));

-- Transactions: visible par acheteur ET vendeur
CREATE POLICY tx_parties ON transactions
  FOR SELECT USING (
    buyer_id::text = current_setting('app.current_user_id', true) OR
    seller_id::text = current_setting('app.current_user_id', true)
  );

-- Messages: visible par les participants uniquement
CREATE POLICY msg_participants ON messages
  FOR ALL USING (
    sender_id::text = current_setting('app.current_user_id', true) OR
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id::text = current_setting('app.current_user_id', true)
         OR seller_id::text = current_setting('app.current_user_id', true)
    )
  );

-- Notifications: propres uniquement
CREATE POLICY notif_own ON notifications
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- ─── Triggers: updated_at auto ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_upd BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tx_upd BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_offers_upd BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Trigger: mise à jour note utilisateur ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND published = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id AND published = true
    )
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ─── Seed categories de base ─────────────────────────────────────────────────
INSERT INTO categories (slug, name, icon, sort_order, is_vehicle) VALUES
  ('outillage', 'Outillage', '🔧', 1, false),
  ('automobile', 'Automobile', '🚗', 2, true),
  ('jardinage', 'Jardinage', '🌿', 3, false),
  ('electromenager', 'Électroménager', '❄️', 4, false),
  ('btp-chantier', 'BTP & Chantier', '🏗️', 5, false),
  ('moto-scooter', 'Moto & Scooter', '🏍️', 6, false),
  ('velo', 'Vélo', '🚲', 7, false),
  ('sport-loisirs', 'Sport & Loisirs', '🏋️', 8, false),
  ('informatique', 'Informatique', '💻', 9, false),
  ('audiovisuel-jeux', 'Audiovisuel & Jeux', '🎮', 10, false),
  ('maison-deco', 'Maison & Déco', '🏡', 11, false),
  ('enfants-bebe', 'Enfants & Bébé', '👶', 12, false),
  ('agriculture', 'Agriculture', '🌾', 13, false),
  ('nautisme', 'Nautisme & Sports eau', '⛵', 14, false),
  ('aviation', 'Aviation & ULM', '✈️', 15, false),
  ('divers', 'Divers', '📦', 16, false)
ON CONFLICT (slug) DO NOTHING;

-- Sous-catégories Outillage
WITH parent AS (SELECT id FROM categories WHERE slug = 'outillage')
INSERT INTO categories (slug, name, parent_id, sort_order) SELECT
  slug, name, parent.id, sort_order FROM parent,
  (VALUES
    ('perceuses-visseuses', 'Perceuses & Visseuses', 1),
    ('perforateurs', 'Perforateurs & Burineurs', 2),
    ('meuleuses', 'Meuleuses & Disqueuses', 3),
    ('scies', 'Scies & Tronçonneuses', 4),
    ('ponceuses', 'Ponceuses & Polisseuses', 5),
    ('compresseurs', 'Compresseurs', 6),
    ('soudage', 'Matériel de soudage', 7),
    ('etablis', 'Établis & Étaux', 8),
    ('mesure-laser', 'Mesure & Laser', 9),
    ('outillage-main', 'Outillage à main', 10),
    ('generateurs', 'Groupes électrogènes', 11),
    ('echafaudages', 'Échafaudages & Escabeaux', 12)
  ) AS sub(slug, name, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Seed config Argus par défaut
INSERT INTO api_configs (service, config) VALUES
  ('argus', '{
    "base_url": "https://api.argus.fr/v3",
    "enabled": true,
    "cache_hours": 24,
    "quota_daily": 10000,
    "quota_monthly_valuation": 6000,
    "quota_monthly_plate": 5000,
    "quota_monthly_ct": 3000,
    "quota_monthly_history": 2000,
    "price_alert_low_pct": 70,
    "price_alert_high_pct": 130,
    "show_cote_to_seller": true,
    "show_cote_to_buyer": true,
    "auto_suggest_price": true,
    "block_expired_ct_months": 6,
    "update_cote_days": 7,
    "badge_prix_juste": true,
    "endpoints": {
      "plate": "/vehicle/plate/{plate}",
      "valuation": "/vehicle/valuation",
      "ct": "/vehicle/ct/{plate}",
      "history": "/vehicle/history/{vin}",
      "comparables": "/market/comparables",
      "batch": "/vehicle/batch"
    }
  }')
ON CONFLICT (service) DO NOTHING;
