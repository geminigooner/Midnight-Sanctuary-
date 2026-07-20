import React from 'react';
import { AppSettings } from '../lib/types';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export function Settings({ settings, onSave, onClose }: SettingsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-ink border border-glass-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh]"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-glass-border shrink-0">
          <h2 className="text-xl font-medium text-champagne tracking-wide">Model Configuration</h2>
          <button onClick={onClose} className="p-2 hover:bg-glass rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm text-mauve uppercase tracking-wider font-semibold">Model ID</label>
            <input 
              type="text" 
              value={settings.model}
              onChange={e => onSave({ model: e.target.value })}
              className="w-full bg-black/40 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-copper/50 transition-colors text-base"
            />
            <p className="text-xs text-mauve/70">Ensure this matches Google's Gemma model strings (e.g. gemma-2-9b-it).</p>
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
            <div className="flex items-center justify-between">
              <label className="text-sm text-champagne">Temperature ({settings.temperature.toFixed(1)})</label>
              <input 
                type="range" min="0" max="2" step="0.1" 
                value={settings.temperature}
                onChange={e => onSave({ temperature: parseFloat(e.target.value) })}
                className="w-1/2 accent-copper"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-champagne">Top-P ({settings.topP.toFixed(2)})</label>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={settings.topP}
                onChange={e => onSave({ topP: parseFloat(e.target.value) })}
                className="w-1/2 accent-copper"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-champagne">Max Tokens</label>
              <input 
                type="number" min="1" max="8192" step="1" 
                value={settings.maxOutputTokens}
                onChange={e => onSave({ maxOutputTokens: parseInt(e.target.value) })}
                className="w-1/3 bg-black/40 border border-glass-border rounded px-3 py-1 focus:outline-none focus:border-copper/50 text-right text-base"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
