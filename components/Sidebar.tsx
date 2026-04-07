import React, { useState } from 'react';
import { Plus, MessageSquare, Settings, User, LogOut, Pencil, Trash2, Check, X } from 'lucide-react';
import { ChatSession } from '../types';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isOpen
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingSessionId && editTitle.trim()) {
      onRenameSession(editingSessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Use a simpler confirmation or custom UI in real app, basic alert for now to prevent accidental deletion
    if (window.confirm("Are you sure you want to delete this conversation?")) {
        onDeleteSession(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        if (editingSessionId && editTitle.trim()) {
            onRenameSession(editingSessionId, editTitle.trim());
            setEditingSessionId(null);
        }
    } else if (e.key === 'Escape') {
        setEditingSessionId(null);
    }
  };

  return (
    <motion.aside 
      initial={{ width: 280 }}
      animate={{ width: isOpen ? 280 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0"
    >
      {/* Header / Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-zinc-800/50">
        <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold font-mono">
          K
        </div>
        <div>
          <h1 className="font-semibold text-lg tracking-tight">KodaAI</h1>
          <p className="text-xs text-zinc-500">v4.1 Fast Reasoning</p>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          variant="secondary"
          className="w-full flex items-center justify-start gap-2 px-4 py-3 text-sm shadow-sm"
        >
          <Plus size={18} />
          New Conversation
        </Button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-hide">
        <h3 className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-2">History</h3>
        {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const isEditing = editingSessionId === session.id;

            return (
                <div
                    key={session.id}
                    onClick={() => !isEditing && onSelectSession(session.id)}
                    className={`group relative w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-sm cursor-pointer ${
                        isActive 
                        ? 'bg-zinc-800/50 text-white' 
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                >
                    <MessageSquare size={16} className={`shrink-0 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                    
                    {isEditing ? (
                        <div className="flex-1 flex items-center gap-1 min-w-0 z-10" onClick={e => e.stopPropagation()}>
                            <Input
                                autoFocus
                                className="w-full bg-zinc-950/50 border border-indigo-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500 h-7"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button onClick={handleSaveEdit} variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-400 hover:bg-zinc-800 rounded"><Check size={12} /></Button>
                            <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:bg-zinc-800 rounded"><X size={12} /></Button>
                        </div>
                    ) : (
                        <>
                            <span className="truncate flex-1 pr-12">{session.title}</span>
                            
                            {/* Hover Actions */}
                            <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${isActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <Button
                                    onClick={(e) => handleStartEdit(session, e)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-zinc-500 hover:text-white hover:bg-zinc-700/80 rounded-md transition-colors"
                                    title="Rename"
                                >
                                    <Pencil size={12} />
                                </Button>
                                <Button
                                    onClick={(e) => handleDelete(session.id, e)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/80 rounded-md transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            );
        })}
      </div>

      {/* User / Settings Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm">
            <Settings size={16} />
            <span>Settings</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm">
            <User size={16} />
            <span>Profile</span>
          </Button>
           <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors text-sm">
            <LogOut size={16} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};