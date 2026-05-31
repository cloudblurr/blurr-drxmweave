import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Copy,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Orbit,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { createDrxmShell, deleteDrxmShell, generateId, getCharacters, getDrxmShells, getNodes, getSettings, saveCharacter } from '../services/storage';
import { Character, DrxmShell, ViewType } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import logoUrl from '../assets/blurrdrxmweave.png';

interface DashboardProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

const openShell = (shell: DrxmShell) => {
  window.open(`/single/${shell.id}`, '_blank', 'noopener,noreferrer');
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [characters, setCharacters] = useState<Character[]>(getCharacters());
  const [shells, setShells] = useState<DrxmShell[]>(getDrxmShells());
  const [showShellModal, setShowShellModal] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(characters[0]?.id || '');
  const [shellName, setShellName] = useState('');

  const nodes = getNodes();
  const settings = getSettings();
  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  const refreshDashboard = () => {
    setCharacters(getCharacters());
    setShells(getDrxmShells());
  };

  const createStarterCharacter = (): Character => {
    const now = Date.now();
    const character: Character = {
      id: generateId(),
      name: "Heaven's Engine Muse",
      description: 'A dedicated single-character roleplay profile created for Heaven\'s Engine.',
      personality: 'Contextual, emotionally aware, vivid, and consistent across long-form roleplay scenes.',
      scenario: 'A focused one-character roleplay shell with gallery, lorebooks, chat history, and memory scoped to this character.',
      first_mes: 'The room settles into focus as I turn toward you, already aware that this space belongs to our story alone.',
      mes_example: '',
      gallery: [],
      tags: ['Heaven Engine', 'DrxmShell'],
      createdAt: now,
      updatedAt: now,
      attachedLorebooks: [],
      data: { createdFrom: 'dashboard_drxm_shell' },
    };
    saveCharacter(character);
    return character;
  };

  const handleCreateShell = (characterId?: string, preferredName?: string) => {
    let resolvedCharacterId = characterId || selectedCharacterId;
    let resolvedName = (preferredName || shellName).trim();

    if (!resolvedCharacterId) {
      const starter = createStarterCharacter();
      resolvedCharacterId = starter.id;
      resolvedName = resolvedName || `${starter.name} Heaven's Engine`;
    }

    const character = getCharacters().find((item) => item.id === resolvedCharacterId);
    const createdShell = createDrxmShell(
      resolvedCharacterId,
      resolvedName || `${character?.name || 'Character'} Heaven's Engine`,
    );

    setShellName('');
    setSelectedCharacterId(resolvedCharacterId);
    setShowShellModal(false);
    refreshDashboard();
    openShell(createdShell);
  };

  const handleDeleteShell = (shell: DrxmShell) => {
    if (!confirm(`Delete DrxmShell "${shell.name}"? The character and chats will remain.`)) return;
    deleteDrxmShell(shell.id);
    refreshDashboard();
  };

  const handleCopyShellLink = async (shell: DrxmShell) => {
    const link = `${window.location.origin}/single/${shell.id}`;
    await navigator.clipboard.writeText(link);
  };

  const statCards = [
    {
      label: 'Characters',
      value: String(characters.length),
      helper: 'Profiles in your local roster',
      icon: <Users className="w-4 h-4 text-sky-300" />,
    },
    {
      label: 'Conversations',
      value: String(nodes.length),
      helper: 'Dialogue threads saved',
      icon: <MessageSquare className="w-4 h-4 text-emerald-300" />,
    },
    {
      label: 'DrxmShells',
      value: String(shells.length),
      helper: "Heaven's Engine instances",
      icon: <Sparkles className="w-4 h-4 text-fuchsia-300" />,
    },
    {
      label: 'Engine',
      value: settings.defaultModel || 'Grok 4.3',
      helper: settings.provider === 'cloudflare'
        ? 'Cloudflare Worker route'
        : settings.provider === 'together'
          ? 'Together AI route'
          : 'Primary model currently selected',
      icon: <Zap className="w-4 h-4 text-amber-300" />,
    },
  ];

  const actions = [
    {
      title: 'Create Character',
      description: 'Start a new profile with lore, style, and behavior.',
      icon: <Plus className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.Characters),
    },
    {
      title: 'Create DrxmShell',
      description: "Launch a focused Heaven's Engine copy for one character.",
      icon: <Sparkles className="w-4 h-4" />,
      onClick: () => {
        setSelectedCharacterId(characters[0]?.id || '');
        setShellName('');
        setShowShellModal(true);
      },
    },
    {
      title: 'Open Lore Builder',
      description: 'Expand world events, factions, and memory structure.',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.LoreWorld),
    },
    {
      title: 'Open Grok Imagine',
      description: 'Generate and edit media through the Cloudflare route.',
      icon: <ImageIcon className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.ImageStudio),
    },
    {
      title: 'Explore BlurrVerse',
      description: 'Browse community-shared public characters.',
      icon: <Orbit className="w-4 h-4" />,
      onClick: () => window.location.assign('/blurrverse'),
    },
    {
      title: 'Configure Settings',
      description: 'Tune model defaults, themes, and app behavior.',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.Settings),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative grid gap-6 p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8">
              <div className="tech-grid absolute inset-0 opacity-25" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-slate-900/50 px-3 py-1 text-xs text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  Workspace Overview
                </div>
                <div className="flex items-center gap-3">
                  <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-16 w-16 rounded-2xl border border-slate-700/70 object-cover" />
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">Neural Command Center</h1>
                    <p className="text-sm text-slate-400">Characters, lore systems, DrxmShells, and media generation in one focused engine.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => onNavigate(ViewType.Characters)}>
                    Create Character
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setShowShellModal(true)} variant="secondary">
                    <Sparkles className="h-4 w-4" />
                    Create DrxmShell
                  </Button>
                  <Button onClick={() => window.location.assign('/blurrverse')} variant="outline">
                    Open BlurrVerse
                  </Button>
                </div>
              </div>
              <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
                {statCards.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <p className="truncate text-xl font-semibold text-slate-100">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.035 }}
            >
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="rounded-lg border border-slate-700/70 bg-slate-900/80 p-1.5 text-slate-200">
                    {action.icon}
                  </span>
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={action.onClick} variant="secondary" className="w-full justify-between">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Heaven's Engine DrxmShells</CardTitle>
              <CardDescription>Dedicated one-character roleplay engines with their own direct launch routes.</CardDescription>
            </div>
            <Button onClick={() => setShowShellModal(true)} size="sm">
              <Plus className="h-4 w-4" />
              New DrxmShell
            </Button>
          </CardHeader>
          <CardContent>
            {shells.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-sky-300" />
                <h3 className="text-lg font-semibold text-slate-100">No DrxmShells yet</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                  Create one to reproduce the roleplay engine as a focused Heaven's Engine shell for a single character.
                </p>
                <Button onClick={() => setShowShellModal(true)} className="mt-4">
                  Create DrxmShell
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shells.map((shell) => {
                  const character = characters.find((item) => item.id === shell.characterId);
                  return (
                    <div key={shell.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900">
                          {character?.avatar ? (
                            <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Users className="h-7 w-7 text-slate-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-slate-100">{shell.name}</h3>
                          <p className="truncate text-xs text-slate-500">{character?.name || 'Missing character'}</p>
                          <p className="mt-1 text-[11px] text-slate-600">Updated {new Date(shell.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                        <Button onClick={() => openShell(shell)} size="sm" className="justify-between">
                          Open
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleCopyShellLink(shell)} variant="outline" size="sm" aria-label={`Copy ${shell.name} link`}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteShell(shell)} variant="ghost" size="sm" aria-label={`Delete ${shell.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {characters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Characters</CardTitle>
              <CardDescription>Jump back into a profile or mint a dedicated DrxmShell from it.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {characters.slice(0, 4).map((character) => (
                  <div key={character.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/60">
                    <button
                      onClick={() => onNavigate(ViewType.CharacterDetail, character.id)}
                      className="absolute inset-0"
                      aria-label={`Open ${character.name}`}
                    >
                      {character.avatar ? (
                        <img
                          src={character.avatar}
                          alt={character.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-950/70">
                          <Users className="h-12 w-12 text-slate-600" />
                        </div>
                      )}
                    </button>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/95 to-transparent p-3">
                      <p className="truncate text-sm font-medium text-slate-100">{character.name}</p>
                    </div>
                    <Button
                      onClick={() => handleCreateShell(character.id, `${character.name} DrxmShell`)}
                      size="sm"
                      variant="secondary"
                      className="absolute right-2 top-2 h-8 rounded-xl px-2 text-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Shell
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {characters.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="mx-auto mb-4 h-14 w-14 text-sky-300" />
              <h2 className="mb-2 text-2xl font-semibold text-slate-100">Welcome to your workspace</h2>
              <p className="mx-auto mb-6 max-w-xl text-slate-400">
                Create your first character profile or start with a dedicated Heaven's Engine DrxmShell.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => onNavigate(ViewType.Characters)}>Create First Character</Button>
                <Button onClick={() => handleCreateShell()} variant="secondary">
                  <Sparkles className="h-4 w-4" />
                  Create First DrxmShell
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {showShellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create DrxmShell</CardTitle>
              <CardDescription>Choose one character and Heaven's Engine will launch a focused roleplay shell for it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {characters.length > 0 ? (
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Character</span>
                  <select
                    value={selectedCharacterId}
                    onChange={(event) => setSelectedCharacterId(event.target.value)}
                    className="neo-input h-11 w-full rounded-2xl px-4 py-2 text-sm text-amber-50"
                  >
                    {characters.map((character) => (
                      <option key={character.id} value={character.id}>{character.name}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 text-sm text-slate-400">
                  No character exists yet. Creating this DrxmShell will also create a starter character for Heaven's Engine.
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shell Name</span>
                <Input
                  value={shellName}
                  onChange={(event) => setShellName(event.target.value)}
                  placeholder="Optional custom name"
                />
              </label>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowShellModal(false)}>Cancel</Button>
                <Button onClick={() => handleCreateShell()}>
                  <Sparkles className="h-4 w-4" />
                  Create and Open
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
