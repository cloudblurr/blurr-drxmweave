import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Plus, Check, X } from 'lucide-react';
import { Wand2, BookMarked, Lightbulb, ListChecks } from 'lucide-react';
import { Message, Role, Lorebook, ProposedLoreCard } from '../types';
import { getLorebooks, getLorebook, saveLoreEntry, generateId, getLoreEntries, saveLorebook } from '../services/storage';
import { chatWithLoreAI, parseLoreCards } from '../services/xaiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LoreAIBuilderProps {
  onEntrySaved?: () => void;
}

export const LoreAIBuilder: React.FC<LoreAIBuilderProps> = ({ onEntrySaved }) => {
  const [lorebooks, setLorebooks] = useState<Lorebook[]>(getLorebooks());
  const [selectedLorebookId, setSelectedLorebookId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposedCards, setProposedCards] = useState<ProposedLoreCard[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickPrompts = [
    'Draft three factions with goals and conflicts.',
    'Describe a capital city, its districts, and a signature landmark.',
    'Create a myth or legend that locals whisper about.',
    'Outline a cultural festival with rituals and foods.',
    'Generate plot hooks tied to current lore entries.'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedLorebookId) {
      const lorebook = getLorebook(selectedLorebookId);
      if (lorebook) {
        setMessages([{
          id: generateId(),
          role: Role.Assistant,
          content: `Hey, I’m LoreAI. I’ll brainstorm, draft, and organize cards for **${lorebook.name}**.

Tell me what you need. I can:
• Pitch ideas, then turn the best into cards
• Expand existing entries with richer detail
• Keep tone/genre consistent with current lore
• Build quick hooks, factions, locations, items, and characters

Start with a request, or tap a quick prompt below.`,
          timestamp: Date.now()
        }]);
      }
    }
  }, [selectedLorebookId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !selectedLorebookId) return;

    const userMessage: Message = {
      id: generateId(),
      role: Role.User,
      content: input.trim(),
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build context from existing lorebook
      const lorebook = getLorebook(selectedLorebookId);
      const loreEntries = getLoreEntries();
      let lorebookContext = '';
      
      if (lorebook) {
        const entries = loreEntries.filter(e => lorebook.entries.includes(e.id));
        if (entries.length > 0) {
          lorebookContext = `Existing entries:\n${entries.map(e => 
            `- ${e.name} (${e.category}): ${e.content.slice(0, 100)}...`
          ).join('\n')}`;
        }
      }

      const response = await chatWithLoreAI(updatedMessages, lorebookContext);

      const assistantMessage: Message = {
        id: generateId(),
        role: Role.Assistant,
        content: response,
        timestamp: Date.now()
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Parse any lore cards from response
      const cards = parseLoreCards(response);
      if (cards.length > 0) {
        const newProposed = cards.map(card => ({
          ...card,
          id: generateId(),
          category: card.category as 'character' | 'location' | 'event' | 'item' | 'concept' | 'other'
        }));
        setProposedCards(prev => [...prev, ...newProposed]);
      }
    } catch (error) {
      console.error('Failed to chat with LoreAI:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to get response from LoreAI. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptCard = (card: ProposedLoreCard) => {
    if (!selectedLorebookId) return;

    const newEntry = {
      id: generateId(),
      name: card.name,
      content: card.content,
      keys: card.keys,
      category: card.category as any,
      importance: card.importance,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    saveLoreEntry(newEntry);

    const lorebook = getLorebook(selectedLorebookId);
    if (lorebook) {
      const updatedBook = {
        ...lorebook,
        entries: [...lorebook.entries, newEntry.id],
        updatedAt: Date.now()
      };
      saveLorebook(updatedBook);
      setLorebooks(getLorebooks());
    }

    setProposedCards(prev => prev.filter(c => c.id !== card.id));
    
    // Notify parent to refresh
    if (onEntrySaved) {
      onEntrySaved();
    }
  };

  const handleRejectCard = (cardId: string) => {
    setProposedCards(prev => prev.filter(c => c.id !== cardId));
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel - Chat */}
      <div className="flex-1 flex flex-col h-full">
        <div className="holo-header p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-holo-cyan" />
            <div className="flex-1">
              <h2 className="holo-text-glow text-lg">LoreAI Builder</h2>
              <select
                value={selectedLorebookId}
                onChange={(e) => setSelectedLorebookId(e.target.value)}
                className="holo-select mt-2 w-full text-sm"
              >
                <option value="">Select a lorebook...</option>
                {lorebooks.map(book => (
                  <option key={book.id} value={book.id}>{book.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === Role.User ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === Role.Assistant && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-holo-cyan to-holo-blue flex items-center justify-center flex-shrink-0 shadow-glow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-xl p-4 ${
                  message.role === Role.User
                    ? 'holo-msg-user'
                    : 'holo-msg-assistant'
                }`}
              >
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
                    code: ({inline, children}: any) => inline ? <code className="bg-slate-900/90 text-cyan-300 px-2 py-0.5 rounded text-[0.9em] font-mono border border-slate-700/60 tracking-tight font-medium">{children}</code> : <code>{children}</code>
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-holo-cyan to-holo-blue flex items-center justify-center shadow-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="holo-msg-assistant rounded-xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-holo-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-holo-cyan/10 p-4 bg-black/40 flex-shrink-0">
          {selectedLorebookId && messages.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  disabled={isLoading}
                  className="holo-btn holo-btn-ghost text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={selectedLorebookId ? "Describe what you want to create... (Shift+Enter for new line)" : "Select a lorebook first"}
              disabled={isLoading || !selectedLorebookId}
              rows={2}
              className="holo-textarea flex-1 resize-none disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || !selectedLorebookId}
              className="holo-btn holo-btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Proposed Cards */}
      <div className="w-110 max-w-md holo-sidebar border-l border-holo-cyan/10 overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-holo-cyan/10">
          <h3 className="holo-text-glow text-lg flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-holo-cyan" />
            Card Deck
          </h3>
          <p className="holo-label text-xs mt-1">Accept to file into the selected lorebook.</p>
        </div>
        <div className="p-4 space-y-3">
          {proposedCards.length === 0 && (
            <div className="holo-card text-sm text-slate-500 p-3">
              Cards you create will appear here. Ask me to "make cards" or tap a quick prompt.
            </div>
          )}
          {proposedCards.map(card => (
            <div key={card.id} className="holo-card p-4 shadow-glow">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div>
                  <h4 className="font-semibold text-holo-cyan leading-tight">{card.name}</h4>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="holo-badge">
                      {card.category}
                    </span>
                    <span className="holo-badge-purple">
                      {card.importance}/10
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAcceptCard(card)}
                    className="holo-btn holo-btn-primary px-2 py-2 text-xs flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => handleRejectCard(card.id)}
                    className="holo-btn holo-btn-danger px-2 py-2 text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{card.content}</p>
              {card.keys.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {card.keys.map(key => (
                    <span key={key} className="holo-badge">
                      {key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
