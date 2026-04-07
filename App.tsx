"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Home, Users, BookOpen, Settings as SettingsIcon, Sparkles, LogOut } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CharacterGallery } from './components/CharacterGallery';
import { CharacterChat } from './components/CharacterChat';
import { LoreWorld } from './components/LoreWorld';
import { Settings } from './components/Settings';
import { SharedProfile } from './components/SharedProfile';
import { ViewType } from './types';
import { getSettings } from './services/storage';
import { getThemePreset } from './themePresets';
import { useAuth } from './components/AuthContext';
import LoginScreen from './components/LoginScreen';
import { signOut } from './services/authService';
import { Button } from './components/ui/button';
import logoUrl from './muselogo.jpg';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Dashboard);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [sharedProfileData, setSharedProfileData] = useState<string | null>(null);
  const [sharedProfileCharacterId, setSharedProfileCharacterId] = useState<string | null>(null);
  const [themePreset, setThemePreset] = useState(() => getThemePreset(getSettings().theme));
  const [showSplash, setShowSplash] = useState(true);

  // Next.js image imports can be StaticImageData; Vite typically returns a string URL.
  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  // Handle URL routes on mount
  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      if (path.startsWith('/share/')) {
        const encodedData = params.get('data');
        const parts = path.split('/').filter(Boolean);
        const characterId = parts[1] || null;
        if (encodedData) {
          setSharedProfileData(encodedData);
        } else {
          setSharedProfileData(null);
        }
        setSharedProfileCharacterId(characterId);
        setCurrentView(ViewType.SharedProfile);
        return;
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      setThemePreset(getThemePreset(getSettings().theme));
    };
    updateTheme();
    window.addEventListener('settings-updated', updateTheme);
    return () => window.removeEventListener('settings-updated', updateTheme);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleNavigate = (view: ViewType, id?: string) => {
    setCurrentView(view);
    if (view === ViewType.CharacterDetail || view === ViewType.Chat) {
      setSelectedCharacterId(id);
    } else {
      setSelectedCharacterId(undefined);
    }
    
    // Update URL without page reload
    if (view === ViewType.Dashboard) {
      window.history.pushState({}, '', '/');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewType.Dashboard:
        return <Dashboard onNavigate={handleNavigate} />;
      case ViewType.Characters:
        return <CharacterGallery onNavigate={handleNavigate} />;
      case ViewType.CharacterDetail:
        return selectedCharacterId ? (
          <CharacterChat 
            characterId={selectedCharacterId} 
            nodeId={selectedNodeId}
            onNavigate={handleNavigate} 
          />
        ) : (
          <CharacterGallery onNavigate={handleNavigate} />
        );
      case ViewType.LoreWorld:
        return <LoreWorld onNavigate={handleNavigate} />;
      case ViewType.Settings:
        return <Settings onNavigate={handleNavigate} />;
      case ViewType.SharedProfile:
        return sharedProfileData || sharedProfileCharacterId ? (
          <SharedProfile
            encodedData={sharedProfileData}
            characterId={sharedProfileCharacterId}
            onNavigate={handleNavigate}
          />
        ) : (
          <Dashboard onNavigate={handleNavigate} />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const appStyle = useMemo(() => {
    const isGradient = themePreset.colors.bg.includes('gradient');
    return {
      background: isGradient ? undefined : themePreset.colors.bg,
      backgroundImage: isGradient ? themePreset.colors.bg : undefined,
      color: themePreset.colors.text
    } as React.CSSProperties;
  }, [themePreset]);

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  // Show login screen when not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  if (showSplash) {
    return (
      <div
        className="flex flex-col h-screen overflow-hidden items-center justify-center text-center relative"
        style={appStyle}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            animation: 'holoDataStream 20s linear infinite'
          }}
        />
        <div className="flex flex-col items-center gap-6 px-6 animate-fadeInScale relative z-10">
          <div className="relative">
            <img src={logoSrc} alt="Ooda Muse Engine logo" className="w-28 h-28 rounded-2xl shadow-glow" />
            <div className="absolute inset-0 rounded-2xl animate-holo-pulse" style={{ boxShadow: '0 0 40px rgba(0,229,255,0.3)' }} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold holo-text tracking-wide">
              Ooda Muse Engine
            </h1>
            <p className="holo-label mt-3">Initializing navigation systems…</p>
          </div>
          <div className="flex gap-1 mt-4">
            <div className="w-2 h-2 rounded-full bg-holo-cyan animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-holo-cyan animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2 h-2 rounded-full bg-holo-cyan animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative" style={appStyle}>
      {/* Floating Header Bar */}
      {currentView !== ViewType.SharedProfile && currentView !== ViewType.Chat && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[min(1000px,calc(100%-1.5rem))]">
          <div className="holo-header px-5 py-3 flex items-center justify-between animate-fadeInUp">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={logoSrc}
                  alt="Ooda Muse Engine logo"
                  className="w-8 h-8 rounded-xl"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-holo-green border border-black/50" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-wide holo-text-glow">Ooda Muse Engine</div>
                <div className="holo-label">
                  {currentView}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="holo-btn-ghost text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Auto-hide Header (Chat) */}
      {currentView === ViewType.Chat && (
        <div className="fixed top-0 left-0 right-0 z-50 group">
          {/* Hover zone */}
          <div className="h-3 w-full" />

          {/* Sliding header */}
          <div className="mx-auto w-[min(1000px,calc(100%-1.5rem))] transform-gpu -translate-y-24 group-hover:translate-y-3 transition-transform duration-200 ease-out">
            <div className="holo-header px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={logoSrc}
                    alt="Ooda Muse Engine logo"
                    className="w-8 h-8 rounded-xl"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-holo-green border border-black/50" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-wide holo-text-glow">Ooda Muse Engine</div>
                  <div className="holo-label">Comm Channel</div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="holo-btn-ghost text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={
          `flex-1 flex flex-col overflow-hidden relative z-10 ` +
          (currentView !== ViewType.SharedProfile ? 'pb-24' : '') +
          (currentView !== ViewType.SharedProfile && currentView !== ViewType.Chat ? ' pt-16' : '')
        }
      >
        {renderView()}
      </div>

      {/* Bottom Navigation Dock */}
      {currentView !== ViewType.SharedProfile && (
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[min(700px,calc(100%-1.5rem))]">
        <div className="holo-dock px-4 py-2 flex items-center justify-around animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <NavButton
            icon={<Home className="w-5 h-5" />}
            active={currentView === ViewType.Dashboard}
            onClick={() => handleNavigate(ViewType.Dashboard)}
            label="Dashboard"
          />
          <NavButton
            icon={<Users className="w-5 h-5" />}
            active={currentView === ViewType.Characters || currentView === ViewType.CharacterDetail}
            onClick={() => handleNavigate(ViewType.Characters)}
            label="Characters"
          />
          <NavButton
            icon={<BookOpen className="w-5 h-5" />}
            active={currentView === ViewType.LoreWorld}
            onClick={() => handleNavigate(ViewType.LoreWorld)}
            label="LoreWorld"
          />
          <NavButton
            icon={<Sparkles className="w-5 h-5" />}
            active={false}
            href="/oodaverse"
            label="OodaVerse"
          />
          <NavButton
            icon={<SettingsIcon className="w-5 h-5" />}
            active={currentView === ViewType.Settings}
            onClick={() => handleNavigate(ViewType.Settings)}
            label="Settings"
          />
        </div>
      </div>
      )}
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  href?: string;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, active, onClick, href, label }) => {
  const handlePress = () => {
    if (href) {
      window.location.assign(href);
      return;
    }
    onClick?.();
  };

  return (
    <button
      onClick={handlePress}
      className={
        `holo-nav-btn flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl ` +
        (active ? 'holo-nav-active' : 'text-slate-400 hover:text-holo-cyan')
      }
    >
      <div className={`holo-nav-icon transition-all ${active ? '' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
};

export default App;
