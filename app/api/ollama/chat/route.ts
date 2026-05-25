import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_OLLAMA_BASE_URL = 'https://sharp-suites-pipes-hon.trycloudflare.com/v1';
const DEFAULT_OLLAMA_API_KEY = 'GyF8ZBlLjEwIdqTfARWa76tC5vehkcu1zn3PY0J4NXQO9pMU';
const DEFAULT_OLLAMA_MODEL = 'fredrezones55/Qwen3.5-Uncensored-HauhauCS-Aggressive:9b';
const AVAILABLE_OLLAMA_MODELS = new Set([
  DEFAULT_OLLAMA_MODEL,
  'reefer/monica',
  'reefer/monicamaxlvl',
]);

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, '');
const OLLAMA_CHAT_URL = process.env.OLLAMA_CHAT_URL || `${OLLAMA_BASE_URL}/chat/completions`;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || DEFAULT_OLLAMA_API_KEY;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const requestBody = normalizeModel(body);

  let upstream: Response;
  try {
    upstream = await fetch(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': OLLAMA_API_KEY ? `Bearer ${OLLAMA_API_KEY}` : request.headers.get('authorization') || 'Bearer ollama',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error: any) {
    return Response.json(
      { error: 'Unable to reach Ollama endpoint', details: error?.message || 'Unknown network error' },
      { status: 502 },
    );
  }

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

function normalizeModel(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const requestBody = { ...(body as Record<string, unknown>) };
  const model = typeof requestBody.model === 'string' ? requestBody.model : '';
  if (!AVAILABLE_OLLAMA_MODELS.has(model)) {
    requestBody.model = DEFAULT_OLLAMA_MODEL;
  }

  return requestBody;
}
