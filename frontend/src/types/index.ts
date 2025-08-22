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

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
