import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { analyzeProductImages, generateOptimizedDescription, estimateMarketPrice } from '@/lib/ai';
import { getPresignedUploadUrl } from '@/lib/storage';
import { query } from '@/lib/db';
import { z } from 'zod';

// Simple in-memory rate limiter for AI endpoints
const aiRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkAIRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = aiRateLimit.get(userId);
  const maxPerHour = parseInt(process.env.AI_RATE_LIMIT_PER_USER || '20');

  if (!limit || limit.resetAt < now) {
    aiRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
    return true;
  }

  if (limit.count >= maxPerHour) return false;
  limit.count++;
  return true;
}

// ─── POST /api/ai/analyze - Analyze product from images ──────────────────────
const analyzeSchema = z.object({
  image_urls: z.array(z.string()).min(1).max(4),
  user_hint: z.string().max(500).optional(),
});

export const POST_analyze = withAuth(async (req: NextRequest, user) => {
  if (!checkAIRateLimit(user.sub)) {
    return NextResponse.json(
      { error: 'Limite d\'analyses atteinte (20/heure). Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { image_urls, user_hint } = parsed.data;

  const start = Date.now();
  const result = await analyzeProductImages(image_urls, user_hint);
  const duration = Date.now() - start;

  // Log usage
  console.log(`AI analyze: user=${user.sub} duration=${duration}ms score=${result.moderation_score}`);

  return NextResponse.json({
    result,
    meta: {
      duration_ms: duration,
      images_analyzed: image_urls.length,
      auto_approve: result.moderation_score >= 85,
    },
  });
});

// ─── POST /api/ai/describe - Generate description ────────────────────────────
const describeSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  condition: z.string(),
  specs: z.record(z.unknown()).default({}),
  category: z.string(),
  user_notes: z.string().optional(),
});

export const POST_describe = withAuth(async (req: NextRequest, user) => {
  if (!checkAIRateLimit(user.sub)) {
    return NextResponse.json({ error: 'Limite atteinte' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = describeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const description = await generateOptimizedDescription(parsed.data);
  return NextResponse.json({ description });
});

// ─── POST /api/ai/price-estimate ─────────────────────────────────────────────
const priceSchema = z.object({
  title: z.string(),
  brand: z.string().optional(),
  model: z.string().optional(),
  condition: z.string(),
  category: z.string(),
  year: z.number().optional(),
});

export const POST_priceEstimate = withAuth(async (req: NextRequest, user) => {
  if (!checkAIRateLimit(user.sub)) {
    return NextResponse.json({ error: 'Limite atteinte' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = priceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const estimate = await estimateMarketPrice(parsed.data);
  return NextResponse.json({ estimate });
});

// ─── POST /api/ai/upload-url - Get presigned S3 URL ─────────────────────────
const uploadSchema = z.object({
  listing_id: z.string(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  file_size: z.number().max(10 * 1024 * 1024),
});

export const POST_uploadUrl = withAuth(async (req: NextRequest, user) => {
  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { listing_id, mime_type, file_size } = parsed.data;

  const result = await getPresignedUploadUrl({
    listingId: listing_id,
    userId: user.sub,
    mimeType: mime_type,
    fileSize: file_size,
  });

  return NextResponse.json(result);
});

// ─── Router ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  if (path.includes('/analyze')) return POST_analyze(req);
  if (path.includes('/describe')) return POST_describe(req);
  if (path.includes('/price-estimate')) return POST_priceEstimate(req);
  if (path.includes('/upload-url')) return POST_uploadUrl(req);
  return NextResponse.json({ error: 'Route inconnue' }, { status: 404 });
}
