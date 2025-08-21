// Core data models (matching backend types)
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
  tags: string[];
  squad?: string;
  importance?: number;
  summary?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  squad?: string;
  role?: string;
  avatar?: string;
  commonTags: string[];
  createdAt: Date;
}

export interface Channel {
  id: string;
  name: string;
  squad?: string;
  isPrivate: boolean;
  memberCount: number;
  isConnected: boolean;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence: number;
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
  greeting?: string;
  highlights: string[];
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

// API response types
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

// Search and filter types
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

// UI state types
export interface DashboardStats {
  totalMessages: number;
  activeUsers: number;
  tagsCreated: number;
  aiTokensUsed: number;
  connectedChannels: number;
  summariesGenerated: number;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  selectedChannels: string[];
  selectedUsers: string[];
  selectedTags: string[];
  selectedSquads: string[];
  keywords: string[];
  importanceThreshold: number;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  compactMode: boolean;
  showThreads: boolean;
  autoRefresh: boolean;
}

// Form types
export interface LoginForm {
  code: string;
}

export interface TagForm {
  name: string;
  category: 'keyword' | 'person' | 'squad' | 'custom';
  confidence?: number;
}

export interface SummaryRequestForm {
  date: string;
  channelIds: string[];
  includeGreeting: boolean;
  maxTokens?: number;
}

// Chart and analytics types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ActivityData {
  date: string;
  messages: number;
  users: number;
  reactions: number;
}

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeMessages: boolean;
  includeSummaries: boolean;
  includeAnalytics: boolean;
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

export type Theme = 'light' | 'dark';

// Component prop types
export interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DropdownProps {
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface TagProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
  onClick?: (tag: Tag) => void;
  variant?: 'default' | 'compact' | 'interactive';
}

export interface MessageProps {
  message: Message;
  showThread?: boolean;
  showReactions?: boolean;
  showTags?: boolean;
  onTagClick?: (tag: string) => void;
  onUserClick?: (userId: string) => void;
  onChannelClick?: (channelId: string) => void;
}
