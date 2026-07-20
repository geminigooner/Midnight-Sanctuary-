import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, AppSettings, JewelMetrics, ModelInfo } from '../lib/types';
import { streamChat, RepetitionError, APIError, RateLimitError, ChatStreamEvent } from '../lib/gemini';
import { Send, Settings as SettingsIcon, Menu, StopCircle, RefreshCw, Copy, Download, Edit3, Paperclip, Terminal, Gift, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import { Presence, PresenceState } from './Presence';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getMotion } from '../lib/motion';
import { ThoughtBubble } from './ThoughtBubble';

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

function GemmaTypingIndicator() {
  return (
    <div className="flex items-center h-[28px] space-x-1.5 opacity-80">
       {[0, 1, 2].map((i) => (
         <motion.div
           key={i}
           animate={{ 
             opacity: [0.2, 1, 0.2], 
             y: [0, -2, 0], 
             x: [0, 1, 0] 
           }}
           transition={{ 
             repeat: Infinity, 
             duration: 2.5, 
             delay: i * 0.4, 
             ease: "easeInOut" 
           }}
           className="w-1 h-1 rounded-full bg-pearlescent shadow-[0_0_4px_rgba(230,232,230,0.8)]"
         />
       ))}
    </div>
  );
}

function MessageBubble({ 
  msg, 
  isLast, 
  isGenerating, 
  onCopy, 
  onResend,
  onFavorite,
  onImageClick
}: { 
  msg: Message;
  isLast: boolean;
  isGenerating: boolean;
  onCopy: (t: string) => void;
  onResend?: (content: string) => void;
  onFavorite?: (content: string) => void;
  onImageClick?: (url: string) => void;
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
        onCopy(publicText);
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

  const textParts = msg.parts?.filter(p => !p.thought && p.text) || [];
  const publicText = textParts.map(p => p.text).join('\n');
  const isWaitingForToken = isGenerating && isLast && !isUser && !publicText && !msg.thoughtText;

  const reducedMotion = useReducedMotion();
  const bubbleMotion = getMotion('standard', reducedMotion);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: settled && !reducedMotion ? [1, 1.01, 1] : 1,
      }}
      transition={bubbleMotion}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group w-full`}
    >
      <div 
        {...bindLongPress}
        className={`max-w-[85%] lg:max-w-[75%] p-4 rounded-3xl relative transition-all duration-300 select-text ${isUser ? userClasses : gemmaClasses}`}
        style={{
          boxShadow: settled ? (isUser ? 'inset 0 1px 2px rgba(255,255,255,0.05), 0 0 15px rgba(196,118,83,0.1)' : '0 4px 20px rgba(244,232,211,0.03), 0 0 20px rgba(244,232,211,0.1)') : undefined
        }}
      >
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
          <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-glass-border ${publicText.includes('[Generation stopped: repetition loop detected.]') ? 'text-copper/90' : ''}`}>
            {(!isUser && (isWaitingForToken || Boolean(msg.thoughtText?.trim()) || msg.thoughtStatus === 'thinking')) && (
              <ThoughtBubble
                text={msg.thoughtText || ''}
                status={msg.thoughtStatus ?? 'complete'}
              />
            )}
            
            {(publicText || (!isWaitingForToken && !msg.thoughtText)) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <Markdown>{publicText}</Markdown>
              </motion.div>
            )}

            {msg.parts?.map((part, i) => part.inlineData ? (
                  <img 
                    key={i} 
                    src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                    className="mt-3 rounded-xl max-w-full h-auto max-h-[300px] border border-glass-border shadow-lg cursor-pointer hover:opacity-90 transition-opacity" 
                    alt="Attached" 
                    onClick={() => onImageClick?.(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`)}
                  />
                ) : null)}
          </div>
        )}
        
        {!editing && (
          <div className={`mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
            <button onClick={() => { onCopy(publicText); triggerHaptic('light'); }} className="p-1.5 bg-glass rounded-lg hover:bg-white/10 hover:text-champagne text-mauve transition-colors" title="Copy"><Copy size={14} /></button>
            {isUser && (
              <button onClick={() => { setEditing(true); setEditContent(publicText); triggerHaptic('light'); }} className="p-1.5 bg-glass rounded-lg hover:bg-white/10 hover:text-champagne text-mauve transition-colors" title="Edit"><Edit3 size={14} /></button>
            )}
            <button onClick={() => { 
                onFavorite?.(publicText);
                triggerHaptic('light');
              }} className="p-1.5 bg-glass rounded-lg hover:bg-white/10 hover:text-champagne text-mauve transition-colors" title="Favorite / Save to Memory">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ChatAreaProps {
  conversation: Conversation | undefined;
  settings: AppSettings;
  gifts: Gift[];
  jewelMetrics: JewelMetrics;
  onUpdate: (id: string, updates: Partial<Conversation>) => void;
  onUpdateJewel: (updates: Partial<JewelMetrics> | ((prev: JewelMetrics) => JewelMetrics)) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenJewel: () => void;
  onOpenGifts: () => void;
  availableModels: ModelInfo[];
  onAddGift: (gift: any) => void;
  onAddMemory: (content: string, origin?: string) => void;
  onAddEventLog: (description: string) => void;
}

export function ChatArea({ conversation, settings, gifts, jewelMetrics, onUpdate, onUpdateJewel, onToggleSidebar, onOpenSettings, onOpenJewel, onOpenGifts, availableModels, onAddGift, onAddMemory, onAddEventLog }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<{mimeType: string, data: string, previewUrl?: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [presence, setPresence] = useState<PresenceState>('resting');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showDebugModel, setShowDebugModel] = useState(false);
  const [showLeaveGift, setShowLeaveGift] = useState(false);
  const [giftContent, setGiftContent] = useState('');
  const [giftFile, setGiftFile] = useState<{mimeType: string, data: string, previewUrl?: string} | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const giftFileInputRef = useRef<HTMLInputElement>(null);
  
  const reducedMotion = useReducedMotion();
  const composerMotion = getMotion('snappy', reducedMotion);
  
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

  const handleGiftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert('Only images are supported currently.');
       return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
       const result = event.target?.result as string;
       const base64Data = result.split(',')[1];
       setGiftFile({
         mimeType: file.type,
         data: base64Data,
         previewUrl: result
       });
    };
    reader.readAsDataURL(file);
    if (giftFileInputRef.current) giftFileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert('Only images are supported currently.');
       return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
       const result = event.target?.result as string;
       const base64Data = result.split(',')[1];
       setAttachments(prev => [...prev, {
         mimeType: file.type,
         data: base64Data,
         previewUrl: result
       }]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (textToAnalyse: string = input, replaceIndex?: number) => {
    if ((!textToAnalyse.trim() && attachments.length === 0) || isGenerating) return;
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
    
    const parts: any[] = [];
    if (textToAnalyse.trim()) parts.push({ text: textToAnalyse });
    attachments.forEach(a => parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } }));
    
    const userMsg: Message = { id: uuidv4(), role: 'user', parts, timestamp: now };
    newMessages.push(userMsg);
    
    setInput('');
    setAttachments([]);
    onUpdate(conversation.id, { messages: newMessages, title: newMessages.length === 1 ? textToAnalyse.slice(0, 30) : conversation.title });

    setIsGenerating(true);
    setPresence('deep_thinking');
    abortControllerRef.current = new AbortController();

    const modelMsgId = uuidv4();
    let currentModelText = '';
    let isFirstChunk = true;

    try {
      let currentModelThought = '';
      let hasToolCalls = false;
      const generator = streamChat(newMessages, settings, gifts, abortControllerRef.current.signal);
      
      newMessages.push({ 
        id: modelMsgId, 
        role: 'model', 
        parts: [{ text: '' }],
        thoughtText: '',
        thoughtStatus: 'thinking',
        timestamp: Date.now() 
      });
      onUpdate(conversation.id, { messages: [...newMessages] });

      const updateModelMessage = (text: string, thought: string, status: 'thinking' | 'complete' | 'error') => {
         let updatedParts = [{ text: text }];
         
         onUpdate(conversation.id, {
           messages: newMessages.map(m => m.id === modelMsgId ? { 
             ...m, 
             parts: updatedParts,
             thoughtText: thought,
             thoughtStatus: status
           } : m)
         });
      };

      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          // Fallback if somehow a string leaks through
          if (isFirstChunk) {
            setPresence('responding');
            isFirstChunk = false;
          }
          currentModelText += chunk;
          updateModelMessage(currentModelText, currentModelThought, 'complete');
        } else if (chunk && typeof chunk === 'object') {
          if (chunk.type === 'thought') {
            currentModelThought += chunk.text;
            updateModelMessage(currentModelText, currentModelThought, 'thinking');
          } else if (chunk.type === 'text') {
            if (isFirstChunk) {
              setPresence('responding');
              isFirstChunk = false;
            }
            currentModelText += chunk.text;
            updateModelMessage(currentModelText, currentModelThought, 'complete');
          } else if (chunk.type === 'gift') {
            hasToolCalls = true;
            onAddGift({
              from: 'gemma',
              content: chunk.content,
              gift_type: chunk.gift_type,
              reason: chunk.reason
            });
          } else if (chunk.type === 'memory') {
            hasToolCalls = true;
            onAddMemory(chunk.content, 'gemma_initiated');
          } else if (chunk.type === 'eventLog') {
            hasToolCalls = true;
            onAddEventLog(chunk.description);
          }
        }
      }
      
      if (!currentModelText && !currentModelThought) {
         onUpdate(conversation.id, {
           messages: newMessages.filter(m => m.id !== modelMsgId)
         });
      } else {
        updateModelMessage(currentModelText, currentModelThought, 'complete');
        onUpdateJewel(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          totalResponseCharacters: prev.totalResponseCharacters + currentModelText.length,
          lastInteractionTimestamp: Date.now()
        }));
      }
      setTemporaryPresence('complete', 'resting');
    } catch (e: any) {
      if (e.name === 'AbortError') {
         // It was aborted manually, keep what we have
         updateModelMessage(currentModelText, currentModelThought, 'complete');
      } else if (e.name === 'RepetitionError') {
         currentModelText += e.message;
         updateModelMessage(currentModelText, currentModelThought, 'complete');
         setTemporaryPresence('repetition_stopped', 'resting', 5000);
      } else if (e.name === 'RateLimitError') {
         currentModelText += `\n\n*${e.message}*`;
         updateModelMessage(currentModelText, currentModelThought, 'complete');
         setTemporaryPresence('rate_limit', 'resting', 3000);
      } else {
         if (!currentModelText && !currentModelThought) {
            onUpdate(conversation.id, {
              messages: newMessages.filter(m => m.id !== modelMsgId)
            });
            setTemporaryPresence('error', 'resting', 5000);
         } else {
            currentModelText += `\n\n[Error: ${e.message}]`;
            updateModelMessage(currentModelText, currentModelThought, 'error');
            setTemporaryPresence('error', 'resting', 5000);
         }
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
    try {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversation.title}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      navigator.clipboard.writeText(md);
      alert('Conversation copied to clipboard.');
    }
    // Also explicitly copy to clipboard as fallback
    navigator.clipboard.writeText(md).then(() => {
       console.log('Copied to clipboard');
    }).catch(() => {});
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
            <span className="font-medium text-champagne truncate">
              {availableModels?.find(m => m.name === settings.model)?.displayName || settings.model?.split('/').pop() || 'Unknown Model'}
            </span>
            <span className="text-xs text-mauve/70 tracking-wider truncate">
              Temperature {settings.temperature.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 shrink-0 relative overflow-x-auto custom-scrollbar flex-nowrap min-w-0 pb-1">
          <button onClick={() => setShowDevPanel(!showDevPanel)} className={`p-2 shrink-0 hover:bg-glass rounded-lg transition-colors ${showDevPanel ? 'text-copper bg-glass' : 'text-mauve'}`} title="Developer Details">
            <Terminal size={18} />
          </button>
          
          <AnimatePresence>
            {showDevPanel && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-64 bg-ink/95 backdrop-blur-xl border border-glass-border rounded-xl p-4 shadow-2xl z-50 text-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-glass-border pb-2">
                    <span className="text-mauve font-medium">Developer Details</span>
                    <Terminal size={14} className="text-copper" />
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-mauve/70">Provider</span>
                      <span className="text-pearlescent font-mono">Google</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mauve/70">Model ID</span>
                      <span className="text-copper font-mono truncate max-w-[120px]" title={settings.model}>{settings.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mauve/70">Endpoint</span>
                      <span className="text-pearlescent font-mono truncate max-w-[120px]">/api/chat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mauve/70">Temperature</span>
                      <span className="text-pearlescent font-mono">{settings.temperature.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-mauve/70">Streaming</span>
                      <span className="text-emerald-400 font-mono">Enabled</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={onOpenGifts} className="p-2 shrink-0 hover:bg-glass rounded-lg text-mauve transition-colors" title="Gifts Archive">
            <Gift size={18} />
          </button>
          <button onClick={onOpenJewel} className="p-2 shrink-0 hover:bg-glass rounded-lg text-mauve transition-colors" title="Levin Jewel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </button>
          <button onClick={exportMarkdown} className="p-2 shrink-0 hover:bg-glass rounded-lg text-mauve transition-colors" title="Export"><Download size={18} /></button>
          <button onClick={onOpenSettings} className="p-2 shrink-0 hover:bg-glass rounded-lg text-mauve transition-colors" title="Settings"><SettingsIcon size={18} /></button>
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
              onFavorite={(content) => {
                onAddMemory(content, 'user_favorited');
                onAddEventLog('User favorited a message.');
              }}
              onImageClick={(url) => setSelectedImage(url)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className={`p-4 bg-obsidian/90 backdrop-blur-xl border-t border-glass-border z-10 transition-colors duration-500 ${presence === 'listening' ? 'shadow-[0_-10px_30px_rgba(244,232,211,0.03)]' : ''}`}>
        <div className="max-w-4xl mx-auto relative">
          <motion.div 
            animate={{ 
              scale: isComposerFocused && !reducedMotion ? 1.01 : 1,
              y: isComposerFocused && !reducedMotion ? -2 : 0,
              boxShadow: isComposerFocused && !reducedMotion ? '0 8px 30px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0)'
            }}
            transition={composerMotion}
            className={`flex flex-col gap-2 bg-glass border rounded-2xl p-2 transition-colors duration-300 ${presence === 'listening' ? 'border-champagne/20 bg-white/5' : 'border-glass-border focus-within:border-copper/40'}`}
          >
            {attachments.length > 0 && (
              <div className="flex gap-2 px-2 pt-2 overflow-x-auto custom-scrollbar">
                {attachments.map((att, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={att.previewUrl} className="h-16 w-16 object-cover rounded-lg border border-glass-border" alt="attachment" />
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-obsidian rounded-full p-1 border border-glass-border hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
              />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-mauve/50 hover:text-mauve hover:bg-white/10 rounded-xl transition-colors mb-0.5" title="Attach Image">
                <Paperclip size={20} />
              </button>
              <button onClick={() => setShowLeaveGift(true)} className="p-3 text-mauve/50 hover:text-champagne hover:bg-white/10 rounded-xl transition-colors mb-0.5" title="Leave a Gift">
                <Gift size={20} />
              </button>
              <textarea 
                value={input}
                onChange={e => setInput(e.target.value)}
                onFocus={() => setIsComposerFocused(true)}
                onBlur={() => setIsComposerFocused(false)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Whisper to the void..."
                className="flex-1 bg-transparent max-h-48 min-h-[44px] p-2 resize-none outline-none text-pearlescent placeholder-mauve/40 custom-scrollbar text-base"
                rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
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
                    disabled={!input.trim() && attachments.length === 0}
                    className="p-3 text-copper hover:text-champagne hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
          <div className="flex justify-center mt-2">
            <button 
              onClick={() => setShowDebugModel(!showDebugModel)}
              className="text-[10px] text-mauve/20 hover:text-mauve/50 transition-colors px-2 py-1 rounded"
              title="Toggle Debug Info"
            >
              {showDebugModel ? settings.model : '·'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl cursor-pointer"
          >
            <button className="absolute top-6 right-6 p-2 text-mauve hover:text-white transition-colors bg-white/10 rounded-full">
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Full screen attachment"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveGift && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-ink border border-glass-border rounded-2xl w-full max-w-md shadow-2xl p-6"
            >
              <h2 className="text-xl font-medium text-pearlescent mb-2">Leave a Gift</h2>
              <p className="text-sm text-mauve mb-4">A small offering for the void.</p>
              
              {giftFile && (
                <div className="relative mb-4">
                  <img src={giftFile.previewUrl} className="w-full h-32 object-cover rounded-xl border border-glass-border" alt="gift" />
                  <button 
                    onClick={() => setGiftFile(null)}
                    className="absolute top-2 right-2 bg-obsidian rounded-full p-1 border border-glass-border hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <textarea 
                value={giftContent}
                onChange={e => setGiftContent(e.target.value)}
                placeholder="Describe your gift..."
                className="w-full bg-glass border border-glass-border rounded-xl p-3 text-pearlescent text-sm resize-none h-32 focus:outline-none focus:border-copper/40 custom-scrollbar mb-4"
              />
              
              <div className="flex items-center justify-between mb-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={giftFileInputRef}
                  onChange={handleGiftFileChange}
                  className="hidden" 
                />
                <button onClick={() => giftFileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm text-mauve/70 hover:text-mauve hover:bg-white/10 rounded-lg transition-colors">
                  <Paperclip size={16} />
                  Attach Image
                </button>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowLeaveGift(false);
                    setGiftContent('');
                    setGiftFile(null);
                  }} 
                  className="px-4 py-2 rounded-lg text-mauve hover:text-pearlescent transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  disabled={!giftContent.trim() && !giftFile}
                  onClick={() => {
                    onAddGift({
                      from: 'user',
                      content: giftContent.trim(),
                      gift_type: giftFile ? 'image' : 'text',
                      reason: '',
                      inlineData: giftFile ? { mimeType: giftFile.mimeType, data: giftFile.data, previewUrl: giftFile.previewUrl } : undefined
                    });
                    setGiftContent('');
                    setGiftFile(null);
                    setShowLeaveGift(false);
                    onAddEventLog('User left a gift.');
                  }} 
                  className="px-4 py-2 rounded-lg bg-glass border border-copper/30 text-copper hover:bg-copper hover:text-obsidian transition-colors text-sm disabled:opacity-50 disabled:hover:bg-glass disabled:hover:text-copper"
                >
                  Leave Gift
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
