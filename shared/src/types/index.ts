// Core entity types
export interface User {
  id: string;
  name: string;
  email?: string;
  squad?: string;
  role?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  name: string;
  squad?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: Date;
  threadId?: string;
  squad?: string;
  createdAt: Date;
  updatedAt: Date;
  channel?: Channel;
  user?: User;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTag {
  messageId: string;
  tagId: number;
  confidence: number;
  createdAt: Date;
  message?: Message;
  tag?: Tag;
}

export interface Summary {
  id: number;
  date: Date;
  channelIds: string[];
  content: string;
  keyTopics?: string[];
  participants?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  aiTokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and search types
export interface MessageFilters {
  dateFrom?: Date;
  dateTo?: Date;
  channelIds?: string[];
  userIds?: string[];
  squad?: string;
  keywords?: string[];
  tags?: string[];
}

export interface SearchParams {
  query: string;
  filters?: MessageFilters;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'user' | 'channel';
  sortOrder?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardStats {
  totalMessages: number;
  totalUsers: number;
  totalChannels: number;
  totalTags: number;
  messagesToday: number;
  activeUsers: number;
  aiTokensUsed: number;
}

export interface ActivitySummary {
  date: Date;
  messageCount: number;
  userCount: number;
  channelCount: number;
  topKeywords: string[];
  topUsers: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Authentication types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permissions: string[];
}

export interface LoginRequest {
  code: string;
  redirectUri: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

// Slack integration types
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  topic?: string;
  purpose?: string;
}

export interface SlackUser {
  id: string;
  name: string;
  realName?: string;
  email?: string;
  avatar?: string;
  isBot: boolean;
  isDeleted: boolean;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: string;
  threadId?: string;
  reactions?: SlackReaction[];
  attachments?: SlackAttachment[];
}

export interface SlackReaction {
  name: string;
  count: number;
  users: string[];
}

export interface SlackAttachment {
  type: string;
  title?: string;
  text?: string;
  url?: string;
}

// AI/ML types
export interface AISummaryRequest {
  messages: Message[];
  channelIds: string[];
  date: Date;
  includeTopics?: boolean;
  includeSentiment?: boolean;
}

export interface AISummaryResponse {
  summary: string;
  keyTopics?: string[];
  participants?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  tokensUsed: number;
}

export interface TagSuggestion {
  tag: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence: number;
  reason: string;
}

// UI component types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  category?: string;
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Configuration types
export interface AppConfig {
  slack: {
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    botToken: string;
    userToken: string;
  };
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  database: {
    url: string;
  };
  server: {
    port: number;
    corsOrigin: string;
  };
  features: {
    enableAISummaries: boolean;
    enableLearningSystem: boolean;
    enableRealTimeUpdates: boolean;
  };
}
