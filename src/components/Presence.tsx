import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type PresenceState = 'resting' | 'listening' | 'responding' | 'deep_thinking' | 'complete' | 'repetition_stopped' | 'error' | 'rate_limit';

interface PresenceProps {
  state: PresenceState;
}

export function Presence({ state }: PresenceProps) {
  const shouldReduceMotion = useReducedMotion();
  
  if (shouldReduceMotion) {
    return (
       <div className="w-5 h-5 flex items-center justify-center transition-colors duration-500">
         {state === 'resting' && <div className="w-1.5 h-1.5 rounded-full bg-mauve opacity-50" />}
         {state === 'listening' && <div className="w-2 h-2 rounded-full bg-champagne opacity-70" />}
         {state === 'responding' && <div className="w-2 h-2 rounded-full bg-champagne" />}
         {state === 'deep_thinking' && <div className="w-2 h-2 rounded-full bg-mauve" />}
         {state === 'complete' && <div className="w-1.5 h-1.5 rounded-full bg-pearlescent opacity-50" />}
         {state === 'repetition_stopped' && <div className="w-3 h-0.5 bg-copper rotate-45" />}
         {state === 'error' && <div className="w-1.5 h-1.5 rounded-full bg-ink border border-glass-border" />}
         {state === 'rate_limit' && <div className="w-2 h-2 rounded-full bg-mauve/50 flex items-center justify-center"><div className="w-1 h-1 bg-ink rounded-full" /></div>}
       </div>
    );
  }

  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      {/* Resting: tiny obsidian ember with a slow lavender pulse */}
      {state === 'resting' && (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-mauve shadow-[0_0_8px_rgba(158,123,143,0.5)]"
        />
      )}

      {/* Listening: faint warm wake */}
      {state === 'listening' && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.5, 0.2] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute w-2 h-2 rounded-full bg-champagne shadow-[0_0_12px_rgba(244,232,211,0.6)]"
          />
          <div className="w-1.5 h-1.5 rounded-full bg-champagne relative z-10" />
        </>
      )}

      {/* Responding: soft gravitational particle convergence */}
      {state === 'responding' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {[...Array(4)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ 
                 x: [Math.cos(i * Math.PI/2)*10, 0, Math.cos(i * Math.PI/2)*10],
                 y: [Math.sin(i * Math.PI/2)*10, 0, Math.sin(i * Math.PI/2)*10],
                 opacity: [0, 0.8, 0],
                 scale: [0.5, 1, 0.5]
               }}
               transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: i * 0.2 }}
               className="absolute w-1 h-1 rounded-full bg-champagne"
             />
          ))}
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-champagne shadow-[0_0_10px_rgba(244,232,211,0.8)] z-10" 
          />
        </div>
      )}

      {/* Deep Thinking: localized miniature nebula, subtle and low-density */}
      {state === 'deep_thinking' && (
        <div className="relative w-full h-full flex items-center justify-center">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
             className="absolute w-6 h-6 rounded-full border border-mauve/20 border-t-mauve/60"
           />
           <motion.div 
             animate={{ rotate: -360, scale: [0.8, 1, 0.8] }}
             transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
             className="absolute w-4 h-4 rounded-full border border-copper/10 border-b-copper/40"
           />
           <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-mauve shadow-[0_0_15px_rgba(158,123,143,0.6)]"
          />
        </div>
      )}

      {/* Complete: particles settle into stillness */}
      {state === 'complete' && (
        <motion.div
          initial={{ scale: 1.5, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="w-1.5 h-1.5 rounded-full bg-pearlescent shadow-[0_0_8px_rgba(230,232,230,0.5)]"
        />
      )}

      {/* Repetition Stopped: copper fracture line */}
      {state === 'repetition_stopped' && (
        <div className="relative flex items-center justify-center">
           <motion.div
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: 1, opacity: 1 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
             className="w-5 h-5 flex items-center justify-center text-copper drop-shadow-[0_0_4px_rgba(196,118,83,0.8)]"
           >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
               <path d="M14 4 L10 12 L14 12 L10 20" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
           </motion.div>
        </div>
      )}

      {/* Error: dim ember, no alarming red screen */}
      {state === 'error' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-2 h-2 rounded-full bg-ink border border-mauve/40 shadow-inner" 
        />
      )}

      {/* Rate Limit: slow, heavy breathing / resting */}
      {state === 'rate_limit' && (
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} 
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-mauve shadow-[0_0_6px_rgba(158,123,143,0.3)]"
        />
      )}
    </div>
  );
}
