export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  imageBase64?: string;
  imageMimeType?: string;
  modelUsed?: string;
  vibeMode?: string;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  vibeMode: string;
  model: string;
  messageCount: number;
  lastMessageSnippet?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
  totalChats: number;
  totalMessages: number;
  preferredVibe?: string;
  isNewUser?: boolean;
}

export interface VibeModeConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  color: string;
  systemInstruction: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  badge: string;
}
