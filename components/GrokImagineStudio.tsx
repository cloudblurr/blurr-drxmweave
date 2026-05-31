import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  CLOUDFLARE_IMAGE_API_URL,
  CLOUDFLARE_IMAGE_EDIT_API_URL,
  CLOUDFLARE_IMAGE_MODEL_OPTIONS,
  CLOUDFLARE_VIDEO_API_URL,
  CLOUDFLARE_VIDEO_MODEL_OPTIONS,
} from '../constants';
import { generateCloudflareMedia, CloudflareMediaMode, CloudflareMediaResult } from '../services/cloudflareClient';
import { getSettings } from '../services/storage';
import { ViewType } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface GrokImagineStudioProps {
  onNavigate: (view: ViewType) => void;
}

interface HistoryItem extends CloudflareMediaResult {
  id: string;
  prompt: string;
  model: string;
  mode: CloudflareMediaMode;
  createdAt: number;
}

const imageSizes = ['1024x1024', '1024x768', '768x1024', '1536x1024', '1024x1536'];
const aspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function resultSource(result: CloudflareMediaResult | HistoryItem): string {
  return result.dataUrl || result.url || '';
}

export const GrokImagineStudio: React.FC<GrokImagineStudioProps> = ({ onNavigate }) => {
  const settings = getSettings();
  const [mode, setMode] = useState<CloudflareMediaMode>('image');
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState(CLOUDFLARE_IMAGE_MODEL_OPTIONS[0]?.id || 'xai/grok-imagine-image-quality');
  const [videoModel, setVideoModel] = useState(CLOUDFLARE_VIDEO_MODEL_OPTIONS[0]?.id || 'xai/grok-imagine-video');
  const [size, setSize] = useState(imageSizes[0]);
  const [quality, setQuality] = useState('high');
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [duration, setDuration] = useState(6);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CloudflareMediaResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const activeModel = mode === 'video' ? videoModel : imageModel;
  const endpointLabel = useMemo(() => {
    if (mode === 'video') return settings.cloudflareVideoApiUrl || CLOUDFLARE_VIDEO_API_URL;
    if (mode === 'edit') return settings.cloudflareImageEditApiUrl || CLOUDFLARE_IMAGE_EDIT_API_URL;
    return settings.cloudflareImageApiUrl || CLOUDFLARE_IMAGE_API_URL;
  }, [mode, settings.cloudflareImageApiUrl, settings.cloudflareImageEditApiUrl, settings.cloudflareVideoApiUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSourceImage(await readFileAsDataUrl(file));
      if (mode === 'image') setMode('edit');
    } catch (err: any) {
      setError(err?.message || 'Unable to load image');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const nextResult = await generateCloudflareMedia({
        mode,
        model: activeModel,
        prompt: prompt.trim(),
        imageDataUrl: sourceImage || undefined,
        size: mode === 'video' ? undefined : size,
        quality: mode === 'video' ? undefined : quality,
        aspectRatio: mode === 'video' ? aspectRatio : undefined,
        duration: mode === 'video' ? duration : undefined,
        apiKey: settings.cloudflareApiKey,
        gatewayId: settings.cloudflareGatewayId,
        accountId: settings.cloudflareAccountId,
        imageApiUrl: settings.cloudflareImageApiUrl,
        imageEditApiUrl: settings.cloudflareImageEditApiUrl,
        videoApiUrl: settings.cloudflareVideoApiUrl,
      });

      setResult(nextResult);
      setHistory((items) => [
        {
          ...nextResult,
          id: `${Date.now()}`,
          prompt: prompt.trim(),
          model: activeModel,
          mode,
          createdAt: Date.now(),
        },
        ...items,
      ].slice(0, 12));
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate(ViewType.Dashboard)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-300" />
                Grok Imagine
              </h1>
              <p className="text-xs text-slate-400">Cloudflare Worker media route</p>
            </div>
          </div>
          <div className="hidden max-w-sm truncate text-right text-[10px] text-slate-500 md:block">
            {endpointLabel}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prompt</CardTitle>
                <CardDescription>{activeModel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <ModeButton active={mode === 'image'} icon={<ImageIcon className="h-4 w-4" />} label="Image" onClick={() => setMode('image')} />
                  <ModeButton active={mode === 'edit'} icon={<RefreshCw className="h-4 w-4" />} label="Edit" onClick={() => setMode('edit')} />
                  <ModeButton active={mode === 'video'} icon={<Video className="h-4 w-4" />} label="Video" onClick={() => setMode('video')} />
                </div>

                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={7}
                  className="neo-input min-h-40 w-full resize-y rounded-xl px-3 py-3 text-sm leading-relaxed"
                  placeholder="A cinematic portrait of a neon oracle inside a rainlit observatory, detailed face, glass reflections"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">Model</span>
                    <select
                      value={activeModel}
                      onChange={(event) => mode === 'video' ? setVideoModel(event.target.value) : setImageModel(event.target.value)}
                      className="neo-input w-full rounded-xl px-3 py-2 text-xs"
                    >
                      {(mode === 'video' ? CLOUDFLARE_VIDEO_MODEL_OPTIONS : CLOUDFLARE_IMAGE_MODEL_OPTIONS).map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </label>

                  {mode === 'video' ? (
                    <label className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">Aspect</span>
                      <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)} className="neo-input w-full rounded-xl px-3 py-2 text-xs">
                        {aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                      </select>
                    </label>
                  ) : (
                    <label className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">Size</span>
                      <select value={size} onChange={(event) => setSize(event.target.value)} className="neo-input w-full rounded-xl px-3 py-2 text-xs">
                        {imageSizes.map((imageSize) => <option key={imageSize} value={imageSize}>{imageSize}</option>)}
                      </select>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {mode === 'video' ? (
                    <label className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">Seconds</span>
                      <input
                        type="number"
                        min={3}
                        max={12}
                        value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                        className="neo-input w-full rounded-xl px-3 py-2 text-xs"
                      />
                    </label>
                  ) : (
                    <label className="space-y-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-500">Quality</span>
                      <select value={quality} onChange={(event) => setQuality(event.target.value)} className="neo-input w-full rounded-xl px-3 py-2 text-xs">
                        <option value="high">High</option>
                        <option value="standard">Standard</option>
                      </select>
                    </label>
                  )}

                  <label className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">Source</span>
                    <span className="neo-input flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </span>
                  </label>
                </div>

                {sourceImage && (
                  <div className="relative overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950">
                    <img src={sourceImage} alt="Source" className="h-36 w-full object-cover" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSourceImage(null)}
                      className="absolute right-2 top-2 h-8 w-8 rounded-full bg-slate-950/80 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full justify-center gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isGenerating ? 'Generating' : 'Generate'}
                </Button>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base">Result</CardTitle>
                <CardDescription>{result ? activeModel : 'Awaiting generation'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/70">
                  {result && result.kind === 'image' && resultSource(result) ? (
                    <img src={resultSource(result)} alt="Generated" className="max-h-[680px] w-full object-contain" />
                  ) : result && result.kind === 'video' && resultSource(result) ? (
                    <video src={resultSource(result)} controls className="max-h-[680px] w-full" />
                  ) : result ? (
                    <pre className="max-h-[520px] w-full overflow-auto p-4 text-xs text-slate-300">{JSON.stringify(result.raw, null, 2)}</pre>
                  ) : (
                    <div className="text-center text-slate-600">
                      <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                      <p className="text-xs uppercase tracking-wide">No output</p>
                    </div>
                  )}
                </div>
                {result && resultSource(result) && (
                  <div className="mt-3 flex justify-end">
                    <Button asChild variant="secondary" size="sm">
                      <a href={resultSource(result)} download>
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setResult(item)}
                        className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60 text-left transition-transform hover:-translate-y-0.5"
                      >
                        <div className="aspect-square bg-slate-950">
                          {item.kind === 'image' && resultSource(item) ? (
                            <img src={resultSource(item)} alt="" className="h-full w-full object-cover" />
                          ) : item.kind === 'video' && resultSource(item) ? (
                            <video src={resultSource(item)} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-600">
                              <Sparkles className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-xs text-slate-200">{item.prompt}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{item.mode}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModeButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      `flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-medium transition-colors ` +
      (active
        ? 'border-sky-300/50 bg-sky-400/15 text-sky-100'
        : 'border-slate-700/70 bg-slate-950/40 text-slate-400 hover:bg-slate-900')
    }
  >
    {icon}
    {label}
  </button>
);

