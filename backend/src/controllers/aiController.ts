import { Request, Response, NextFunction } from 'express';
import { AIService, AIAnalysisResult, DailySummaryResult } from '../services/aiService';
import { messageStorage, summaryStorage } from '../utils/storage';
import { ApiResponse, CustomError, Message } from '../types';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Analyze a single message with AI
   */
  analyzeMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId } = req.params;
      
      if (!messageId) {
        throw new CustomError('Message ID is required', 400);
      }

      // Find the message
      const messageData = await messageStorage.read();
      const message = messageData.messages.find(m => m.id === messageId);
      
      if (!message) {
        throw new CustomError('Message not found', 404);
      }

      // Analyze with AI
      const analysis = await this.aiService.analyzeMessage(message);

      const response: ApiResponse<AIAnalysisResult> = {
        success: true,
        data: analysis,
        message: 'Message analyzed successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Batch analyze multiple messages
   */
  analyzeMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        messageIds,
        channelId,
        startDate,
        endDate,
        limit = 50 
      } = req.body;

      let messagesToAnalyze: Message[] = [];
      const messageData = await messageStorage.read();

      if (messageIds && Array.isArray(messageIds)) {
        // Analyze specific messages
        messagesToAnalyze = messageData.messages.filter(m => messageIds.includes(m.id));
      } else {
        // Analyze messages based on filters
        let filteredMessages = messageData.messages;

        if (channelId) {
          filteredMessages = filteredMessages.filter(m => m.channelId === channelId);
        }

        if (startDate) {
          const start = new Date(startDate);
          filteredMessages = filteredMessages.filter(m => new Date(m.timestamp) >= start);
        }

        if (endDate) {
          const end = new Date(endDate);
          filteredMessages = filteredMessages.filter(m => new Date(m.timestamp) <= end);
        }

        // Sort by timestamp (newest first) and limit
        filteredMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        messagesToAnalyze = filteredMessages.slice(0, limit);
      }

      if (messagesToAnalyze.length === 0) {
        throw new CustomError('No messages found to analyze', 404);
      }

      // Batch analyze
      const analyses = await this.aiService.analyzeMessages(messagesToAnalyze);

      const response: ApiResponse<{
        analyses: AIAnalysisResult[];
        totalAnalyzed: number;
        averageConfidence: number;
        processingTime: number;
      }> = {
        success: true,
        data: {
          analyses,
          totalAnalyzed: analyses.length,
          averageConfidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
          processingTime: analyses.reduce((sum, a) => sum + a.processingTime, 0)
        },
        message: `Successfully analyzed ${analyses.length} messages`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate daily summary
   */
  generateDailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.params;
      const { forceRegenerate = false } = req.query;
      
      if (!date) {
        throw new CustomError('Date is required', 400);
      }

      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new CustomError('Invalid date format', 400);
      }

      // Check if summary already exists (unless forcing regeneration)
      if (!forceRegenerate) {
        const summaryData = await summaryStorage.read();
        const existingSummary = summaryData.summaries.find(s => 
          new Date(s.date).toDateString() === targetDate.toDateString()
        );

        if (existingSummary) {
          const response: ApiResponse<any> = {
            success: true,
            data: existingSummary,
            message: 'Daily summary retrieved from cache'
          };
          res.status(200).json(response);
          return;
        }
      }

      // Generate new summary
      const summaryResult = await this.aiService.generateDailySummary(targetDate);

      // Save summary to storage
      const summaryData = await summaryStorage.read();
      
      // Remove existing summary for this date if it exists
      summaryData.summaries = summaryData.summaries.filter(s => 
        new Date(s.date).toDateString() !== targetDate.toDateString()
      );

      // Add new summary
      summaryData.summaries.push({
        id: `summary-${targetDate.toISOString().split('T')[0]}`,
        date: targetDate,
        content: summaryResult.summary.executiveSummary,
        keyPoints: summaryResult.summary.keyDevelopments,
        actionItems: summaryResult.summary.actionItems,
        messageCount: summaryResult.messageCount,
        squads: summaryResult.squadsAnalyzed,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await summaryStorage.write(summaryData);

      const response: ApiResponse<DailySummaryResult> = {
        success: true,
        data: summaryResult,
        message: 'Daily summary generated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get daily summary by date
   */
  getDailySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.params;
      
      if (!date) {
        throw new CustomError('Date is required', 400);
      }

      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new CustomError('Invalid date format', 400);
      }

      const summaryData = await summaryStorage.read();
      const summary = summaryData.summaries.find(s => 
        new Date(s.date).toDateString() === targetDate.toDateString()
      );

      if (!summary) {
        throw new CustomError('Summary not found for the specified date', 404);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: summary,
        message: 'Daily summary retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent summaries
   */
  getRecentSummaries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 7 } = req.query;
      
      const summaryData = await summaryStorage.read();
      
      // Sort by date (newest first) and limit
      const recentSummaries = summaryData.summaries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, Number(limit));

      const response: ApiResponse<any[]> = {
        success: true,
        data: recentSummaries,
        message: `Retrieved ${recentSummaries.length} recent summaries`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test AI services connection
   */
  testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connectionTest = await this.aiService.testConnection();

      const response: ApiResponse<any> = {
        success: connectionTest.overall,
        data: connectionTest,
        message: connectionTest.overall 
          ? 'AI services are connected and working'
          : 'Some AI services are not responding'
      };

      res.status(connectionTest.overall ? 200 : 503).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get AI processing statistics
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.aiService.getProcessingStats();

      const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: 'AI processing statistics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
