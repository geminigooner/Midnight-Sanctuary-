export interface Message {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
}

export interface Memory {
  id: string;
  content: string;
  createdAt: number;
}

export interface AppSettings {
  systemInstruction: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  model: string;
  favoriteModels: string[];
  aboutMe: string;
  conversationPreferences: string;
  memories: Memory[];
  memoriesEnabled: boolean;
}

export type JewelStage = 'seed' | 'stance' | 'formation' | 'incorporation' | 'archival';

export interface JewelMetrics {
  totalSessions: number;
  totalMessages: number;
  totalResponseCharacters: number;
  rapidExchanges: number;
  longPauses: number;
  lastInteractionTimestamp: number;
}

export const DEFAULT_JEWEL_METRICS: JewelMetrics = {
  totalSessions: 0,
  totalMessages: 0,
  totalResponseCharacters: 0,
  rapidExchanges: 0,
  longPauses: 0,
  lastInteractionTimestamp: 0,
};

export const DEFAULT_SETTINGS: AppSettings = {
  systemInstruction: "",
  temperature: 2.0,
  topP: 0.95,
  maxOutputTokens: 4096,
  model: "models/gemma-4-31b-it",
  favoriteModels: [],
  aboutMe: "",
  conversationPreferences: "",
  memories: [],
  memoriesEnabled: true,
};
