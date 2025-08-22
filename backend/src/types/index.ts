// Simplified data models for newsroom dashboard

export interface Reaction {
  name: string;
  count: number;
  users: string[];
}

export interface Message {
  id: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  reactions: Reaction[];
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  confidence: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTag {
  messageId: string;
  tagId: number;
  confidence: number;
  isManual: boolean;
  createdAt: Date;
}

// JSON storage data structures
export interface MessagesData {
  messages: Message[];
  lastUpdated: string;
}

export interface TagsData {
  tags: Tag[];
  lastUpdated: string;
}

export interface SummariesData {
  summaries: Array<{
    id: string;
    date: Date;
    content: string;
    keyPoints: string[];
    actionItems: string[];
    messageCount: number;
    squads: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  lastUpdated: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Custom error class
export class CustomError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'CustomError';
  }
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
