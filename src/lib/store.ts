import { useState, useEffect, useCallback } from 'react';
import { Conversation, AppSettings, DEFAULT_SETTINGS, JewelMetrics, DEFAULT_JEWEL_METRICS, ModelInfo, Gift } from './types';
import { v4 as uuidv4 } from 'uuid';

export function useAppStore() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [jewelMetrics, setJewelMetrics] = useState<JewelMetrics>(DEFAULT_JEWEL_METRICS);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  const [gifts, setGifts] = useState<Gift[]>([]);

  // Load on mount
  useEffect(() => {
    let loadedSettings = { ...DEFAULT_SETTINGS };
    const savedConvos = localStorage.getItem('midnight_sanctuary_conversations');
    if (savedConvos) {
      try { setConversations(JSON.parse(savedConvos)); } catch (e) {}
    }
    const savedSettings = localStorage.getItem('midnight_sanctuary_settings');
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {}
    }
    setSettings(loadedSettings);
    
    const savedJewel = localStorage.getItem('midnight_sanctuary_jewel');
    if (savedJewel) {
      try { setJewelMetrics({ ...DEFAULT_JEWEL_METRICS, ...JSON.parse(savedJewel) }); } catch (e) {}
    }

    const savedGifts = localStorage.getItem('midnight_sanctuary_gifts');
    if (savedGifts) {
      try { setGifts(JSON.parse(savedGifts)); } catch (e) {}
    }

    // Fetch models
    fetch('/api/models')
      .then(res => res.json())
      .then((data: ModelInfo[]) => {
        setAvailableModels(data);
        setIsModelsLoading(false);

        // If the current model is the default and it's not in the list, try to find the newest Gemma
        if (!savedSettings) {
          const gemmaModels = data.filter(m => m.name.toLowerCase().includes('gemma'));
          if (gemmaModels.length > 0) {
            // Assuming string sorting might roughly work for versions, or just taking the last one
            gemmaModels.sort((a, b) => b.name.localeCompare(a.name));
            setSettings(prev => ({ ...prev, model: gemmaModels[0].name }));
          }
        }
      })
      .catch(err => {
        console.error("Failed to fetch models", err);
        setIsModelsLoading(false);
      });
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

  useEffect(() => {
    localStorage.setItem('midnight_sanctuary_gifts', JSON.stringify(gifts));
  }, [gifts]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addGift = useCallback((gift: Omit<Gift, 'id' | 'timestamp'>) => {
    const newGift: Gift = {
      ...gift,
      id: uuidv4(),
      timestamp: Date.now()
    };
    setGifts(prev => [newGift, ...prev]);
  }, []);

  const addMemory = useCallback((memoryContent: string, origin?: string) => {
    setSettings(prev => {
      const newMemory = {
        id: uuidv4(),
        content: memoryContent,
        createdAt: Date.now(),
        origin
      };
      return {
        ...prev,
        memories: [newMemory, ...(prev.memories || [])]
      };
    });
  }, []);

  const addEventLog = useCallback((description: string) => {
    setSettings(prev => {
      const newEvent = {
        id: uuidv4(),
        description,
        timestamp: Date.now()
      };
      return {
        ...prev,
        eventLog: [newEvent, ...(prev.eventLog || [])]
      };
    });
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
    availableModels,
    isModelsLoading,
    gifts,
    addGift,
    addMemory,
    addEventLog,
  };
}
