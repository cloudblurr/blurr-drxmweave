import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, MessageSquare, User, X, ExternalLink, Share2, Copy } from 'lucide-react';
import { Character, ChatNode, GalleryItem, ViewType } from '../types';
import { getCharacter, getNodesForCharacter } from '../services/storage';
import { getGalleryItemsByCharacter } from '../services/galleryDB';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SharedProfileProps {
  encodedData?: string | null;
  characterId?: string | null;
  onNavigate: (view: ViewType) => void;
}

interface SharedProfileData {
  character: Character;
  gallery: GalleryItem[];
  nodes: ChatNode[];
}

export const SharedProfile: React.FC<SharedProfileProps> = ({ encodedData, characterId, onNavigate }) => {
  const [data, setData] = useState<SharedProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'gallery' | 'chats'>('profile');
  const [viewingMedia, setViewingMedia] = useState<GalleryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const loadFromEncoded = () => {
      try {
        if (!encodedData) return false;
        const jsonStr = decodeURIComponent(atob(encodedData));
        const parsed: SharedProfileData = JSON.parse(jsonStr);
        setData(parsed);
        return true;
      } catch (err) {
        console.error('Failed to decode profile data:', err);
        setError('Failed to load character profile. The share link may be corrupted.');
        return true;
      }
    };

    const loadFromCharacterId = async () => {
      if (!characterId) return;
      const character = getCharacter(characterId);
      if (!character) {
        setError('Character not found for this share link.');
        return;
      }
      const gallery = await getGalleryItemsByCharacter(characterId);
      const nodes = getNodesForCharacter(characterId);
      setData({ character, gallery, nodes });
    };

    const usedEncoded = loadFromEncoded();
    if (!usedEncoded) {
      loadFromCharacterId();
    }
  }, [encodedData, characterId]);

  useEffect(() => {
    setPlaybackRate(1);
  }, [viewingMedia?.id]);

  const handleCopyLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="holo-text text-2xl mb-2">Invalid Profile Link</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => onNavigate(ViewType.Dashboard)}
            className="holo-btn holo-btn-primary px-6 py-3"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading character profile...</p>
        </div>
      </div>
    );
  }

  const { character, gallery, nodes } = data;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 relative">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onNavigate(ViewType.Dashboard)}
            className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute top-4 right-4">
          <button
            onClick={handleCopyLink}
            className={`px-4 py-2 backdrop-blur-xl rounded-xl transition-all flex items-center gap-2 ${
              copySuccess 
                ? 'bg-green-500/30 text-white' 
                : 'bg-black/20 hover:bg-black/40 text-white'
            }`}
          >
            {copySuccess ? (
              <>
                <Copy className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Copy Share Link
              </>
            )}
          </button>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center pt-8">
          {character.avatar && (
            <img
              src={character.avatar}
              alt={character.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl mb-4"
            />
          )}
          <h1 className="text-4xl font-bold text-white mb-2">{character.name}</h1>
          {character.description && (
            <p className="text-white/90 text-lg max-w-2xl">{character.description}</p>
          )}
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-sm text-white">
              📸 {gallery.length} Media
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-sm text-white">
              💬 {nodes.length} Conversations
            </span>
          </div>
          <p className="mt-4 text-sm text-white/60">
            🔗 Shared Character Profile • Read-Only View
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="holo-header flex">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-6 py-4 text-center font-medium transition-all border-b-2 ${
            activeTab === 'profile'
              ? 'text-holo-cyan border-holo-cyan bg-holo-cyan/10'
              : 'text-slate-500 border-transparent hover:text-holo-cyan hover:bg-holo-cyan/5'
          }`}
        >
          <User className="w-5 h-5 inline-block mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 px-6 py-4 text-center font-medium transition-all border-b-2 ${
            activeTab === 'gallery'
              ? 'text-holo-cyan border-holo-cyan bg-holo-cyan/10'
              : 'text-slate-500 border-transparent hover:text-holo-cyan hover:bg-holo-cyan/5'
          }`}
        >
          <ImageIcon className="w-5 h-5 inline-block mr-2" />
          Gallery ({gallery.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-6 py-4 text-center font-medium transition-all border-b-2 ${
            activeTab === 'chats'
              ? 'text-holo-cyan border-holo-cyan bg-holo-cyan/10'
              : 'text-slate-500 border-transparent hover:text-holo-cyan hover:bg-holo-cyan/5'
          }`}
        >
          <MessageSquare className="w-5 h-5 inline-block mr-2" />
          Conversations ({nodes.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'profile' && (
            <div className="grid gap-6">
              {character.personality && (
                <div className="holo-panel p-6">
                  <h3 className="text-xl font-semibold text-holo-cyan mb-3 flex items-center gap-2">
                    🎭 Personality
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{character.personality}</p>
                </div>
              )}
              
              {character.scenario && (
                <div className="holo-panel p-6">
                  <h3 className="text-xl font-semibold text-holo-blue mb-3 flex items-center gap-2">
                    📖 Scenario
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{character.scenario}</p>
                </div>
              )}
              
              {character.first_mes && (
                <div className="holo-panel p-6">
                  <h3 className="text-xl font-semibold text-holo-purple mb-3 flex items-center gap-2">
                    💬 First Message
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{character.first_mes}</p>
                </div>
              )}
              
              {character.mes_example && (
                <div className="holo-panel p-6">
                  <h3 className="text-xl font-semibold text-holo-purple mb-3 flex items-center gap-2">
                    💭 Example Dialogue
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-sm">{character.mes_example}</p>
                </div>
              )}
              
              {character.tags && character.tags.length > 0 && (
                <div className="holo-panel p-6">
                  <h3 className="text-xl font-semibold text-holo-cyan mb-3 flex items-center gap-2">
                    🏷️ Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map(tag => (
                      <span key={tag} className="holo-badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="holo-panel p-6">
                <h3 className="text-xl font-semibold text-holo-cyan mb-3 flex items-center gap-2">
                  ℹ️ Metadata
                </h3>
                <div className="space-y-2 text-sm text-slate-500">
                  <p>Created: {new Date(character.createdAt).toLocaleString()}</p>
                  <p>Last Updated: {new Date(character.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setViewingMedia(item)}
                      className="relative group cursor-pointer holo-card overflow-hidden hover:border-holo-cyan/40 transition-all">
                      {item.type === 'image' && item.blob && (
                        <img
                          src={URL.createObjectURL(item.blob)}
                          alt={item.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      {item.type === 'video' && item.blob && (
                        <video
                          src={URL.createObjectURL(item.blob)}
                          className="w-full h-48 object-cover"
                          poster={item.thumbnail}
                        />
                      )}
                      {item.type === 'embed' && (
                        <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/80">
                          <ExternalLink className="w-12 h-12 text-slate-600" />
                        </div>
                      )}
                      <div className="p-3 bg-black/60 backdrop-blur">
                        <p className="text-sm text-slate-400 truncate">{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No gallery items</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-4">
              {nodes.length > 0 ? (
                nodes.map((node) => (
                  <div
                    key={node.id}
                    className="holo-panel p-6"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-holo-cyan mb-1">
                        {node.title || 'Untitled Conversation'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {new Date(node.createdAt).toLocaleString()} • {node.messages.length} messages
                      </p>
                    </div>
                    <div className="space-y-3">
                      {node.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl ${
                            msg.role === 'user'
                              ? 'holo-msg-user ml-8'
                              : 'holo-msg-assistant mr-8'
                          }`}
                        >
                          <div className="text-xs font-semibold text-holo-cyan/50 uppercase mb-2">
                            {msg.role === 'user' ? 'User' : character.name}
                          </div>
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                              h1: ({children}) => <h1 className="text-xl font-bold text-white mb-5 mt-8 pb-2.5 border-b-2 border-slate-700/50 first:mt-0 tracking-tight">{children}</h1>,
                              h2: ({children}) => <h2 className="text-lg font-bold text-white mb-4 mt-8 flex items-center gap-2 first:mt-0 tracking-tight"><span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></span>{children}</h2>,
                              h3: ({children}) => <h3 className="text-base font-semibold text-slate-100 mb-3 mt-6 first:mt-0 tracking-tight">{children}</h3>,
                              p: ({children}) => <p className="leading-[1.8] mb-5 text-slate-200 text-[15px] last:mb-0 font-normal tracking-normal">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-outside ml-4 mb-5 space-y-2 text-slate-200 marker:text-slate-500 text-[14.5px]">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-outside ml-4 mb-5 space-y-2 text-slate-200 marker:text-slate-500 text-[14.5px]">{children}</ol>,
                              li: ({children}) => <li className="pl-2 leading-[1.75]">{children}</li>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-600/60 pl-4 py-2.5 my-5 italic text-slate-300 bg-slate-900/50 rounded-r-lg text-[14.5px]">{children}</blockquote>,
                              a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/40 hover:decoration-cyan-300/60 underline-offset-2 transition-colors font-medium">{children}</a>,
                              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                              em: ({children}) => <em className="italic text-slate-100">{children}</em>,
                              code: ({inline, children}: any) => inline ? <code className="bg-slate-900/90 text-cyan-300 px-2 py-0.5 rounded text-[0.9em] font-mono border border-slate-700/60 tracking-tight font-medium">{children}</code> : <code>{children}</code>
                            }}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          <div className="text-xs text-slate-500 mt-2">
                            {new Date(msg.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No conversations yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {viewingMedia && (
        <div
          className="holo-overlay z-50 flex items-center justify-center p-4"
          onClick={() => setViewingMedia(null)}
        >
          <button
            onClick={() => setViewingMedia(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {viewingMedia.type === 'image' && viewingMedia.blob && (
              <img
                src={URL.createObjectURL(viewingMedia.blob)}
                alt={viewingMedia.name}
                className="max-w-full max-h-[85vh] rounded-xl"
              />
            )}
            {viewingMedia.type === 'video' && viewingMedia.blob && (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(viewingMedia.blob)}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] rounded-xl"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = playbackRate;
                    }
                  }}
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xl rounded-lg px-2 py-1">
                  <label className="text-xs text-slate-200 mr-2">Speed</label>
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setPlaybackRate(next);
                      if (videoRef.current) {
                        videoRef.current.playbackRate = next;
                      }
                    }}
                    className="bg-black/60 text-white text-xs rounded px-1 py-0.5"
                  >
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}x
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {viewingMedia.type === 'embed' && viewingMedia.embedUrl && (
              <div className="bg-slate-900 rounded-xl p-4">
                <iframe
                  src={viewingMedia.embedUrl}
                  className="w-full h-[70vh] rounded-xl"
                  allowFullScreen
                />
              </div>
            )}
            <p className="text-center text-white mt-4 text-lg">{viewingMedia.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
