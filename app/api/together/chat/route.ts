import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOGETHER_CHAT_URL = process.env.TOGETHER_CHAT_URL || 'https://api.together.ai/v1/chat/completions';
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || process.env.VITE_TOGETHER_API_KEY || '';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const authorization = TOGETHER_API_KEY
    ? `Bearer ${TOGETHER_API_KEY}`
    : request.headers.get('authorization');

  if (!authorization) {
    return Response.json(
      {
        error: 'Together AI API key is required',
        details: 'Set TOGETHER_API_KEY on the server or enter a Together AI key in Settings.',
      },
      { status: 401 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(TOGETHER_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    return Response.json(
      { error: 'Unable to reach Together AI', details: error?.message || 'Unknown network error' },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const details = await upstream.text();
    return Response.json(
      { error: 'Together AI request failed', status: upstream.status, details },
      { status: upstream.status },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
