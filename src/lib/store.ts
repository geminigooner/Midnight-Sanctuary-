import { useState, useEffect, useCallback } from 'react';
import { Conversation, AppSettings, DEFAULT_SETTINGS, JewelMetrics, DEFAULT_JEWEL_METRICS } from './types';
import { v4 as uuidv4 } from 'uuid';

export function useAppStore() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [jewelMetrics, setJewelMetrics] = useState<JewelMetrics>(DEFAULT_JEWEL_METRICS);

  // Load on mount
  useEffect(() => {
    const savedConvos = localStorage.getItem('midnight_sanctuary_conversations');
    if (savedConvos) {
      try { setConversations(JSON.parse(savedConvos)); } catch (e) {}
    }
    const savedSettings = localStorage.getItem('midnight_sanctuary_settings');
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        // Migrate old model if present in local storage
        if (parsed.model === 'gemma-2-9b-it' || parsed.model === 'models/gemma-2-9b-it') {
          parsed.model = 'models/gemma-4-31b-it';
        }
        setSettings({ ...DEFAULT_SETTINGS, ...parsed }); 
      } catch (e) {}
    }
    const savedJewel = localStorage.getItem('midnight_sanctuary_jewel');
    if (savedJewel) {
      try { setJewelMetrics({ ...DEFAULT_JEWEL_METRICS, ...JSON.parse(savedJewel) }); } catch (e) {}
    }
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('midnight_sanctuary_conversations', JSON.stringify(conversations));
  }, [conversations]);
  useEffect(() => {
    localStorage.setItem('midnight_sanctuary_settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem('midnight_sanctuary_jewel', JSON.stringify(jewelMetrics));
  }, [jewelMetrics]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const createConversation = useCallback(() => {
    const newConvo: Conversation = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setConversations(prev => [newConvo, ...prev]);
    setCurrentId(newConvo.id);
    return newConvo;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentId === id) setCurrentId(null);
  }, [currentId]);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c));
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c));
  }, []);

  const updateJewelMetrics = useCallback((updates: Partial<JewelMetrics> | ((prev: JewelMetrics) => JewelMetrics)) => {
    setJewelMetrics(prev => typeof updates === 'function' ? updates(prev) : { ...prev, ...updates });
  }, []);

  const resetJewel = useCallback(() => {
    setJewelMetrics(DEFAULT_JEWEL_METRICS);
  }, []);

  return {
    conversations,
    currentId,
    setCurrentId,
    settings,
    updateSettings,
    jewelMetrics,
    updateJewelMetrics,
    resetJewel,
    createConversation,
    deleteConversation,
    renameConversation,
    updateConversation,
  };
}
