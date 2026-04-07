"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Home, Users, BookOpen, Settings as SettingsIcon, Sparkles, LogOut, Compass } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CharacterGallery } from './components/CharacterGallery';
import { CharacterChat } from './components/CharacterChat';
import { LoreWorld } from './components/LoreWorld';
import { Settings } from './components/Settings';
import { SharedProfile } from './components/SharedProfile';
import { ViewType } from './types';
import { getSettings, saveSettings } from './services/storage';
import { getThemePreset, THEME_PRESETS } from './themePresets';
import { useAuth } from './components/AuthContext';
import LoginScreen from './components/LoginScreen';
import { signOut } from './services/authService';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import logoUrl from './assets/blurrdrxmweave.png';

const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Dashboard);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [sharedProfileData, setSharedProfileData] = useState<string | null>(null);
  const [sharedProfileCharacterId, setSharedProfileCharacterId] = useState<string | null>(null);
  const [themePreset, setThemePreset] = useState(() => getThemePreset(getSettings().theme));
  const [showSplash, setShowSplash] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState(() => getSettings().theme || 'cosmic-wave');

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
      const latestSettings = getSettings();
      setThemePreset(getThemePreset(latestSettings.theme));
      setCurrentThemeId(latestSettings.theme || 'cosmic-wave');
    };
    updateTheme();
    window.addEventListener('settings-updated', updateTheme);
    return () => window.removeEventListener('settings-updated', updateTheme);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1800);
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

  const handleThemeChange = (themeId: string) => {
    const latest = getSettings();
    saveSettings({ ...latest, theme: themeId });
    setCurrentThemeId(themeId);
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
        style={{ background: 'linear-gradient(135deg, #0b1220 0%, #111827 100%)' }}>
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.15),transparent_40%)]" />
        <Card className="relative z-10 w-[92%] max-w-lg p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/70 border border-slate-700/70">
            <img src={logoSrc} alt="Blurr Drxmweave logo" className="w-16 h-16 rounded-xl object-cover" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-100">Blurr Drxmweave</h1>
            <p className="mt-2 text-sm text-slate-300">Syncing the cosmic colorwave workspace...</p>
          </div>
          <div className="mx-auto h-1.5 w-36 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/2 rounded-full bg-sky-400 animate-pulse" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={appStyle}>
      {currentView !== ViewType.SharedProfile && (
        <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/65 backdrop-blur px-4 py-3 md:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <img
                  src={logoSrc}
                  alt="Blurr Drxmweave logo"
                  className="w-14 h-14 rounded-2xl border border-slate-700/70 object-cover"
                />
              </div>
              <div className="leading-tight hidden sm:block">
                <div className="text-base font-semibold tracking-wide text-slate-100">Blurr Drxmweave</div>
                <div className="text-xs text-slate-300">Cosmic Colorwave Command Hub</div>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <NavButton icon={<Home className="w-4 h-4" />} active={currentView === ViewType.Dashboard} onClick={() => handleNavigate(ViewType.Dashboard)} label="Home" />
              <NavButton icon={<Users className="w-4 h-4" />} active={currentView === ViewType.Characters || currentView === ViewType.CharacterDetail} onClick={() => handleNavigate(ViewType.Characters)} label="Characters" />
              <NavButton icon={<BookOpen className="w-4 h-4" />} active={currentView === ViewType.LoreWorld} onClick={() => handleNavigate(ViewType.LoreWorld)} label="Lore" />
              <NavButton icon={<Compass className="w-4 h-4" />} active={false} href="/blurrverse" label="BlurrVerse" />
              <NavButton icon={<SettingsIcon className="w-4 h-4" />} active={currentView === ViewType.Settings} onClick={() => handleNavigate(ViewType.Settings)} label="Settings" />
              <select
                value={currentThemeId}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleThemeChange(event.target.value)}
                className="neo-input h-9 min-w-47.5 rounded-xl px-3 py-1.5 text-xs"
                aria-label="Theme Switcher"
              >
                {THEME_PRESETS.map((theme) => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => signOut()} className="text-xs">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>
      )}

      <div
        className={
          `flex-1 flex flex-col overflow-hidden ` +
          (currentView !== ViewType.SharedProfile ? 'p-4 md:p-6' : '')
        }
      >
        {renderView()}
      </div>
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
    <Button
      onClick={handlePress}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={
        `min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs ` +
        (active ? 'text-slate-100' : 'text-slate-300 hover:text-white')
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Button>
  );
};

export default App;
