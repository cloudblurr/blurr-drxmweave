import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Code2, Move, GripVertical, Pause, Play, Minimize2, Maximize2, Scan, Loader2 } from 'lucide-react';
import { GalleryItem } from '../types';

interface OracleViewerProps {
  items: GalleryItem[];
  initialIndex?: number;
  onClose: () => void;
}

/* ─── Filmstrip Thumbnail ─── */
const FilmThumb: React.FC<{
  item: GalleryItem;
  active: boolean;
  onClick: () => void;
}> = ({ item, active, onClick }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (item.thumbnail) { setUrl(item.thumbnail); return; }
    if (item.blob && (item.type === 'image' || item.type === 'video')) {
      const u = URL.createObjectURL(item.blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [item.thumbnail, item.blob, item.type]);

  return (
    <button
      onClick={onClick}
      className={`
        relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200
        ${active
          ? 'border-amber-300 shadow-[0_0_10px_rgba(211,172,88,0.45)] scale-110'
          : 'border-transparent opacity-50 hover:opacity-85 hover:border-blue-400/30'}
      `}
    >
      {url ? (
        item.type === 'video' ? (
          <video src={url} muted preload="none" className="w-full h-full object-cover" />
        ) : (
          <img src={url} alt={item.name} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          {item.type === 'video' ? <Video className="w-3 h-3 text-slate-600" /> :
           item.type === 'embed' ? <Code2 className="w-3 h-3 text-slate-600" /> :
           <ImageIcon className="w-3 h-3 text-slate-600" />}
        </div>
      )}
      {item.type === 'video' && (
        <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-[3px] border-l-white border-y-2 border-y-transparent ml-px" />
        </div>
      )}
    </button>
  );
};

/* ─── Clamp helper (keep window inside viewport) ─── */
function clampPosition(x: number, y: number, w: number, h: number) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    x: Math.max(0, Math.min(vw - Math.min(w, 120), x)),
    y: Math.max(0, Math.min(vh - 48, y)),
  };
}

const HEADER_HEIGHT = 32;
const CONTROL_BAR_HEIGHT = 44;
const FILMSTRIP_HEIGHT = 56;

function getFittedViewerSize(mediaW: number, mediaH: number, hasFilmstrip: boolean) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;

  const maxStageW = Math.floor(vw * 0.78);
  const maxStageH = Math.floor(vh * 0.68);

  const safeMediaW = Math.max(1, mediaW || 16);
  const safeMediaH = Math.max(1, mediaH || 9);
  const scale = Math.min(maxStageW / safeMediaW, maxStageH / safeMediaH, 1);

  const stageW = Math.max(280, Math.round(safeMediaW * scale));
  const stageH = Math.max(180, Math.round(safeMediaH * scale));
  const chromeH = HEADER_HEIGHT + CONTROL_BAR_HEIGHT + (hasFilmstrip ? FILMSTRIP_HEIGHT : 0);

  return {
    w: stageW,
    h: stageH + chromeH,
  };
}

/* ─── Main Floating Viewer ─── */
export const OracleViewer: React.FC<OracleViewerProps> = ({ items, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(Math.max(0, Math.min(initialIndex, items.length - 1)));
  const item = items[currentIndex] ?? items[0];
  const [mediaUrl, setMediaUrl] = useState('');

  // Window position & sizing
  const [pos, setPos] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return { x: Math.max(16, vw - 560), y: 60 };
  });
  const [size, setSize] = useState({ w: 520, h: 360 });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const resizeStart = useRef({ mx: 0, my: 0, w: 0, h: 0 });

  // Typing fade: listen for any focus on input/textarea globally
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const autoFitBaseRef = useRef<{ w: number; h: number } | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(((idx % items.length) + items.length) % items.length);
  }, [items.length]);

  /* ── Typing detection: when user focuses an input/textarea anywhere, fade the chrome ── */
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.contentEditable === 'true') {
        setIsTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.contentEditable === 'true') {
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setIsTyping(false), 600);
      }
    };
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  /* ── Keyboard nav ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // Only navigate if focus is NOT on an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (items.length <= 1) return;
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [items.length, currentIndex, goTo, onClose]);

  /* ── Blob URL lifecycle ── */
  useEffect(() => {
    if (!item || item.type === 'embed') { setMediaUrl(''); return; }
    if (item.blob) {
      const u = URL.createObjectURL(item.blob);
      setMediaUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setMediaUrl('');
  }, [item?.id, item?.type, item?.blob]);

  /* ── Native HTML5 video controls (no Plyr — fixes the runtime .call() error) ── */
  useEffect(() => {
    if (item?.type === 'video' && videoRef.current && mediaUrl) {
      const v = videoRef.current;
      v.load();
      setIsBuffering(true);
      v.play().catch(() => {});
      v.playbackRate = playbackRate;
    }
  }, [item?.type, mediaUrl, item?.id, playbackRate]);

  useEffect(() => {
    if (item?.type !== 'video' || !videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, item?.type]);

  useEffect(() => {
    setPlaybackRate(1);
    setNaturalSize(null);
  }, [item?.id]);

  useEffect(() => {
    if (!naturalSize) return;
    const fitted = getFittedViewerSize(naturalSize.w, naturalSize.h, items.length > 1);
    autoFitBaseRef.current = fitted;
    setSize(fitted);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const centered = clampPosition(Math.round((vw - fitted.w) / 2), pos.y, fitted.w, fitted.h);
    setPos(centered);
  }, [naturalSize, items.length]);

  const applyScale = (multiplier: number) => {
    const base = autoFitBaseRef.current ?? size;
    const next = {
      w: Math.round(base.w * multiplier),
      h: Math.round(base.h * multiplier),
    };
    const clamped = {
      w: Math.max(280, Math.min(next.w, Math.floor((window.innerWidth || 1400) * 0.94))),
      h: Math.max(220, Math.min(next.h, Math.floor((window.innerHeight || 900) * 0.94))),
    };
    setSize(clamped);
    setPos((prev) => clampPosition(prev.x, prev.y, clamped.w, clamped.h));
  };

  const fitToMedia = () => {
    if (!naturalSize) return;
    const fitted = getFittedViewerSize(naturalSize.w, naturalSize.h, items.length > 1);
    autoFitBaseRef.current = fitted;
    setSize(fitted);
    setPos((prev) => clampPosition(prev.x, prev.y, fitted.w, fitted.h));
  };

  const togglePlayback = () => {
    if (item?.type !== 'video' || !videoRef.current) return;
    const video = videoRef.current;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  /* ── Auto-scroll filmstrip ── */
  useEffect(() => {
    if (!filmstripRef.current) return;
    const active = filmstripRef.current.children[currentIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  /* ── Drag handling ── */
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  /* ── Resize handling ── */
  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        const nx = dragStart.current.px + (e.clientX - dragStart.current.mx);
        const ny = dragStart.current.py + (e.clientY - dragStart.current.my);
        const c = clampPosition(nx, ny, size.w, size.h);
        setPos(c);
      }
      if (isResizing) {
        const nw = Math.max(280, resizeStart.current.w + (e.clientX - resizeStart.current.mx));
        const nh = Math.max(200, resizeStart.current.h + (e.clientY - resizeStart.current.my));
        setSize({ w: nw, h: nh });
      }
    };
    const onUp = () => { setIsDragging(false); setIsResizing(false); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [isDragging, isResizing, size.w, size.h]);

  /* chrome opacity state */
  const chromeOpacity = isTyping ? 'opacity-20' : 'opacity-100';
  const borderStyle = isTyping
    ? 'border-transparent shadow-none'
    : 'border-amber-300/30 shadow-[0_0_30px_rgba(211,172,88,0.12),0_8px_32px_rgba(0,0,0,0.55)]';

  return (
    <div
      className={`fixed z-9999 rounded-2xl overflow-hidden transition-all duration-500 ease-out ${borderStyle} border-2`}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* ── Drag header ── */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 cursor-move select-none transition-all duration-500
          bg-linear-to-r from-black/80 via-slate-950/70 to-black/80 backdrop-blur-xl
          border-b border-amber-200/15 ${chromeOpacity}`}
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Move className="w-3.5 h-3.5 text-amber-300/60 shrink-0" />
          {items.length > 1 && (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={() => goTo(currentIndex - 1)}
              className="p-0.5 hover:bg-amber-200/10 rounded transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-amber-200" />
            </button>
          )}
          <span className="text-xs font-medium text-amber-100/90 truncate max-w-35">
            {item?.name}
          </span>
          {items.length > 1 && (
            <>
              <span className="text-[10px] text-slate-500">{currentIndex + 1}/{items.length}</span>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => goTo(currentIndex + 1)}
                className="p-0.5 hover:bg-amber-200/10 rounded transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-amber-200" />
              </button>
            </>
          )}
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onClose}
          className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
        </button>
      </div>

      {/* ── Viewer controls ── */}
      <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 bg-black/75 border-b border-amber-200/10 ${chromeOpacity}`}>
        <div className="flex items-center gap-1.5">
          <button onClick={() => applyScale(0.85)} className="p-1 hover:bg-slate-800/70 rounded" title="Smaller viewer">
            <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button onClick={() => applyScale(1.15)} className="p-1 hover:bg-slate-800/70 rounded" title="Larger viewer">
            <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
          </button>
          <button onClick={fitToMedia} className="p-1 hover:bg-slate-800/70 rounded" title="Fit media to viewer">
            <Scan className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>

        {item?.type === 'video' && (
          <div className="flex items-center gap-2">
            <button onClick={togglePlayback} className="p-1 hover:bg-slate-800/70 rounded" title="Play or pause">
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-100" /> : <Play className="w-3.5 h-3.5 text-amber-100" />}
            </button>
            <label className="text-[10px] text-slate-400">Speed</label>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="h-7 rounded-md border border-amber-200/20 bg-slate-950 px-2 text-[11px] text-slate-100"
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.50x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.00x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.50x</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Media stage ── */}
      <div className="relative w-full bg-black" style={{ height: `calc(100% - ${HEADER_HEIGHT + CONTROL_BAR_HEIGHT}px)` }}>
        {item.type === 'video' ? (
          mediaUrl ? (
            <>
              <video
                key={`v-${item.id}`}
                ref={videoRef}
                src={mediaUrl}
                className="w-full h-full object-contain"
                onLoadedMetadata={(event) => {
                  setNaturalSize({
                    w: event.currentTarget.videoWidth || 16,
                    h: event.currentTarget.videoHeight || 9,
                  });
                  setIsPlaying(!event.currentTarget.paused);
                  setIsBuffering(false);
                }}
                onPlay={() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                }}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                playsInline
                loop
                controls
                preload="auto"
                autoPlay
                controlsList="nodownload"
                style={{ background: '#000' }}
              />
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none">
                  <div className="flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs text-slate-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Buffering...
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Loading video…</div>
          )
        ) : item.type === 'embed' ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {item.embedCode ? (
              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: item.embedCode }} />
            ) : item.embedUrl ? (
              <iframe src={item.embedUrl} className="w-full h-full" allowFullScreen />
            ) : (
              <div className="text-slate-500 text-sm">No embed content</div>
            )}
          </div>
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt={item.name}
            className="w-full h-full object-contain select-none"
            onLoad={(event) => {
              setNaturalSize({
                w: event.currentTarget.naturalWidth || 16,
                h: event.currentTarget.naturalHeight || 9,
              });
            }}
            draggable={false}
            style={{ background: '#000' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Loading…</div>
        )}

        {/* ── Filmstrip overlay (bottom of media area) ── */}
        {items.length > 1 && (
          <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent
            px-2 py-1.5 transition-all duration-500 ${chromeOpacity}`}>
            <div
              ref={filmstripRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-amber-700/30 justify-center"
            >
              {items.map((it, idx) => (
                <FilmThumb
                  key={it.id}
                  item={it}
                  active={idx === currentIndex}
                  onClick={() => goTo(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Resize handle ── */}
        <div
          className={`absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end
            pr-0.5 pb-0.5 transition-opacity duration-500 ${isTyping ? 'opacity-0' : 'opacity-40 hover:opacity-80'}`}
          onMouseDown={onResizeStart}
        >
          <GripVertical className="w-3.5 h-3.5 text-amber-300 -rotate-45" />
        </div>
      </div>
    </div>
  );
};
