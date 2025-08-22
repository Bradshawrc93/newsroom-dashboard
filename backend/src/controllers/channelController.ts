import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService';
import { channelStorage } from '../utils/storage';
import { ApiResponse, CustomError, Channel } from '../types';
import { z } from 'zod';

// Validation schemas
const connectChannelSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
});

const disconnectChannelSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
});

export class ChannelController {
  private slackService: SlackService;

  constructor() {
    this.slackService = new SlackService(process.env.SLACK_BOT_TOKEN);
  }

  /**
   * Get all channels
   */
  getAllChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch real channels from Slack
      const slackChannels = await this.slackService.getChannels();
      
      // Transform Slack channels to our format
      const channels = slackChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        squad: this.slackService.inferSquadFromChannelName(channel.name),
        isPrivate: channel.isPrivate,
        memberCount: channel.memberCount,
        isConnected: true, // All fetched channels are connected
        createdAt: new Date()
      }));
      
      const response: ApiResponse<{
        channels: Channel[];
        total: number;
        connected: number;
      }> = {
        success: true,
        data: {
          channels,
          total: channels.length,
          connected: channels.filter(c => c.isConnected).length,
        },
        message: 'Channels retrieved successfully from Slack',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching channels from Slack:', error);
      
      // Fallback to stored channels if Slack fails
      try {
        const storedChannels = await channelStorage.read();
        
        const response: ApiResponse<{
          channels: Channel[];
          total: number;
          connected: number;
        }> = {
          success: true,
          data: {
            channels: storedChannels.channels,
            total: storedChannels.channels.length,
            connected: storedChannels.channels.filter(c => c.isConnected).length,
          },
          message: 'Channels retrieved from fallback data',
        };

        res.status(200).json(response);
      } catch (fallbackError) {
        next(error);
      }
    }
  };

  /**
   * Connect a channel (mark as monitored)
   */
  connectChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { channelId } = connectChannelSchema.parse(req.body);

      const channels = await channelStorage.read();
      const channel = channels.channels.find(c => c.id === channelId);

      if (!channel) {
        throw new CustomError('Channel not found', 404);
      }

      if (channel.isConnected) {
        throw new CustomError('Channel is already connected', 400);
      }

      // Update channel connection status
      channel.isConnected = true;
      channels.lastUpdated = new Date().toISOString();
      await channelStorage.write(channels);

      const response: ApiResponse<Channel> = {
        success: true,
        data: channel,
        message: `Channel ${channel.name} connected successfully`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Disconnect a channel (stop monitoring)
   */
  disconnectChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { channelId } = disconnectChannelSchema.parse(req.body);

      const channels = await channelStorage.read();
      const channel = channels.channels.find(c => c.id === channelId);

      if (!channel) {
        throw new CustomError('Channel not found', 404);
      }

      if (!channel.isConnected) {
        throw new CustomError('Channel is not connected', 400);
      }

      // Update channel connection status
      channel.isConnected = false;
      channels.lastUpdated = new Date().toISOString();
      await channelStorage.write(channels);

      const response: ApiResponse<Channel> = {
        success: true,
        data: channel,
        message: `Channel ${channel.name} disconnected successfully`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get channel details
   */
  getChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { channelId } = req.params;

      const channels = await channelStorage.read();
      const channel = channels.channels.find(c => c.id === channelId);

      if (!channel) {
        throw new CustomError('Channel not found', 404);
      }

      const response: ApiResponse<Channel> = {
        success: true,
        data: channel,
        message: 'Channel details retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh channels from Slack
   */
  refreshChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch fresh channels from Slack
      const freshChannels = await this.slackService.getChannels();
      
      const existingChannels = await channelStorage.read();
      const existingChannelMap = new Map(
        existingChannels.channels.map(c => [c.id, c])
      );

      // Merge fresh channels with existing connection status
      const mergedChannels = freshChannels.map(freshChannel => ({
        ...freshChannel,
        isConnected: existingChannelMap.get(freshChannel.id)?.isConnected || false,
      }));

      // Update storage
      existingChannels.channels = mergedChannels;
      existingChannels.lastUpdated = new Date().toISOString();
      await channelStorage.write(existingChannels);

      const response: ApiResponse<{
        channels: Channel[];
        total: number;
        connected: number;
        refreshed: number;
      }> = {
        success: true,
        data: {
          channels: mergedChannels,
          total: mergedChannels.length,
          connected: mergedChannels.filter(c => c.isConnected).length,
          refreshed: freshChannels.length,
        },
        message: `Refreshed ${freshChannels.length} channels from Slack`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get connected channels only
   */
  getConnectedChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const channels = await channelStorage.read();
      const connectedChannels = channels.channels.filter(c => c.isConnected);

      const response: ApiResponse<{
        channels: Channel[];
        total: number;
      }> = {
        success: true,
        data: {
          channels: connectedChannels,
          total: connectedChannels.length,
        },
        message: 'Connected channels retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
