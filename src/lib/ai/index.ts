import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '1500');

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProductAnalysisResult {
  title: string;
  category: string;
  subcategory: string;
  brand: string | null;
  model: string | null;
  condition: 'new' | 'like_new' | 'very_good' | 'good' | 'fair' | 'for_parts';
  condition_confidence: number;
  specs: Record<string, string | number | boolean>;
  description: string;
  price_min: number;
  price_suggested: number;
  price_max: number;
  price_neuf: number | null;
  moderation_score: number;
  flags: string[];
  is_vehicle: boolean;
}

export interface ModerationResult {
  score: number;           // 0-100
  approved: boolean;       // true if score > 85
  flags: string[];
  reasons: string[];
  priority: number;        // 1-10 for human review queue
}

// ─── Analyse produit depuis images ────────────────────────────────────────────
export async function analyzeProductImages(
  imageUrls: string[],
  userHint?: string
): Promise<ProductAnalysisResult> {

  // Fetch images and convert to base64
  const imageContents = await Promise.all(
    imageUrls.slice(0, 4).map(async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mediaType = (response.headers.get('content-type') || 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
      return {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mediaType, data: base64 },
      };
    })
  );

  const systemPrompt = `Tu es un expert en évaluation de produits d'occasion pour la marketplace FranceOccas.fr.
Tu analyses des photos de produits et génères des fiches d'annonce professionnelles en français.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, sans blocs de code.`;

  const userPrompt = `Analyse ${imageUrls.length > 1 ? 'ces photos' : 'cette photo'} et génère une fiche d'annonce complète.
${userHint ? `Informations supplémentaires du vendeur: ${userHint}` : ''}

Retourne UNIQUEMENT ce JSON (pas de markdown, pas d'explication):
{
  "title": "Titre accrocheur et précis pour l'annonce (max 80 car.)",
  "category": "Catégorie principale parmi: outillage|automobile|jardinage|electromenager|btp-chantier|moto-scooter|velo|sport-loisirs|informatique|audiovisuel-jeux|maison-deco|enfants-bebe|agriculture|divers",
  "subcategory": "Sous-catégorie précise",
  "brand": "Marque détectée ou null",
  "model": "Modèle précis ou null",
  "condition": "new|like_new|very_good|good|fair|for_parts",
  "condition_confidence": 0,
  "specs": {},
  "description": "Description complète 200-400 mots style professionnel e-commerce. Inclure: état détaillé, caractéristiques principales, accessoires inclus, historique si visible, pourquoi vendre, prix neuf si connu.",
  "price_min": 0,
  "price_suggested": 0,
  "price_max": 0,
  "price_neuf": null,
  "moderation_score": 0,
  "flags": [],
  "is_vehicle": false
}

Règles:
- condition_confidence: 0-100 (certitude sur l'état évalué)
- specs: objet clé-valeur des caractéristiques techniques détectées
- price_min/suggested/max: estimation réaliste du marché en euros entiers
- moderation_score: 0-100 (100=parfait, <60=problématique)
- flags: ["prix_suspect", "photo_stock", "contenu_inapproprie", "coordonnees_perso"] si applicable
- is_vehicle: true seulement si voiture, moto, vélo motorisé`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        ...imageContents,
        { type: 'text', text: userPrompt },
      ],
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned) as ProductAnalysisResult;
  } catch {
    // Fallback if JSON is malformed
    return {
      title: 'Produit d\'occasion',
      category: 'divers',
      subcategory: 'Divers',
      brand: null,
      model: null,
      condition: 'good',
      condition_confidence: 50,
      specs: {},
      description: 'Produit en bon état. Contactez-moi pour plus d\'informations.',
      price_min: 0,
      price_suggested: 0,
      price_max: 0,
      price_neuf: null,
      moderation_score: 60,
      flags: [],
      is_vehicle: false,
    };
  }
}

// ─── Modération automatique d'annonce ────────────────────────────────────────
export async function moderateListing(params: {
  title: string;
  description: string;
  price: number;
  category: string;
  photos: string[];
}): Promise<ModerationResult> {

  const prompt = `Modère cette annonce FranceOccas.fr et détecte tout contenu problématique.

Titre: ${params.title}
Catégorie: ${params.category}
Prix: ${params.price}€
Description: ${params.description.slice(0, 500)}

Réponds UNIQUEMENT avec ce JSON:
{
  "score": 85,
  "approved": true,
  "flags": [],
  "reasons": [],
  "priority": 3
}

Règles de modération:
- score 85+: approbation automatique
- score 60-84: revue manuelle normale
- score <60: revue prioritaire
- flags possibles: "prix_suspect", "coordonnees_perso", "photo_stock", "contenu_interdit", "spam", "doublon", "incomplete"
- priority: 1 (urgence max) à 10 (faible priorité)`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { score: 70, approved: false, flags: [], reasons: ['Erreur analyse'], priority: 5 };
  }
}

// ─── Génération description optimisée ────────────────────────────────────────
export async function generateOptimizedDescription(params: {
  brand?: string;
  model?: string;
  condition: string;
  specs: Record<string, unknown>;
  userNotes?: string;
  category: string;
}): Promise<string> {

  const prompt = `Génère une description professionnelle pour une annonce d'occasion sur FranceOccas.fr.

Produit: ${params.brand || ''} ${params.model || ''}
Catégorie: ${params.category}
État: ${params.condition}
Caractéristiques: ${JSON.stringify(params.specs)}
Notes vendeur: ${params.userNotes || 'Aucune'}

Écris une description de 150-300 mots en français, style professionnel et accrocheur.
- Commence par l'état général du produit
- Liste les caractéristiques importantes
- Mentionne les accessoires inclus si précisés
- Termine par une raison de vente et un appel à l'action
- N'inclus PAS de coordonnées, email, téléphone ou liens externes`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ─── Estimation prix marché ────────────────────────────────────────────────────
export async function estimateMarketPrice(params: {
  title: string;
  brand?: string;
  model?: string;
  condition: string;
  category: string;
  year?: number;
}): Promise<{ min: number; suggested: number; max: number; explanation: string }> {

  const prompt = `Estime le prix de marché d'occasion pour ce produit en France.

${params.brand || ''} ${params.model || ''} - ${params.title}
Catégorie: ${params.category}
État: ${params.condition}
${params.year ? `Année: ${params.year}` : ''}

Réponds UNIQUEMENT avec ce JSON:
{
  "min": 0,
  "suggested": 0,
  "max": 0,
  "explanation": "Justification en 1-2 phrases"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { min: 0, suggested: 0, max: 0, explanation: 'Estimation non disponible' };
  }
}

// ─── Détection coordonnées personnelles dans les messages ────────────────────
export async function detectPersonalInfo(text: string): Promise<{
  hasPersonalInfo: boolean;
  sanitized: string;
  detected: string[];
}> {
  // Regex-based detection (fast, no API call needed)
  const phoneRegex = /(\+33|0033|0)[1-9]([0-9]{8})/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const urlRegex = /https?:\/\/[^\s]+/g;

  const detected: string[] = [];
  let sanitized = text;

  if (phoneRegex.test(text)) {
    detected.push('telephone');
    sanitized = sanitized.replace(phoneRegex, '[TÉLÉPHONE MASQUÉ]');
  }
  if (emailRegex.test(text)) {
    detected.push('email');
    sanitized = sanitized.replace(emailRegex, '[EMAIL MASQUÉ]');
  }
  if (urlRegex.test(text)) {
    detected.push('url');
    sanitized = sanitized.replace(urlRegex, '[LIEN MASQUÉ]');
  }

  return {
    hasPersonalInfo: detected.length > 0,
    sanitized,
    detected,
  };
}

// ─── Génération texte annonce auto (pour import catalogue) ────────────────────
export async function generateVehicleListing(vehicle: {
  make: string;
  model: string;
  version: string;
  year: number;
  mileage: number;
  fuel: string;
  gearbox: string;
  color: string;
  doors: number;
  ctStatus: string;
  argusPrice: number;
}): Promise<{ title: string; description: string }> {

  const prompt = `Génère un titre et une description d'annonce pour ce véhicule d'occasion.

${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.version}
Km: ${vehicle.mileage.toLocaleString('fr')} | Carburant: ${vehicle.fuel} | Boîte: ${vehicle.gearbox}
Couleur: ${vehicle.color} | Portes: ${vehicle.doors} | CT: ${vehicle.ctStatus}
Prix Argus: ${vehicle.argusPrice}€

Réponds avec ce JSON:
{
  "title": "Titre 60-80 caractères",
  "description": "Description 150-250 mots professionnelle"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.version}`,
      description: `Véhicule en bon état. ${vehicle.mileage.toLocaleString('fr')} km. ${vehicle.fuel}. CT ${vehicle.ctStatus}.`,
    };
  }
}
