import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService';
import { messageStorage, userStorage, channelStorage } from '../utils/storage';
import { ApiResponse, CustomError, Message, Channel } from '../types';
import { z } from 'zod';

// Validation schemas
const fetchMessagesSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  startDate: z.string().datetime('Start date must be a valid ISO date'),
  endDate: z.string().datetime('End date must be a valid ISO date'),
  limit: z.number().min(1).max(1000).optional().default(100),
});

const searchMessagesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  channelIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});

export class MessageController {
  private slackService: SlackService;

  constructor() {
    this.slackService = new SlackService();
  }

  /**
   * Fetch messages from a specific channel for a date range
   */
  fetchChannelMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { channelId, startDate, endDate, limit } = fetchMessagesSchema.parse(req.body);
      
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate date range
      if (start >= end) {
        throw new CustomError('Start date must be before end date', 400);
      }

      // Check if channel exists and is connected
      const channels = await channelStorage.read();
      const channel = channels.channels.find(c => c.id === channelId);
      
      if (!channel) {
        throw new CustomError('Channel not found', 404);
      }

      if (!channel.isConnected) {
        throw new CustomError('Channel is not connected. Please connect the channel first.', 400);
      }

      // Fetch messages from Slack
      const messages = await this.slackService.getChannelMessages(channelId, start, end);

      // Store messages in JSON storage
      const existingData = await messageStorage.read();
      const newMessages = messages.filter(newMsg => 
        !existingData.messages.some(existingMsg => existingMsg.id === newMsg.id)
      );

      if (newMessages.length > 0) {
        existingData.messages.push(...newMessages);
        existingData.lastUpdated = new Date().toISOString();
        await messageStorage.write(existingData);
      }

      // Store new users if any
      const newUsers = messages
        .map(msg => msg.userId)
        .filter(userId => !existingData.messages.some(msg => msg.userId === userId));

      if (newUsers.length > 0) {
        const users = await this.slackService.getUsersByIds(newUsers);
        const existingUsers = await userStorage.read();
        existingUsers.users.push(...users);
        existingUsers.lastUpdated = new Date().toISOString();
        await userStorage.write(existingUsers);
      }

      const response: ApiResponse<{
        messages: Message[];
        totalFetched: number;
        channel: Channel;
      }> = {
        success: true,
        data: {
          messages: messages.slice(0, limit),
          totalFetched: messages.length,
          channel,
        },
        message: `Successfully fetched ${messages.length} messages from ${channel.name}`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get stored messages with filtering
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        channelId,
        userId,
        startDate,
        endDate,
        tags,
        limit = 50,
        offset = 0,
      } = req.query;

      const messages = await messageStorage.read();
      let filteredMessages = messages.messages;

      // Apply filters
      if (channelId) {
        filteredMessages = filteredMessages.filter(msg => msg.channelId === channelId);
      }

      if (userId) {
        filteredMessages = filteredMessages.filter(msg => msg.userId === userId);
      }

      if (startDate) {
        const start = new Date(startDate as string);
        filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) <= end);
      }

      if (tags && Array.isArray(tags)) {
        filteredMessages = filteredMessages.filter(msg => 
          tags.some(tag => msg.tags.includes(tag))
        );
      }

      // Sort by timestamp (newest first)
      filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      const paginatedMessages = filteredMessages.slice(offset as number, (offset as number) + (limit as number));

      const response: ApiResponse<{
        messages: Message[];
        total: number;
        limit: number;
        offset: number;
      }> = {
        success: true,
        data: {
          messages: paginatedMessages,
          total: filteredMessages.length,
          limit: limit as number,
          offset: offset as number,
        },
        message: `Retrieved ${paginatedMessages.length} messages`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search messages by text content
   */
  searchMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, channelIds, userIds, startDate, endDate, tags, limit } = searchMessagesSchema.parse(req.body);

      const messages = await messageStorage.read();
      let filteredMessages = messages.messages;

      // Apply filters
      if (channelIds && channelIds.length > 0) {
        filteredMessages = filteredMessages.filter(msg => channelIds.includes(msg.channelId));
      }

      if (userIds && userIds.length > 0) {
        filteredMessages = filteredMessages.filter(msg => userIds.includes(msg.userId));
      }

      if (startDate) {
        const start = new Date(startDate);
        filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredMessages = filteredMessages.filter(msg => new Date(msg.timestamp) <= end);
      }

      if (tags && tags.length > 0) {
        filteredMessages = filteredMessages.filter(msg => 
          tags.some(tag => msg.tags.includes(tag))
        );
      }

      // Search in message text
      const searchQuery = query.toLowerCase();
      const searchResults = filteredMessages.filter(msg => 
        msg.text.toLowerCase().includes(searchQuery) ||
        msg.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery))
      );

      // Sort by relevance (exact matches first, then partial matches)
      searchResults.sort((a, b) => {
        const aExact = a.text.toLowerCase().includes(searchQuery);
        const bExact = b.text.toLowerCase().includes(searchQuery);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      const response: ApiResponse<{
        messages: Message[];
        total: number;
        query: string;
      }> = {
        success: true,
        data: {
          messages: searchResults.slice(0, limit),
          total: searchResults.length,
          query,
        },
        message: `Found ${searchResults.length} messages matching "${query}"`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get messages from yesterday (for daily summaries)
   */
  getYesterdayMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messages = await messageStorage.read();
      const yesterdayMessages = messages.messages.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= yesterday && msgDate < today;
      });

      // Sort by timestamp
      yesterdayMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const response: ApiResponse<{
        messages: Message[];
        date: string;
        total: number;
      }> = {
        success: true,
        data: {
          messages: yesterdayMessages,
          date: yesterday.toISOString().split('T')[0],
          total: yesterdayMessages.length,
        },
        message: `Retrieved ${yesterdayMessages.length} messages from yesterday`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get message statistics
   */
  getMessageStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await messageStorage.read();
      const users = await userStorage.read();
      const channels = await channelStorage.read();

      const stats = {
        totalMessages: messages.messages.length,
        totalUsers: users.users.length,
        totalChannels: channels.channels.length,
        connectedChannels: channels.channels.filter(c => c.isConnected).length,
        lastUpdated: messages.lastUpdated,
        messagesByChannel: {} as Record<string, number>,
        messagesByUser: {} as Record<string, number>,
        messagesByDate: {} as Record<string, number>,
      };

      // Calculate channel statistics
      messages.messages.forEach(msg => {
        stats.messagesByChannel[msg.channelId] = (stats.messagesByChannel[msg.channelId] || 0) + 1;
        stats.messagesByUser[msg.userId] = (stats.messagesByUser[msg.userId] || 0) + 1;
        
        const date = new Date(msg.timestamp).toISOString().split('T')[0];
        stats.messagesByDate[date] = (stats.messagesByDate[date] || 0) + 1;
      });

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Message statistics retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
