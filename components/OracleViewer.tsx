import React, { useEffect, useRef, useState } from 'react';
import type Plyr from 'plyr';
import { Minimize2, Maximize2, X, Move, RotateCcw } from 'lucide-react';
import { GalleryItem } from '../types';

interface OracleViewerProps {
  item: GalleryItem;
  onClose: () => void;
}

export const OracleViewer: React.FC<OracleViewerProps> = ({ item, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 640, height: 480 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const [mediaUrl, setMediaUrl] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const plyrRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (item.type === 'embed') {
      setMediaUrl('');
      return;
    }
    if (item.blob) {
      const url = URL.createObjectURL(item.blob);
      setMediaUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.type, item.blob]);

  useEffect(() => {
    let cancelled = false;

    // Clean up existing player first
    if (plyrRef.current) {
      plyrRef.current.destroy();
      plyrRef.current = null;
    }

    // Initialize new player for video (dynamic import to avoid SSR "document" error)
    if (item.type === 'video' && mediaRef.current && mediaUrl) {
      import('plyr').then((mod) => {
        if (cancelled || !mediaRef.current) return;
        // Inject CSS once
        if (!document.querySelector('link[data-plyr-css]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
          link.setAttribute('data-plyr-css', '');
          document.head.appendChild(link);
        }
        const PlyrClass = mod.default || mod;
        plyrRef.current = new PlyrClass(mediaRef.current as HTMLVideoElement, {
          controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
          settings: ['speed', 'loop'],
          speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
          loop: { active: true },
          ratio: '16:9',
          tooltips: { controls: true, seek: true },
          autoplay: false,
          resetOnEnd: true
        });

        plyrRef.current.on('ready', () => {
          console.log('Plyr player ready for:', item.name);
        });
      }).catch(err => console.warn('Failed to load Plyr:', err));
    }

    return () => {
      cancelled = true;
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
    };
  }, [item.type, mediaUrl, item.id, item.name]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      // Add boundary constraints to prevent dragging offscreen
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const maxX = window.innerWidth - 100; // Leave at least 100px visible
      const maxY = window.innerHeight - 50; // Leave at least 50px visible
      
      setPosition({
        x: Math.max(-size.width + 100, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    }
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.mouseX;
      const deltaY = e.clientY - resizeStart.mouseY;
      const newWidth = Math.max(320, resizeStart.width + deltaX);
      const newHeight = Math.max(240, resizeStart.height + deltaY);
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResetPosition = () => {
    setPosition({ x: 100, y: 100 });
    setSize({ width: 640, height: 480 });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  return (
    <div
      ref={containerRef}
      className="fixed bg-black/95 backdrop-blur-xl border-2 border-holo-cyan/40 rounded-xl shadow-2xl shadow-holo-cyan/20 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '300px' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex: 9999
      }}
    >
      {/* Header */}
      <div 
        className="oracle-drag-handle holo-header px-4 py-2 flex items-center justify-between cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-holo-cyan" />
          <span className="text-sm font-semibold text-holo-cyan truncate max-w-[200px]">
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetPosition}
            className="p-1 hover:bg-holo-cyan/10 rounded-lg transition-colors"
            title="Reset Position"
          >
            <RotateCcw className="w-4 h-4 text-holo-cyan" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-holo-cyan/10 rounded-lg transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-slate-500" />
            ) : (
              <Minimize2 className="w-4 h-4 text-slate-500" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-slate-500 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Media Content */}
      {!isMinimized && (
        <div className="relative w-full h-full bg-black" style={{ height: 'calc(100% - 42px)' }}>
          {item.type === 'video' ? (
            mediaUrl ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl}
                className="w-full h-full"
                playsInline
                loop
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Loading video…
              </div>
            )
          ) : item.type === 'embed' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              {item.embedCode ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: item.embedCode }}
                />
              ) : item.embedUrl ? (
                <iframe src={item.embedUrl} className="w-full h-full" allowFullScreen />
              ) : (
                <div className="text-slate-400 text-sm">No embed content</div>
              )}
            </div>
          ) : (
            mediaUrl ? (
              <img
                ref={mediaRef as React.RefObject<HTMLImageElement>}
                src={mediaUrl}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Loading…
              </div>
            )
          )}

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize hover:opacity-100 opacity-50 transition-opacity z-10 flex items-center justify-center"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsResizing(true);
              setResizeStart({
                width: size.width,
                height: size.height,
                mouseX: e.clientX,
                mouseY: e.clientY
              });
            }}
          >
            <svg className="w-5 h-5 text-cyan-400 drop-shadow-lg" viewBox="0 0 16 16">
              <path d="M16 0 L16 16 L0 16 Z" fill="currentColor" opacity="0.3" />
              <line x1="10" y1="6" x2="10" y2="10" stroke="white" strokeWidth="2" />
              <line x1="6" y1="10" x2="10" y2="10" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
