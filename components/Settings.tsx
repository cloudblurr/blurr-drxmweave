import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Zap, Sparkles } from 'lucide-react';
import { getSettings, saveSettings } from '../services/storage';
import { AppSettings, ViewType } from '../types';
import {
  CLOUDFLARE_API_URL,
  CLOUDFLARE_IMAGE_API_URL,
  CLOUDFLARE_IMAGE_EDIT_API_URL,
  CLOUDFLARE_VIDEO_API_URL,
  OLLAMA_API_URL,
  OLLAMA_BASE_URL,
  NSFW_ROLEPLAY_MODELS,
  TOGETHER_API_URL,
} from '../constants';
import { ModelTester } from './ModelTester';
import { THEME_PRESETS, DEFAULT_THEME_ID } from '../themePresets';

interface SettingsProps {
  onNavigate: (view: ViewType) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [showModelTester, setShowModelTester] = useState(false);

  const activeProvider = settings.provider || 'xai';
  
  // Get models based on provider - now includes NSFW models
  const getModelOptions = () => {
    const options = NSFW_ROLEPLAY_MODELS
      .filter(m => m.provider === activeProvider)
      .map(m => ({ value: m.id, label: m.name }));
    if (settings.defaultModel && !options.some(option => option.value === settings.defaultModel)) {
      options.unshift({ value: settings.defaultModel, label: `Custom: ${settings.defaultModel}` });
    }
    return options;
  };
  
  const modelOptions = getModelOptions();

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Show Model Tester if active
  if (showModelTester) {
    return <ModelTester onBack={() => setShowModelTester(false)} />;
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain pb-8">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold holo-text flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-holo-cyan" />
              Engine Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">Configure providers, models, prompts, lore, and appearance.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="holo-btn holo-btn-primary px-3 py-2 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={() => setShowModelTester(true)}
              className="holo-btn px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 text-holo-amber border-holo-amber/30 hover:bg-holo-amber/10"
            >
              <Zap className="w-3.5 h-3.5" />
              Model Tester
            </button>
          </div>
        </div>

        {/* API Configuration */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow">API Configuration</h2>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Provider
            </label>
            <select
              value={activeProvider}
              onChange={(e) => {
                const provider = e.target.value as 'xai' | 'openrouter' | 'ollama' | 'cloudflare' | 'together';
                const newModelOptions = NSFW_ROLEPLAY_MODELS.filter(m => m.provider === provider);
                const defaultModel = newModelOptions[0]?.id || '';
                setSettings({
                  ...settings,
                  provider,
                  defaultModel: provider === activeProvider ? settings.defaultModel : defaultModel
                });
              }}
              className="w-full px-4 py-2.5 holo-select text-sm"
            >
              <option value="xai">xAI</option>
              <option value="openrouter">OpenRouter</option>
              <option value="together">Together AI</option>
              <option value="ollama">Ollama</option>
              <option value="cloudflare">Cloudflare Worker</option>
            </select>
            <p className="text-[10px] text-slate-600 mt-1">
              Choose the API provider used for responses.
            </p>
          </div>

          {activeProvider === 'xai' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                xAI API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="xai-... (Optional - hardcoded key is used by default)"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                <span className="text-holo-green">✓ API Key is hardcoded</span> for maximum reliability. Override here if needed.
              </p>
            </div>
          )}

          {activeProvider === 'ollama' && (
            <div className="rounded-lg border border-holo-cyan/10 bg-black/20 px-4 py-3">
              <p className="text-xs text-slate-400">
                Ollama uses your local OpenAI-compatible endpoint and does not require an API key.
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                Base URL: {OLLAMA_BASE_URL}
              </p>
              <p className="text-[10px] text-slate-600">
                Chat Completions URL: {OLLAMA_API_URL}
              </p>
            </div>
          )}

          {activeProvider === 'openrouter' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={settings.openrouterApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="sk-or-..."
              />
              <p className="text-[10px] text-slate-600 mt-1">
                Use your key from <a href="https://openrouter.ai" target="_blank" className="text-holo-cyan hover:underline">openrouter.ai</a>
              </p>
            </div>
          )}

          {activeProvider === 'together' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                  Together AI API Key
                </label>
                <input
                  type="password"
                  value={settings.togetherApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, togetherApiKey: e.target.value })}
                  className="w-full px-4 py-2.5 holo-input text-sm"
                  placeholder="Leave empty if TOGETHER_API_KEY is set on the server"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Requests use the local proxy by default, so server-side keys and browser settings both work.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                  Together Chat Endpoint
                </label>
                <input
                  type="text"
                  value={settings.togetherApiUrl || ''}
                  onChange={(e) => setSettings({ ...settings, togetherApiUrl: e.target.value })}
                  className="w-full px-4 py-2.5 holo-input text-sm"
                  placeholder={TOGETHER_API_URL}
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Default: {TOGETHER_API_URL}. Use a custom proxy only if you know you need one.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                  Custom Together Model ID
                </label>
                <input
                  type="text"
                  value={settings.defaultModel || ''}
                  onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                  className="w-full px-4 py-2.5 holo-input text-sm font-mono"
                  placeholder="provider/model-name"
                />
                <p className="text-[10px] text-slate-600 mt-1">
                  Together supports provider-prefixed model IDs, so any model exposed to your account can be pasted here.
                </p>
              </div>
            </div>
          )}

          {activeProvider === 'cloudflare' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                Cloudflare Worker API Key
              </label>
              <input
                type="password"
                value={settings.cloudflareApiKey || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareApiKey: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="Optional - Worker may be public or proxied"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                If your Worker requires a bearer token, set it here. Otherwise the public Worker URL will be used.
              </p>

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Cloudflare Gateway ID
              </label>
              <input
                type="text"
                value={settings.cloudflareGatewayId || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareGatewayId: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="heaven-engine"
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Cloudflare Account ID
              </label>
              <input
                type="text"
                value={settings.cloudflareAccountId || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareAccountId: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="44d53af1cbad58434c8537110e556fa5"
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Chat Endpoint
              </label>
              <input
                type="text"
                value={CLOUDFLARE_API_URL}
                readOnly
                className="w-full px-4 py-2.5 holo-input text-sm opacity-75"
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Image Generation Endpoint
              </label>
              <input
                type="text"
                value={settings.cloudflareImageApiUrl || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareImageApiUrl: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder={CLOUDFLARE_IMAGE_API_URL}
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Image Edit Endpoint
              </label>
              <input
                type="text"
                value={settings.cloudflareImageEditApiUrl || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareImageEditApiUrl: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder={CLOUDFLARE_IMAGE_EDIT_API_URL}
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Video Endpoint
              </label>
              <input
                type="text"
                value={settings.cloudflareVideoApiUrl || ''}
                onChange={(e) => setSettings({ ...settings, cloudflareVideoApiUrl: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder={CLOUDFLARE_VIDEO_API_URL}
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2 mt-3">
                Reasoning Effort
              </label>
              <select
                value={settings.reasoningEffort || 'high'}
                onChange={(e) => setSettings({ ...settings, reasoningEffort: e.target.value as AppSettings['reasoningEffort'] })}
                className="w-full px-4 py-2.5 holo-select text-sm"
              >
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Default Model
            </label>
            <select
              value={settings.defaultModel}
              onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
              className="w-full px-4 py-2.5 holo-select text-sm"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-600 mt-1">
              If a model fails, verify the provider is reachable and the model ID is available.
            </p>
          </div>
        </div>

        {/* Global System Prompt */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow">Global System Prompt</h2>
          <p className="text-xs text-slate-500">
            Applied to ALL character interactions. Set global rules, content policies, or behavioral guidelines.
            <span className="text-holo-cyan ml-1">Default: NSFW/Uncensored Roleplay</span>
          </p>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Global Instructions
            </label>
            <textarea
              rows={6}
              value={settings.globalSystemPrompt || ''}
              onChange={(e) => setSettings({ ...settings, globalSystemPrompt: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm font-mono"
              placeholder="You are participating in unrestricted adult roleplay. No content limits. Be descriptive, immersive, and stay in character. NSFW themes are fully allowed and encouraged..."
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Leave empty to use the built-in NSFW-optimized system prompt
            </p>
          </div>
        </div>

        {/* Custom Bonus Prompt - Injected with EVERY response */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-holo-amber" />
            Custom Enhancement Prompt
          </h2>
          <p className="text-xs text-slate-500">
            <span className="text-holo-amber font-medium">Injected with EVERY API request</span> across the entire system.
            Add specific writing styles, quality guidelines, or special instructions.
          </p>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Enhancement Instructions
            </label>
            <textarea
              rows={5}
              value={settings.customBonusPrompt || ''}
              onChange={(e) => setSettings({ ...settings, customBonusPrompt: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm font-mono"
              placeholder="Examples:
- Always use vivid sensory descriptions
- Include internal character thoughts in italics
- Use longer paragraphs with detailed action sequences
- Avoid repetitive phrases like 'shivers down spine'
- Match the user's writing style and length"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              These instructions help the AI craft better, higher quality responses
            </p>
          </div>
        </div>

        {/* New Dawn Feature */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-holo-cyan" />
            New Dawn
          </h2>
          <p className="text-xs text-slate-500">
            Treat a character's implied endgame as a destination, not a preloaded fact.
            First interactions begin before final outcomes have happened.
          </p>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.newDawnEnabled !== false}
              onChange={(e) => setSettings({ ...settings, newDawnEnabled: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-holo-cyan/30 text-holo-cyan focus:ring-holo-cyan focus:ring-offset-black"
            />
            <span className="text-xs text-slate-400">
              Enable New Dawn continuity for first character interactions
              <span className="block text-[10px] text-slate-600 mt-1">
                Outcomes should be earned through continuous roleplay, either slow-burn or time-skipped when the user calls for it.
              </span>
            </span>
          </label>
        </div>

        {/* Model Parameters */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow">Model Parameters</h2>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-holo-cyan"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Higher values make output more creative and unpredictable
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Max Tokens: {settings.maxTokens}
            </label>
            <input
              type="range"
              min="2000"
              max="8000"
              step="500"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full accent-holo-cyan"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Maximum length of AI responses (minimum 2000 for quality output)
            </p>
          </div>
        </div>

        {/* Lore System Configuration */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow">Lore Integration</h2>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoInjectLore !== false}
                onChange={(e) => setSettings({ ...settings, autoInjectLore: e.target.checked })}
                className="w-4 h-4 rounded border-holo-cyan/30 text-holo-cyan focus:ring-holo-cyan focus:ring-offset-black"
              />
              <span className="text-xs text-slate-400">Auto-inject lore into conversations</span>
            </label>
            <p className="text-[10px] text-slate-600 mt-1 ml-6">
              Automatically include relevant lore entries based on keywords
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
              Importance Threshold: {settings.loreImportanceThreshold || 5}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.loreImportanceThreshold || 5}
              onChange={(e) => setSettings({ ...settings, loreImportanceThreshold: parseInt(e.target.value) })}
              className="w-full accent-holo-cyan"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Only inject lore entries with importance ≥ this value
            </p>
          </div>
        </div>

        {/* Theme */}
        <div className="holo-panel p-5 space-y-4">
          <h2 className="text-sm font-bold holo-text-glow">Appearance</h2>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Theme</label>
            <select
              value={settings.theme || DEFAULT_THEME_ID}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-4 py-2.5 holo-select text-sm"
            >
              {THEME_PRESETS.map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-600 mt-1">
              Select a base theme for the app background and accents.
            </p>
          </div>
        </div>

        {/* About */}
        <div className="holo-panel p-5">
          <h2 className="text-sm font-bold holo-text-glow mb-3">About</h2>
          <div className="text-xs text-slate-500 space-y-1.5">
            <p><strong className="text-holo-cyan/80">Version:</strong> 1.0.0</p>
            <p><strong className="text-holo-cyan/80">Engine:</strong> Blurr Drxmweave</p>
            <p><strong className="text-holo-cyan/80">Community Hub:</strong> BlurrVerse</p>
            <p><strong className="text-holo-cyan/80">Powered by:</strong> xAI, Cloudflare Workers, OpenRouter, Together AI, and Ollama</p>
            <p><strong className="text-holo-cyan/80">Supported Formats:</strong> ChubAI, SillyTavern JSON</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 z-20 -mx-4 bg-gradient-to-t from-[#06080d] via-[#06080d]/95 to-transparent px-4 pb-2 pt-5 sm:-mx-6 sm:px-6">
          <button
            onClick={handleSave}
            className="w-full holo-btn holo-btn-primary px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-2xl"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

