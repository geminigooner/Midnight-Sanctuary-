import React, { useMemo, useState } from 'react';
import { AppSettings, ModelInfo } from '../lib/types';
import { X, Star, ChevronDown, ChevronRight, Trash2, Plus, Edit2, Check } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { getMotion } from '../lib/motion';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  availableModels: ModelInfo[];
  isModelsLoading: boolean;
}

export function Settings({ settings, onSave, onClose, availableModels, isModelsLoading }: SettingsProps) {
  const reducedMotion = useReducedMotion();
  const panelMotion = getMotion('heavy', reducedMotion);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'model' | 'identity'>('identity');
  const [newMemory, setNewMemory] = useState('');

  const toggleFavorite = (modelName: string) => {
    const isFav = settings.favoriteModels?.includes(modelName);
    const newFavs = isFav 
      ? (settings.favoriteModels || []).filter(m => m !== modelName)
      : [...(settings.favoriteModels || []), modelName];
    onSave({ favoriteModels: newFavs });
  };

  const addMemory = () => {
    if (!newMemory.trim()) return;
    const memory = {
      id: Math.random().toString(36).substring(2, 9),
      content: newMemory.trim(),
      createdAt: Date.now()
    };
    onSave({ memories: [memory, ...(settings.memories || [])] });
    setNewMemory('');
  };

  const deleteMemory = (id: string) => {
    onSave({ memories: (settings.memories || []).filter(m => m.id !== id) });
  };

  const updateMemory = (id: string, content: string) => {
    onSave({
      memories: (settings.memories || []).map(m => m.id === id ? { ...m, content } : m)
    });
  };

  const sortedModels = useMemo(() => {
    if (!availableModels) return [];
    return [...availableModels].sort((a, b) => {
      const aFav = settings.favoriteModels?.includes(a.name) ? 1 : 0;
      const bFav = settings.favoriteModels?.includes(b.name) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      
      const aGemma = a.name.toLowerCase().includes('gemma') ? 1 : 0;
      const bGemma = b.name.toLowerCase().includes('gemma') ? 1 : 0;
      if (aGemma !== bGemma) return bGemma - aGemma;

      return a.displayName.localeCompare(b.displayName);
    });
  }, [availableModels, settings.favoriteModels]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={panelMotion}
        className="bg-ink border border-glass-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh]"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-glass-border shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('identity')}
              className={`text-lg font-medium tracking-wide transition-colors ${activeTab === 'identity' ? 'text-champagne border-b-2 border-copper' : 'text-mauve hover:text-champagne/80'}`}
            >
              Identity & Memory
            </button>
            <button 
              onClick={() => setActiveTab('model')}
              className={`text-lg font-medium tracking-wide transition-colors ${activeTab === 'model' ? 'text-champagne border-b-2 border-copper' : 'text-mauve hover:text-champagne/80'}`}
            >
              Model & API
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-glass rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {activeTab === 'model' && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-mauve uppercase tracking-wider font-semibold">Model ID</label>
            {isModelsLoading ? (
              <div className="text-mauve text-sm py-2">Loading available models...</div>
            ) : (
              <div className="space-y-2">
                <select 
                  value={settings.model}
                  onChange={e => onSave({ model: e.target.value })}
                  className="w-full bg-black/40 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-copper/50 transition-colors text-base appearance-none text-pearlescent"
                >
                  {sortedModels.map(m => (
                    <option key={m.name} value={m.name}>
                      {settings.favoriteModels?.includes(m.name) ? '★ ' : ''}{m.displayName}
                    </option>
                  ))}
                  {/* Fallback if the saved model isn't in the list */}
                  {!sortedModels.find(m => m.name === settings.model) && (
                    <option value={settings.model} disabled>
                      {settings.model} (Unavailable)
                    </option>
                  )}
                </select>
                
                {settings.model && sortedModels.find(m => m.name === settings.model) && (
                  <div className="space-y-1">
                    <div className="text-xs text-mauve/70 flex items-center justify-between">
                      <span>Exact ID: <span className="font-mono text-copper">{settings.model}</span></span>
                    </div>
                    <div className="text-xs text-mauve/70 flex items-center justify-between">
                      <span>Provider: Google</span>
                      {sortedModels.find(m => m.name === settings.model)?.inputTokenLimit && (
                        <span>Context: {sortedModels.find(m => m.name === settings.model)?.inputTokenLimit?.toLocaleString()} tokens</span>
                      )}
                    </div>
                  </div>
                )}
                
                {sortedModels.find(m => m.name === settings.model) && (
                  <button 
                    onClick={() => toggleFavorite(settings.model)}
                    className="flex items-center gap-2 text-sm text-champagne hover:text-copper transition-colors"
                  >
                    <Star size={14} className={settings.favoriteModels?.includes(settings.model) ? 'fill-champagne' : ''} />
                    {settings.favoriteModels?.includes(settings.model) ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                )}

                {!sortedModels.find(m => m.name === settings.model) && (
                  <div className="text-red-400 text-sm py-1">
                    The selected model is unavailable. Please choose another model.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-mauve uppercase tracking-wider font-semibold">System Instructions</label>
            <textarea 
              value={settings.systemInstruction}
              onChange={e => onSave({ systemInstruction: e.target.value })}
              rows={4}
              className="w-full bg-black/40 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-copper/50 transition-colors resize-none text-base"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-glass-border">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-champagne">Temperature ({settings.temperature.toFixed(1)})</label>
                <span className="text-xs text-mauve/70">Controls randomness</span>
              </div>
              <input 
                type="range" min="0" max="2" step="0.1" 
                value={settings.temperature}
                onChange={e => onSave({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-copper"
              />
            </div>
            
            <div className="pt-2">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-mauve hover:text-champagne transition-colors uppercase tracking-wider font-semibold w-full"
              >
                {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Advanced
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 pt-4 pb-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-champagne">Top-P ({settings.topP.toFixed(2)})</label>
                          <span className="text-xs text-mauve/70">Nucleus sampling</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05" 
                          value={settings.topP}
                          onChange={e => onSave({ topP: parseFloat(e.target.value) })}
                          className="w-full accent-copper"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-champagne">Max Tokens ({settings.maxOutputTokens})</label>
                          <span className="text-xs text-mauve/70">Output length limit</span>
                        </div>
                        <input 
                          type="range" min="1" max="8192" step="1" 
                          value={settings.maxOutputTokens}
                          onChange={e => onSave({ maxOutputTokens: parseInt(e.target.value) })}
                          className="w-full accent-copper"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-mauve uppercase tracking-wider font-semibold">About Me</label>
                <textarea 
                  value={settings.aboutMe || ''}
                  onChange={e => onSave({ aboutMe: e.target.value })}
                  placeholder="Tell the model about yourself..."
                  rows={3}
                  className="w-full bg-black/40 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-copper/50 transition-colors resize-none text-base text-pearlescent placeholder:text-mauve/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-mauve uppercase tracking-wider font-semibold">Conversation Preferences</label>
                <textarea 
                  value={settings.conversationPreferences || ''}
                  onChange={e => onSave({ conversationPreferences: e.target.value })}
                  placeholder="How should the model talk to you?"
                  rows={3}
                  className="w-full bg-black/40 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-copper/50 transition-colors resize-none text-base text-pearlescent placeholder:text-mauve/50"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-glass-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-mauve uppercase tracking-wider font-semibold">Saved Memories</label>
                  <button 
                    onClick={() => onSave({ memoriesEnabled: !settings.memoriesEnabled })}
                    className={`text-xs px-2 py-1 rounded transition-colors ${settings.memoriesEnabled ? 'bg-copper text-obsidian' : 'bg-glass text-mauve'}`}
                  >
                    {settings.memoriesEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                {settings.memoriesEnabled && (
                  <>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newMemory}
                        onChange={e => setNewMemory(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMemory()}
                        placeholder="Add a new memory..."
                        className="flex-1 bg-black/40 border border-glass-border rounded-lg px-3 py-2 focus:outline-none focus:border-copper/50 transition-colors text-sm text-pearlescent placeholder:text-mauve/50"
                      />
                      <button onClick={addMemory} className="p-2 bg-glass hover:bg-glass-border rounded-lg transition-colors text-champagne">
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {(!settings.memories || settings.memories.length === 0) ? (
                        <div className="text-sm text-mauve/70 italic text-center py-4">No memories saved yet.</div>
                      ) : (
                        settings.memories.map(memory => (
                          <div key={memory.id} className="flex gap-2 items-start group">
                            <textarea
                              value={memory.content}
                              onChange={e => updateMemory(memory.id, e.target.value)}
                              className="flex-1 bg-black/20 border border-transparent hover:border-glass-border focus:border-copper/50 rounded-lg px-3 py-2 focus:outline-none transition-colors text-sm text-pearlescent resize-none"
                              rows={2}
                            />
                            <button 
                              onClick={() => deleteMemory(memory.id)}
                              className="p-2 mt-1 text-mauve hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-glass shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
