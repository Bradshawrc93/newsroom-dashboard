import { Request, Response, NextFunction } from 'express';
import { LearningService } from '../services/learningService';
import { ApiResponse, CustomError } from '../types';

export class LearningController {
  private learningService: LearningService;

  constructor() {
    this.learningService = new LearningService();
  }

  /**
   * Record tag correction from user
   */
  recordTagCorrection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId, originalTags, correctedTags, userId } = req.body;

      if (!messageId || !Array.isArray(originalTags) || !Array.isArray(correctedTags)) {
        throw new CustomError('messageId, originalTags, and correctedTags are required', 400);
      }

      await this.learningService.recordTagCorrection(
        messageId,
        originalTags,
        correctedTags,
        userId
      );

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success: true },
        message: 'Tag correction recorded successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record tag feedback (positive/negative)
   */
  recordTagFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageId, tags, feedback, userId } = req.body;

      if (!messageId || !Array.isArray(tags) || !['positive', 'negative'].includes(feedback)) {
        throw new CustomError('messageId, tags, and feedback (positive/negative) are required', 400);
      }

      await this.learningService.recordTagFeedback(messageId, tags, feedback, userId);

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success: true },
        message: 'Tag feedback recorded successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get learning metrics and statistics
   */
  getLearningMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await this.learningService.getLearningMetrics();

      const response: ApiResponse<any> = {
        success: true,
        data: metrics,
        message: 'Learning metrics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent corrections for review
   */
  getRecentCorrections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 50 } = req.query;
      const corrections = await this.learningService.getRecentCorrections(Number(limit));

      const response: ApiResponse<any[]> = {
        success: true,
        data: corrections,
        message: `Retrieved ${corrections.length} recent corrections`
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get improved tag suggestions based on learning
   */
  getImprovedTagSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messageText, channelName, originalSuggestions } = req.body;

      if (!messageText || !channelName || !Array.isArray(originalSuggestions)) {
        throw new CustomError('messageText, channelName, and originalSuggestions are required', 400);
      }

      const improvedSuggestions = await this.learningService.getImprovedTagSuggestions(
        messageText,
        channelName,
        originalSuggestions
      );

      const response: ApiResponse<{ suggestions: string[] }> = {
        success: true,
        data: { suggestions: improvedSuggestions },
        message: 'Improved tag suggestions generated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
