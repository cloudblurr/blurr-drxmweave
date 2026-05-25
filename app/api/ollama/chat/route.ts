import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1').replace(/\/$/, '');
const OLLAMA_CHAT_URL = process.env.OLLAMA_CHAT_URL || `${OLLAMA_BASE_URL}/chat/completions`;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const upstream = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': OLLAMA_API_KEY ? `Bearer ${OLLAMA_API_KEY}` : request.headers.get('authorization') || 'Bearer ollama',
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const details = await upstream.text();
    return Response.json(
      { error: 'Ollama request failed', status: upstream.status, details },
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
