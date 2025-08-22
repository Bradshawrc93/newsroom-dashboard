import { WebClient } from '@slack/web-api';
import { 
  SlackMessage, 
  SlackChannel, 
  SlackUser, 
  Message, 
  Channel, 
  User
} from '../types';
import { CustomError } from '../types';

export class SlackService {
  public client: WebClient;
  public userClient: WebClient;

  constructor(token?: string) {
    this.client = new WebClient(token);
    this.userClient = new WebClient(process.env.SLACK_USER_TOKEN || token);
  }



  /**
   * Get all accessible channels (public and private)
   */
  async getChannels(): Promise<Channel[]> {
    try {
      // Get public channels
      const publicResult = await this.client.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
      });

      // Get private channels using user token (more permissions)
      const privateResult = await this.userClient.conversations.list({
        types: 'private_channel',
        exclude_archived: true,
      });

      const allChannels = [
        ...(publicResult.channels || []),
        ...(privateResult.channels || [])
      ];

      return (allChannels as SlackChannel[]).map(channel => ({
        id: channel.id,
        name: channel.name,
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw new CustomError('Failed to fetch channels', 500);
    }
  }

  /**
   * Get messages from a channel for a specific date range (using bot token)
   */
  async getChannelMessages(
    channelId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Message[]> {
    try {
      const startTs = Math.floor(startDate.getTime() / 1000);
      const endTs = Math.floor(endDate.getTime() / 1000);

      const result = await this.client.conversations.history({
        channel: channelId,
        oldest: startTs.toString(),
        latest: endTs.toString(),
        limit: 1000, // Max allowed by Slack
      });

      if (!result.messages) {
        return [];
      }

      // Get user info for all unique users in messages
      const userIds = [...new Set(
        (result.messages as SlackMessage[])
          .filter(msg => msg.user)
          .map(msg => msg.user!)
      )];

      const users = await this.getUsersByIds(userIds);
      const userMap = new Map(users.map(user => [user.id, user]));

      // Get channel info
      let channelName = 'unknown';
      try {
        const channelInfo = await this.client.conversations.info({ channel: channelId });
        channelName = channelInfo.channel?.name || 'unknown';
      } catch (error) {
        console.warn('Failed to get channel info:', error);
      }

      return (result.messages as SlackMessage[])
        .filter(msg => msg.type === 'message' && msg.user && msg.text)
        .map(msg => this.convertSlackMessageToMessage(msg, userMap, channelId, channelName));
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      throw new CustomError('Failed to fetch channel messages', 500);
    }
  }

  /**
   * Get messages from a channel for a specific date range (using user token)
   */
  async getChannelMessagesWithUserToken(
    channelId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<Message[]> {
    try {
      const startTs = Math.floor(startDate.getTime() / 1000);
      const endTs = Math.floor(endDate.getTime() / 1000);

      // Use user client for reading messages (more permissions)
      const result = await this.userClient.conversations.history({
        channel: channelId,
        oldest: startTs.toString(),
        latest: endTs.toString(),
        limit: 1000, // Max allowed by Slack
      });

      if (!result.messages) {
        return [];
      }

      // Get user info for all unique users in messages
      const userIds = [...new Set(
        (result.messages as SlackMessage[])
          .filter(msg => msg.user)
          .map(msg => msg.user!)
      )];

      const users = await this.getUsersByIds(userIds);
      const userMap = new Map(users.map(user => [user.id, user]));

      // Get channel info
      let channelName = 'unknown';
      try {
        const channelInfo = await this.userClient.conversations.info({ channel: channelId });
        channelName = channelInfo.channel?.name || 'unknown';
      } catch (error) {
        console.warn('Failed to get channel info:', error);
      }

      return (result.messages as SlackMessage[])
        .filter(msg => msg.type === 'message' && msg.user && msg.text)
        .map(msg => this.convertSlackMessageToMessage(msg, userMap, channelId, channelName));
    } catch (error) {
      console.error('Error fetching channel messages with user token:', error);
      throw new CustomError('Failed to fetch channel messages', 500);
    }
  }

  /**
   * Get user information by IDs
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    const users: User[] = [];

    for (const userId of userIds) {
      try {
        // Use user client for better permissions
        const result = await this.userClient.users.info({ user: userId });
        if (result.user) {
          const slackUser = result.user as SlackUser;
          users.push({
            id: slackUser.id,
            name: slackUser.real_name || slackUser.name || 'Unknown User',
          });
        }
      } catch (error) {
        console.warn(`Failed to get user info for ${userId}:`, error);
        // Add a fallback user entry
        users.push({
          id: userId,
          name: 'Unknown User',
        });
      }
    }

    return users;
  }

  /**
   * Get all users in the workspace
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.client.users.list();
      if (!result.members) {
        return [];
      }

      return (result.members as any[])
        .filter((user: any) => !user.is_bot && !user.is_restricted && !user.deleted)
        .map((user: any) => ({
          id: user.id,
          name: user.real_name || user.name,
        }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new CustomError('Failed to fetch users', 500);
    }
  }

  /**
   * Get users (alias for getAllUsers for compatibility)
   */
  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }





  /**
   * Convert Slack message to internal Message format
   */
  private convertSlackMessageToMessage(
    slackMessage: SlackMessage, 
    userMap: Map<string, User>,
    channelId: string,
    channelName: string
  ): Message {
    const user = userMap.get(slackMessage.user!);
    
    return {
      id: `${channelId}.${slackMessage.ts}`,
      channelId: channelId,
      channelName: channelName,
      userId: slackMessage.user!,
      userName: user?.name || 'Unknown User',
      text: slackMessage.text,
      timestamp: new Date(parseFloat(slackMessage.ts) * 1000),
      reactions: slackMessage.reactions?.map(reaction => ({
        name: reaction.name,
        count: reaction.count,
        users: reaction.users || [],
      })) || [],
      createdAt: new Date(parseFloat(slackMessage.ts) * 1000),
    };
  }



  /**
   * Test Slack API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.auth.test();
      return true;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }
}
