// Core data models as specified in the technical specs

export interface Reaction {
  name: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: Date;
  threadId?: string;
  reactions: Reaction[];
  tags: string[]; // Array of tag names for simplicity
  squad?: string;
  importance?: number; // AI-scored importance (0-1)
  summary?: string; // Cached AI summary
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  squad?: string;
  role?: string;
  avatar?: string;
  commonTags: string[]; // Learned associations
  createdAt: Date;
}

export interface Channel {
  id: string;
  name: string;
  squad?: string;
  isPrivate: boolean;
  memberCount: number;
  isConnected: boolean; // User-selected channels
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence: number; // 0-1, how reliable this tag is
  usageCount: number;
  createdAt: Date;
  lastUsed: Date;
}

export interface Summary {
  id: string;
  date: Date;
  channelIds: string[];
  content: string;
  keyTopics: string[];
  participants: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  aiTokensUsed: number;
  greeting?: string; // Morning greeting text
  highlights: string[]; // High-importance items
  createdAt: Date;
}

export interface Association {
  userId: string;
  commonTags: string[];
  squad?: string;
  lastUpdated: Date;
}

export interface LearningStats {
  totalPredictions: number;
  accuratePredictions: number;
  accuracy: number;
}

// JSON storage data structures
export interface MessagesData {
  messages: Message[];
  lastUpdated: string;
}

export interface UsersData {
  users: User[];
  lastUpdated: string;
}

export interface ChannelsData {
  channels: Channel[];
  lastUpdated: string;
}

export interface TagsData {
  tags: Tag[];
  lastUpdated: string;
}

export interface SummariesData {
  summaries: Summary[];
  lastUpdated: string;
}

export interface AssociationsData {
  associations: Association[];
  learningStats: LearningStats;
  lastUpdated: string;
}

export interface CacheData {
  cache: Record<string, any>;
  lastUpdated: string;
}

// API request/response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  dateFrom?: string;
  dateTo?: string;
  channels?: string[];
  users?: string[];
  tags?: string[];
  squads?: string[];
  keywords?: string[];
  importance?: number;
}

export interface MessageSearchRequest {
  filters: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'importance' | 'reactions';
  sortOrder?: 'asc' | 'desc';
}

export interface SlackAuthRequest {
  code: string;
  state?: string;
}

export interface SlackAuthResponse {
  accessToken: string;
  userId: string;
  teamId: string;
  teamName: string;
  channels: Channel[];
}

export interface SummaryGenerationRequest {
  date: string;
  channelIds?: string[];
  includeGreeting?: boolean;
  maxTokens?: number;
}

export interface TagCreationRequest {
  name: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence?: number;
}

export interface TagUpdateRequest {
  name?: string;
  category?: 'keyword' | 'person' | 'squad' | 'custom';
  confidence?: number;
}

// Slack API types
export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  channel: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  num_members: number;
  is_member: boolean;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email: string;
    image_72?: string;
  };
}

// OpenAI API types
export interface OpenAISummaryRequest {
  messages: Message[];
  date: string;
  includeGreeting?: boolean;
  maxTokens?: number;
}

export interface OpenAISummaryResponse {
  summary: string;
  greeting?: string;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  highlights: string[];
  tokensUsed: number;
}

// Authentication types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  avatar?: string;
}

export interface JwtPayload {
  userId: string;
  teamId: string;
  email: string;
  iat: number;
  exp: number;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Utility types
export type DateRange = {
  start: Date;
  end: Date;
};

export type SortOrder = 'asc' | 'desc';

export type ImportanceLevel = 'low' | 'medium' | 'high' | 'critical';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export type TagCategory = 'keyword' | 'person' | 'squad' | 'custom';
