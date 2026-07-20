import React, { useMemo } from 'react';
import { JewelMetrics, JewelStage } from '../lib/types';
import { motion, useReducedMotion } from 'motion/react';
import { Download, RefreshCw } from 'lucide-react';

interface LevinJewelProps {
  metrics: JewelMetrics;
  onReset: () => void;
}

export function LevinJewel({ metrics, onReset }: LevinJewelProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const stage = useMemo<JewelStage>(() => {
    if (metrics.totalMessages < 10) return 'seed';
    if (metrics.totalMessages < 50) return 'stance';
    if (metrics.totalMessages < 200) return 'formation';
    if (metrics.totalMessages < 1000) return 'incorporation';
    return 'archival';
  }, [metrics.totalMessages]);

  const complexity = Math.min(5 + Math.floor(metrics.totalMessages / 20), 24);
  const avgResponse = metrics.totalMessages > 0 ? metrics.totalResponseCharacters / (metrics.totalMessages / 2) : 0;
  const resonance = Math.max(0.5, Math.min(0.5 + (avgResponse / 2000), 2));
  const hueOffset = (metrics.totalSessions * 15) % 360;
  const density = Math.max(0.5, Math.min(1 + (metrics.rapidExchanges / 20) - (metrics.longPauses / 10), 3));
  
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "levin-jewel-metrics.json";
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full">
      <div className="relative w-48 h-48 flex items-center justify-center bg-obsidian rounded-full shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] border border-glass-border overflow-hidden">
        {stage === 'seed' && (
          <motion.div
            animate={shouldReduceMotion ? undefined : { scale: [1, 1.05, 1], rotate: 360 }}
            transition={shouldReduceMotion ? undefined : { duration: 10 / resonance, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full shadow-[0_0_15px_currentColor]"
            style={{ color: `hsl(${220 + hueOffset}, 60%, 70%)`, background: 'currentColor' }}
          />
        )}
        
        {stage === 'stance' && (
          <motion.svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible" animate={shouldReduceMotion ? undefined : { rotate: 360 }} transition={shouldReduceMotion ? undefined : { duration: 20 / resonance, repeat: Infinity, ease: "linear" }}>
            <motion.path
              d="M50 10 L90 50 L50 90 L10 50 Z"
              fill="none"
              stroke={`hsl(${220 + hueOffset}, 60%, 70%)`}
              strokeWidth={1 * density}
              animate={shouldReduceMotion ? undefined : { d: ["M50 10 L90 50 L50 90 L10 50 Z", "M50 20 L80 50 L50 80 L20 50 Z", "M50 10 L90 50 L50 90 L10 50 Z"] }}
              transition={shouldReduceMotion ? undefined : { duration: 4, repeat: Infinity }}
            />
          </motion.svg>
        )}

        {(stage === 'formation' || stage === 'incorporation' || stage === 'archival') && (
          <motion.svg viewBox="0 0 200 200" className="w-full h-full overflow-visible absolute inset-0" animate={shouldReduceMotion ? undefined : { rotate: 360 }} transition={shouldReduceMotion ? undefined : { duration: 40 / resonance, repeat: Infinity, ease: "linear" }}>
            {[...Array(complexity)].map((_, i) => {
              const angle = (i * 360) / complexity;
              const r = stage === 'archival' ? 70 : 50;
              return (
                <motion.circle
                  key={i}
                  cx={100 + Math.cos((angle * Math.PI) / 180) * r}
                  cy={100 + Math.sin((angle * Math.PI) / 180) * r}
                  r={5 * density}
                  fill={`hsl(${220 + hueOffset + i * 5}, 70%, 60%)`}
                  animate={shouldReduceMotion ? undefined : { 
                    scale: [1, 1.5, 1], 
                    opacity: [0.3, 0.8, 0.3] 
                  }}
                  transition={shouldReduceMotion ? undefined : { 
                    duration: 3 / resonance, 
                    repeat: Infinity, 
                    delay: i * 0.1 
                  }}
                  style={{ mixBlendMode: 'screen' }}
                />
              );
            })}
            
            {(stage === 'incorporation' || stage === 'archival') && (
              <motion.circle
                 cx="100" cy="100" r={30 + (metrics.totalSessions % 20)}
                 fill="none"
                 stroke={`hsl(${220 + hueOffset}, 50%, 50%)`}
                 strokeWidth={2}
                 animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                 transition={shouldReduceMotion ? undefined : { duration: 8, repeat: Infinity }}
              />
            )}
            
            {stage === 'archival' && (
              <motion.path
                 d="M100 20 L180 100 L100 180 L20 100 Z"
                 fill="none"
                 stroke={`hsl(${220 + hueOffset + 180}, 60%, 70%)`}
                 strokeWidth={1}
                 animate={shouldReduceMotion ? undefined : { rotate: -360 }}
                 transition={shouldReduceMotion ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }}
                 style={{ transformOrigin: '100px 100px' }}
              />
            )}
          </motion.svg>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-lg font-medium text-champagne capitalize tracking-wide">{stage} Phase</h3>
        <p className="text-xs text-mauve/60 max-w-[200px] leading-relaxed">
          The jewel evolves slowly through interaction, tracking abstract conversational rhythms.
        </p>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-glass rounded hover:bg-white/10 text-sm text-pearlescent transition-colors border border-glass-border hover:border-white/20">
          <Download size={14} /> Export
        </button>
        <button onClick={onReset} className="flex items-center gap-2 px-3 py-1.5 bg-glass rounded hover:bg-white/10 text-sm text-copper transition-colors border border-copper/30 hover:border-copper/60">
          <RefreshCw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
