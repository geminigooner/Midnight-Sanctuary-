/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from './lib/store';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Settings } from './components/Settings';
import { LevinJewel } from './components/LevinJewel';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getMotion } from './lib/motion';

export default function App() {
  const store = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jewelOpen, setJewelOpen] = useState(false);

  const reducedMotion = useReducedMotion();
  const modalMotion = getMotion('heavy', reducedMotion);

  React.useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const currentConversation = store.conversations.find(c => c.id === store.currentId);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-obsidian text-pearlescent relative w-full">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-80 shrink-0`}>
        <Sidebar 
          conversations={store.conversations}
          currentId={store.currentId}
          onSelect={(id) => {
            store.setCurrentId(id);
            if (window.innerWidth < 1024) setSidebarOpen(false);
          }}
          onNew={() => {
            store.createConversation();
            store.updateJewelMetrics(prev => ({ ...prev, totalSessions: prev.totalSessions + 1 }));
            if (window.innerWidth < 1024) setSidebarOpen(false);
          }}
          onDelete={store.deleteConversation}
          onRename={store.renameConversation}
          isOpen={true}
        />
      </div>
      
      <ChatArea 
        conversation={currentConversation}
        settings={store.settings}
        jewelMetrics={store.jewelMetrics}
        onUpdate={store.updateConversation}
        onUpdateJewel={store.updateJewelMetrics}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenJewel={() => setJewelOpen(true)}
        availableModels={store.availableModels}
      />

      <AnimatePresence>
        {settingsOpen && (
          <Settings 
            settings={store.settings}
            onSave={store.updateSettings}
            onClose={() => setSettingsOpen(false)}
            availableModels={store.availableModels}
            isModelsLoading={store.isModelsLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jewelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={modalMotion}
              className="bg-ink border border-glass-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative"
            >
              <button onClick={() => setJewelOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-glass rounded-full transition-colors z-10 text-mauve hover:text-champagne">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <LevinJewel metrics={store.jewelMetrics} onReset={store.resetJewel} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
