import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolType, Note, AiMode, MemoryFact } from '../types';
import { 
  X, CheckSquare, Calendar as CalendarIcon, Search, 
  Split, Bot, Code2, Image as ImageIcon, Plus, Trash2,
  ChevronRight, StickyNote, LayoutGrid, FileText, Folder,
  Copy, Quote, Sparkles, Globe, Edit2, Tag, Save, ArrowLeft,
  Check, Play, AlignLeft, ListTodo, BrainCircuit, User, Terminal, Database
} from 'lucide-react';
import { getModeIcon } from './ModeSelector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface WorkspaceProps {
  activeTool: ToolType | null;
  onClose: () => void;
  notes?: Note[];
  memoryFacts?: MemoryFact[];
  activeSessionId?: string;
  onAddNote?: (note: Note) => void;
  onDeleteNote?: (id: string) => void;
  onUpdateNote?: (note: Note) => void;
  onDeleteMemory?: (id: string) => void;
  activeMode?: AiMode;
}

// --- Tool Views ---

const WorkspaceView = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Current Project</h3>
      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Folder size={20} /></div>
          <div><h4 className="font-semibold text-zinc-200">KodaAI App Development</h4><p className="text-xs text-zinc-500">Updated 2m ago</p></div>
        </div>
        <div className="flex gap-2"><span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">React</span></div>
      </div>
    </div>
  </div>
);

const ResearchView = () => (
  <div className="space-y-4 h-full flex flex-col">
    <div className="relative">
      <Search className="absolute left-3 top-3 text-zinc-500" size={16} />
      <Input type="text" placeholder="Research topic..." className="w-full pl-10 pr-4 text-sm" />
    </div>
    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-3 opacity-50"><Search size={48} strokeWidth={1} /><p className="text-sm">Enter a topic to begin deep research</p></div>
  </div>
);

const CompareView = () => (
    <div className="h-full flex flex-col gap-4">
      <Textarea className="flex-1 text-xs font-mono resize-none" placeholder="Original..." />
      <Textarea className="flex-1 text-xs font-mono resize-none" placeholder="Comparison..." />
      <Button className="w-full text-sm" variant="secondary">Run Comparison</Button>
    </div>
);

const CalendarView = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between"><h3 className="font-semibold text-zinc-200">October 2026</h3><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ChevronRight className="rotate-180" size={16}/></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ChevronRight size={16}/></Button></div></div>
    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-zinc-500"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
    <div className="grid grid-cols-7 gap-1 text-center text-sm">{Array.from({ length: 31 }).map((_, i) => <div key={i} className={`aspect-square flex items-center justify-center rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${i === 14 ? 'bg-white text-black' : 'text-zinc-400'}`}>{i + 1}</div>)}</div>
  </div>
);

const TasksView = () => {
    return <div className="text-zinc-400 text-sm">Tasks Module Loaded</div>;
};

const NoteEditForm: React.FC<{ note: Note, onSave: (n: Note) => void, onCancel: () => void }> = ({ note, onSave, onCancel }) => {
    const [title, setTitle] = useState(note.title);
    const [tags, setTags] = useState(note.tags.join(', '));
    const [isGlobal, setIsGlobal] = useState(note.isGlobal);
    return (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-4">
        <Input className="w-full bg-zinc-950 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button onClick={() => onSave({ ...note, title, tags: tags.split(','), isGlobal })} variant="secondary" size="sm" className="text-xs">Save</Button>
        </div>
    );
};
const NotesView = ({ notes = [], activeSessionId, onDelete, onAdd, onUpdate }: any) => {
    return <div className="text-zinc-400 text-sm p-4">Notes Module Active ({notes.length})</div>;
};

const ImageGenView = () => <div className="text-zinc-400 text-sm p-4">Image Gen Active</div>;
const CodingView = () => <div className="text-zinc-400 text-sm p-4">Coding Scratchpad Active</div>;

// --- Memory / Brain View ---
const BrainView = ({ facts, onDelete }: { facts: MemoryFact[], onDelete?: (id: string) => void }) => {
    const userFacts = facts.filter(f => f.category === 'user_profile' || f.category === 'fact');
    const preferences = facts.filter(f => f.category === 'preference');
    const patterns = facts.filter(f => f.category === 'coding_pattern');

    return (
        <div className="space-y-6">
            <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <BrainCircuit size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Neural Memory</h3>
                    <p className="text-xs text-indigo-300">Long-term context & cheatsheets</p>
                </div>
            </div>

            {/* Coding Cheatsheet Section */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Terminal size={12} /> Coding Cheatsheet
                </h4>
                {patterns.length === 0 ? (
                    <div className="text-xs text-zinc-600 italic px-2">No patterns analyzed yet. Chat about code to build this list.</div>
                ) : (
                    patterns.map(fact => (
                        <div key={fact.id} className="relative group bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:bg-zinc-900 transition-colors">
                            <div className="text-xs text-zinc-300 font-mono leading-relaxed">{fact.content}</div>
                            {onDelete && (
                                <Button onClick={() => onDelete(fact.id)} variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="w-full h-px bg-zinc-800/50"></div>

            {/* User Profile Section */}
             <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <User size={12} /> User Profile
                </h4>
                {userFacts.length === 0 ? (
                     <div className="text-xs text-zinc-600 italic px-2">Koda doesn't know you yet. Introduce yourself!</div>
                ) : (
                    <div className="grid gap-2">
                        {userFacts.map(fact => (
                            <div key={fact.id} className="flex items-start justify-between group">
                                <span className="text-xs text-zinc-400">• {fact.content}</span>
                                {onDelete && (
                                    <Button onClick={() => onDelete(fact.id)} variant="ghost" size="sm" className="h-5 w-5 p-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={10} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Preferences Section */}
             <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Tag size={12} /> Preferences
                </h4>
                 {preferences.length === 0 ? (
                     <div className="text-xs text-zinc-600 italic px-2">No preferences stored.</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {preferences.map(fact => (
                            <div key={fact.id} className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/50 border border-zinc-700 text-[10px] text-zinc-300">
                                {fact.content}
                                {onDelete && (
                                    <Button onClick={() => onDelete(fact.id)} variant="ghost" size="sm" className="h-4 w-4 p-0 hover:text-red-400 ml-1">
                                        <X size={8} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Mode Specific Features View ---
const ModeFeaturesView = ({ mode }: { mode: AiMode }) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center shrink-0">
                    {getModeIcon(mode.iconName, 20)}
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">{mode.name}</h3>
                    <p className="text-xs text-indigo-300">Active Mode Features</p>
                </div>
            </div>
            
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Tools</h4>
                {mode.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                                {idx % 2 === 0 ? <Bot size={16}/> : <Sparkles size={16}/>}
                            </div>
                            <span className="text-sm text-zinc-300 group-hover:text-white">{feature}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-indigo-400">
                             <Play size={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Workspace: React.FC<WorkspaceProps> = ({ activeTool, onClose, notes, memoryFacts, activeSessionId, onDeleteNote, onAddNote, onUpdateNote, onDeleteMemory, activeMode }) => {
  const getToolTitle = (tool: ToolType) => {
    switch(tool) {
      case ToolType.Brain: return 'Memory & Cheatsheets'; // New
      case ToolType.AgentModes: return 'Mode Features';
      case ToolType.Tasks: return 'Task Manager';
      case ToolType.Calendar: return 'Calendar';
      case ToolType.Workspace: return 'My Workspace';
      case ToolType.Research: return 'Research Assistant';
      case ToolType.Compare: return 'Diff & Compare';
      case ToolType.ImageGen: return 'Image Generation';
      case ToolType.Coding: return 'Code Scratchpad';
      case ToolType.Notes: return 'Quick Notes';
      case ToolType.WebSearch: return 'Web Search';
      default: return tool;
    }
  };

  const renderContent = () => {
    switch(activeTool) {
      case ToolType.Brain: return <BrainView facts={memoryFacts || []} onDelete={onDeleteMemory} />;
      case ToolType.AgentModes: return activeMode ? <ModeFeaturesView mode={activeMode} /> : <div>Select a mode</div>;
      case ToolType.Tasks: return <TasksView />;
      case ToolType.Calendar: return <CalendarView />;
      case ToolType.Workspace: return <WorkspaceView />;
      case ToolType.Research: return <ResearchView />;
      case ToolType.Compare: return <CompareView />;
      case ToolType.Notes: return <NotesView notes={notes || []} activeSessionId={activeSessionId} onDelete={onDeleteNote} onAdd={onAddNote} onUpdate={onUpdateNote} />;
      case ToolType.Coding: return <CodingView />;
      case ToolType.ImageGen: return <ImageGenView />;
      case ToolType.WebSearch: return <ResearchView />;
      default: return <div className="text-zinc-500 text-sm">Select a tool to begin</div>;
    }
  };

  return (
    <AnimatePresence>
      {activeTool && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: window.innerWidth < 1024 ? '100vw' : 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className={`h-full bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0 shadow-2xl z-40 lg:relative fixed inset-0 lg:inset-auto`}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
              {getToolTitle(activeTool)}
            </h3>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 bg-zinc-950">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};