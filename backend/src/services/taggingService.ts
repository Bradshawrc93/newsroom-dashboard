import { OpenAIService, TagSuggestion } from './openaiService';
import { messageStorage, tagStorage } from '../utils/storage';
import { Message, Tag, MessageTag, CustomError } from '../types';
import { getChannelById } from '../config/channels';

export interface TagAnalysisResult {
  messageId: string;
  tags: MessageTag[];
  importanceScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  processingTime: number;
}

export class TaggingService {
  private openaiService: OpenAIService;

  constructor() {
    this.openaiService = new OpenAIService();
  }

  /**
   * Analyze a message and assign tags with importance scoring
   */
  async analyzeMessage(message: Message): Promise<TagAnalysisResult> {
    const startTime = Date.now();

    try {
      // Get squad context for better tagging
      const squadContext = this.getSquadContext(message.channelId);
      
      // Use OpenAI to analyze the message
      const aiResponse = await this.openaiService.analyzeMessage(
        message.text,
        message.channelName || 'unknown',
        message.userName || 'unknown',
        squadContext
      );

      // Convert AI suggestions to MessageTags
      const messageTags = await this.convertSuggestionsToMessageTags(
        message.id,
        aiResponse.suggestions
      );

      // Calculate importance score
      const importanceScore = this.calculateImportanceScore(message, aiResponse.suggestions);

      // Update tag usage statistics
      await this.updateTagUsageStats(messageTags);

      const processingTime = Date.now() - startTime;

      return {
        messageId: message.id,
        tags: messageTags,
        importanceScore,
        urgencyLevel: aiResponse.urgencyLevel,
        processingTime
      };
    } catch (error) {
      console.error('Error analyzing message:', error);
      
      // Return fallback result
      return {
        messageId: message.id,
        tags: [],
        importanceScore: 0.3, // Default low importance
        urgencyLevel: 'low',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Batch analyze multiple messages
   */
  async analyzeMessages(messages: Message[]): Promise<TagAnalysisResult[]> {
    console.log(`Starting batch analysis of ${messages.length} messages...`);
    
    const results: TagAnalysisResult[] = [];
    const batchSize = 5; // Process in small batches to avoid rate limits
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(messages.length/batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(message => this.analyzeMessage(message));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Collect successful results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to analyze message ${batch[index].id}:`, result.reason);
          // Add fallback result
          results.push({
            messageId: batch[index].id,
            tags: [],
            importanceScore: 0.3,
            urgencyLevel: 'low',
            processingTime: 0
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Completed batch analysis. Processed ${results.length}/${messages.length} messages.`);
    return results;
  }

  /**
   * Get squad context for a channel to improve tagging accuracy
   */
  private getSquadContext(channelId: string): string[] {
    const channel = getChannelById(channelId);
    if (!channel) {
      return ['general'];
    }

    // Return relevant squads based on channel configuration
    const squads = [channel.squad || 'general'];
    
    // Add related squads based on channel name patterns
    const channelName = channel.name.toLowerCase();
    if (channelName.includes('voice') || channelName.includes('ai')) {
      squads.push('voice-ai');
    }
    if (channelName.includes('rcm') || channelName.includes('epic')) {
      squads.push('core-rcm', 'epic');
    }
    if (channelName.includes('hitl')) {
      squads.push('hitl');
    }
    if (channelName.includes('portal')) {
      squads.push('portal-aggregator');
    }

    return [...new Set(squads)];
  }

  /**
   * Convert OpenAI tag suggestions to MessageTag objects
   */
  private async convertSuggestionsToMessageTags(
    messageId: string,
    suggestions: TagSuggestion[]
  ): Promise<MessageTag[]> {
    const messageTags: MessageTag[] = [];
    const tagData = await tagStorage.read();

    for (const suggestion of suggestions) {
      // Find or create tag
      let tag = tagData.tags.find(t => t.name === suggestion.tag);
      
      if (!tag) {
        // Create new tag
        tag = {
          id: tagData.tags.length + 1,
          name: suggestion.tag,
          category: suggestion.category,
          confidence: suggestion.confidence,
          usageCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        tagData.tags.push(tag);
      } else {
        // Update existing tag
        tag.usageCount += 1;
        tag.confidence = (tag.confidence + suggestion.confidence) / 2; // Average confidence
        tag.updatedAt = new Date();
      }

      // Create MessageTag association
      messageTags.push({
        messageId,
        tagId: tag.id,
        confidence: suggestion.confidence,
        isManual: false,
        createdAt: new Date()
      });
    }

    // Save updated tag data
    await tagStorage.write(tagData);

    return messageTags;
  }

  /**
   * Calculate importance score based on message content and context
   */
  private calculateImportanceScore(message: Message, suggestions: TagSuggestion[]): number {
    let score = 0.3; // Base score

    // Factor in reactions (emoji count and variety)
    if (message.reactions && message.reactions.length > 0) {
      const totalReactions = message.reactions.reduce((sum, r) => sum + r.count, 0);
      const uniqueReactionTypes = message.reactions.length;
      
      score += Math.min(totalReactions * 0.1, 0.3); // Max 0.3 from reaction count
      score += Math.min(uniqueReactionTypes * 0.05, 0.2); // Max 0.2 from variety
    }

    // Factor in message length (longer messages often more important)
    const wordCount = message.text.split(' ').length;
    if (wordCount > 50) {
      score += 0.1;
    }
    if (wordCount > 100) {
      score += 0.1;
    }

    // Factor in urgency from AI analysis
    const urgencyTag = suggestions.find(s => s.category === 'urgency');
    if (urgencyTag) {
      switch (urgencyTag.tag) {
        case 'critical':
          score += 0.4;
          break;
        case 'urgent':
          score += 0.3;
          break;
        case 'important':
          score += 0.2;
          break;
      }
    }

    // Factor in message type
    const typeTag = suggestions.find(s => s.category === 'type');
    if (typeTag) {
      switch (typeTag.tag) {
        case 'announcement':
        case 'issue':
          score += 0.2;
          break;
        case 'achievement':
        case 'decision':
          score += 0.15;
          break;
        case 'status-update':
          score += 0.1;
          break;
      }
    }

    // Factor in keywords that indicate importance
    const importantKeywords = [
      'deployment', 'release', 'bug', 'critical', 'urgent', 'issue',
      'decision', 'announcement', 'milestone', 'launch', 'problem'
    ];
    
    const messageText = message.text.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => 
      messageText.includes(keyword)
    ).length;
    
    score += Math.min(keywordMatches * 0.05, 0.2);

    // Apply squad multiplier (some squads may be more critical)
    const squadMultiplier = this.getSquadImportanceMultiplier(message.channelId);
    score *= squadMultiplier;

    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Get importance multiplier for different squads
   */
  private getSquadImportanceMultiplier(channelId: string): number {
    const channel = getChannelById(channelId);
    if (!channel) return 1.0;

    const channelName = channel.name.toLowerCase();
    
    // Critical production channels get higher multiplier
    if (channelName.includes('production') || channelName.includes('critical')) {
      return 1.3;
    }
    
    // Core business channels
    if (channelName.includes('epic') || channelName.includes('core-rcm')) {
      return 1.2;
    }
    
    // Development and testing channels
    if (channelName.includes('dev') || channelName.includes('test')) {
      return 0.9;
    }

    return 1.0; // Default multiplier
  }

  /**
   * Update tag usage statistics
   */
  private async updateTagUsageStats(messageTags: MessageTag[]): Promise<void> {
    if (messageTags.length === 0) return;

    try {
      const tagData = await tagStorage.read();
      
      // Update usage counts (already done in convertSuggestionsToMessageTags)
      // This could include additional analytics if needed
      
      await tagStorage.write(tagData);
    } catch (error) {
      console.error('Error updating tag usage stats:', error);
    }
  }

  /**
   * Get tag statistics for analytics
   */
  async getTagStatistics(): Promise<{
    totalTags: number;
    mostUsedTags: Array<{ name: string; usage: number; category: string }>;
    tagsByCategory: Record<string, number>;
  }> {
    try {
      const tagData = await tagStorage.read();
      
      const mostUsedTags = tagData.tags
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
        .map(tag => ({
          name: tag.name,
          usage: tag.usageCount,
          category: tag.category
        }));

      const tagsByCategory = tagData.tags.reduce((acc, tag) => {
        acc[tag.category] = (acc[tag.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalTags: tagData.tags.length,
        mostUsedTags,
        tagsByCategory
      };
    } catch (error) {
      console.error('Error getting tag statistics:', error);
      return {
        totalTags: 0,
        mostUsedTags: [],
        tagsByCategory: {}
      };
    }
  }
}
