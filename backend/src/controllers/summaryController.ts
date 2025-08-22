import { Request, Response, NextFunction } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/storage';
import { OpenAIService } from '../services/openaiService';

const openaiService = new OpenAIService();

const SUMMARIES_FILE = 'data/summaries.json';
const MESSAGES_FILE = 'data/messages.json';
const USERS_FILE = 'data/users.json';
const CHANNELS_FILE = 'data/channels.json';

interface Summary {
  id: string
  date: string
  title: string
  content: string
  highlights: string[]
  keyTopics: string[]
  participants: string[]
  channels: string[]
  messageCount: number
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

interface GenerateSummaryRequest {
  date: string
  squad?: string
  channels?: string[]
  includeHighlights?: boolean
  includeKeyTopics?: boolean
}

export const summaryController = {
  /**
   * Get all summaries with optional filtering
   */
  getSummaries: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, squad, limit = 50, offset = 0 } = req.query;

      const data = await readJsonFile(SUMMARIES_FILE) as any;
      let summaries = data.summaries || [];

      // Apply filters
      if (date && typeof date === 'string') {
        summaries = summaries.filter((summary: Summary) => summary.date === date);
      }

      if (squad && typeof squad === 'string') {
        summaries = summaries.filter((summary: Summary) => 
          summary.channels.some(channel => channel.includes(squad))
        );
      }

      // Sort by date (newest first)
      summaries.sort((a: Summary, b: Summary) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply pagination
      const paginatedSummaries = summaries.slice(offset as number, (offset as number) + (limit as number));

      res.status(200).json({
        success: true,
        data: {
          summaries: paginatedSummaries,
          total: summaries.length,
          limit: limit as number,
          offset: offset as number,
        },
        message: `Retrieved ${paginatedSummaries.length} summaries`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate a new summary using OpenAI
   */
  generateSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date, squad, channels, includeHighlights = true, includeKeyTopics = true }: GenerateSummaryRequest = req.body;

      if (!date) {
        res.status(400).json({
          success: false,
          error: 'Date is required',
          message: 'Please provide a date for the summary',
        });
        return;
      }

      // Load data
      const [messagesData, usersData, channelsData] = await Promise.all([
        readJsonFile(MESSAGES_FILE) as any,
        readJsonFile(USERS_FILE) as any,
        readJsonFile(CHANNELS_FILE) as any,
      ]);

      const messages = messagesData.messages || [];
      const users = usersData.users || [];
      const channelsList = channelsData.channels || [];

      // Filter messages for the specified date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      let filteredMessages = messages.filter((msg: any) => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= startOfDay && msgDate < endOfDay;
      });

      // Apply additional filters
      if (squad) {
        filteredMessages = filteredMessages.filter((msg: any) => {
          const user = users.find((u: any) => u.id === msg.userId);
          return user?.squad === squad;
        });
      }

      if (channels && channels.length > 0) {
        filteredMessages = filteredMessages.filter((msg: any) => 
          channels.includes(msg.channelId)
        );
      }

      if (filteredMessages.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No messages found',
          message: `No messages found for ${date}${squad ? ` in squad ${squad}` : ''}`,
        });
        return;
      }

      // Prepare context for OpenAI
      const context = prepareSummaryContext(filteredMessages, users, channelsList, date, squad);

      // Generate summary using OpenAI
      const summaryContent = await openaiService.generateDailySummary(context);

      // Create summary object
      const summary: Summary = {
        id: `summary_${date}_${Date.now()}`,
        date,
        title: `Daily Summary - ${formatDate(date)}${squad ? ` - ${squad}` : ''}`,
        content: summaryContent,
        highlights: includeHighlights ? extractHighlights(filteredMessages) : [],
        keyTopics: includeKeyTopics ? extractKeyTopics(filteredMessages) : [],
        participants: [...new Set(filteredMessages.map((msg: any) => msg.userId))] as string[],
        channels: [...new Set(filteredMessages.map((msg: any) => msg.channelId))] as string[],
        messageCount: filteredMessages.length,
        aiGenerated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save summary
      const summariesData = await readJsonFile(SUMMARIES_FILE) as any;
      summariesData.summaries = summariesData.summaries || [];
      summariesData.summaries.push(summary);
      summariesData.lastUpdated = new Date().toISOString();

      await writeJsonFile(SUMMARIES_FILE, summariesData);

      res.status(201).json({
        success: true,
        data: { summary },
        message: 'Summary generated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get daily summary for a specific date
   */
  getDailySummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { date } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          error: 'Date parameter is required',
          message: 'Please provide a date parameter',
        });
        return;
      }

      const data = await readJsonFile(SUMMARIES_FILE) as any;
      const summaries = data.summaries || [];

      const summary = summaries.find((s: Summary) => s.date === date);

      if (!summary) {
        res.status(404).json({
          success: false,
          error: 'Summary not found',
          message: `No summary found for ${date}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { summary },
        message: 'Daily summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get summary by ID
   */
  getSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const data = await readJsonFile(SUMMARIES_FILE) as any;
      const summaries = data.summaries || [];

      const summary = summaries.find((s: Summary) => s.id === id);

      if (!summary) {
        res.status(404).json({
          success: false,
          error: 'Summary not found',
          message: `Summary with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { summary },
        message: 'Summary retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update summary
   */
  updateSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const data = await readJsonFile(SUMMARIES_FILE) as any;
      const summaries = data.summaries || [];

      const summaryIndex = summaries.findIndex((s: Summary) => s.id === id);

      if (summaryIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Summary not found',
          message: `Summary with ID ${id} not found`,
        });
        return;
      }

      // Update summary
      summaries[summaryIndex] = {
        ...summaries[summaryIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      data.lastUpdated = new Date().toISOString();
      await writeJsonFile(SUMMARIES_FILE, data);

      res.status(200).json({
        success: true,
        data: { summary: summaries[summaryIndex] },
        message: 'Summary updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete summary
   */
  deleteSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const data = await readJsonFile(SUMMARIES_FILE) as any;
      const summaries = data.summaries || [];

      const summaryIndex = summaries.findIndex((s: Summary) => s.id === id);

      if (summaryIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Summary not found',
          message: `Summary with ID ${id} not found`,
        });
        return;
      }

      // Remove summary
      summaries.splice(summaryIndex, 1);

      data.lastUpdated = new Date().toISOString();
      await writeJsonFile(SUMMARIES_FILE, data);

      res.status(200).json({
        success: true,
        message: 'Summary deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Helper function to prepare context for OpenAI
 */
function prepareSummaryContext(messages: any[], users: any[], channels: any[], date: string, squad?: string): string {
  const messageTexts = messages.map(msg => {
    const user = users.find(u => u.id === msg.userId);
    const channel = channels.find(c => c.id === msg.channelId);
    return `[${channel?.name || msg.channelId}] ${user?.name || msg.userId}: ${msg.text}`;
  }).join('\n');

  const context = `
Date: ${date}
${squad ? `Squad: ${squad}` : 'All Squads'}
Total Messages: ${messages.length}
Unique Participants: ${new Set(messages.map(m => m.userId)).size}
Channels: ${new Set(messages.map(m => m.channelId)).size}

Messages:
${messageTexts}

Please provide a comprehensive daily summary of the Slack activity above. Include:
1. Key highlights and important discussions
2. Major decisions or announcements
3. Notable trends or patterns
4. Action items or follow-ups needed
5. Overall team sentiment and engagement

Format the summary in a clear, professional manner suitable for a morning standup or team review.
  `.trim();

  return context;
}

/**
 * Helper function to extract highlights from messages
 */
function extractHighlights(messages: any[]): string[] {
  // Simple highlight extraction based on message importance and reactions
  const highlights = messages
    .filter(msg => (msg.importance && msg.importance > 0.7) || (msg.reactions && msg.reactions.length > 0))
    .map(msg => msg.text)
    .slice(0, 5);

  return highlights;
}

/**
 * Helper function to extract key topics from messages
 */
function extractKeyTopics(messages: any[]): string[] {
  // Extract topics from message tags
  const topics = new Set<string>();
  
  messages.forEach(msg => {
    if (msg.tags && Array.isArray(msg.tags)) {
      msg.tags.forEach((tag: string) => topics.add(tag));
    }
  });

  return Array.from(topics).slice(0, 10);
}

/**
 * Helper function to format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
