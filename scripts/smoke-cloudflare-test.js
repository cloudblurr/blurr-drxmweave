// Simple smoke test for the Cloudflare Worker AI endpoint
// Usage: VITE_CLOUDFLARE_API_URL, VITE_CLOUDFLARE_API_KEY, VITE_CLOUDFLARE_GATEWAY_ID, VITE_CLOUDFLARE_ACCOUNT_ID
// Run chat: node scripts/smoke-cloudflare-test.js
// Run image: MEDIA_MODE=image node scripts/smoke-cloudflare-test.js
// Run video: MEDIA_MODE=video node scripts/smoke-cloudflare-test.js

const apiUrl = process.env.VITE_CLOUDFLARE_API_URL || 'https://grok-chat-api.blnq.workers.dev/v1/chat/completions';
const apiKey = process.env.VITE_CLOUDFLARE_API_KEY || '';
const gatewayId = process.env.VITE_CLOUDFLARE_GATEWAY_ID || '';
const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || '';
const model = process.env.MODEL || 'xai/grok-4.3';
const mediaMode = process.env.MEDIA_MODE || '';
const mediaPrompt = process.env.MEDIA_PROMPT || 'A small holographic loom weaving blue and gold light.';
const mediaUrl =
  mediaMode === 'video'
    ? process.env.VITE_CLOUDFLARE_VIDEO_API_URL || apiUrl.replace('/chat/completions', '/videos/generations')
    : process.env.VITE_CLOUDFLARE_IMAGE_API_URL || apiUrl.replace('/chat/completions', '/images/generations');

const body = {
  model,
  messages: [
    { role: 'system', content: 'You are a test assistant. Respond succinctly.' },
    { role: 'user', content: 'Hello from smoke test — respond with a single sentence identifying the model.' }
  ],
  reasoning_effort: 'high'
};

const headers = { 'Content-Type': 'application/json' };
if (gatewayId) headers['cf-aig-gateway-id'] = gatewayId;
if (accountId) headers['cf-account-id'] = accountId;
if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

(async () => {
  try {
    const targetUrl = mediaMode ? mediaUrl : apiUrl;
    const requestBody = mediaMode
      ? {
          model: mediaMode === 'video' ? 'xai/grok-imagine-video' : 'xai/grok-imagine-image-quality',
          prompt: mediaPrompt,
          response_format: 'b64_json',
        }
      : body;
    const resp = await fetch(targetUrl, { method: 'POST', headers, body: JSON.stringify(requestBody) });
    const text = await resp.text();
    console.log('HTTP', resp.status);
    try {
      console.log('Response JSON:', JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log('Raw response:', text);
    }
  } catch (e) {
    console.error('Request failed:', e);
    process.exit(1);
  }
})();
