import React from 'react';
import { Sparkles, Users, BookOpen, Settings, Plus, MessageSquare, Zap, Globe } from 'lucide-react';
import { getCharacters, getNodes } from '../services/storage';
import { ViewType } from '../types';
import logoUrl from '../muselogo.jpg';

interface DashboardProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const characters = getCharacters();
  const nodes = getNodes();
  const logoSrc: string = ((logoUrl as unknown as { src?: string })?.src ?? (logoUrl as unknown as string)) || '';

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-8 animate-fadeInUp">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <img src={logoSrc} alt="Ooda Muse Engine logo" className="w-14 h-14 rounded-xl" />
              <div className="absolute inset-0 rounded-xl animate-holo-pulse" style={{ boxShadow: '0 0 25px rgba(0,229,255,0.25)' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold holo-text tracking-wide">
              Command Center
            </h1>
          </div>
          <p className="holo-label">System Status: All Systems Operational</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="holo-card p-5 animate-fadeInUp delay-100">
            <div className="flex items-center justify-between mb-3">
              <span className="holo-label">Characters</span>
              <Users className="w-5 h-5 text-holo-cyan" />
            </div>
            <div className="text-3xl font-bold holo-text-glow">{characters.length}</div>
            <p className="text-xs text-slate-500 mt-1">Crew manifest entries</p>
          </div>

          <div className="holo-card p-5 animate-fadeInUp delay-200">
            <div className="flex items-center justify-between mb-3">
              <span className="holo-label">Conversations</span>
              <MessageSquare className="w-5 h-5 text-holo-blue" />
            </div>
            <div className="text-3xl font-bold holo-text-glow">{nodes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Active comm channels</p>
          </div>

          <div className="holo-card p-5 animate-fadeInUp delay-300">
            <div className="flex items-center justify-between mb-3">
              <span className="holo-label">AI Core</span>
              <Zap className="w-5 h-5 text-holo-amber" />
            </div>
            <div className="text-xl font-bold holo-text-glow">Grok 4</div>
            <p className="text-xs text-slate-500 mt-1">xAI neural engine online</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="holo-panel p-6 animate-fadeInUp delay-200">
          <h2 className="text-lg font-semibold mb-4 holo-text-glow flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Navigation Console
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate(ViewType.Characters)}
              className="holo-btn flex items-center gap-3 p-4 rounded-xl text-left w-full"
            >
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0,229,255,0.1)' }}>
                <Plus className="w-5 h-5 text-holo-cyan" />
              </div>
              <div>
                <div className="font-semibold text-holo-cyan text-sm">Create Character</div>
                <div className="text-xs text-slate-500">Commission new crew member</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate(ViewType.LoreWorld)}
              className="holo-btn flex items-center gap-3 p-4 rounded-xl text-left w-full"
            >
              <div className="p-2 rounded-lg" style={{ background: 'rgba(41,121,255,0.1)' }}>
                <BookOpen className="w-5 h-5 text-holo-blue" />
              </div>
              <div>
                <div className="font-semibold text-holo-cyan text-sm">LoreBuilder</div>
                <div className="text-xs text-slate-500">Navigate worldbuilding archives</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate(ViewType.Characters)}
              className="holo-btn flex items-center gap-3 p-4 rounded-xl text-left w-full"
            >
              <div className="p-2 rounded-lg" style={{ background: 'rgba(213,0,249,0.1)' }}>
                <Users className="w-5 h-5 text-holo-purple" />
              </div>
              <div>
                <div className="font-semibold text-holo-cyan text-sm">Browse Characters</div>
                <div className="text-xs text-slate-500">Access crew manifest</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate(ViewType.Settings)}
              className="holo-btn flex items-center gap-3 p-4 rounded-xl text-left w-full"
            >
              <div className="p-2 rounded-lg" style={{ background: 'rgba(255,171,0,0.1)' }}>
                <Settings className="w-5 h-5 text-holo-amber" />
              </div>
              <div>
                <div className="font-semibold text-holo-cyan text-sm">Settings</div>
                <div className="text-xs text-slate-500">Configure ship systems</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Characters */}
        {characters.length > 0 && (
          <div className="holo-panel p-6 animate-fadeInUp delay-300">
            <h2 className="text-lg font-semibold mb-4 holo-text-glow flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Crew
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.slice(0, 4).map(character => (
                <button
                  key={character.id}
                  onClick={() => onNavigate(ViewType.CharacterDetail, character.id)}
                  className="group relative aspect-square rounded-xl overflow-hidden holo-card border-0 holo-panel-interactive"
                >
                  {character.avatar ? (
                    <img 
                      src={character.avatar} 
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(213,0,249,0.1))' }}>
                      <Users className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: 'linear-gradient(0deg, rgba(2,8,16,0.9) 0%, transparent 100%)' }}>
                    <p className="font-semibold text-holo-cyan text-sm truncate">{character.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started */}
        {characters.length === 0 && (
          <div className="holo-panel p-8 text-center animate-fadeInUp delay-300">
            <Globe className="w-16 h-16 mx-auto mb-4 text-holo-cyan animate-holo-pulse" />
            <h2 className="text-2xl font-bold mb-2 holo-text">Welcome, Captain</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Your ship awaits configuration. Begin by creating your first crew member or importing existing character data from ChubAI or SillyTavern formats.
            </p>
            <button
              onClick={() => onNavigate(ViewType.Characters)}
              className="holo-btn holo-btn-primary px-8 py-3 rounded-xl text-sm font-semibold"
            >
              Commission First Crew Member
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
