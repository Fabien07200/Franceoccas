import { query } from '@/lib/db';

const ARGUS_BASE = process.env.ARGUS_BASE_URL || 'https://api.argus.fr/v3';
const ARGUS_KEY = process.env.ARGUS_API_KEY!;
const SIV_KEY = process.env.SIV_API_KEY!;
const CACHE_HOURS = 24;

// ─── Types Argus ──────────────────────────────────────────────────────────────
export interface ArgusVehicle {
  make: string;
  model: string;
  version: string;
  year: number;
  fuel: string;
  gearbox: string;
  mileage_ct: number;
  color: string;
  doors: number;
  vin: string;
  engine_cc: number;
  power_hp: number;
  co2: number;
  euro_norm: string;
  first_registration: string;
}

export interface ArgusValuation {
  trade_in_min: number;     // Prix reprise minimum (euros)
  trade_in_max: number;     // Prix reprise maximum
  retail_min: number;       // Prix vente particulier minimum
  retail_max: number;       // Prix vente particulier maximum
  fo_suggested: number;     // Prix conseillé FranceOccas
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  based_on: number;         // Nombre d'annonces comparables
  last_updated: string;
}

export interface ArgusCTHistory {
  last_ct_date: string;
  result: 'FAVORABLE' | 'DEFAVORABLE' | 'SANS_OBJET';
  defects: string[];
  next_ct: string;
  ct_count: number;
}

export interface ArgusFullData {
  vehicle: ArgusVehicle;
  valuation: ArgusValuation;
  ct_history: ArgusCTHistory;
  accident_history: {
    has_accidents: boolean;
    accident_count: number;
    last_accident_date?: string;
  };
  owner_count: number;
}

// ─── Cache Helper ─────────────────────────────────────────────────────────────
async function getCachedData(cacheKey: string): Promise<ArgusFullData | null> {
  const { rows } = await query(
    `SELECT data FROM argus_cache
     WHERE cache_key = $1 AND expires_at > NOW()`,
    [cacheKey]
  );
  if (rows[0]) {
    await query(
      `UPDATE argus_cache SET hit_count = hit_count + 1 WHERE cache_key = $1`,
      [cacheKey]
    );
    return rows[0].data as ArgusFullData;
  }
  return null;
}

async function setCachedData(
  cacheKey: string,
  data: ArgusFullData,
  plate?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000);
  await query(
    `INSERT INTO argus_cache (cache_key, plate, data, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cache_key)
     DO UPDATE SET data = $3, expires_at = $4, hit_count = 0`,
    [cacheKey, plate, JSON.stringify(data), expiresAt]
  );
}

// ─── API Request Helper ───────────────────────────────────────────────────────
async function argusRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ARGUS_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': ARGUS_KEY,
      'Accept': 'application/json',
      'User-Agent': 'FranceOccas/1.0',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Argus API error ${res.status}: ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

// ─── Récupération données par plaque ─────────────────────────────────────────
export async function getVehicleByPlate(plate: string): Promise<ArgusFullData> {
  const normalizedPlate = plate.toUpperCase().replace(/[\s-]/g, '');
  const cacheKey = `plate:${normalizedPlate}`;

  // Check cache first
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  // Fetch from Argus API
  try {
    const [vehicle, valuation, ctHistory] = await Promise.all([
      argusRequest<ArgusVehicle>(`/vehicle/plate/${normalizedPlate}`),
      argusRequest<ArgusValuation>('/vehicle/valuation', {
        plate: normalizedPlate,
        include_market: 'true',
      }),
      argusRequest<ArgusCTHistory>(`/vehicle/ct/${normalizedPlate}`),
    ]);

    let accidentHistory = { has_accidents: false, accident_count: 0 };
    let ownerCount = 1;

    try {
      const history = await argusRequest<{
        accidents: unknown[];
        owner_count: number;
      }>(`/vehicle/history/${vehicle.vin}`);
      accidentHistory = {
        has_accidents: history.accidents.length > 0,
        accident_count: history.accidents.length,
      };
      ownerCount = history.owner_count;
    } catch {
      // History endpoint optional
    }

    const fullData: ArgusFullData = {
      vehicle,
      valuation,
      ct_history: ctHistory,
      accident_history: accidentHistory,
      owner_count: ownerCount,
    };

    await setCachedData(cacheKey, fullData, normalizedPlate);
    return fullData;
  } catch (error) {
    // Return mock data in development if API not configured
    if (process.env.NODE_ENV === 'development') {
      return getMockVehicleData(plate);
    }
    throw error;
  }
}

// ─── Import catalogue en batch ────────────────────────────────────────────────
export interface BatchVehicle {
  plate: string;
  dealer_price?: number;
  mileage?: number;
  internal_ref?: string;
}

export interface BatchResult {
  plate: string;
  success: boolean;
  data?: ArgusFullData;
  error?: string;
  internal_ref?: string;
}

export async function batchImportCatalogue(
  vehicles: BatchVehicle[],
  concessionId: string
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
    const batch = vehicles.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (v) => {
        const data = await getVehicleByPlate(v.plate);
        return { plate: v.plate, data, internal_ref: v.internal_ref };
      })
    );

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push({
          plate: batch[idx].plate,
          success: true,
          data: result.value.data,
          internal_ref: batch[idx].internal_ref,
        });
      } else {
        results.push({
          plate: batch[idx].plate,
          success: false,
          error: result.reason?.message || 'Erreur API',
          internal_ref: batch[idx].internal_ref,
        });
      }
    });

    // Rate limiting: pause between batches
    if (i + BATCH_SIZE < vehicles.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

// ─── Vérification règles métier prix ─────────────────────────────────────────
export interface PriceCheck {
  isJust: boolean;
  isTooLow: boolean;
  isTooHigh: boolean;
  badge: 'prix_juste' | 'prix_bas' | 'prix_eleve' | null;
  alertMessage: string | null;
  percentageVsRetail: number;
}

export function checkVehiclePrice(
  sellerPrice: number,
  valuation: ArgusValuation,
  config?: { lowThreshold?: number; highThreshold?: number }
): PriceCheck {
  const low = config?.lowThreshold || 70;
  const high = config?.highThreshold || 130;
  const midRetail = (valuation.retail_min + valuation.retail_max) / 2;
  const pct = Math.round((sellerPrice / midRetail) * 100);

  if (pct < low) {
    return {
      isJust: false, isTooLow: true, isTooHigh: false,
      badge: 'prix_bas',
      alertMessage: `Prix ${Math.round(100 - pct)}% sous la cote Argus — vérification recommandée`,
      percentageVsRetail: pct,
    };
  }

  if (pct > high) {
    return {
      isJust: false, isTooLow: false, isTooHigh: true,
      badge: 'prix_eleve',
      alertMessage: `Prix ${Math.round(pct - 100)}% au-dessus de la cote Argus`,
      percentageVsRetail: pct,
    };
  }

  return {
    isJust: true, isTooLow: false, isTooHigh: false,
    badge: 'prix_juste',
    alertMessage: null,
    percentageVsRetail: pct,
  };
}

// ─── Données mock pour le développement ──────────────────────────────────────
function getMockVehicleData(plate: string): ArgusFullData {
  return {
    vehicle: {
      make: 'Renault',
      model: 'Clio V',
      version: '1.0 TCe 90 Intens',
      year: 2022,
      fuel: 'Essence',
      gearbox: 'Manuelle 6 vitesses',
      mileage_ct: 28000,
      color: 'Gris Platine',
      doors: 5,
      vin: `VF1XXXXXX${plate.replace(/[^A-Z0-9]/g, '')}`,
      engine_cc: 999,
      power_hp: 90,
      co2: 118,
      euro_norm: 'Euro 6d',
      first_registration: '2022-03-15',
    },
    valuation: {
      trade_in_min: 9200,
      trade_in_max: 10400,
      retail_min: 10800,
      retail_max: 12600,
      fo_suggested: 11500,
      confidence: 'HIGH',
      based_on: 127,
      last_updated: new Date().toISOString(),
    },
    ct_history: {
      last_ct_date: '2024-03-15',
      result: 'FAVORABLE',
      defects: [],
      next_ct: '2026-03-15',
      ct_count: 1,
    },
    accident_history: {
      has_accidents: false,
      accident_count: 0,
    },
    owner_count: 1,
  };
}

// ─── Quota tracking ───────────────────────────────────────────────────────────
export async function getArgusQuotaStatus(): Promise<{
  daily: { used: number; limit: number };
  monthly: Record<string, { used: number; limit: number }>;
}> {
  // In production, track via Redis or DB
  // Mock for now
  return {
    daily: { used: 1284, limit: 10000 },
    monthly: {
      valuation: { used: 4820, limit: 6000 },
      plate: { used: 2640, limit: 5000 },
      ct: { used: 1240, limit: 3000 },
      history: { used: 820, limit: 2000 },
    },
  };
}
