import {
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_API_URL,
  CLOUDFLARE_GATEWAY_ID,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_IMAGE_API_URL,
  CLOUDFLARE_IMAGE_EDIT_API_URL,
  CLOUDFLARE_VIDEO_API_URL,
} from '../constants';

interface CallOptions {
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  reasoning_effort?: 'none' | 'low' | 'medium' | 'high';
  accountId?: string;
  gatewayId?: string;
  apiKey?: string;
}

export type CloudflareMediaMode = 'image' | 'edit' | 'video';

export interface CloudflareMediaOptions {
  mode: CloudflareMediaMode;
  model: string;
  prompt: string;
  imageDataUrl?: string;
  size?: string;
  quality?: string;
  aspectRatio?: string;
  duration?: number;
  accountId?: string;
  gatewayId?: string;
  apiKey?: string;
  imageApiUrl?: string;
  imageEditApiUrl?: string;
  videoApiUrl?: string;
}

export interface CloudflareMediaResult {
  kind: 'image' | 'video' | 'json';
  url?: string;
  dataUrl?: string;
  mimeType?: string;
  raw: unknown;
}

function buildHeaders(options: {
  apiKey?: string;
  gatewayId?: string;
  accountId?: string;
}): Record<string, string> {
  const apiKey = options.apiKey || CLOUDFLARE_API_KEY || '';
  const gatewayId = options.gatewayId || CLOUDFLARE_GATEWAY_ID;
  const accountId = options.accountId || CLOUDFLARE_ACCOUNT_ID;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (gatewayId) headers['cf-aig-gateway-id'] = gatewayId;
  if (accountId) headers['cf-account-id'] = accountId;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  return headers;
}

async function parseResponse(resp: Response): Promise<any> {
  const text = await resp.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function extractAssistantText(data: any): string {
  if (Array.isArray(data?.choices) && data.choices[0]?.message) {
    return (data.choices[0].message.content || data.choices[0].message.reasoning || '').trim();
  }
  if (Array.isArray(data?.output) && data.output[0]?.content) {
    const content = data.output[0].content;
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((part) => part?.text || part?.content || '')
        .filter(Boolean)
        .join('\n')
        .trim();
    }
  }
  if (typeof data?.result === 'string') return data.result.trim();
  if (typeof data?.response === 'string') return data.response.trim();
  if (typeof data?.text === 'string') return data.text.trim();
  return JSON.stringify(data);
}

/**
 * Cloudflare Worker / AI Gateway chat client.
 * The default endpoint is OpenAI-compatible, so the app can route Grok 4.3
 * through a Worker without exposing provider details to the UI.
 */
export async function callCloudflareAI(options: CallOptions): Promise<string> {
  const body: any = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature ?? 1.0,
    max_tokens: options.max_tokens ?? 2000,
    top_p: options.top_p ?? 1.0,
  };
  if (options.reasoning_effort && options.reasoning_effort !== 'none') {
    body.reasoning_effort = options.reasoning_effort;
  }

  const resp = await fetch(CLOUDFLARE_API_URL, {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });

  const data = await parseResponse(resp);
  if (!resp.ok) {
    throw new Error(`Cloudflare AI HTTP ${resp.status}: ${resp.statusText} - ${JSON.stringify(data)}`);
  }

  return extractAssistantText(data);
}

function mediaEndpoint(options: CloudflareMediaOptions): string {
  if (options.mode === 'video') return options.videoApiUrl || CLOUDFLARE_VIDEO_API_URL;
  if (options.mode === 'edit') return options.imageEditApiUrl || CLOUDFLARE_IMAGE_EDIT_API_URL;
  return options.imageApiUrl || CLOUDFLARE_IMAGE_API_URL;
}

function extractMediaResult(data: any, mode: CloudflareMediaMode): CloudflareMediaResult {
  const first = Array.isArray(data?.data) ? data.data[0] : undefined;
  const output = Array.isArray(data?.output) ? data.output[0] : undefined;
  const result = data?.result;
  const candidate = first || output || result || data;

  const url =
    candidate?.url ||
    candidate?.video_url ||
    candidate?.image_url ||
    candidate?.asset_url ||
    (typeof result === 'string' && /^https?:\/\//i.test(result) ? result : undefined);

  const b64 =
    candidate?.b64_json ||
    candidate?.base64 ||
    candidate?.image ||
    candidate?.data;

  if (typeof b64 === 'string' && !/^https?:\/\//i.test(b64)) {
    const mimeType = mode === 'video' ? 'video/mp4' : 'image/png';
    const dataUrl = b64.startsWith('data:') ? b64 : `data:${mimeType};base64,${b64}`;
    return { kind: mode === 'video' ? 'video' : 'image', dataUrl, mimeType, raw: data };
  }

  if (url) {
    return {
      kind: mode === 'video' ? 'video' : 'image',
      url,
      mimeType: mode === 'video' ? 'video/mp4' : 'image/png',
      raw: data,
    };
  }

  return { kind: 'json', raw: data };
}

export async function generateCloudflareMedia(options: CloudflareMediaOptions): Promise<CloudflareMediaResult> {
  const body: Record<string, unknown> = {
    model: options.model,
    prompt: options.prompt,
  };

  if (options.size) body.size = options.size;
  if (options.quality) body.quality = options.quality;
  if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options.duration) body.duration = options.duration;
  if (options.mode !== 'video') body.response_format = 'b64_json';
  if (options.imageDataUrl) {
    body.image = options.imageDataUrl;
    body.input_image = options.imageDataUrl;
  }

  const resp = await fetch(mediaEndpoint(options), {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });

  const data = await parseResponse(resp);
  if (!resp.ok) {
    throw new Error(`Cloudflare media HTTP ${resp.status}: ${resp.statusText} - ${JSON.stringify(data)}`);
  }

  return extractMediaResult(data, options.mode);
}

export default callCloudflareAI;
