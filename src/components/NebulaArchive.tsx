import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Conversation } from '../lib/types';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getMotion } from '../lib/motion';

interface NebulaArchiveProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  currentId: string | null;
}

const sfc32 = (a: number, b: number, c: number, d: number) => {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h;
}

function getKeywords(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
}

function computeLayout(conversations: Conversation[]) {
  const nodes = conversations.map(c => {
    const keywords = getKeywords(c.title);
    const kwHash = keywords.length > 0 ? hashString(keywords.sort()[0]) : hashString(c.id);
    const rand = sfc32(kwHash, kwHash, kwHash, 1);
    
    const angle = (Math.abs(kwHash) % 360) * (Math.PI / 180);
    const distance = 50 + rand() * 250; 

    return {
      ...c,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      depth: c.messages.length,
      cluster: kwHash,
    };
  });
  
  for (let i = 0; i < 60; i++) {
    for (let a of nodes) {
      for (let b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx*dx + dy*dy;
        if (distSq < 10000) { 
          const f = 20 / (Math.sqrt(distSq) + 0.1);
          a.x += dx * f;
          a.y += dy * f;
        }
      }
    }
  }
  return nodes;
}

  export function NebulaArchive({ conversations, onSelect, currentId }: NebulaArchiveProps) {
  const nodes = useMemo(() => computeLayout(conversations), [conversations]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  const reducedMotion = useReducedMotion();
  const nodeMotion = getMotion('heavy', reducedMotion);
  
  const touchState = useRef({
    initialDist: 0,
    initialScale: 1,
    initialCenterX: 0,
    initialCenterY: 0,
    initialX: 0,
    initialY: 0,
    isPanning: false
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTransform(prev => {
        if (e.ctrlKey) {
           let zoomFactor = -e.deltaY * 0.01;
           const newScale = Math.min(Math.max(prev.scale * Math.exp(zoomFactor), 0.2), 3);
           return { ...prev, scale: newScale };
        } else {
           return {
             ...prev,
             x: prev.x - e.deltaX,
             y: prev.y - e.deltaY,
           };
        }
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      touchState.current = {
         ...touchState.current,
         initialCenterX: e.clientX,
         initialCenterY: e.clientY,
         initialX: transform.x,
         initialY: transform.y,
         isPanning: true
      };
      const handleMove = (moveEvent: PointerEvent) => {
         const dx = moveEvent.clientX - touchState.current.initialCenterX;
         const dy = moveEvent.clientY - touchState.current.initialCenterY;
         setTransform(prev => ({
           ...prev,
           x: touchState.current.initialX + dx,
           y: touchState.current.initialY + dy,
         }));
      };
      const handleUp = () => {
         touchState.current.isPanning = false;
         window.removeEventListener('pointermove', handleMove);
         window.removeEventListener('pointerup', handleUp);
      };
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      touchState.current = {
        ...touchState.current,
        initialDist: dist,
        initialScale: transform.scale,
        initialCenterX: (p1.clientX + p2.clientX) / 2,
        initialCenterY: (p1.clientY + p2.clientY) / 2,
        initialX: transform.x,
        initialY: transform.y,
      };
    } else if (e.touches.length === 1) {
      touchState.current = {
         ...touchState.current,
         initialCenterX: e.touches[0].clientX,
         initialCenterY: e.touches[0].clientY,
         initialX: transform.x,
         initialY: transform.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const p1 = e.touches[0];
      const p2 = e.touches[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      const scaleChange = dist / touchState.current.initialDist;
      const newScale = Math.min(Math.max(touchState.current.initialScale * scaleChange, 0.2), 3);
      
      const cx = (p1.clientX + p2.clientX) / 2;
      const cy = (p1.clientY + p2.clientY) / 2;
      const dx = cx - touchState.current.initialCenterX;
      const dy = cy - touchState.current.initialCenterY;

      setTransform({
        x: touchState.current.initialX + dx,
        y: touchState.current.initialY + dy,
        scale: newScale
      });
    } else if (e.touches.length === 1) {
       const p = e.touches[0];
       const dx = p.clientX - touchState.current.initialCenterX;
       const dy = p.clientY - touchState.current.initialCenterY;
       setTransform(prev => ({
         ...prev,
         x: touchState.current.initialX + dx,
         y: touchState.current.initialY + dy,
       }));
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full relative overflow-hidden bg-transparent touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div 
        className="absolute top-1/2 left-1/2"
        style={{ 
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          transition: touchState.current.isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <AnimatePresence>
          {nodes.map(node => {
            const size = Math.min(Math.max(node.depth * 2, 6), 40);
            const isMeaningful = node.depth >= 10;
            const isCurrent = currentId === node.id;
            
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={nodeMotion}
                className={`absolute rounded-full cursor-pointer transition-colors duration-500 hover:!scale-150 flex items-center justify-center group ${isCurrent ? 'z-20' : 'z-10'}`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: size,
                  height: size,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: isCurrent ? 'var(--color-copper)' : (isMeaningful ? 'var(--color-champagne)' : 'var(--color-mauve)'),
                  opacity: isMeaningful ? 0.9 : 0.6,
                  boxShadow: isMeaningful ? `0 0 ${size}px currentColor` : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.id);
                }}
              >
                {/* Glow ring for meaningful ones */}
                {isMeaningful && !isCurrent && (
                   <div className="absolute inset-0 rounded-full border border-champagne opacity-50 animate-pulse" style={{ padding: '2px', left: '-2px', top: '-2px', width: `calc(100% + 4px)`, height: `calc(100% + 4px)` }} />
                )}
                
                {/* Title tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-ink/80 backdrop-blur border border-glass-border rounded-lg px-2 py-1 text-xs whitespace-nowrap text-pearlescent pointer-events-none z-30 shadow-xl">
                  {node.title}
                  <div className="text-[10px] text-mauve/70 mt-0.5">{node.depth} messages</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
