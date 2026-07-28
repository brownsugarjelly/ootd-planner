import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ALL_CATEGORIES } from '@/lib/types';
import { MATERIALS, OCCASIONS, SEASONS } from '@/lib/constants';

export const runtime = 'nodejs';

const CLASSIFY_TOOL = {
  name: 'classify_clothing_item',
  description:
    'Record structured metadata describing a single clothing item photo, to help organize a digital wardrobe. Do not describe a person, background, or scene — only the garment itself.',
  input_schema: {
    type: 'object' as const,
    properties: {
      suggestedName: { type: 'string', description: 'A short, sensible default name, e.g. "Sage Green Cardigan".' },
      category: {
        type: 'string',
        enum: ALL_CATEGORIES,
        description:
          'REQUIRED. Look at the garment\'s actual shape and function, not just "clothing": full-length or ankle-length legwear/skirts/shorts -> "bottoms". Footwear of any kind (sneakers, heels, sandals, boots) -> "shoes". Head covering / hijab / scarf worn on the head -> "hijab". Bags/purses/backpacks -> "bag". Jewelry, belts, sunglasses, hats (not head-covering), hair clips, small carried objects -> "accessories". Shirts, hoodies, sweaters, jackets, dresses, blouses -> "tops". Pick exactly one; do not default to "tops" unless the item is genuinely worn on the upper body.',
      },
      garmentType: { type: 'string', description: 'Specific garment type, e.g. "hoodie", "cargo pants", "sneakers".' },
      material: {
        type: 'string',
        enum: [...MATERIALS, 'unknown'],
        description: 'Best guess at the primary material, or "unknown" if not visually determinable.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Up to 8 short descriptive tags (style, texture, fit — e.g. "oversized", "streetwear").',
      },
      occasion: {
        type: 'array',
        items: { type: 'string', enum: OCCASIONS },
        description: 'Likely occasions this item suits (choose 1-3).',
      },
      season: {
        type: 'string',
        enum: [...SEASONS, 'unknown'],
        description: 'Likely season, or "unknown" if it truly could be any season.',
      },
      confidence: { type: 'number', description: 'Your overall confidence in this classification, 0 to 1.' },
    },
    required: ['suggestedName', 'category', 'garmentType', 'tags', 'occasion', 'confidence'],
  },
};export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server yet.' },
      { status: 501 },
    );
  }

  const body = await req.json().catch(() => null);
  const imageBase64: string | undefined = body?.imageBase64;
  const mediaType: string | undefined = body?.mediaType;
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mediaType in request body.' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: 'tool', name: 'classify_clothing_item' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Classify this single clothing item photo for a digital wardrobe app. Call classify_clothing_item with your best-effort structured answer.',
            },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (!toolUse) {
      return NextResponse.json({ error: 'The model did not return structured data.' }, { status: 502 });
    }

    return NextResponse.json({ result: toolUse.input });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling the classification model.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
