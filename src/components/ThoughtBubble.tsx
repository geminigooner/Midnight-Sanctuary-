import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';

interface ThoughtBubbleProps {
  text: string;
  status: 'thinking' | 'complete' | 'error';
  initiallyOpen?: boolean;
}

export function ThoughtBubble({ text, status, initiallyOpen }: ThoughtBubbleProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen ?? false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setAutoScroll(isScrolledToBottom);
  };

  return (
    <div className="mb-4 flex flex-col items-start max-w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian/60 border border-copper/20 hover:border-copper/40 transition-all shadow-sm group"
      >
        <Brain size={14} className={`${status === 'thinking' ? 'animate-pulse text-copper' : 'text-mauve group-hover:text-champagne'}`} />
        <span className="text-xs font-mono tracking-wide text-mauve group-hover:text-champagne transition-colors">
          {status === 'thinking' ? 'Gemma is thinking...' : 'Thought process'}
        </span>
        {status === 'thinking' && (
          <span className="flex space-x-0.5 ml-1">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1 h-1 bg-copper rounded-full" />
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 bg-copper rounded-full" />
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 bg-copper rounded-full" />
          </span>
        )}
        {isOpen ? (
          <ChevronUp size={14} className="text-mauve ml-1" />
        ) : (
          <ChevronDown size={14} className="text-mauve ml-1" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full overflow-hidden"
          >
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="mt-2 max-h-[320px] overflow-y-auto p-4 rounded-2xl bg-plum/10 backdrop-blur-md border border-copper/10 text-xs font-mono text-mauve/90 whitespace-pre-wrap leading-relaxed shadow-inner"
            >
              <Markdown>{text}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
