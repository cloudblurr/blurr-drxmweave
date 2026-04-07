import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Upload, Download, Trash2, Edit, MessageSquare, BookOpen, FileText, Share2, ChevronDown } from 'lucide-react';
import { Character, ViewType, GalleryItem, Lorebook } from '../types';
import { getCharacters, saveCharacter, deleteCharacter, generateId, exportCharacter, importCharacter, getLorebooks, exportCharacterHTML, getNodesForCharacter } from '../services/storage';
import { getGalleryItemsByCharacter, saveGalleryItem, deleteGalleryItem, updateGalleryItem } from '../services/galleryDB';
import { OracleViewer } from './OracleViewer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface CharacterGalleryProps {
  onNavigate: (view: ViewType, id?: string) => void;
}

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({ onNavigate }) => {
  const [characters, setCharacters] = useState<Character[]>(getCharacters());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState<string | null>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setExportMenuOpen(null);
    if (exportMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [exportMenuOpen]);

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCharacter = (character: Partial<Character>) => {
    const newChar: Character = {
      id: generateId(),
      name: character.name || 'New Character',
      description: character.description || '',
      personality: character.personality || '',
      scenario: character.scenario || '',
      first_mes: character.first_mes || '',
      mes_example: character.mes_example || '',
      avatar: character.avatar,
      gallery: character.gallery || [],
      tags: character.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attachedLorebooks: character.attachedLorebooks || [],
      data: {},
    };
    saveCharacter(newChar);
    setCharacters(getCharacters());
    setShowCreateModal(false);
  };

  const handleDeleteCharacter = (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      deleteCharacter(id);
      setCharacters(getCharacters());
    }
  };

  const handleExportCharacter = (character: Character) => {
    const json = exportCharacter(character);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const handleExportHTML = async (character: Character) => {
    try {
      const galleryItems = await getGalleryItemsByCharacter(character.id);
      const chatNodes = getNodesForCharacter(character.id);
      const html = await exportCharacterHTML(character, galleryItems, chatNodes);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.name.replace(/\s+/g, '_')}_profile.html`;
      a.click();
      URL.revokeObjectURL(url);
      alert('✅ Interactive HTML profile exported successfully!');
    } catch (err) {
      console.error('Failed to export HTML:', err);
      alert('Failed to export HTML profile. Please try again.');
    }
  };

  const handleShareHTML = async (character: Character) => {
    try {
      const galleryItems = await getGalleryItemsByCharacter(character.id);
      const chatNodes = getNodesForCharacter(character.id);
      
      // Create shareable data object
      const shareData = {
        character,
        gallery: galleryItems,
        nodes: chatNodes
      };
      
      // Encode to base64
      const jsonStr = JSON.stringify(shareData);
      const encoded = btoa(encodeURIComponent(jsonStr));
      
      // Generate shareable URL
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${character.id}?data=${encoded}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Also open in new tab
      window.open(shareUrl, '_blank');
      
      alert('✅ Shareable link copied to clipboard and opened in new tab!\n\nShare this URL to let others view the full character profile with gallery and conversations.');
    } catch (err) {
      console.error('Failed to generate share link:', err);
      alert('Failed to generate shareable link. Please try again.');
    }
  };

  const handleImportCharacter = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          // Handle JSON files
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const char = importCharacter(event.target?.result as string);
              saveCharacter(char);
              setCharacters(getCharacters());
              alert(`Successfully imported: ${char.name}`);
            } catch (err) {
              console.error(err);
              alert('Failed to import character. Please check the JSON file format and try again.');
            }
          };
          reader.readAsText(file);
        } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
          // Handle PNG files with embedded JSON (TavernAI/SillyTavern format)
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const arrayBuffer = event.target?.result as ArrayBuffer;
              const uint8Array = new Uint8Array(arrayBuffer);
              
              // Look for tEXt chunk with chara data
              let jsonString = '';
              for (let i = 0; i < uint8Array.length - 4; i++) {
                if (uint8Array[i] === 0x74 && uint8Array[i+1] === 0x45 && 
                    uint8Array[i+2] === 0x58 && uint8Array[i+3] === 0x74) {
                  // Found tEXt chunk, read the keyword
                  const chunkStart = i + 4;
                  let keywordEnd = chunkStart;
                  while (keywordEnd < uint8Array.length && uint8Array[keywordEnd] !== 0) {
                    keywordEnd++;
                  }
                  const keyword = new TextDecoder().decode(uint8Array.slice(chunkStart, keywordEnd));
                  
                  if (keyword === 'chara') {
                    // Found character data
                    const dataStart = keywordEnd + 1;
                    let dataEnd = dataStart;
                    while (dataEnd < uint8Array.length && uint8Array[dataEnd] !== 0) {
                      dataEnd++;
                    }
                    const base64Data = new TextDecoder().decode(uint8Array.slice(dataStart, dataEnd));
                    jsonString = atob(base64Data);
                    break;
                  }
                }
              }
              
              if (jsonString) {
                const char = importCharacter(jsonString);
                saveCharacter(char);
                setCharacters(getCharacters());
                alert(`Successfully imported: ${char.name}`);
              } else {
                alert('No character data found in PNG file. This may not be a character card image.');
              }
            } catch (err) {
              console.error(err);
              alert('Failed to extract character data from PNG. Please check if this is a valid character card image.');
            }
          };
          reader.readAsArrayBuffer(file);
        }
      }
    };
    input.click();
  };

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="holo-panel p-5 flex items-center justify-between gap-4 animate-fadeInUp">
          <div>
            <h1 className="text-2xl font-bold holo-text-glow flex items-center gap-3">
              <Users className="w-7 h-7" />
              Crew Manifest
            </h1>
            <p className="holo-label mt-1">{characters.length} crew members registered</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportCharacter}
              className="holo-btn-ghost holo-btn px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="holo-btn holo-btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative animate-fadeInUp delay-100">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-holo-cyan/40" />
          <Input
            type="text"
            placeholder="Search crew manifest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 holo-input text-sm"
          />
        </div>

        {/* Character Grid */}
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character, idx) => (
              <div
                key={character.id}
                className="holo-card holo-panel-interactive group animate-fadeInUp"
                style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }}
              >
                {/* Avatar */}
                <div 
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-t-[19px]"
                  onClick={() => onNavigate(ViewType.CharacterDetail, character.id)}
                >
                  {character.avatar ? (
                    <img 
                      src={character.avatar} 
                      alt={character.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(213,0,249,0.08))' }}>
                      <Users className="w-16 h-16 text-slate-600" />
                    </div>
                  )}
                  {/* Scanline overlay on avatar */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.03) 2px, rgba(0,229,255,0.03) 4px)' }} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {character.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="holo-badge text-[10px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-holo-cyan text-base truncate">{character.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{character.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button
                      onClick={() => onNavigate(ViewType.CharacterDetail, character.id)}
                      className="flex-1 holo-btn px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Button>
                    <Button
                      onClick={() => setEditingCharacter(character)}
                      variant="ghost"
                      size="sm"
                      className="holo-btn-ghost holo-btn px-2.5 py-2 rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <div className="relative">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMenuOpen(exportMenuOpen === character.id ? null : character.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="holo-btn-ghost holo-btn px-2.5 py-2 rounded-lg flex items-center gap-0.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      {exportMenuOpen === character.id && (
                        <div 
                          className="absolute right-0 mt-1 w-52 holo-modal z-50 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            onClick={() => {
                              handleExportCharacter(character);
                              setExportMenuOpen(null);
                            }}
                            variant="ghost"
                            className="w-full px-4 py-3 text-left hover:bg-holo-cyan/5 text-slate-300 flex items-center gap-3 transition-colors border-b border-holo-cyan/10"
                          >
                            <Download className="w-4 h-4 text-holo-cyan/60" />
                            <div>
                              <div className="text-xs font-medium text-holo-cyan">Export JSON</div>
                              <div className="text-[10px] text-slate-600">Raw character data</div>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              handleExportHTML(character);
                              setExportMenuOpen(null);
                            }}
                            variant="ghost"
                            className="w-full px-4 py-3 text-left hover:bg-holo-cyan/5 text-slate-300 flex items-center gap-3 transition-colors border-b border-holo-cyan/10"
                          >
                            <FileText className="w-4 h-4 text-holo-blue/60" />
                            <div>
                              <div className="text-xs font-medium text-holo-cyan">Export HTML</div>
                              <div className="text-[10px] text-slate-600">Interactive profile</div>
                            </div>
                          </Button>
                          <Button
                            onClick={() => {
                              handleShareHTML(character);
                              setExportMenuOpen(null);
                            }}
                            variant="ghost"
                            className="w-full px-4 py-3 text-left hover:bg-holo-cyan/5 text-slate-300 flex items-center gap-3 transition-colors"
                          >
                            <Share2 className="w-4 h-4 text-holo-purple/60" />
                            <div>
                              <div className="text-xs font-medium text-holo-cyan">Share Profile</div>
                              <div className="text-[10px] text-slate-600">Open & copy link</div>
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDeleteCharacter(character.id)}
                      variant="ghost"
                      size="sm"
                      className="holo-btn-danger px-2.5 py-2 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 holo-panel p-8 animate-fadeInUp">
            <Users className="w-16 h-16 mx-auto mb-4 text-holo-cyan/30 animate-holo-pulse" />
            <h3 className="text-xl font-semibold holo-text-glow mb-2">No Crew Found</h3>
            <p className="text-slate-600 text-sm">Commission your first crew member to begin</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCharacter) && (
        <CharacterModal
          character={editingCharacter}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCharacter(null);
          }}
          onSave={(char) => {
            if (editingCharacter) {
              saveCharacter({ ...editingCharacter, ...char, updatedAt: Date.now() });
            } else {
              handleCreateCharacter(char);
            }
            setCharacters(getCharacters());
            setShowCreateModal(false);
            setEditingCharacter(null);
          }}
        />
      )}
    </div>
  );
};

// Character Modal Component
interface CharacterModalProps {
  character: Character | null;
  onClose: () => void;
  onSave: (character: Partial<Character>) => void;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ character, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Character>>({
    name: character?.name || '',
    description: character?.description || '',
    personality: character?.personality || '',
    scenario: character?.scenario || '',
    first_mes: character?.first_mes || '',
    mes_example: character?.mes_example || '',
    avatar: character?.avatar || '',
    tags: character?.tags || [],
    attachedLorebooks: character?.attachedLorebooks || [],
  });
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [embedName, setEmbedName] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      if (character?.id) {
        const items = await getGalleryItemsByCharacter(character.id);
        setMedia(items);
      } else {
        setMedia([]);
      }
    };
    loadMedia();
  }, [character?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      e.target.value = '';
      return;
    }
    setIsAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, avatar: reader.result as string });
      setIsAvatarUploading(false);
      e.target.value = '';
    };
    reader.onerror = () => {
      setIsAvatarUploading(false);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !character?.id) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) continue;
        await saveGalleryItem({
          type,
          name: file.name,
          blob: file,
          characterId: character.id,
          tags: [],
          thumbnail: undefined,
        });
      }
      const items = await getGalleryItemsByCharacter(character.id);
      setMedia(items);
    } catch (err) {
      console.error('Failed to upload media', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteMedia = async (id: string) => {
    await deleteGalleryItem(id);
    if (character?.id) {
      const items = await getGalleryItemsByCharacter(character.id);
      setMedia(items);
    }
  };

  const handleRenameMedia = async (id: string, name: string) => {
    await updateGalleryItem(id, { name });
    if (character?.id) {
      const items = await getGalleryItemsByCharacter(character.id);
      setMedia(items);
    }
  };

  const handleAddEmbed = async () => {
    if (!character?.id || !embedName.trim() || !embedCode.trim()) return;
    setIsUploading(true);
    try {
      const urlMatch = embedCode.trim().match(/https?:\/\/\S+/);
      await saveGalleryItem({
        type: 'embed',
        name: embedName.trim(),
        embedCode: embedCode.trim(),
        embedUrl: urlMatch ? urlMatch[0] : undefined,
        characterId: character.id,
        tags: [],
        thumbnail: undefined,
      });
      const items = await getGalleryItemsByCharacter(character.id);
      setMedia(items);
      setEmbedName('');
      setEmbedCode('');
    } catch (err) {
      console.error('Failed to add embed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 holo-overlay flex items-center justify-center z-50 p-4">
      <div className="holo-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-fadeInScale">
        <div className="p-6 border-b border-holo-cyan/10 flex items-center justify-between">
          <h2 className="text-xl font-bold holo-text-glow">
            {character ? 'Edit Crew Member' : 'Commission Crew Member'}
          </h2>
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="text-slate-500 hover:text-holo-cyan transition-colors h-8 w-8 p-0">✕</Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Name *</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 holo-input text-sm"
              placeholder="Character name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Avatar URL</label>
            <div className="flex flex-col gap-3">
              <Input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full px-4 py-2.5 holo-input text-sm"
                placeholder="https://... (or upload an image)"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">Upload an image to use as the avatar.</p>
                <label className="holo-btn-ghost holo-btn px-3 py-2 rounded-lg text-xs cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  {isAvatarUploading ? 'Uploading…' : 'Upload Avatar'}
                </label>
              </div>
              {formData.avatar && (
                <div className="flex items-center gap-3">
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-xl object-cover border border-holo-cyan/20"
                  />
                  <Button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: '' })}
                    variant="ghost"
                    size="sm"
                    className="holo-btn-ghost holo-btn px-3 py-2 rounded-lg text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Description</label>
            <Textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm"
              placeholder="Concise bio: appearance, vibe, role (avoid long prose)."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Personality</label>
            <Textarea
              rows={3}
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm"
              placeholder="Use concise bullet-ish traits (tone, style, boundaries)."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Scenario</label>
            <Textarea
              rows={3}
              value={formData.scenario}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm"
              placeholder="Setting + stakes + relationship hooks (short, vivid)."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">First Message</label>
            <Textarea
              rows={3}
              value={formData.first_mes}
              onChange={(e) => setFormData({ ...formData, first_mes: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm"
              placeholder={`{{char}}: (warm, in-character opener that sets tone and relationship)
{{char}}: I was starting to think you forgot me. Ready to make trouble together?`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Example Messages</label>
            <Textarea
              rows={4}
              value={formData.mes_example}
              onChange={(e) => setFormData({ ...formData, mes_example: e.target.value })}
              className="w-full px-4 py-2.5 holo-textarea text-sm"
              placeholder={`<START>
{{user}}: Hey, what's the plan tonight?
{{char}}: Whatever gets our hearts racing—street food first, rooftop after. Stay close.
{{user}}: You always know the best spots.
{{char}}: I know you. Now move—sunset's waiting.`}
            />
          </div>

          <div className="border-t border-holo-cyan/10 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">Attached Lorebooks</label>
              <p className="text-xs text-slate-600 mb-3">Select lorebooks to inject their lore entries during conversations.</p>
              <div className="space-y-2">
                {getLorebooks().map(book => {
                  const isAttached = (formData.attachedLorebooks || []).includes(book.id);
                  return (
                    <label
                      key={book.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isAttached ? 'holo-sidebar-item-active' : 'holo-sidebar-item'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={(e) => {
                          const current = formData.attachedLorebooks || [];
                          const updated = e.target.checked
                            ? [...current, book.id]
                            : current.filter(id => id !== book.id);
                          setFormData({ ...formData, attachedLorebooks: updated });
                        }}
                        className="w-4 h-4 rounded border-holo-cyan/30 text-holo-cyan focus:ring-holo-cyan focus:ring-offset-black"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-holo-cyan/60" />
                          <span className="text-holo-cyan font-medium text-sm">{book.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{book.description}</p>
                        <p className="text-xs text-slate-500 mt-1">{book.entries.length} entries</p>
                      </div>
                    </label>
                  );
                })}
                {getLorebooks().length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No lorebooks available. Create one in LoreWorld first.</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-holo-cyan/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50">Character Media</label>
                <p className="text-xs text-slate-600">Upload images/videos directly to this character for quick selection.</p>
              </div>
              <label className={`holo-btn px-3 py-2 rounded-lg text-xs cursor-pointer ${character?.id ? 'holo-btn-ghost' : 'opacity-40 cursor-not-allowed'}`}>
                <input type="file" accept="image/*,video/*" multiple className="hidden" disabled={!character?.id || isUploading} onChange={handleMediaUpload} />
                {isUploading ? 'Uploading…' : 'Upload'}
              </label>
            </div>

            {!character?.id && (
              <p className="text-xs text-slate-600">Save the character first to enable media uploads.</p>
            )}

            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {media.map(item => (
                  <CharacterMediaThumb
                    key={item.id}
                    item={item}
                    onDelete={handleDeleteMedia}
                    onRename={handleRenameMedia}
                    onView={() => setViewingItem(item)}
                  />
                ))}
              </div>
            ) : character?.id ? (
              <p className="text-xs text-gray-500">No media yet. Upload images, clips, or embeds.</p>
            ) : null}
          </div>

          <div className="border-t border-holo-cyan/10 pt-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50">Add Embedded Code</label>
            <p className="text-xs text-slate-600">Paste iframe/embed HTML or a media URL to save as reusable embed.</p>
            <Input
              type="text"
              value={embedName}
              onChange={(e) => setEmbedName(e.target.value)}
              placeholder="Title for this embed"
              className="w-full px-3 py-2.5 holo-input text-sm"
            />
            <Textarea
              rows={3}
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder="<iframe ...></iframe> or https://media-url"
              className="w-full px-3 py-2.5 holo-textarea text-sm"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddEmbed}
                disabled={!character?.id || isUploading || !embedName.trim() || !embedCode.trim()}
                className="holo-btn holo-btn-primary px-4 py-2 rounded-lg text-sm"
              >
                Save Embed
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 holo-btn holo-btn-primary px-6 py-3 rounded-lg font-semibold text-sm"
            >
              {character ? 'Save Changes' : 'Create Character'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="holo-btn holo-btn-ghost px-6 py-3 rounded-lg font-semibold text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {viewingItem && (
        <OracleViewer items={media} initialIndex={media.findIndex(i => i.id === viewingItem.id)} onClose={() => setViewingItem(null)} />
      )}
    </div>
  );
};

interface CharacterMediaThumbProps {
  item: GalleryItem;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onView: () => void;
}

const CharacterMediaThumb: React.FC<CharacterMediaThumbProps> = ({ item, onDelete, onRename, onView }) => {
  const [thumbUrl, setThumbUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [name, setName] = useState(item.name);

  useEffect(() => {
    setName(item.name);
  }, [item.name]);

  useEffect(() => {
    let cleanups: Array<() => void> = [];
    if (item.thumbnail) {
      setThumbUrl(item.thumbnail);
    } else if (item.type === 'image' && item.blob) {
      const isBlob = item.blob instanceof Blob;
      const url = isBlob ? URL.createObjectURL(item.blob as Blob) : (item.blob as unknown as string);
      setThumbUrl(url);
      if (isBlob) cleanups.push(() => URL.revokeObjectURL(url));
    }

    if (item.type === 'video' && item.blob) {
      const isBlob = item.blob instanceof Blob;
      const url = isBlob ? URL.createObjectURL(item.blob as Blob) : (item.blob as unknown as string);
      setPreviewUrl(url);
      if (isBlob) cleanups.push(() => URL.revokeObjectURL(url));
    }

    return () => cleanups.forEach(fn => fn());
  }, [item.thumbnail, item.blob, item.type]);

  return (
    <div className="holo-card overflow-hidden flex flex-col hover:border-holo-cyan/30 transition-colors">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onView();
          }
        }}
        className="aspect-square relative text-left"
      >
        {item.type === 'video' ? (
          previewUrl ? (
            <video
              src={previewUrl}
              poster={thumbUrl || undefined}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No preview</div>
          )
        ) : item.type === 'embed' ? (
          <div className="w-full h-full bg-black/40 text-holo-cyan text-xs flex items-center justify-center p-2 text-center">
            Embed
          </div>
        ) : thumbUrl ? (
          <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No preview</div>
        )}
        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(item.id);
          }}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 p-1 bg-red-500/60 backdrop-blur-sm hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-500/20"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && onRename(item.id, name.trim())}
        className="px-2 py-1.5 bg-black/40 border-t border-holo-cyan/10 text-holo-cyan text-xs focus:outline-none focus:border-holo-cyan/40"
      />
    </div>
  );
};
