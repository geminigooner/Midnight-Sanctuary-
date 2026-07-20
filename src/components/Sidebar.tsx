import React, { useState } from 'react';
import { Conversation } from '../lib/types';
import { MessageSquare, Trash2, Edit2, Check, X, Plus, Search, List, Orbit } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NebulaArchive } from './NebulaArchive';
import { getMotion } from '../lib/motion';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isOpen: boolean;
}

export function Sidebar({ conversations, currentId, onSelect, onNew, onDelete, onRename, isOpen }: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'nebula'>('list');

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.messages.some(m => m.parts?.[0]?.text?.toLowerCase().includes(search.toLowerCase())));

  const reducedMotion = useReducedMotion();
  const listMotion = getMotion('standard', reducedMotion);
  const viewMotion = getMotion('heavy', reducedMotion);

  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className={`flex flex-col h-full bg-ink/50 backdrop-blur-md border-r border-glass-border w-full relative`}>
      <div className="p-4 border-b border-glass-border flex flex-col gap-3 z-10 shrink-0">
        <button 
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-glass border border-glass-border rounded-xl hover:bg-white/10 transition-colors text-champagne"
        >
          <Plus size={18} />
          <span>New Sanctuary</span>
        </button>

        <div className="flex bg-black/40 border border-glass-border rounded-lg p-1">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white/10 text-champagne shadow-sm' : 'text-mauve hover:text-champagne'}`}
          >
            <List size={14} /> List
          </button>
          <button 
            onClick={() => setViewMode('nebula')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'nebula' ? 'bg-white/10 text-champagne shadow-sm' : 'text-mauve hover:text-champagne'}`}
          >
            <Orbit size={14} /> Nebula
          </button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={viewMotion}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="p-3 border-b border-glass-border relative z-10 shrink-0">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-mauve" />
              <input 
                type="text" 
                placeholder="Search memories..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-glass-border rounded-lg pl-9 pr-4 py-2 text-base focus:outline-none focus:border-copper/50 text-pearlescent placeholder-mauve/50"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <AnimatePresence>
                {filtered.map(c => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={listMotion}
                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentId === c.id ? 'bg-glass border border-glass-border' : 'hover:bg-glass/50 border border-transparent'}`}
                    onClick={() => onSelect(c.id)}
                  >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <MessageSquare size={16} className={currentId === c.id ? 'text-copper' : 'text-mauve'} />
                    {editingId === c.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          className="bg-black/60 border border-copper/50 rounded px-2 py-1 text-base w-full outline-none text-champagne"
                        />
                        <button onClick={saveEdit} className="p-1 hover:text-green-400"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 hover:text-red-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <span className="truncate text-sm opacity-90">{c.title}</span>
                    )}
                  </div>
                  
                  {editingId !== c.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => startEdit(c)} className="p-1.5 hover:bg-white/10 rounded-md text-mauve hover:text-champagne transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => {
                        if (window.confirm('Delete this sanctuary?')) onDelete(c.id);
                      }} className="p-1.5 hover:bg-white/10 rounded-md text-mauve hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="nebula"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={viewMotion}
            className="flex-1 flex overflow-hidden"
          >
            <NebulaArchive conversations={conversations} currentId={currentId} onSelect={onSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
