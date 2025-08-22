import { WebClient } from '@slack/web-api';
import { 
  SlackMessage, 
  SlackChannel, 
  SlackUser, 
  Message, 
  Channel, 
  User,
  SlackAuthResponse,
  SlackAuthRequest
} from '../types';
import { userStorage, channelStorage, messageStorage } from '../utils/storage';
import { CustomError } from '../types';

export class SlackService {
  public client: WebClient;

  constructor(token?: string) {
    this.client = new WebClient(token);
  }

  /**
   * Handle Slack OAuth flow
   */
  async handleOAuth(code: string): Promise<SlackAuthResponse> {
    try {
      const result = await this.client.oauth.v2.access({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
      });

      if (!result.access_token) {
        throw new CustomError('Failed to get access token from Slack', 400);
      }

      // Create new client with access token
      this.client = new WebClient(result.access_token);

      // Get user info
      const authTest = await this.client.auth.test();
      if (!authTest.user_id || !authTest.team_id || !authTest.team) {
        throw new CustomError('Failed to get user info from Slack', 400);
      }

      // Get user details
      const userInfo = await this.client.users.info({
        user: authTest.user_id,
      });

      // Get accessible channels
      const channels = await this.getChannels();

      const authResponse: SlackAuthResponse = {
        accessToken: result.access_token,
        userId: authTest.user_id,
        teamId: authTest.team_id,
        teamName: authTest.team,
        channels,
      };

      // Store user and channels in JSON storage
      await this.storeUserAndChannels(authResponse, userInfo.user as SlackUser);

      return authResponse;
    } catch (error) {
      console.error('Slack OAuth error:', error);
      throw new CustomError(
        error instanceof Error ? error.message : 'Slack OAuth failed',
        400
      );
    }
  }

  /**
   * Get all accessible channels
   */
  async getChannels(): Promise<Channel[]> {
    try {
      // First try to get public channels only (we have permission for these)
      const result = await this.client.conversations.list({
        types: 'public_channel',
        exclude_archived: true,
      });

      if (!result.channels) {
        return [];
      }

      return (result.channels as SlackChannel[]).map(channel => ({
        id: channel.id,
        name: channel.name,
        squad: this.inferSquadFromChannelName(channel.name),
        isPrivate: channel.is_private,
        memberCount: channel.num_members,
        isConnected: true, // All fetched channels are connected
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw new CustomError('Failed to fetch channels', 500);
    }
  }

  /**
   * Get messages from a channel for a specific date range
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

      return (result.messages as SlackMessage[])
        .filter(msg => msg.type === 'message' && msg.user && msg.text)
        .map(msg => this.convertSlackMessageToMessage(msg, userMap));
    } catch (error) {
      console.error('Error fetching channel messages:', error);
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
        const result = await this.client.users.info({ user: userId });
        if (result.user) {
          const slackUser = result.user as SlackUser;
          users.push({
            id: slackUser.id,
            name: slackUser.real_name || slackUser.name,
            email: slackUser.profile.email,
            squad: this.inferSquadFromEmail(slackUser.profile.email),
            role: this.inferRoleFromEmail(slackUser.profile.email),
            avatar: slackUser.profile.image_72,
            commonTags: [] as string[],
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.warn(`Failed to get user info for ${userId}:`, error);
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

      return (result.members as SlackUser[])
        // @ts-ignore
        .filter(user => !user.is_bot && !user.is_restricted && !user.deleted)
        .map(user => ({
          id: user.id,
          name: user.real_name || user.name,
          email: user.profile.email,
          squad: this.inferSquadFromEmail(user.profile.email),
          role: this.inferRoleFromEmail(user.profile.email),
          avatar: user.profile.image_72,
          commonTags: [] as string[],
          createdAt: new Date(),
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
   * Infer squad from user name
   */
  inferSquadFromUserName(userName: string): string {
    const name = userName.toLowerCase();
    
    // Map user names to squads based on patterns
    if (name.includes('voice') || name.includes('ai')) return 'voice';
    if (name.includes('epic') || name.includes('rcm')) return 'epic';
    if (name.includes('portal') || name.includes('agg')) return 'portal-agg';
    if (name.includes('hitl') || name.includes('arc')) return 'hitl';
    if (name.includes('customer') || name.includes('facing')) return 'customer-facing';
    if (name.includes('data') || name.includes('analytics')) return 'data-team';
    if (name.includes('dev') || name.includes('engineer')) return 'dev-team';
    
    return 'general';
  }

  /**
   * Store user and channels in JSON storage
   */
  private async storeUserAndChannels(
    authResponse: SlackAuthResponse, 
    slackUser: SlackUser
  ): Promise<void> {
    try {
      // Store user
      const user: User = {
        id: authResponse.userId,
        name: slackUser.real_name || slackUser.name,
        email: slackUser.profile.email,
        squad: this.inferSquadFromEmail(slackUser.profile.email),
        role: this.inferRoleFromEmail(slackUser.profile.email),
        avatar: slackUser.profile.image_72,
        commonTags: [],
        createdAt: new Date(),
      };

      await userStorage.update(data => {
        const existingUserIndex = data.users.findIndex(u => u.id === user.id);
        if (existingUserIndex >= 0) {
          data.users[existingUserIndex] = user;
        } else {
          data.users.push(user);
        }
        data.lastUpdated = new Date().toISOString();
        return data;
      });

      // Store channels
      await channelStorage.update(data => {
        // Merge with existing channels, preserving isConnected status
        const existingChannels = new Map(data.channels.map(c => [c.id, c]));
        
        authResponse.channels.forEach(channel => {
          const existing = existingChannels.get(channel.id);
          if (existing) {
            // Preserve existing connection status
            channel.isConnected = existing.isConnected;
          }
          existingChannels.set(channel.id, channel);
        });

        data.channels = Array.from(existingChannels.values());
        data.lastUpdated = new Date().toISOString();
        return data;
      });
    } catch (error) {
      console.error('Error storing user and channels:', error);
      throw new CustomError('Failed to store user data', 500);
    }
  }

  /**
   * Convert Slack message to internal Message format
   */
  private convertSlackMessageToMessage(
    slackMessage: SlackMessage, 
    userMap: Map<string, User>
  ): Message {
    const user = userMap.get(slackMessage.user!);
    
    return {
      id: `${slackMessage.channel}.${slackMessage.ts}`,
      channelId: slackMessage.channel,
      userId: slackMessage.user!,
      text: slackMessage.text,
      timestamp: new Date(parseFloat(slackMessage.ts) * 1000),
      threadId: slackMessage.thread_ts ? `${slackMessage.channel}.${slackMessage.thread_ts}` : undefined,
      reactions: slackMessage.reactions?.map(reaction => ({
        name: reaction.name,
        count: reaction.count,
        users: reaction.users || [],
      })) || [],
      tags: [],
      squad: user?.squad,
      importance: this.calculateInitialImportance(slackMessage),
      createdAt: new Date(parseFloat(slackMessage.ts) * 1000),
    };
  }

  /**
   * Calculate initial importance score based on message characteristics
   */
  private calculateInitialImportance(slackMessage: SlackMessage): number {
    let importance = 0.5; // Base importance

    // Increase importance based on reactions
    if (slackMessage.reactions) {
      const totalReactions = slackMessage.reactions.reduce((sum, r) => sum + r.count, 0);
      importance += Math.min(totalReactions * 0.1, 0.3);
    }

    // Increase importance for thread messages
    if (slackMessage.thread_ts) {
      importance += 0.1;
    }

    // Increase importance for messages with urgency indicators
    const urgencyWords = ['urgent', 'asap', 'emergency', 'critical', 'important', 'priority'];
    const hasUrgency = urgencyWords.some(word => 
      slackMessage.text.toLowerCase().includes(word)
    );
    if (hasUrgency) {
      importance += 0.2;
    }

    return Math.min(importance, 1.0);
  }

  /**
   * Infer squad from channel name
   */
  inferSquadFromChannelName(channelName: string): string | undefined {
    const squadPatterns = [
      { pattern: /frontend|react|vue|angular/i, squad: 'frontend' },
      { pattern: /backend|api|server/i, squad: 'backend' },
      { pattern: /devops|infra|deploy/i, squad: 'devops' },
      { pattern: /design|ui|ux/i, squad: 'design' },
      { pattern: /product|pm/i, squad: 'product' },
      { pattern: /marketing|growth/i, squad: 'marketing' },
      { pattern: /sales|revenue/i, squad: 'sales' },
      { pattern: /support|help/i, squad: 'support' },
    ];

    for (const { pattern, squad } of squadPatterns) {
      if (pattern.test(channelName)) {
        return squad;
      }
    }

    return undefined;
  }

  /**
   * Infer squad from email domain or pattern
   */
  private inferSquadFromEmail(email: string): string | undefined {
    // This is a simple implementation - in a real app, you might have
    // a more sophisticated mapping based on your organization structure
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes('frontend') || emailLower.includes('ui')) return 'frontend';
    if (emailLower.includes('backend') || emailLower.includes('api')) return 'backend';
    if (emailLower.includes('devops') || emailLower.includes('infra')) return 'devops';
    if (emailLower.includes('design')) return 'design';
    if (emailLower.includes('product') || emailLower.includes('pm')) return 'product';
    if (emailLower.includes('marketing')) return 'marketing';
    if (emailLower.includes('sales')) return 'sales';
    if (emailLower.includes('support')) return 'support';

    return undefined;
  }

  /**
   * Infer role from email
   */
  private inferRoleFromEmail(email: string): string | undefined {
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes('lead') || emailLower.includes('manager')) return 'lead';
    if (emailLower.includes('senior') || emailLower.includes('sr')) return 'senior';
    if (emailLower.includes('junior') || emailLower.includes('jr')) return 'junior';
    if (emailLower.includes('intern')) return 'intern';

    return 'developer';
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
