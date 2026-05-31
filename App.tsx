"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Command,
  Compass,
  Home,
  Image as ImageIcon,
  LogOut,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Users,
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { CharacterGallery } from './components/CharacterGallery';
import { CharacterChat } from './components/CharacterChat';
import { LoreWorld } from './components/LoreWorld';
import { GrokImagineStudio } from './components/GrokImagineStudio';
import { Settings } from './components/Settings';
import { SharedProfile } from './components/SharedProfile';
import { ViewType } from './types';
import { getSettings, saveSettings } from './services/storage';
import { THEME_PRESETS } from './themePresets';
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
  const [selectedNodeId] = useState<string | undefined>();
  const [sharedProfileData, setSharedProfileData] = useState<string | null>(null);
  const [sharedProfileCharacterId, setSharedProfileCharacterId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState(() => getSettings().theme || 'neural-forge');

  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      if (path.startsWith('/share/')) {
        const encodedData = params.get('data');
        const parts = path.split('/').filter(Boolean);
        const characterId = parts[1] || null;
        setSharedProfileData(encodedData || null);
        setSharedProfileCharacterId(characterId);
        setCurrentView(ViewType.SharedProfile);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  useEffect(() => {
    const updateTheme = () => setCurrentThemeId(getSettings().theme || 'neural-forge');
    updateTheme();
    window.addEventListener('settings-updated', updateTheme);
    return () => window.removeEventListener('settings-updated', updateTheme);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  const handleNavigate = (view: ViewType, id?: string) => {
    setCurrentView(view);
    if (view === ViewType.CharacterDetail || view === ViewType.Chat) {
      setSelectedCharacterId(id);
    } else {
      setSelectedCharacterId(undefined);
    }

    if (view === ViewType.Dashboard) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleThemeChange = (themeId: string) => {
    const latest = getSettings();
    saveSettings({ ...latest, theme: themeId });
    setCurrentThemeId(themeId);
  };

  const isImmersiveView = currentView === ViewType.CharacterDetail || currentView === ViewType.SharedProfile;

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
      case ViewType.ImageStudio:
        return <GrokImagineStudio onNavigate={handleNavigate} />;
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

  const navItems = [
    { view: ViewType.Dashboard, label: 'Home', icon: <Home className="h-4 w-4" /> },
    { view: ViewType.Characters, label: 'Characters', icon: <Users className="h-4 w-4" /> },
    { view: ViewType.LoreWorld, label: 'Lore', icon: <BookOpen className="h-4 w-4" /> },
    { view: ViewType.ImageStudio, label: 'Imagine', icon: <ImageIcon className="h-4 w-4" /> },
    { view: ViewType.Settings, label: 'Settings', icon: <SettingsIcon className="h-4 w-4" /> },
  ];

  if (authLoading) {
    return (
      <div className="neuro-app flex h-screen items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-cyan-300/20 border-t-cyan-200 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (showSplash) {
    return (
      <div className="neuro-app flex h-screen items-center justify-center overflow-hidden p-4">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Card className="w-[92vw] max-w-md p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[10px] border border-slate-700/70 bg-slate-950/70">
              <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-14 w-14 rounded-[8px] object-cover" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-50">Blurr Drxmweave</h1>
            <p className="mt-2 text-sm text-slate-400">Preparing the engine workspace</p>
            <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-slate-950/80 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-cyan-200"
                initial={{ x: '-100%' }}
                animate={{ x: '240%' }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (currentView === ViewType.SharedProfile) {
    return <div className="neuro-app h-screen overflow-hidden">{renderView()}</div>;
  }

  return (
    <div className="neuro-app flex h-screen overflow-hidden text-slate-100">
      <aside className="neuro-sidebar hidden w-72 shrink-0 flex-col gap-5 p-4 lg:flex">
        <div className="flex items-center gap-3 px-2 pt-1">
          <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-12 w-12 rounded-[10px] object-cover ring-1 ring-cyan-200/20" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-50">Blurr Drxmweave</div>
            <div className="text-xs text-slate-500">Roleplay Engine</div>
          </div>
        </div>

        <div className="command-surface flex items-center gap-2 rounded-[10px] px-3 py-2 text-xs text-slate-500">
          <Search className="h-4 w-4 text-slate-500" />
          <span className="flex-1">Search workspace</span>
          <Command className="h-3.5 w-3.5" />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavButton
              key={item.view}
              icon={item.icon}
              active={
                currentView === item.view ||
                (item.view === ViewType.Characters && currentView === ViewType.CharacterDetail)
              }
              onClick={() => handleNavigate(item.view)}
              label={item.label}
            />
          ))}
          <NavButton icon={<Compass className="h-4 w-4" />} active={false} href="/blurrverse" label="BlurrVerse" />
        </nav>

        <div className="space-y-3">
          <select
            value={currentThemeId}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => handleThemeChange(event.target.value)}
            className="neo-input h-10 w-full rounded-[10px] px-3 text-xs"
            aria-label="Theme Switcher"
          >
            {THEME_PRESETS.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => signOut()} className="w-full justify-start text-xs">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="neuro-topbar z-20 flex shrink-0 items-center justify-between gap-3 px-3 py-3 md:px-5 lg:hidden">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-10 w-10 rounded-[10px] object-cover" />
            <div>
              <div className="text-sm font-semibold text-slate-50">Drxmweave</div>
              <div className="text-[11px] text-slate-500">Engine</div>
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.slice(0, 4).map((item) => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleNavigate(item.view)}
                className="h-9 w-9 p-0"
                aria-label={item.label}
              >
                {item.icon}
              </Button>
            ))}
          </div>
        </header>

        <main className={`min-h-0 flex-1 ${isImmersiveView ? 'overflow-hidden p-3 md:p-5' : 'overflow-y-auto p-3 md:p-5'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentView}-${selectedCharacterId || ''}`}
              className={isImmersiveView ? 'h-full min-h-0' : 'min-h-full'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
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
    <button
      onClick={handlePress}
      className={
        `flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-all ` +
        (active
          ? 'holo-sidebar-item-active text-slate-50'
          : 'holo-sidebar-item text-slate-400 hover:text-slate-100')
      }
    >
      <span className={active ? 'text-cyan-200' : 'text-slate-500'}>{icon}</span>
      <span>{label}</span>
      {active && <Sparkles className="ml-auto h-3.5 w-3.5 text-cyan-200" />}
    </button>
  );
};

export default App;
