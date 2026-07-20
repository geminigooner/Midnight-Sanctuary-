import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, AppSettings, JewelMetrics } from '../lib/types';
import { streamChat, RepetitionError, APIError } from '../lib/gemini';
import { Send, Settings as SettingsIcon, Menu, StopCircle, RefreshCw, Copy, Download, Edit3, Paperclip } from 'lucide-react';
import Markdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { Presence, PresenceState } from './Presence';
import { motion, AnimatePresence } from 'motion/react';

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'light') navigator.vibrate(10);
      if (type === 'medium') navigator.vibrate(20);
      if (type === 'heavy') navigator.vibrate([30, 50, 30]);
    } catch (e) {
      // Ignore
    }
  }
};

function MessageBubble({ 
  msg, 
  isLast, 
  isGenerating, 
  onCopy, 
  onResend 
}: { 
  msg: Message;
  isLast: boolean;
  isGenerating: boolean;
  onCopy: (t: string) => void;
  onResend?: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [settled, setSettled] = useState(false);
  
  useEffect(() => {
    if (isLast && !isGenerating) {
      setSettled(true);
      const timer = setTimeout(() => setSettled(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isLast, isGenerating]);

  const [startLongPress, setStartLongPress] = useState(false);
  const timerId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (startLongPress) {
      timerId.current = setTimeout(() => {
        onCopy(msg.parts?.[0]?.text || '');
        triggerHaptic('medium');
        setStartLongPress(false);
      }, 500);
    } else {
      if (timerId.current) clearTimeout(timerId.current);
    }
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
    };
  }, [startLongPress, msg, onCopy]);

  const bindLongPress = {
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false),
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
  };

  const isUser = msg.role === 'user';
  
  const userClasses = "bg-obsidian/90 backdrop-blur-2xl border border-copper/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] text-champagne";
  const gemmaClasses = "bg-plum/30 backdrop-blur-xl border border-glass-border border-t-white/10 shadow-[0_4px_20px_rgba(244,232,211,0.03)] text-pearlescent";

  const isStarting = isGenerating && isLast && !isUser && (msg.parts?.[0]?.text?.length || 0) > 0 && (msg.parts?.[0]?.text?.length || 0) < 15;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: settled ? [1, 1.01, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group w-full`}
    >
      <div 
        {...bindLongPress}
        className={`max-w-[85%] lg:max-w-[75%] p-4 rounded-3xl relative transition-all duration-300 select-text ${isUser ? userClasses : gemmaClasses}`}
        style={{
          boxShadow: settled ? (isUser ? 'inset 0 1px 2px rgba(255,255,255,0.05), 0 0 15px rgba(196,118,83,0.1)' : '0 4px 20px rgba(244,232,211,0.03), 0 0 20px rgba(244,232,211,0.1)') : undefined
        }}
      >
        {isStarting && (
           <motion.div 
             initial={{ opacity: 0, scale: 0 }}
             animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], rotate: [0, 90, 180] }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="absolute -top-2 -left-2 w-4 h-4 text-champagne pointer-events-none drop-shadow-[0_0_8px_rgba(244,232,211,0.8)]"
           >
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/></svg>
           </motion.div>
        )}

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)} 
              className="w-full bg-black/40 border border-copper/30 rounded-xl p-3 text-base outline-none resize-none text-champagne"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-1">
              <button onClick={() => setEditing(false)} className="text-sm text-mauve hover:text-champagne transition-colors">Cancel</button>
              <button onClick={() => { setEditing(false); onResend?.(editContent); triggerHaptic('light'); }} className="text-sm text-copper font-medium hover:text-champagne transition-colors">Resend</button>
            </div>
          </div>
        ) : (
          <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-glass-border ${msg.parts?.[0]?.text?.includes('[Generation stopped: repetition loop detected.]') ? 'text-copper/90' : ''}`}>
            <Markdown>{msg.parts?.[0]?.text || ''}</Markdown>
          </div>
        )}
        
        {!editing && (
          <div className={`absolute ${isUser ? '-left-12 top-2' : '-right-12 top-2'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
            <button onClick={() => { onCopy(msg.parts?.[0]?.text || ''); triggerHaptic('light'); }} className="p-1.5 bg-glass rounded-lg hover:bg-white/10 hover:text-champagne text-mauve transition-colors" title="Copy"><Copy size={14} /></button>
            {isUser && (
              <button onClick={() => { setEditing(true); setEditContent(msg.parts?.[0]?.text || ''); triggerHaptic('light'); }} className="p-1.5 bg-glass rounded-lg hover:bg-white/10 hover:text-champagne text-mauve transition-colors" title="Edit"><Edit3 size={14} /></button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ChatAreaProps {
  conversation: Conversation | undefined;
  settings: AppSettings;
  jewelMetrics: JewelMetrics;
  onUpdate: (id: string, updates: Partial<Conversation>) => void;
  onUpdateJewel: (updates: Partial<JewelMetrics> | ((prev: JewelMetrics) => JewelMetrics)) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenJewel: () => void;
}

export function ChatArea({ conversation, settings, jewelMetrics, onUpdate, onUpdateJewel, onToggleSidebar, onOpenSettings, onOpenJewel }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [presence, setPresence] = useState<PresenceState>('resting');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTemporaryPresence = (newState: PresenceState, revertTo: PresenceState, delay: number = 3000) => {
    setPresence(newState);
    if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
    presenceTimeoutRef.current = setTimeout(() => {
      setPresence(revertTo);
    }, delay);
  };

  useEffect(() => {
    if (!isGenerating && presence !== 'error' && presence !== 'repetition_stopped' && presence !== 'complete') {
      if (input.trim().length > 0) {
        setPresence('listening');
      } else {
        setPresence('resting');
      }
    }
  }, [input, isGenerating, presence]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isGenerating]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-mauve">
        <div className="w-16 h-16 rounded-full bg-glass flex items-center justify-center mb-4">
          <SettingsIcon size={24} className="opacity-50" />
        </div>
        <p>Select or create a sanctuary to begin.</p>
        <button onClick={onToggleSidebar} className="mt-4 px-4 py-2 border border-glass-border rounded-full hover:bg-glass lg:hidden">Open Menu</button>
      </div>
    );
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setTemporaryPresence('complete', input.trim().length > 0 ? 'listening' : 'resting');
    }
  };

  const handleSend = async (textToAnalyse: string = input, replaceIndex?: number) => {
    if (!textToAnalyse.trim() || isGenerating) return;
    triggerHaptic('light');

    const now = Date.now();
    onUpdateJewel(prev => {
      let rapid = prev.rapidExchanges;
      let long = prev.longPauses;
      if (prev.lastInteractionTimestamp > 0) {
        const diff = now - prev.lastInteractionTimestamp;
        if (diff < 10000) rapid++;
        else if (diff > 3600000) long++;
      }
      return {
        ...prev,
        totalMessages: prev.totalMessages + 1,
        rapidExchanges: rapid,
        longPauses: long,
        lastInteractionTimestamp: now
      };
    });

    let newMessages = [...conversation.messages];
    
    if (replaceIndex !== undefined) {
      newMessages = newMessages.slice(0, replaceIndex);
    }
    
    const userMsg: Message = { id: uuidv4(), role: 'user', parts: [{ text: textToAnalyse }], timestamp: now };
    newMessages.push(userMsg);
    
    setInput('');
    onUpdate(conversation.id, { messages: newMessages, title: newMessages.length === 1 ? textToAnalyse.slice(0, 30) : conversation.title });

    setIsGenerating(true);
    setPresence('deep_thinking');
    abortControllerRef.current = new AbortController();

    const modelMsgId = uuidv4();
    let currentModelText = '';
    let isFirstChunk = true;

    try {
      const generator = streamChat(newMessages, settings, abortControllerRef.current.signal);
      
      newMessages.push({ id: modelMsgId, role: 'model', parts: [{ text: '' }], timestamp: Date.now() });
      onUpdate(conversation.id, { messages: [...newMessages] });

      for await (const chunk of generator) {
        if (isFirstChunk) {
          setPresence('responding');
          isFirstChunk = false;
        }
        currentModelText += chunk;
        onUpdate(conversation.id, {
          messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
        });
      }
      onUpdateJewel(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1,
        totalResponseCharacters: prev.totalResponseCharacters + currentModelText.length,
        lastInteractionTimestamp: Date.now()
      }));
      setTemporaryPresence('complete', 'resting');
    } catch (e: any) {
      if (e.name === 'AbortError') {
         // It was aborted manually, keep what we have
      } else if (e.name === 'RepetitionError') {
         currentModelText += e.message;
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
         });
         setTemporaryPresence('repetition_stopped', 'resting', 5000);
      } else {
         currentModelText += `\n\n[Error: ${e.message}]`;
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { ...m, parts: [{ text: currentModelText }] } : m)
         });
         setTemporaryPresence('error', 'resting', 5000);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (conversation.messages.length < 2) return;
    const lastUserIndex = conversation.messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIndex !== -1) {
      handleSend(conversation.messages[lastUserIndex].parts?.[0]?.text || '', lastUserIndex);
    }
  };

  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  const exportMarkdown = () => {
    const md = conversation.messages.map(m => `**${m.role === 'user' ? 'You' : 'Gemma'}**:\n${m.parts?.[0]?.text || ''}\n`).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title}.md`;
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-obsidian relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-plum/10 via-obsidian/0 to-obsidian/0"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border bg-obsidian/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-glass rounded-lg text-mauve shrink-0 lg:hidden"><Menu size={20} /></button>
          <Presence state={presence} />
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-champagne truncate">{conversation.title}</span>
            <span className="text-xs text-mauve/70 tracking-wider truncate">Gemma · {settings.model.split('/').pop()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onOpenJewel} className="p-2 hover:bg-glass rounded-lg text-mauve transition-colors" title="Levin Jewel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </button>
          <button onClick={exportMarkdown} className="p-2 hover:bg-glass rounded-lg text-mauve transition-colors" title="Export"><Download size={18} /></button>
          <button onClick={onOpenSettings} className="p-2 hover:bg-glass rounded-lg text-mauve transition-colors" title="Settings"><SettingsIcon size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar z-10 scroll-smooth">
        {conversation.messages.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-50">
            <p className="text-mauve tracking-widest uppercase text-sm">The sanctuary is quiet.</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {conversation.messages.map((msg, i) => (
            <MessageBubble 
              key={msg.id}
              msg={msg}
              isLast={i === conversation.messages.length - 1}
              isGenerating={isGenerating}
              onCopy={handleCopy}
              onResend={(content) => handleSend(content, i)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className={`p-4 bg-obsidian/90 backdrop-blur-xl border-t border-glass-border z-10 transition-colors duration-500 ${presence === 'listening' ? 'shadow-[0_-10px_30px_rgba(244,232,211,0.03)]' : ''}`}>
        <div className="max-w-4xl mx-auto relative">
          <div className={`flex items-end gap-2 bg-glass border rounded-2xl p-2 transition-colors duration-300 ${presence === 'listening' ? 'border-champagne/20 bg-white/5' : 'border-glass-border focus-within:border-copper/40'}`}>
            <button className="p-3 text-mauve/50 hover:text-mauve hover:bg-white/10 rounded-xl transition-colors mb-0.5" title="Attachments (Coming Soon)">
              <Paperclip size={20} />
            </button>
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Whisper to the void..."
              className="flex-1 bg-transparent max-h-48 min-h-[44px] p-2 resize-none outline-none text-pearlescent placeholder-mauve/40 custom-scrollbar text-base"
              rows={input.split('\\n').length > 1 ? Math.min(input.split('\\n').length, 5) : 1}
            />
            
            {isGenerating ? (
              <button onClick={stopGeneration} className="p-3 text-red-400 hover:bg-white/10 rounded-xl transition-colors mb-0.5">
                <StopCircle size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-1 mb-0.5">
                {conversation.messages.length > 0 && conversation.messages[conversation.messages.length-1].role === 'model' && (
                   <button onClick={handleRegenerate} className="p-3 text-mauve hover:text-champagne hover:bg-white/10 rounded-xl transition-colors" title="Regenerate Last">
                     <RefreshCw size={20} />
                   </button>
                )}
                <button 
                  onClick={() => handleSend()} 
                  disabled={!input.trim()}
                  className="p-3 text-copper hover:text-champagne hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
