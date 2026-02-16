import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Plus, Trash2, BookOpen, Settings as SettingsIcon, Image as ImageIcon, Library, Edit2, Copy, Download, FileText, Share2, Archive, RefreshCw, X, ChevronDown } from 'lucide-react';
import { Character, ChatNode, Message, Role, ViewType, LoreEntry, Lorebook, GalleryItem, CharacterBrain, CharacterMemoryChunk, CharacterMemorySummary, AIModel } from '../types';
import { getCharacter, getNodesForCharacter, saveNode, deleteNode, generateId, getNode, getLoreEntries, getLorebooks, getSettings, exportCharacterHTML, saveCharacter } from '../services/storage';
import { sendMessageToCharacter, sendMessageWithCustomPrompt, sendMessageWithModel, summarizeResponsesToMemory, summarizeMemoryBankOverview } from '../services/xaiService';
import { useRoleplayEngine, getLoreContextForCharacter } from '../services/roleplay';
import { getGalleryItemsByCharacter, saveGalleryItem, createThumbnail } from '../services/galleryDB';
import { NSFW_ROLEPLAY_MODELS } from '../constants';
import { OracleViewer } from './OracleViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CharacterChatProps {
  characterId: string;
  nodeId?: string;
  onNavigate: (view: ViewType, id?: string) => void;
}

export const CharacterChat: React.FC<CharacterChatProps> = ({ characterId, nodeId, onNavigate }) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [nodes, setNodes] = useState<ChatNode[]>([]);
  const [activeNode, setActiveNode] = useState<ChatNode | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLorebooks, setShowLorebooks] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showLoreDex, setShowLoreDex] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [activeLoreCount, setActiveLoreCount] = useState(0);
  const [loreDexSearch, setLoreDexSearch] = useState('');
  const [loreDexCategory, setLoreDexCategory] = useState<string>('all');
  const [expandedLoreEntry, setExpandedLoreEntry] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeTitle, setEditingNodeTitle] = useState('');
  // Regenerate with model selection state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateMessageIndex, setRegenerateMessageIndex] = useState<number | null>(null);
  const [selectedRegenerateModel, setSelectedRegenerateModel] = useState<AIModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didInitLoreCodex = useRef(false);

  // Roleplay Engine Hook - provides layered prompts, action tracking, scene state
  const roleplayEngine = useRoleplayEngine(characterId);

  const ensureBrain = (char: Character): CharacterBrain => {
    if (char.brain) return char.brain;
    return {
      recentResponses: [],
      memoryBank: [],
      overviewMemory: '',
      updatedAt: Date.now()
    };
  };

  const buildResponseChunks = (messages: Message[], characterName: string): string[] => {
    const chunks: string[] = [];
    let lastUser: Message | null = null;

    messages.forEach((msg) => {
      if (msg.role === Role.User) {
        lastUser = msg;
      } else if (msg.role === Role.Assistant) {
        const userText = lastUser?.content ? `User: ${lastUser.content}` : 'User: (no prior user message)';
        const assistantText = `${characterName}: ${msg.content}`;
        chunks.push(`${userText}\n${assistantText}`);
        lastUser = null;
      }
    });

    return chunks;
  };

  useEffect(() => {
    const char = getCharacter(characterId);
    if (char) {
      setCharacter(char);
      // Initialize roleplay engine for this character
      roleplayEngine.initializeEngine(char);
      
      const charNodes = getNodesForCharacter(characterId);
      setNodes(charNodes);

      if (nodeId) {
        const node = getNode(nodeId);
        if (node) setActiveNode(node);
      } else if (charNodes.length === 0) {
        // Create initial node with first message
        const newNode: ChatNode = {
          id: generateId(),
          characterId,
          title: 'New Conversation',
          messages: char.first_mes ? [{
            id: generateId(),
            role: Role.Assistant,
            content: char.first_mes,
            timestamp: Date.now(),
            characterId
          }] : [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveNode(newNode);
        setActiveNode(newNode);
        setNodes([newNode]);
      } else {
        setActiveNode(charNodes[0]);
      }
    }
  }, [characterId, nodeId]);

  useEffect(() => {
    if (didInitLoreCodex.current) return;
    if (character?.attachedLorebooks && character.attachedLorebooks.length > 0) {
      setShowLoreDex(true);
      didInitLoreCodex.current = true;
    }
  }, [character?.attachedLorebooks]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeNode?.messages]);

  useEffect(() => {
    const loadGallery = async () => {
      const items = await getGalleryItemsByCharacter(characterId);
      setGalleryItems(items);
    };
    loadGallery();
    
    // Calculate active lore count
    const char = getCharacter(characterId);
    if (char && char.attachedLorebooks) {
      const lorebooks = getLorebooks();
      const loreEntries = getLoreEntries();
      let count = 0;
      char.attachedLorebooks.forEach(lorebookId => {
        const lorebook = lorebooks.find(b => b.id === lorebookId);
        if (lorebook) {
          lorebook.entries.forEach(entryId => {
            const entry = loreEntries.find(e => e.id === entryId);
            if (entry) count++;
          });
        }
      });
      setActiveLoreCount(count);
    }
  }, [characterId]);

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!type) continue;
        const thumbnail = await createThumbnail(file);
        await saveGalleryItem({
          type,
          name: file.name,
          blob: file,
          characterId,
          tags: [],
          thumbnail,
        });
      }
      const items = await getGalleryItemsByCharacter(characterId);
      setGalleryItems(items);
      if (items.length > 0) {
        const newest = [...items].sort((a, b) => b.createdAt - a.createdAt)[0];
        setViewingItem(newest);
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !character || !activeNode || isLoading || activeNode.isClosed) return;

    const userMessage: Message = {
      id: generateId(),
      role: Role.User,
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeNode.messages, userMessage];
    const updatedNode = { ...activeNode, messages: updatedMessages, updatedAt: Date.now() };
    saveNode(updatedNode);
    setActiveNode(updatedNode);
    setInput('');
    setIsLoading(true);

    try {
      // Get lore context using the roleplay engine helper
      const loreContext = getLoreContextForCharacter(character);

      // Build enhanced system prompt using the roleplay engine
      // This includes: System Prompt (narrative rules), Developer Prompt (content style),
      // Scene Prompt (dynamic state), Action Ledger (unresolved actions), and User Model
      const enhancedSystemPrompt = roleplayEngine.buildFullSystemPrompt(character, loreContext);
      
      // Prepare the turn (parses user message for actions, updates scene state)
      roleplayEngine.prepareMessage(userMessage.content);

      // Send message with the enhanced roleplay engine prompt
      const response = await sendMessageWithCustomPrompt(
        enhancedSystemPrompt,
        updatedMessages,
        userMessage.content
      );

      // Process the response through the roleplay engine
      // This validates the response, resolves actions, and updates scene state
      const turnResult = roleplayEngine.processResponse(response, userMessage.content);
      
      // Log validation issues for debugging (can be removed in production)
      if (!turnResult.validation.valid) {
        console.warn('Response validation issues:', turnResult.validation.issues);
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: Role.Assistant,
        content: response,
        timestamp: Date.now(),
        characterId: character.id
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalNode = { 
        ...updatedNode, 
        messages: finalMessages, 
        updatedAt: Date.now(),
        title: updatedMessages.length === 1 ? userMessage.content.slice(0, 30) : updatedNode.title
      };
      saveNode(finalNode);
      setActiveNode(finalNode);
      setNodes(getNodesForCharacter(characterId));
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to send message. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEditNode = (node: ChatNode) => {
    setEditingNodeId(node.id);
    setEditingNodeTitle(node.title);
  };

  const handleSaveNodeTitle = (node: ChatNode) => {
    const nextTitle = editingNodeTitle.trim();
    if (!nextTitle) {
      setEditingNodeId(null);
      setEditingNodeTitle('');
      return;
    }
    const updatedNode = { ...node, title: nextTitle, updatedAt: Date.now() };
    saveNode(updatedNode);
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    if (activeNode?.id === node.id) {
      setActiveNode(updatedNode);
    }
    setEditingNodeId(null);
    setEditingNodeTitle('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeNode || !confirm('Delete this message?')) return;
    
    const updatedMessages = activeNode.messages.filter(msg => msg.id !== messageId);
    const updatedNode = { ...activeNode, messages: updatedMessages, updatedAt: Date.now() };
    saveNode(updatedNode);
    setActiveNode(updatedNode);
    setNodes(getNodesForCharacter(characterId));
  };

  const handleEditMessage = (messageId: string) => {
    const message = activeNode?.messages.find(msg => msg.id === messageId);
    if (message) {
      setEditingMessageId(messageId);
      setEditingContent(message.content);
    }
  };

  const handleSaveEdit = (messageId: string) => {
    if (!activeNode || !editingContent.trim()) return;
    
    const updatedMessages = activeNode.messages.map(msg => 
      msg.id === messageId ? { ...msg, content: editingContent.trim() } : msg
    );
    const updatedNode = { ...activeNode, messages: updatedMessages, updatedAt: Date.now() };
    saveNode(updatedNode);
    setActiveNode(updatedNode);
    setNodes(getNodesForCharacter(characterId));
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Optional: show a toast notification
  };

  // Open regenerate modal with model selection
  const openRegenerateModal = (messageIndex: number) => {
    setRegenerateMessageIndex(messageIndex);
    setSelectedRegenerateModel(null);
    setShowRegenerateModal(true);
  };

  // Regenerate using the default model (quick regenerate)
  const handleRegenerateResponse = async (messageIndex: number) => {
    if (!activeNode || !character || isLoading || messageIndex === 0) return;
    
    // Get the user message before this assistant message
    const previousUserMessage = activeNode.messages[messageIndex - 1];
    if (!previousUserMessage || previousUserMessage.role !== Role.User) return;
    
    setIsLoading(true);
    
    try {
      // Get history up to (but not including) this assistant message
      const historyMessages = activeNode.messages.slice(0, messageIndex);
      
      // Get lore context using the roleplay engine helper
      const loreContext = getLoreContextForCharacter(character);
      
      // Build enhanced system prompt using the roleplay engine
      const enhancedSystemPrompt = roleplayEngine.buildFullSystemPrompt(character, loreContext);
      
      // Prepare the turn (this re-parses the user message for actions)
      roleplayEngine.prepareMessage(previousUserMessage.content);
      
      // Generate new response with enhanced prompt
      const response = await sendMessageWithCustomPrompt(
        enhancedSystemPrompt,
        historyMessages,
        previousUserMessage.content
      );
      
      // Process response through roleplay engine
      const turnResult = roleplayEngine.processResponse(response, previousUserMessage.content);
      
      if (!turnResult.validation.valid) {
        console.warn('Regenerated response validation issues:', turnResult.validation.issues);
      }
      
      // Replace the message at this index with new response
      const newMessage: Message = {
        id: generateId(),
        role: Role.Assistant,
        content: response,
        timestamp: Date.now(),
        characterId: character.id
      };
      
      const updatedMessages = [
        ...activeNode.messages.slice(0, messageIndex),
        newMessage,
        ...activeNode.messages.slice(messageIndex + 1)
      ];
      
      const updatedNode = { ...activeNode, messages: updatedMessages, updatedAt: Date.now() };
      saveNode(updatedNode);
      setActiveNode(updatedNode);
      setNodes(getNodesForCharacter(characterId));
    } catch (error) {
      console.error('Failed to regenerate response:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to regenerate response.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate using a specific model selected from modal
  const handleRegenerateWithModel = async () => {
    if (!activeNode || !character || isLoading || regenerateMessageIndex === null) return;
    if (!selectedRegenerateModel) {
      // Use default regenerate
      handleRegenerateResponse(regenerateMessageIndex);
      setShowRegenerateModal(false);
      return;
    }
    
    const messageIndex = regenerateMessageIndex;
    const previousUserMessage = activeNode.messages[messageIndex - 1];
    if (!previousUserMessage || previousUserMessage.role !== Role.User) return;
    
    setIsLoading(true);
    setShowRegenerateModal(false);
    
    try {
      // Get history up to (but not including) this assistant message
      const historyMessages = activeNode.messages.slice(0, messageIndex);
      
      // Get lore context and build enhanced system prompt
      const loreContext = getLoreContextForCharacter(character);
      const enhancedSystemPrompt = roleplayEngine.buildFullSystemPrompt(character, loreContext);
      
      // Prepare the turn
      roleplayEngine.prepareMessage(previousUserMessage.content);
      
      // Generate response using the selected model
      const response = await sendMessageWithModel(
        selectedRegenerateModel.id,
        selectedRegenerateModel.provider,
        enhancedSystemPrompt,
        historyMessages,
        previousUserMessage.content
      );
      
      // Process response through roleplay engine
      const turnResult = roleplayEngine.processResponse(response, previousUserMessage.content);
      
      if (!turnResult.validation.valid) {
        console.warn('Regenerated response validation issues:', turnResult.validation.issues);
      }
      
      // Replace the message at this index with new response
      const newMessage: Message = {
        id: generateId(),
        role: Role.Assistant,
        content: response,
        timestamp: Date.now(),
        characterId: character.id
      };
      
      const updatedMessages = [
        ...activeNode.messages.slice(0, messageIndex),
        newMessage,
        ...activeNode.messages.slice(messageIndex + 1)
      ];
      
      const updatedNode = { 
        ...activeNode, 
        messages: updatedMessages, 
        updatedAt: Date.now(),
        model: selectedRegenerateModel.id // Track which model was used
      };
      saveNode(updatedNode);
      setActiveNode(updatedNode);
      setNodes(getNodesForCharacter(characterId));
    } catch (error) {
      console.error('Failed to regenerate with model:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to regenerate response.'}`);
    } finally {
      setIsLoading(false);
      setSelectedRegenerateModel(null);
      setRegenerateMessageIndex(null);
    }
  };

  const handleNewNode = () => {
    if (!character) return;
    const newNode: ChatNode = {
      id: generateId(),
      characterId,
      title: 'New Conversation',
      messages: character.first_mes ? [{
        id: generateId(),
        role: Role.Assistant,
        content: character.first_mes,
        timestamp: Date.now(),
        characterId
      }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isClosed: false,
    };
    saveNode(newNode);
    setActiveNode(newNode);
    setNodes(getNodesForCharacter(characterId));
  };

  const handleCompileConversation = async () => {
    if (!character || !activeNode || isLoading) return;
    if (activeNode.isClosed) return;

    const confirmed = confirm('Compile this conversation into memory? This will close the chat but keep logs available.');
    if (!confirmed) return;

    const responseChunks = buildResponseChunks(activeNode.messages, character.name);
    if (responseChunks.length === 0) {
      alert('No assistant responses found to compile.');
      return;
    }

    setIsLoading(true);
    try {
      const brain = ensureBrain(character);

      const newChunks: CharacterMemoryChunk[] = responseChunks.map((content) => ({
        id: generateId(),
        createdAt: Date.now(),
        content
      }));

      const recentResponses = [...brain.recentResponses, ...newChunks];
      const memoryBank: CharacterMemorySummary[] = [...brain.memoryBank];

      // Compile every 25 response chunks into a memory bank summary
      while (recentResponses.length >= 25) {
        const batch = recentResponses.splice(0, 25);
        const summary = await summarizeResponsesToMemory(character.name, batch.map((b) => b.content));
        memoryBank.push({
          id: generateId(),
          createdAt: Date.now(),
          content: summary,
          sourceCount: batch.length
        });
      }

      let overviewMemory = brain.overviewMemory || '';
      if (memoryBank.length >= 25) {
        overviewMemory = await summarizeMemoryBankOverview(
          character.name,
          memoryBank.map((m) => m.content)
        );
      }

      const updatedBrain: CharacterBrain = {
        recentResponses,
        memoryBank,
        overviewMemory,
        updatedAt: Date.now()
      };

      const updatedCharacter: Character = { ...character, brain: updatedBrain, updatedAt: Date.now() };
      saveCharacter(updatedCharacter);
      setCharacter(updatedCharacter);

      const compiledNode: ChatNode = {
        ...activeNode,
        isClosed: true,
        compiledAt: Date.now(),
        updatedAt: Date.now()
      };
      saveNode(compiledNode);
      setActiveNode(compiledNode);
      setNodes(getNodesForCharacter(characterId));

      alert('Conversation compiled into memory and archived.');
    } catch (error) {
      console.error('Failed to compile memory:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to compile memory.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNode = (id: string) => {
    if (confirm('Delete this conversation?')) {
      deleteNode(id);
      const remainingNodes = getNodesForCharacter(characterId);
      setNodes(remainingNodes);
      if (activeNode?.id === id) {
        setActiveNode(remainingNodes[0] || null);
      }
    }
  };

  const handleExportHTML = async () => {
    if (!character) return;
    try {
      const html = await exportCharacterHTML(character, galleryItems, nodes);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.name.replace(/\s+/g, '_')}_profile.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export HTML:', err);
      alert('Failed to export HTML profile.');
    }
  };

  const handleShareHTML = async () => {
    if (!character) return;
    try {
      const shareData = {
        character,
        gallery: galleryItems,
        nodes: nodes
      };
      
      const jsonStr = JSON.stringify(shareData);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${character.id}?data=${encoded}`;
      
      await navigator.clipboard.writeText(shareUrl);
      window.open(shareUrl, '_blank');
      
      alert('✅ Shareable link copied to clipboard and opened!');
    } catch (err) {
      console.error('Failed to share:', err);
      alert('Failed to generate shareable link.');
    }
  };

  if (!character) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">Character not found</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="holo-header p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(ViewType.Characters)}
              className="p-2 hover:bg-holo-cyan/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-holo-cyan/60" />
            </button>
            {character.avatar && (
              <img src={character.avatar} alt={character.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-holo-cyan/30" />
            )}
            <div>
              <h1 className="text-base font-bold holo-text-glow">{character.name}</h1>
              <p className="text-[10px] holo-label">{activeNode?.title || 'Comm Channel Active'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {character.attachedLorebooks && character.attachedLorebooks.length > 0 && (
              <>
                <button
                  onClick={() => setShowLorebooks(!showLorebooks)}
                  className="holo-btn holo-btn-ghost px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                  title={`${character.attachedLorebooks.length} lorebook(s) attached with ${activeLoreCount} total entries`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="font-medium">{activeLoreCount}</span>
                </button>
                <button
                  onClick={() => setShowLoreDex(!showLoreDex)}
                  className="holo-btn holo-btn-ghost px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                  title="Lore Codex - Browse Active Lore Entries"
                >
                  <Library className="w-3.5 h-3.5" />
                  Codex
                </button>
              </>
            )}
            <button
              onClick={() => setShowGallery(!showGallery)}
              className="holo-btn holo-btn-ghost px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {galleryItems.length}
            </button>
            <button
              onClick={handleNewNode}
              className="holo-btn holo-btn-primary px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
            <button
              onClick={handleCompileConversation}
              disabled={!activeNode || activeNode.isClosed || isLoading}
              className="holo-btn px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-holo-purple border-holo-purple/30 hover:bg-holo-purple/10 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Compile this conversation into memory and archive it"
            >
              <Archive className="w-3.5 h-3.5" />
              Compile
            </button>
            <button
              onClick={handleExportHTML}
              className="holo-btn holo-btn-ghost px-2 py-1.5 rounded-lg text-xs"
              title="Export as interactive HTML profile"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleShareHTML}
              className="holo-btn holo-btn-ghost px-2 py-1.5 rounded-lg text-xs"
              title="Share profile (opens in new tab)"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation Nodes */}
        <div className="w-56 holo-sidebar overflow-y-auto">
          <div className="p-3 space-y-1.5">
            <h3 className="holo-label text-[10px] mb-3">Comm Channels</h3>
            {nodes.map(node => (
              <div
                key={node.id}
                onClick={() => setActiveNode(node)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all group ${
                  activeNode?.id === node.id
                    ? 'holo-sidebar-item-active'
                    : 'holo-sidebar-item'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingNodeId === node.id ? (
                      <input
                        value={editingNodeTitle}
                        onChange={(e) => setEditingNodeTitle(e.target.value)}
                        onBlur={() => handleSaveNodeTitle(node)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNodeTitle(node);
                          } else if (e.key === 'Escape') {
                            setEditingNodeId(null);
                            setEditingNodeTitle('');
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 holo-input text-xs rounded-lg"
                      />
                    ) : (
                      <p className="text-xs font-medium text-holo-cyan truncate">{node.title}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-600">{node.messages.length} msgs</p>
                      {node.isClosed && (
                        <span className="holo-badge-purple text-[9px] px-1.5 py-0.5">
                          Archived
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditNode(node);
                    }}
                    className="text-[10px] text-slate-600 hover:text-holo-cyan transition-colors"
                  >
                    Rename
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeNode?.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 group ${message.role === Role.User ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === Role.Assistant && character.avatar && (
                  <img src={character.avatar} alt={character.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-holo-cyan/20" />
                )}
                <div className="flex flex-col gap-2 max-w-[70%]">
                  <div
                    className={`rounded-xl p-4 ${
                      message.role === Role.User
                        ? 'holo-msg-user'
                        : 'holo-msg-assistant'
                    }`}
                  >
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full px-3 py-2 holo-textarea text-sm resize-none"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="holo-btn holo-btn-primary px-3 py-1 rounded-lg text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="holo-btn holo-btn-ghost px-3 py-1 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        className="prose prose-invert prose-sm max-w-none"
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-white mb-5 mt-8 pb-2.5 border-b-2 border-slate-700/50 first:mt-0 tracking-tight">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-bold text-white mb-4 mt-8 flex items-center gap-2 first:mt-0 tracking-tight"><span className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></span>{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-semibold text-slate-100 mb-3 mt-6 first:mt-0 tracking-tight">{children}</h3>,
                          h4: ({children}) => <h4 className="text-sm font-semibold text-slate-200 mb-2.5 mt-5 first:mt-0">{children}</h4>,
                          p: ({children}) => <p className="leading-[1.8] mb-5 text-slate-200 text-[15px] last:mb-0 font-normal tracking-normal">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-outside ml-4 mb-5 space-y-2 text-slate-200 marker:text-slate-500 text-[14.5px]">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-outside ml-4 mb-5 space-y-2 text-slate-200 marker:text-slate-500 text-[14.5px]">{children}</ol>,
                          li: ({children}) => <li className="pl-2 leading-[1.75]">{children}</li>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-cyan-600/60 pl-4 py-2.5 my-5 italic text-slate-300 bg-slate-900/50 rounded-r-lg text-[14.5px]">{children}</blockquote>,
                          a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/40 hover:decoration-cyan-300/60 underline-offset-2 transition-colors font-medium">{children}</a>,
                          hr: () => <hr className="border-slate-700 my-8" />,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="italic text-slate-100">{children}</em>,
                          code: ({inline, children}: any) => inline ? <code className="bg-slate-800/90 text-cyan-300 px-2 py-0.5 rounded text-[0.9em] font-mono border border-slate-700/60 tracking-tight font-medium">{children}</code> : <code>{children}</code>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  {/* Message actions - show on hover */}
                  {editingMessageId !== message.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="p-1 hover:bg-holo-cyan/10 rounded text-slate-600 hover:text-holo-cyan transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="p-1 hover:bg-holo-cyan/10 rounded text-slate-600 hover:text-holo-cyan transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {message.role === Role.Assistant && index > 0 && (
                        <>
                          {/* Quick regenerate with default model */}
                          <button
                            onClick={() => handleRegenerateResponse(index)}
                            disabled={isLoading}
                            className="p-1 hover:bg-holo-cyan/10 rounded text-slate-600 hover:text-holo-cyan transition-colors disabled:opacity-40"
                            title="Quick Regenerate (default model)"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          {/* Regenerate with model selection */}
                          <button
                            onClick={() => openRegenerateModal(index)}
                            disabled={isLoading}
                            className="p-1 hover:bg-holo-amber/10 rounded text-slate-600 hover:text-holo-amber transition-colors disabled:opacity-40"
                            title="Regenerate with model selection"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 hover:bg-red-500/10 rounded text-slate-600 hover:text-red-400 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                {character.avatar && (
                  <img src={character.avatar} alt={character.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-holo-cyan/20" />
                )}
                <div className="holo-msg-assistant rounded-xl p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-holo-cyan/10 p-4 bg-black/40 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={activeNode?.isClosed ? 'This channel is archived. Open a new one to continue.' : `Transmit to ${character.name}... (Shift+Enter for new line)`}
                disabled={isLoading || activeNode?.isClosed}
                rows={1}
                className="flex-1 px-4 py-3 holo-textarea text-sm placeholder-slate-600 disabled:opacity-40 resize-none overflow-y-auto max-h-40"
                style={{ minHeight: '48px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '48px';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim() || activeNode?.isClosed}
                className="holo-btn holo-btn-primary px-5 py-3 rounded-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lorebook Sidebar */}
      {showLorebooks && (
        <div className="fixed right-0 top-0 bottom-0 w-80 holo-sidebar z-40">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold holo-text-glow flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-holo-cyan" />
                Lore Context
              </h3>
              <button
                onClick={() => setShowLorebooks(false)}
                className="text-slate-600 hover:text-holo-cyan transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {character.attachedLorebooks?.map(lorebookId => {
                const lorebook = getLorebooks().find(b => b.id === lorebookId);
                if (!lorebook) return null;
                return (
                  <div key={lorebookId} className="holo-card p-3">
                    <h4 className="font-semibold text-holo-cyan text-sm mb-1">{lorebook.name}</h4>
                    <p className="text-xs text-slate-500 mb-1">{lorebook.description}</p>
                    <p className="text-[10px] holo-label">{lorebook.entries.length} entries</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Sidebar */}
      {showGallery && (
        <div className="fixed right-0 top-0 bottom-0 w-80 holo-sidebar z-40 flex flex-col">
          <div className="p-4 border-b border-holo-cyan/10 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold holo-text-glow flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-holo-cyan" />
                Visual Archive
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-slate-600 hover:text-holo-cyan transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] holo-label">Upload imagery to this profile.</p>
              <label className="holo-btn holo-btn-ghost px-3 py-1.5 rounded-lg text-xs cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleGalleryUpload}
                />
                {isUploading ? 'Uploading…' : 'Upload'}
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {galleryItems.length === 0 ? (
              <p className="text-slate-600 text-xs">No media files in archive.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {galleryItems.map(item => (
                  <GalleryThumb key={item.id} item={item} onClick={() => setViewingItem(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lore Codex Sidebar - Enhanced Codex View */}
      {showLoreDex && character.attachedLorebooks && (
        <div className="fixed right-0 top-0 bottom-0 w-96 holo-sidebar flex flex-col z-40">
          <div className="p-4 border-b border-holo-cyan/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold holo-text-glow flex items-center gap-2">
                <Library className="w-4 h-4 text-holo-purple" />
                Lore Codex
              </h3>
              <button
                onClick={() => setShowLoreDex(false)}
                className="text-slate-600 hover:text-holo-cyan transition-colors"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Search lore entries..."
              value={loreDexSearch}
              onChange={(e) => setLoreDexSearch(e.target.value)}
              className="w-full px-3 py-2 holo-input text-sm mb-3"
            />
            <div className="flex gap-1 flex-wrap">
              {['all', 'character', 'location', 'event', 'item', 'concept', 'other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setLoreDexCategory(cat)}
                  className={`px-2.5 py-1 text-[10px] rounded-lg transition-all ${
                    loreDexCategory === cat
                      ? 'holo-badge-purple'
                      : 'holo-badge'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {character.attachedLorebooks.map(lorebookId => {
              const lorebook = getLorebooks().find(b => b.id === lorebookId);
              if (!lorebook) return null;
              
              let loreEntries = getLoreEntries().filter(e => lorebook.entries.includes(e.id));
              
              // Apply filters
              if (loreDexSearch) {
                const searchLower = loreDexSearch.toLowerCase();
                loreEntries = loreEntries.filter(e => 
                  e.name.toLowerCase().includes(searchLower) ||
                  e.content.toLowerCase().includes(searchLower) ||
                  e.keys.some(k => k.toLowerCase().includes(searchLower))
                );
              }
              if (loreDexCategory !== 'all') {
                loreEntries = loreEntries.filter(e => e.category === loreDexCategory);
              }
              
              // Sort by importance
              loreEntries.sort((a, b) => b.importance - a.importance);
              
              if (loreEntries.length === 0) return null;
              
              return (
                <div key={lorebookId} className="space-y-2">
                  <div className="holo-card p-3">
                    <h4 className="font-semibold text-holo-purple text-sm">{lorebook.name}</h4>
                    <p className="text-[10px] holo-label mt-1">{loreEntries.length} entries shown</p>
                  </div>
                  {loreEntries.map(entry => {
                    const isExpanded = expandedLoreEntry === entry.id;
                    const contentPreview = entry.content.length > 150 ? entry.content.slice(0, 150) + '...' : entry.content;
                    
                    return (
                      <div 
                        key={entry.id} 
                        className="holo-card p-3 hover:border-holo-purple/30 cursor-pointer transition-all"
                        onClick={() => setExpandedLoreEntry(isExpanded ? null : entry.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-holo-cyan text-sm flex-1">{entry.name}</h5>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <span className="holo-badge text-[10px]">
                              {entry.category}
                            </span>
                            <span className="holo-badge-purple text-[10px] font-medium">
                              {entry.importance}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {isExpanded ? entry.content : contentPreview}
                        </p>
                        {entry.keys.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.keys.map(key => (
                              <span key={key} className="holo-badge text-[10px]">
                                {key}
                              </span>
                            ))}
                          </div>
                        )}
                        {!isExpanded && entry.content.length > 150 && (
                          <p className="text-[10px] text-holo-purple mt-2">Click to expand...</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Oracle Viewer */}
      {viewingItem && (
        <OracleViewer item={viewingItem} onClose={() => setViewingItem(null)} />
      )}

      {/* Regenerate with Model Selection Modal */}
      {showRegenerateModal && (
        <div className="holo-overlay">
          <div className="holo-modal max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-holo-cyan/10 flex items-center justify-between">
              <h3 className="text-sm font-bold holo-text-glow flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-holo-cyan" />
                Regenerate — Model Selection
              </h3>
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  setSelectedRegenerateModel(null);
                  setRegenerateMessageIndex(null);
                }}
                className="p-1.5 hover:bg-holo-cyan/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <p className="text-xs text-slate-500 mb-4">
                Select a model to regenerate this response, or use the default.
              </p>
              
              {/* Model Groups */}
              <div className="space-y-4">
                {/* xAI Models */}
                <div>
                  <h4 className="holo-label text-[10px] mb-2 text-holo-blue">xAI Models</h4>
                  <div className="space-y-1">
                    {NSFW_ROLEPLAY_MODELS.filter(m => m.provider === 'xai').map(model => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedRegenerateModel(model)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          selectedRegenerateModel?.id === model.id
                            ? 'holo-sidebar-item-active'
                            : 'holo-sidebar-item'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-holo-cyan text-sm">{model.name}</span>
                          {model.isNsfw && (
                            <span className="holo-badge-danger text-[9px]">NSFW</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">{model.pricing}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* OpenRouter Models */}
                <div>
                  <h4 className="holo-label text-[10px] mb-2 text-holo-purple">OpenRouter Models</h4>
                  <div className="space-y-1">
                    {NSFW_ROLEPLAY_MODELS.filter(m => m.provider === 'openrouter').slice(0, 15).map(model => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedRegenerateModel(model)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                          selectedRegenerateModel?.id === model.id
                            ? 'holo-sidebar-item-active'
                            : 'holo-sidebar-item'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-holo-cyan text-sm">{model.name}</span>
                          {model.isNsfw && (
                            <span className="holo-badge-danger text-[9px]">NSFW</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">{model.description?.substring(0, 60)}...</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-holo-cyan/10 flex gap-3">
              <button
                onClick={() => {
                  setShowRegenerateModal(false);
                  if (regenerateMessageIndex !== null) {
                    handleRegenerateResponse(regenerateMessageIndex);
                  }
                }}
                className="flex-1 holo-btn holo-btn-ghost px-4 py-2 rounded-lg font-medium text-sm"
              >
                Use Default Model
              </button>
              <button
                onClick={handleRegenerateWithModel}
                disabled={!selectedRegenerateModel || isLoading}
                className="flex-1 holo-btn holo-btn-primary px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface GalleryThumbProps {
  item: GalleryItem;
  onClick: () => void;
}

const GalleryThumb: React.FC<GalleryThumbProps> = ({ item, onClick }) => {
  const [thumbUrl, setThumbUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

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
    <button
      onClick={onClick}
      className="aspect-square holo-card overflow-hidden hover:ring-1 hover:ring-holo-cyan/40 transition-all"
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
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-700" />
          </div>
        )
      ) : item.type === 'embed' ? (
        <div className="w-full h-full bg-black/40 text-holo-cyan text-xs flex items-center justify-center p-2 text-center">
          Embed
        </div>
      ) : thumbUrl ? (
        <img src={thumbUrl} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-700" />
        </div>
      )}
    </button>
  );
};

