import { OpenAIService, SummaryRequest, SummaryResponse } from './openaiService';
import { TaggingService, TagAnalysisResult } from './taggingService';
import { SlackService } from './slackService';
import { Message, CustomError } from '../types';
import { messageStorage } from '../utils/storage';

export interface AIAnalysisResult {
  messageId: string;
  tags: string[];
  importance: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  processingTime: number;
  confidence: number;
}

export interface DailySummaryResult {
  date: Date;
  summary: SummaryResponse;
  messageCount: number;
  squadsAnalyzed: string[];
  generatedAt: Date;
}

export class AIService {
  private openaiService: OpenAIService;
  private taggingService: TaggingService;

  constructor() {
    this.openaiService = new OpenAIService();
    this.taggingService = new TaggingService();
  }

  /**
   * Perform complete AI analysis on a message (tagging + importance scoring)
   */
  async analyzeMessage(message: Message): Promise<AIAnalysisResult> {
    try {
      const result = await this.taggingService.analyzeMessage(message);
      
      // Extract tag names for easier consumption
      const tagNames = result.tags.map(tag => `tag-${tag.tagId}`); // Will need to resolve tag names
      
      // Calculate overall confidence from tag confidences
      const avgConfidence = result.tags.length > 0 
        ? result.tags.reduce((sum, tag) => sum + tag.confidence, 0) / result.tags.length
        : 0.5;

      return {
        messageId: message.id,
        tags: tagNames,
        importance: result.importanceScore,
        urgencyLevel: result.urgencyLevel,
        processingTime: result.processingTime,
        confidence: avgConfidence
      };
    } catch (error) {
      console.error('Error in AI message analysis:', error);
      throw new CustomError('Failed to analyze message with AI', 500);
    }
  }

  /**
   * Batch analyze multiple messages
   */
  async analyzeMessages(messages: Message[]): Promise<AIAnalysisResult[]> {
    console.log(`Starting AI analysis of ${messages.length} messages...`);
    
    try {
      const tagResults = await this.taggingService.analyzeMessages(messages);
      
      // Convert to AIAnalysisResult format
      const results = tagResults.map(result => ({
        messageId: result.messageId,
        tags: result.tags.map(tag => `tag-${tag.tagId}`),
        importance: result.importanceScore,
        urgencyLevel: result.urgencyLevel,
        processingTime: result.processingTime,
        confidence: result.tags.length > 0 
          ? result.tags.reduce((sum, tag) => sum + tag.confidence, 0) / result.tags.length
          : 0.5
      }));

      console.log(`Completed AI analysis of ${results.length} messages`);
      return results;
    } catch (error) {
      console.error('Error in batch AI analysis:', error);
      throw new CustomError('Failed to analyze messages with AI', 500);
    }
  }

  /**
   * Generate a daily summary from messages
   */
  async generateDailySummary(
    date: Date,
    messages?: Message[]
  ): Promise<DailySummaryResult> {
    try {
      let messagesToAnalyze = messages;
      
      // If no messages provided, fetch ALL messages for the date (including threads)
      if (!messagesToAnalyze) {
        messagesToAnalyze = await this.getMessagesWithThreadsForDate(date);
      }

      if (messagesToAnalyze.length === 0) {
        throw new CustomError('No messages found for the specified date', 404);
      }

      // Group messages by squad
      const messagesBySquad = this.groupMessagesBySquad(messagesToAnalyze);
      const squadsAnalyzed = Object.keys(messagesBySquad);

      // Prepare request for OpenAI
      const summaryRequest: SummaryRequest = {
        messages: messagesToAnalyze.map(msg => ({
          id: msg.id,
          text: msg.text,
          channelName: msg.channelName || 'unknown',
          userName: msg.userName || 'unknown',
          timestamp: new Date(msg.timestamp),
          squad: this.inferSquadFromChannel(msg.channelName || ''),
          importance: this.estimateImportance(msg)
        })),
        dateRange: {
          start: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          end: date
        },
        squads: squadsAnalyzed
      };

      // Generate summary using OpenAI
      const summary = await this.openaiService.generateDailySummary(summaryRequest);

      return {
        date,
        summary,
        messageCount: messagesToAnalyze.length,
        squadsAnalyzed,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to generate daily summary', 500);
    }
  }

  /**
   * Get messages for a date range
   */
  /**
   * Get messages with threaded replies for a specific date using real Slack data
   */
  private async getMessagesWithThreadsForDate(date: Date): Promise<Message[]> {
    try {
      // Use the Slack service to get real messages (not just stored mock data)
      const slackService = new SlackService();
      
      // Get all messages for the date from all channels
      const allMessages: Message[] = [];
      
      try {
        // Fetch from Slack API for the specific date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        // Get messages from Slack from all channels (this will include threads)
        const channels = await slackService.getChannels();
        const slackMessages: Message[] = [];
        
        // Fetch messages from each channel for the date
        for (const channel of channels.slice(0, 10)) { // Limit to prevent timeout
          try {
            const channelMessages = await slackService.getChannelMessages(
              channel.id,
              startDate,
              endDate
            );
            slackMessages.push(...channelMessages);
          } catch (error) {
            console.warn(`Failed to fetch messages from channel ${channel.name}:`, error);
          }
        }
        
        allMessages.push(...slackMessages);
        console.log(`Fetched ${slackMessages.length} messages from Slack for ${date.toDateString()}`);
        
      } catch (slackError) {
        console.warn('Failed to fetch from Slack, falling back to stored data:', slackError);
        
        // Fallback to stored data if Slack API fails
        const messageData = await messageStorage.read();
        const filteredMessages = messageData.messages.filter(message => {
          const messageDate = new Date(message.timestamp);
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          return messageDate >= startDate && messageDate <= endDate;
        });
        
        allMessages.push(...filteredMessages);
        console.log(`Using ${filteredMessages.length} stored messages for ${date.toDateString()}`);
      }
      
      return allMessages;
    } catch (error) {
      console.error('Error fetching messages with threads for date:', error);
      return [];
    }
  }

  private async getMessagesForDateRange(startDate: Date, endDate: Date): Promise<Message[]> {
    try {
      const messageData = await messageStorage.read();
      
      return messageData.messages.filter(message => {
        const messageDate = new Date(message.timestamp);
        return messageDate >= startDate && messageDate <= endDate;
      });
    } catch (error) {
      console.error('Error fetching messages for date range:', error);
      return [];
    }
  }

  /**
   * Group messages by squad for better organization
   */
  private groupMessagesBySquad(messages: Message[]): Record<string, Message[]> {
    const grouped: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      const squad = this.inferSquadFromChannel(message.channelName || '');
      if (!grouped[squad]) {
        grouped[squad] = [];
      }
      grouped[squad].push(message);
    });

    return grouped;
  }

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
   * Estimate message importance (simplified version for summaries)
   */
  private estimateImportance(message: Message): number {
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

  /**
   * Test AI services connection
   */
  async testConnection(): Promise<{
    openai: boolean;
    overall: boolean;
  }> {
    try {
      const openaiTest = await this.openaiService.testConnection();
      
      return {
        openai: openaiTest,
        overall: openaiTest
      };
    } catch (error) {
      console.error('AI service connection test failed:', error);
      return {
        openai: false,
        overall: false
      };
    }
  }

  /**
   * Get AI processing statistics
   */
  async getProcessingStats(): Promise<{
    tagging: any;
    totalProcessed: number;
    averageProcessingTime: number;
  }> {
    try {
      const tagStats = await this.taggingService.getTagStatistics();
      
      return {
        tagging: tagStats,
        totalProcessed: tagStats.totalTags, // Approximate
        averageProcessingTime: 1500 // Placeholder - would track this in production
      };
    } catch (error) {
      console.error('Error getting AI processing stats:', error);
      return {
        tagging: { totalTags: 0, mostUsedTags: [], tagsByCategory: {} },
        totalProcessed: 0,
        averageProcessingTime: 0
      };
    }
  }
}
