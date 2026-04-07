import React from 'react';
import { Sparkles, Users, BookOpen, Settings, Plus, MessageSquare, Zap, Globe, Orbit, ArrowRight } from 'lucide-react';
import { getCharacters, getNodes } from '../services/storage';
import { ViewType } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import logoUrl from '../assets/blurrdrxmweave.png';

interface DashboardProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const characters = getCharacters();
  const nodes = getNodes();
  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  const statCards = [
    {
      label: 'Characters',
      value: String(characters.length),
      helper: 'Profiles in your local roster',
      icon: <Users className="w-4 h-4 text-sky-300" />
    },
    {
      label: 'Conversations',
      value: String(nodes.length),
      helper: 'Dialogue threads saved',
      icon: <MessageSquare className="w-4 h-4 text-emerald-300" />
    },
    {
      label: 'Engine',
      value: 'Grok 4',
      helper: 'Primary model currently selected',
      icon: <Zap className="w-4 h-4 text-amber-300" />
    }
  ];

  const actions = [
    {
      title: 'Create Character',
      description: 'Start a new profile with lore, style, and behavior.',
      icon: <Plus className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.Characters)
    },
    {
      title: 'Open Lore Builder',
      description: 'Expand world events, factions, and memory structure.',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.LoreWorld)
    },
    {
      title: 'Explore BlurrVerse',
      description: 'Browse community-shared public characters.',
      icon: <Orbit className="w-4 h-4" />,
      onClick: () => window.location.assign('/blurrverse')
    },
    {
      title: 'Configure Settings',
      description: 'Tune model defaults, themes, and app behavior.',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => onNavigate(ViewType.Settings)
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative grid gap-6 p-6 md:grid-cols-[1.35fr_0.65fr] md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.14),transparent_40%)]" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-slate-900/50 px-3 py-1 text-xs text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                  Workspace Overview
                </div>
                <div className="flex items-center gap-3">
                  <img src={logoSrc} alt="Blurr Drxmweave logo" className="h-16 w-16 rounded-2xl border border-slate-700/70 object-cover" />
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-100 md:text-3xl">Command Center</h1>
                    <p className="text-sm text-slate-300">Operate characters, lore systems, and BlurrVerse publishing.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => onNavigate(ViewType.Characters)}>
                    Create Character
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => window.location.assign('/blurrverse')} variant="outline">
                    Open BlurrVerse
                  </Button>
                </div>
              </div>
              <div className="relative grid grid-cols-1 gap-3">
                {statCards.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <p className="text-xl font-semibold text-slate-100">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <Card key={action.title} className="transition-transform hover:-translate-y-0.5">
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
          ))}
        </div>

        {characters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Characters</CardTitle>
              <CardDescription>Jump back into your most recent profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.slice(0, 4).map(character => (
                <button
                  key={character.id}
                  onClick={() => onNavigate(ViewType.CharacterDetail, character.id)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700/70 bg-slate-900/60"
                >
                  {character.avatar ? (
                    <img 
                      src={character.avatar} 
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950/70">
                      <Users className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-slate-950/95 to-transparent">
                    <p className="font-medium text-slate-100 text-sm truncate">{character.name}</p>
                  </div>
                </button>
              ))}
              </div>
            </CardContent>
          </Card>
        )}

        {characters.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="w-14 h-14 mx-auto mb-4 text-sky-300" />
              <h2 className="text-2xl font-semibold mb-2 text-slate-100">Welcome to your workspace</h2>
              <p className="text-slate-400 mb-6 max-w-xl mx-auto">
                Create your first character profile to begin chatting, worldbuilding, and publishing to BlurrVerse.
              </p>
              <Button onClick={() => onNavigate(ViewType.Characters)}>
                Create First Character
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
