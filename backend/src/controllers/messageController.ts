import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService';
import { messageStorage } from '../utils/storage';
import { ApiResponse, CustomError, Message } from '../types';
import { getChannelIds, getChannelById } from '../config/channels';

export class MessageController {
  private slackService: SlackService;

  constructor() {
    this.slackService = new SlackService(process.env.SLACK_BOT_TOKEN);
  }



  /**
   * Get messages with filtering
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        channelId,
        userId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        search,
        squad,
        minImportance,
        hasReactions,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      // Fetch messages from Slack
      let messages: Message[] = [];
      
      try {
        // If a specific channel is requested, fetch from that channel
        if (channelId) {
          const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const end = endDate ? new Date(endDate as string) : new Date();
          
          const channelMessages = await this.slackService.getChannelMessages(channelId as string, start, end);
          messages = channelMessages;
        } else {
          // Fetch from monitored channels based on squad structure
          const monitoredChannelIds = getChannelIds();
          
          console.log(`Fetching messages from ${monitoredChannelIds.length} monitored channels in parallel...`);
          
          const start = startDate ? new Date(startDate as string) : new Date('2025-08-01');
          const end = endDate ? new Date(endDate as string) : new Date();
          
          // Fetch all channels in parallel for better performance
          const channelPromises = monitoredChannelIds.map(async (channelId) => {
            const channelConfig = getChannelById(channelId);
            const channelName = channelConfig?.name || channelId;
            
            try {
              console.log(`Fetching messages from channel: ${channelName} (${channelId})`);
              const channelMessages = await this.slackService.getChannelMessagesWithUserToken(channelId, start, end);
              console.log(`Got ${channelMessages.length} messages from ${channelName}`);
              return channelMessages;
            } catch (channelError) {
              console.error(`Error fetching messages from channel ${channelName}:`, channelError);
              return []; // Return empty array on error
            }
          });
          
          // Wait for all channels to complete
          const channelResults = await Promise.allSettled(channelPromises);
          
          // Combine all successful results
          channelResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              messages.push(...result.value);
            } else {
              console.error(`Failed to fetch from channel ${monitoredChannelIds[index]}:`, result.reason);
            }
          });
        }
      } catch (slackError) {
        console.error('Error fetching messages from Slack:', slackError);
        
        // Fallback to stored messages
        const storedData = await messageStorage.read();
        messages = storedData.messages;
      }

      let filteredMessages = messages;

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

      // Text search
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredMessages = filteredMessages.filter(msg => 
          msg.text.toLowerCase().includes(searchTerm) ||
          msg.userName.toLowerCase().includes(searchTerm) ||
          (msg.channelName && msg.channelName.toLowerCase().includes(searchTerm))
        );
      }

      // Squad filter
      if (squad) {
        const squadName = (squad as string).toLowerCase();
        filteredMessages = filteredMessages.filter(msg => {
          const inferredSquad = this.inferSquadFromChannel(msg.channelName || '').toLowerCase();
          return inferredSquad === squadName;
        });
      }

      // Minimum importance filter
      if (minImportance) {
        const minScore = parseFloat(minImportance as string);
        filteredMessages = filteredMessages.filter(msg => {
          // For now, use a simple importance estimation
          // In production, this would use stored AI analysis results
          const estimatedImportance = this.estimateMessageImportance(msg);
          return estimatedImportance >= minScore;
        });
      }

      // Has reactions filter
      if (hasReactions === 'true') {
        filteredMessages = filteredMessages.filter(msg => 
          msg.reactions && msg.reactions.length > 0
        );
      }

      // Sorting
      const sortField = sortBy as string;
      const order = sortOrder as string;
      
      filteredMessages.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'importance':
            aValue = this.estimateMessageImportance(a);
            bValue = this.estimateMessageImportance(b);
            break;
          case 'reactions':
            aValue = a.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
            bValue = b.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
            break;
          case 'username':
            aValue = a.userName;
            bValue = b.userName;
            break;
          case 'channel':
            aValue = a.channelName || '';
            bValue = b.channelName || '';
            break;
          default: // timestamp
            aValue = new Date(a.timestamp).getTime();
            bValue = new Date(b.timestamp).getTime();
        }
        
        if (typeof aValue === 'string') {
          return order === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        } else {
          return order === 'desc' ? bValue - aValue : aValue - bValue;
        }
      });

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
        message: `Retrieved ${paginatedMessages.length} messages from Slack`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Infer squad from channel name
   */
  private inferSquadFromChannel(channelName: string): string {
    const name = channelName.toLowerCase();
    
    if (name.includes('voice') || name.includes('ai')) return 'voice-ai';
    if (name.includes('rcm') || name.includes('epic')) return 'core-rcm';
    if (name.includes('hitl')) return 'hitl';
    if (name.includes('portal')) return 'portal-aggregator';
    if (name.includes('thoughthub')) return 'thoughthub';
    if (name.includes('nox')) return 'nox-health';
    if (name.includes('orthofi')) return 'orthofi';
    if (name.includes('biowound')) return 'biowound';
    if (name.includes('legent')) return 'legent';
    
    return 'general';
  }

  /**
   * Estimate message importance (simplified version)
   */
  private estimateMessageImportance(message: Message): number {
    let importance = 0.3; // Base importance
    
    // Factor in reactions
    if (message.reactions && message.reactions.length > 0) {
      const totalReactions = message.reactions.reduce((sum, r) => sum + r.count, 0);
      importance += Math.min(totalReactions * 0.1, 0.3);
    }
    
    // Factor in message length
    const wordCount = message.text.split(' ').length;
    if (wordCount > 50) importance += 0.1;
    if (wordCount > 100) importance += 0.1;
    
    // Factor in keywords
    const importantKeywords = [
      'urgent', 'critical', 'issue', 'bug', 'deployment', 'release',
      'decision', 'announcement', 'milestone', 'launch'
    ];
    
    const messageText = message.text.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => 
      messageText.includes(keyword)
    ).length;
    
    importance += Math.min(keywordMatches * 0.05, 0.2);
    
    return Math.min(importance, 1);
  }
}
