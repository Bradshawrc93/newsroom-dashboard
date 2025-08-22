import { messageStorage, tagStorage } from '../utils/storage';
import { CustomError } from '../types';

export interface TagCorrection {
  messageId: string;
  originalTags: string[];
  correctedTags: string[];
  userId?: string;
  timestamp: Date;
  feedback: 'positive' | 'negative' | 'correction';
  confidence: number;
}

export interface LearningMetrics {
  totalCorrections: number;
  accuracyImprovement: number;
  mostCorrectedTags: Array<{ tag: string; corrections: number }>;
  userFeedbackStats: {
    positive: number;
    negative: number;
    corrections: number;
  };
}

export class LearningService {
  private corrections: TagCorrection[] = [];

  constructor() {
    this.loadCorrections();
  }

  /**
   * Record a tag correction from user feedback
   */
  async recordTagCorrection(
    messageId: string,
    originalTags: string[],
    correctedTags: string[],
    userId?: string
  ): Promise<void> {
    try {
      const correction: TagCorrection = {
        messageId,
        originalTags,
        correctedTags,
        userId,
        timestamp: new Date(),
        feedback: 'correction',
        confidence: 0.8 // User corrections are highly confident
      };

      this.corrections.push(correction);
      await this.saveCorrections();

      // Update tag confidence scores based on correction
      await this.updateTagConfidenceScores(originalTags, correctedTags);

      console.log('Tag correction recorded:', correction);
    } catch (error) {
      console.error('Error recording tag correction:', error);
      throw new CustomError('Failed to record tag correction', 500);
    }
  }

  /**
   * Record positive or negative feedback on AI tags
   */
  async recordTagFeedback(
    messageId: string,
    tags: string[],
    feedback: 'positive' | 'negative',
    userId?: string
  ): Promise<void> {
    try {
      const correction: TagCorrection = {
        messageId,
        originalTags: tags,
        correctedTags: tags, // Same tags for feedback
        userId,
        timestamp: new Date(),
        feedback,
        confidence: feedback === 'positive' ? 0.9 : 0.1
      };

      this.corrections.push(correction);
      await this.saveCorrections();

      // Update tag confidence based on feedback
      await this.updateTagConfidenceFromFeedback(tags, feedback);

      console.log('Tag feedback recorded:', correction);
    } catch (error) {
      console.error('Error recording tag feedback:', error);
      throw new CustomError('Failed to record tag feedback', 500);
    }
  }

  /**
   * Get learning metrics and statistics
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const totalCorrections = this.corrections.length;
      
      // Calculate most corrected tags
      const tagCorrectionCounts: Record<string, number> = {};
      this.corrections.forEach(correction => {
        correction.originalTags.forEach(tag => {
          if (!correction.correctedTags.includes(tag)) {
            tagCorrectionCounts[tag] = (tagCorrectionCounts[tag] || 0) + 1;
          }
        });
      });

      const mostCorrectedTags = Object.entries(tagCorrectionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, corrections]) => ({ tag, corrections }));

      // Calculate feedback stats
      const userFeedbackStats = this.corrections.reduce(
        (stats, correction) => {
          if (correction.feedback === 'correction') {
            stats.corrections++;
          } else {
            stats[correction.feedback]++;
          }
          return stats;
        },
        { positive: 0, negative: 0, corrections: 0 }
      );

      // Simple accuracy improvement calculation
      const recentCorrections = this.corrections.filter(
        c => c.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      );
      const accuracyImprovement = recentCorrections.length > 0 
        ? (userFeedbackStats.positive / totalCorrections) * 100 
        : 0;

      return {
        totalCorrections,
        accuracyImprovement,
        mostCorrectedTags,
        userFeedbackStats
      };
    } catch (error) {
      console.error('Error getting learning metrics:', error);
      throw new CustomError('Failed to get learning metrics', 500);
    }
  }

  /**
   * Get tag suggestions based on learning history
   */
  async getImprovedTagSuggestions(
    messageText: string,
    channelName: string,
    originalSuggestions: string[]
  ): Promise<string[]> {
    try {
      // For now, return original suggestions
      // In a more advanced system, this would use ML models trained on corrections
      let improvedSuggestions = [...originalSuggestions];

      // Simple rule-based improvements based on historical corrections
      const tagData = await tagStorage.read();
      
      // Filter out frequently corrected tags with low confidence
      improvedSuggestions = improvedSuggestions.filter(tag => {
        const tagInfo = tagData.tags.find(t => t.name === tag);
        return !tagInfo || tagInfo.confidence > 0.3;
      });

      // Add commonly used tags for similar contexts
      const contextualTags = this.getContextualTags(messageText, channelName);
      contextualTags.forEach(tag => {
        if (!improvedSuggestions.includes(tag)) {
          improvedSuggestions.push(tag);
        }
      });

      return improvedSuggestions;
    } catch (error) {
      console.error('Error getting improved tag suggestions:', error);
      return originalSuggestions; // Fallback to original
    }
  }

  /**
   * Update tag confidence scores based on corrections
   */
  private async updateTagConfidenceScores(
    originalTags: string[],
    correctedTags: string[]
  ): Promise<void> {
    try {
      const tagData = await tagStorage.read();

      // Decrease confidence for removed tags
      originalTags.forEach(tagName => {
        if (!correctedTags.includes(tagName)) {
          const tag = tagData.tags.find(t => t.name === tagName);
          if (tag) {
            tag.confidence = Math.max(0.1, tag.confidence * 0.9); // Decrease confidence
            tag.updatedAt = new Date();
          }
        }
      });

      // Increase confidence for added/kept tags
      correctedTags.forEach(tagName => {
        const tag = tagData.tags.find(t => t.name === tagName);
        if (tag) {
          if (originalTags.includes(tagName)) {
            // Tag was kept - increase confidence slightly
            tag.confidence = Math.min(1.0, tag.confidence * 1.1);
          } else {
            // Tag was added - create or increase confidence
            tag.confidence = Math.min(1.0, (tag.confidence || 0.5) * 1.2);
          }
          tag.updatedAt = new Date();
        }
      });

      await tagStorage.write(tagData);
    } catch (error) {
      console.error('Error updating tag confidence scores:', error);
    }
  }

  /**
   * Update tag confidence based on positive/negative feedback
   */
  private async updateTagConfidenceFromFeedback(
    tags: string[],
    feedback: 'positive' | 'negative'
  ): Promise<void> {
    try {
      const tagData = await tagStorage.read();
      const multiplier = feedback === 'positive' ? 1.05 : 0.95;

      tags.forEach(tagName => {
        const tag = tagData.tags.find(t => t.name === tagName);
        if (tag) {
          tag.confidence = Math.min(1.0, Math.max(0.1, tag.confidence * multiplier));
          tag.updatedAt = new Date();
        }
      });

      await tagStorage.write(tagData);
    } catch (error) {
      console.error('Error updating tag confidence from feedback:', error);
    }
  }

  /**
   * Get contextual tags based on message content and channel
   */
  private getContextualTags(messageText: string, channelName: string): string[] {
    const contextualTags: string[] = [];
    const text = messageText.toLowerCase();
    const channel = channelName.toLowerCase();

    // Channel-based tags
    if (channel.includes('deployment') || text.includes('deploy')) {
      contextualTags.push('deployment');
    }
    if (channel.includes('bug') || text.includes('bug') || text.includes('issue')) {
      contextualTags.push('bug-fix');
    }
    if (text.includes('release') || text.includes('launch')) {
      contextualTags.push('release');
    }
    if (text.includes('urgent') || text.includes('critical')) {
      contextualTags.push('urgent');
    }

    return contextualTags;
  }

  /**
   * Load corrections from storage
   */
  private async loadCorrections(): Promise<void> {
    try {
      // In a real implementation, this would load from a database or file
      // For now, we'll start with an empty array
      this.corrections = [];
    } catch (error) {
      console.error('Error loading corrections:', error);
      this.corrections = [];
    }
  }

  /**
   * Save corrections to storage
   */
  private async saveCorrections(): Promise<void> {
    try {
      // In a real implementation, this would save to a database or file
      // For now, we just keep them in memory
      console.log(`Saved ${this.corrections.length} tag corrections`);
    } catch (error) {
      console.error('Error saving corrections:', error);
    }
  }

  /**
   * Get recent corrections for analysis
   */
  async getRecentCorrections(limit = 50): Promise<TagCorrection[]> {
    return this.corrections
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
