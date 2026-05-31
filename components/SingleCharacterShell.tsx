import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Copy,
  History,
  Image as ImageIcon,
  Info,
  Library,
  MessageSquare,
  Plus,
  Save,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Character, ChatNode, DrxmShell, GalleryItem, LoreEntry, Lorebook, ViewType } from '../types';
import {
  createDrxmShell,
  getCharacter,
  getDrxmShell,
  getLorebooks,
  getLoreEntries,
  getNodesForCharacter,
  saveDrxmShell,
  touchDrxmShell,
} from '../services/storage';
import { getGalleryItemsByCharacter } from '../services/galleryDB';
import { CharacterChat } from './CharacterChat';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

type ShellTab = 'chat' | 'info' | 'gallery' | 'lore' | 'history' | 'settings';

interface SingleCharacterShellProps {
  characterId: string;
}

const formatDate = (value?: number) => {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

export const SingleCharacterShell: React.FC<SingleCharacterShellProps> = ({ characterId }) => {
  const [shell, setShell] = useState<DrxmShell | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [nodes, setNodes] = useState<ChatNode[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ShellTab>('chat');
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
  const [shellName, setShellName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const existingShell = getDrxmShell(characterId);
    const resolvedCharacterId = existingShell?.characterId || characterId;
    const resolvedCharacter = getCharacter(resolvedCharacterId) || null;
    const resolvedNodes = getNodesForCharacter(resolvedCharacterId).sort((a, b) => b.updatedAt - a.updatedAt);

    if (existingShell) {
      touchDrxmShell(existingShell.id);
      const touchedShell = getDrxmShell(existingShell.id) || existingShell;
      setShell(touchedShell);
      setShellName(touchedShell.name);
    } else {
      setShell(null);
      setShellName(resolvedCharacter ? `${resolvedCharacter.name} Heaven's Engine` : "Heaven's Engine");
    }

    setCharacter(resolvedCharacter);
    setNodes(resolvedNodes);
    setActiveNodeId((current) => current || resolvedNodes[0]?.id);
    setLorebooks(getLorebooks());
    setLoreEntries(getLoreEntries());

    let isActive = true;
    getGalleryItemsByCharacter(resolvedCharacterId)
      .then((items) => {
        if (isActive) setGalleryItems([...items].sort((a, b) => b.createdAt - a.createdAt));
      })
      .catch((error) => {
        console.error('Failed to load Heaven Engine gallery:', error);
        if (isActive) setGalleryItems([]);
      });

    return () => {
      isActive = false;
    };
  }, [characterId]);

  const attachedLorebooks = useMemo(() => {
    const ids = character?.attachedLorebooks || [];
    return lorebooks.filter((book) => ids.includes(book.id));
  }, [character?.attachedLorebooks, lorebooks]);

  const attachedLoreEntries = useMemo(() => {
    const entryIds = new Set(attachedLorebooks.flatMap((book) => book.entries));
    return loreEntries.filter((entry) => entryIds.has(entry.id));
  }, [attachedLorebooks, loreEntries]);

  const shellRouteId = shell?.id || character?.id || characterId;
  const shellUrl = typeof window !== 'undefined' ? `${window.location.origin}/single/${shellRouteId}` : `/single/${shellRouteId}`;
  const lastNode = nodes[0];

  const tabs: Array<{ id: ShellTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'info', label: 'Info', icon: <Info className="h-4 w-4" /> },
    { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="h-4 w-4" />, count: galleryItems.length },
    { id: 'lore', label: 'Lorebooks', icon: <BookOpen className="h-4 w-4" />, count: attachedLorebooks.length },
    { id: 'history', label: 'History', icon: <History className="h-4 w-4" />, count: nodes.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleNavigate = (view: ViewType, id?: string) => {
    if (view === ViewType.CharacterDetail && id) {
      setActiveTab('chat');
      return;
    }
    if (view === ViewType.Characters || view === ViewType.Dashboard) {
      window.location.assign('/');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shellUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleSaveShellName = () => {
    if (!character) return;
    const nextName = shellName.trim() || `${character.name} Heaven's Engine`;
    if (shell) {
      const updatedShell = { ...shell, name: nextName };
      saveDrxmShell(updatedShell);
      setShell(getDrxmShell(updatedShell.id) || updatedShell);
      setShellName(nextName);
      return;
    }

    const createdShell = createDrxmShell(character.id, nextName);
    setShell(createdShell);
    setShellName(createdShell.name);
    window.history.replaceState({}, '', `/single/${createdShell.id}`);
  };

  const handleDuplicateShell = () => {
    if (!character) return;
    const createdShell = createDrxmShell(character.id, `${character.name} DrxmShell`);
    window.open(`/single/${createdShell.id}`, '_blank', 'noopener,noreferrer');
  };

  if (!character) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Heaven's Engine could not open</CardTitle>
              <CardDescription>No DrxmShell or character exists for this route.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={() => window.location.assign('/')}>
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.assign('/')}
              className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 transition-colors hover:border-sky-300/60 hover:text-sky-200"
              aria-label="Return to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-sky-300/30 bg-slate-900">
              {character.avatar ? (
                <img src={character.avatar} alt={character.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserRound className="h-8 w-8 text-slate-500" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Heaven's Engine
                </span>
                <span className="rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-400">
                  DrxmShell
                </span>
              </div>
              <h1 className="mt-2 truncate text-2xl font-semibold text-slate-100 md:text-3xl">{shellName}</h1>
              <p className="truncate text-sm text-slate-400">Dedicated one-character roleplay engine for {character.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:w-[520px]">
            <ShellMetric label="Chats" value={nodes.length} />
            <ShellMetric label="Gallery" value={galleryItems.length} />
            <ShellMetric label="Lore" value={attachedLoreEntries.length} />
            <ShellMetric label="Last Opened" value={formatDate(shell?.lastOpenedAt || Date.now())} compact />
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 md:px-6">
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/35'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="rounded-full bg-slate-950/80 px-2 py-0.5 text-[11px] text-slate-300">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <section className="min-h-0 flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70">
              <CharacterChat
                characterId={character.id}
                nodeId={activeNodeId}
                onNavigate={handleNavigate}
                embedded
                hideBackButton
              />
            </div>
          )}

          {activeTab === 'info' && (
            <div className="h-full overflow-y-auto pr-1">
              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <Card>
                  <CardContent className="p-5">
                    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                      {character.avatar ? (
                        <img src={character.avatar} alt={character.name} className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center">
                          <UserRound className="h-20 w-20 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <h2 className="text-xl font-semibold text-slate-100">{character.name}</h2>
                      <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap">{character.description || 'No description yet.'}</p>
                    </div>
                    {character.tags && character.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {character.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="grid gap-4">
                  <InfoBlock title="Personality" content={character.personality} />
                  <InfoBlock title="Scenario" content={character.scenario} />
                  <InfoBlock title="First Message" content={character.first_mes} />
                  <InfoBlock title="Example Dialogue" content={character.mes_example} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="h-full overflow-y-auto pr-1">
              {galleryItems.length === 0 ? (
                <EmptyPanel
                  icon={<ImageIcon className="h-8 w-8 text-sky-300" />}
                  title="No media in this shell yet"
                  description="Use the chat gallery upload or Grok Imagine Studio to attach images and videos to this character."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {galleryItems.map((item) => (
                    <ShellMediaCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="h-full overflow-y-auto pr-1">
              {attachedLorebooks.length === 0 ? (
                <EmptyPanel
                  icon={<BookOpen className="h-8 w-8 text-sky-300" />}
                  title="No lorebooks attached"
                  description="Attach lorebooks from the character editor to make this shell inherit active memory and world context."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {attachedLorebooks.map((book) => {
                    const entries = loreEntries.filter((entry) => book.entries.includes(entry.id));
                    return (
                      <Card key={book.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Library className="h-4 w-4 text-sky-300" />
                            {book.name}
                          </CardTitle>
                          <CardDescription>{book.description || `${entries.length} active entries`}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {entries.length === 0 ? (
                            <p className="text-sm text-slate-500">No entries in this lorebook.</p>
                          ) : (
                            entries.map((entry) => (
                              <div key={entry.id} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <h3 className="text-sm font-semibold text-slate-100">{entry.name}</h3>
                                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400">
                                    {entry.category}
                                  </span>
                                </div>
                                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-400">{entry.content}</p>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="h-full overflow-y-auto pr-1">
              {nodes.length === 0 ? (
                <EmptyPanel
                  icon={<History className="h-8 w-8 text-sky-300" />}
                  title="No chat history yet"
                  description="Start a conversation in Chat and this shell will keep the character's history here."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setActiveNodeId(node.id);
                        setActiveTab('chat');
                      }}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        activeNodeId === node.id
                          ? 'border-sky-300/45 bg-sky-400/10'
                          : 'border-slate-800/80 bg-slate-900/60 hover:border-sky-300/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold text-slate-100">{node.title}</h3>
                        {node.isClosed && (
                          <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-200">
                            compiled
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{node.messages.length} messages</p>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(node.updatedAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full overflow-y-auto pr-1">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">DrxmShell Settings</CardTitle>
                    <CardDescription>Rename this one-character engine and manage its standalone route.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="space-y-2 block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shell Name</span>
                      <Input value={shellName} onChange={(event) => setShellName(event.target.value)} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSaveShellName}>
                        <Save className="h-4 w-4" />
                        Save Shell
                      </Button>
                      <Button variant="outline" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4" />
                        {copied ? 'Copied' : 'Copy Link'}
                      </Button>
                      <Button variant="secondary" onClick={handleDuplicateShell}>
                        <Plus className="h-4 w-4" />
                        Duplicate DrxmShell
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shell Scope</CardTitle>
                    <CardDescription>This engine is locked to one character while reusing the full roleplay stack.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-400">
                    <ShellDetail label="Character" value={character.name} />
                    <ShellDetail label="Route" value={shellUrl} />
                    <ShellDetail label="Created" value={formatDate(shell?.createdAt || character.createdAt)} />
                    <ShellDetail label="Last Conversation" value={lastNode ? formatDate(lastNode.updatedAt) : 'No conversations yet'} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const ShellMetric: React.FC<{ label: string; value: string | number; compact?: boolean }> = ({ label, value, compact }) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 truncate font-semibold text-slate-100 ${compact ? 'text-xs' : 'text-lg'}`}>{value}</p>
  </div>
);

const InfoBlock: React.FC<{ title: string; content?: string }> = ({ title, content }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{content || 'Not set yet.'}</p>
    </CardContent>
  </Card>
);

const EmptyPanel: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/55 p-8 text-center">
    <div className="max-w-md">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  </div>
);

const ShellDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 break-words text-slate-200">{value}</p>
  </div>
);

const ShellMediaCard: React.FC<{ item: GalleryItem }> = ({ item }) => {
  const [src, setSrc] = useState<string | undefined>(item.thumbnail || item.embedUrl);

  useEffect(() => {
    if (item.thumbnail) {
      setSrc(item.thumbnail);
      return;
    }
    if (item.blob) {
      const objectUrl = URL.createObjectURL(item.blob);
      setSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setSrc(item.embedUrl);
  }, [item]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70">
      <div className="aspect-square bg-slate-950">
        {item.type === 'image' && src ? (
          <img src={src} alt={item.name} className="h-full w-full object-cover" />
        ) : item.type === 'video' && src ? (
          <video src={src} className="h-full w-full object-cover" controls />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-500">
            Embedded media
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-slate-100">{item.name}</p>
        <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
};

export default SingleCharacterShell;
