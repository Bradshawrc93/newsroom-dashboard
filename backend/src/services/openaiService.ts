import OpenAI from 'openai';
import { 
  Message, 
  OpenAISummaryRequest, 
  OpenAISummaryResponse,
  Summary,
  SentimentType
} from '../types';
import { cacheStorage } from '../utils/storage';
import { CustomError } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate summary for a collection of messages
   */
  async generateSummary(request: OpenAISummaryRequest): Promise<OpenAISummaryResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const messages = request.messages;
      if (messages.length === 0) {
        return {
          summary: 'No messages found for the specified time period.',
          greeting: request.includeGreeting ? this.generateDefaultGreeting() : undefined,
          keyTopics: [],
          sentiment: 'neutral',
          highlights: [],
          tokensUsed: 0,
        };
      }

      // Prepare messages for OpenAI
      const messageTexts = messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.text}`
      ).join('\n\n');

      const prompt = this.buildSummaryPrompt(messageTexts, request.date, request.includeGreeting);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that summarizes Slack conversations for product operations managers. Provide concise, actionable insights with a professional tone.'
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: request.maxTokens || 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new CustomError('No response from OpenAI', 500);
      }

      // Parse the response
      const parsedResponse = this.parseSummaryResponse(response, request.includeGreeting);
      
      // Cache the result
      await this.cacheResult(cacheKey, parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error('OpenAI summary generation error:', error);
      throw new CustomError(
        error instanceof Error ? error.message : 'Failed to generate summary',
        500
      );
    }
  }

  /**
   * Generate importance score for a message
   */
  async calculateMessageImportance(message: Message): Promise<number> {
    try {
      const prompt = `Rate the importance of this Slack message on a scale of 0-1, where 0 is not important and 1 is critical. Consider factors like urgency, business impact, and team relevance.

Message: "${message.text}"
Channel: ${message.channelId}
User: ${message.userId}
Reactions: ${message.reactions.length}
Thread: ${message.threadId ? 'Yes' : 'No'}

Respond with only a number between 0 and 1.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that rates message importance. Respond with only a number between 0 and 1.'
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return message.importance || 0.5;
      }

      const importance = parseFloat(response.trim());
      return isNaN(importance) ? (message.importance || 0.5) : Math.max(0, Math.min(1, importance));
    } catch (error) {
      console.error('Error calculating message importance:', error);
      return message.importance || 0.5;
    }
  }

  /**
   * Extract key topics from messages
   */
  async extractKeyTopics(messages: Message[]): Promise<string[]> {
    try {
      const messageTexts = messages.map(msg => msg.text).join('\n');
      
      const prompt = `Extract 5-10 key topics from these Slack messages. Focus on business-relevant topics, technical issues, decisions, and action items. Return as a JSON array of strings.

Messages:
${messageTexts}

Respond with only a valid JSON array.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You extract key topics from messages. Respond with only a valid JSON array of strings.'
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: 200,
        temperature: 0.2,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      try {
        const topics = JSON.parse(response);
        return Array.isArray(topics) ? topics.slice(0, 10) : [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error extracting key topics:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment of messages
   */
  async analyzeSentiment(messages: Message[]): Promise<SentimentType> {
    try {
      const messageTexts = messages.map(msg => msg.text).join('\n');
      
      const prompt = `Analyze the overall sentiment of these Slack messages. Classify as "positive", "neutral", or "negative".

Messages:
${messageTexts}

Respond with only one word: positive, neutral, or negative.`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You analyze sentiment. Respond with only one word: positive, neutral, or negative.'
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content?.toLowerCase();
      if (!response) {
        return 'neutral';
      }

      if (response.includes('positive')) return 'positive';
      if (response.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return 'neutral';
    }
  }

  /**
   * Generate morning greeting
   */
  async generateMorningGreeting(date: string): Promise<string> {
    try {
      const prompt = `Generate a friendly, professional morning greeting for a product operations manager. Include the date and a brief motivational message. Keep it under 100 words.

Date: ${date}

Example format:
"Good morning! It's [date]. Here's your daily rundown of yesterday's Slack activity. Let's make today productive! 🚀"`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You generate morning greetings. Keep responses friendly and professional.'
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || this.generateDefaultGreeting();
    } catch (error) {
      console.error('Error generating morning greeting:', error);
      return this.generateDefaultGreeting();
    }
  }

  /**
   * Build the summary prompt
   */
  private buildSummaryPrompt(messageTexts: string, date: string, includeGreeting?: boolean): string {
    return `Summarize the following Slack messages from ${date}. 

${includeGreeting ? 'Include a morning greeting at the beginning.' : ''}

Provide:
1. A concise summary of key discussions and decisions
2. Important action items and follow-ups needed
3. Any urgent issues or blockers mentioned
4. Team collaboration highlights
5. Technical or business insights

Messages:
${messageTexts}

Format your response as:
${includeGreeting ? 'GREETING: [morning greeting]\n\n' : ''}SUMMARY: [main summary]

KEY_TOPICS: [comma-separated list of key topics]

SENTIMENT: [positive/neutral/negative]

HIGHLIGHTS: [bullet points of important items]

Keep the summary professional and actionable for a product operations manager.`;
  }

  /**
   * Parse the summary response from OpenAI
   */
  private parseSummaryResponse(response: string, includeGreeting?: boolean): OpenAISummaryResponse {
    const lines = response.split('\n');
    let greeting: string | undefined;
    let summary = '';
    let keyTopics: string[] = [];
    let sentiment: SentimentType = 'neutral';
    let highlights: string[] = [];

    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('GREETING:')) {
        greeting = trimmedLine.replace('GREETING:', '').trim();
        currentSection = 'greeting';
      } else if (trimmedLine.startsWith('SUMMARY:')) {
        currentSection = 'summary';
        summary = trimmedLine.replace('SUMMARY:', '').trim();
      } else if (trimmedLine.startsWith('KEY_TOPICS:')) {
        currentSection = 'topics';
        const topics = trimmedLine.replace('KEY_TOPICS:', '').trim();
        keyTopics = topics.split(',').map(t => t.trim()).filter(t => t);
      } else if (trimmedLine.startsWith('SENTIMENT:')) {
        const sentimentText = trimmedLine.replace('SENTIMENT:', '').trim().toLowerCase();
        if (sentimentText.includes('positive')) sentiment = 'positive';
        else if (sentimentText.includes('negative')) sentiment = 'negative';
        else sentiment = 'neutral';
      } else if (trimmedLine.startsWith('HIGHLIGHTS:')) {
        currentSection = 'highlights';
      } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        if (currentSection === 'highlights') {
          highlights.push(trimmedLine.replace(/^[-•]\s*/, '').trim());
        }
      } else if (trimmedLine && currentSection === 'summary') {
        summary += ' ' + trimmedLine;
      }
    }

    // Generate greeting if not provided but requested
    if (includeGreeting && !greeting) {
      greeting = this.generateDefaultGreeting();
    }

    return {
      summary: summary || 'No significant activity found.',
      greeting,
      keyTopics: keyTopics.length > 0 ? keyTopics : ['general discussion'],
      sentiment,
      highlights: highlights.length > 0 ? highlights : ['Review messages for details'],
      tokensUsed: response.length / 4, // Rough estimate
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: OpenAISummaryRequest): string {
    const messageIds = request.messages.map(m => m.id).sort();
    return `summary_${request.date}_${messageIds.join('_')}_${request.includeGreeting}`;
  }

  /**
   * Get result from cache
   */
  private async getFromCache(key: string): Promise<OpenAISummaryResponse | null> {
    try {
      const cacheData = await cacheStorage.read();
      const cached = cacheData.cache[key];
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        // Cache for 24 hours
        if (age < 24 * 60 * 60 * 1000) {
          return cached.data;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache result
   */
  private async cacheResult(key: string, data: OpenAISummaryResponse): Promise<void> {
    try {
      await cacheStorage.update(cacheData => {
        cacheData.cache[key] = {
          data,
          timestamp: Date.now(),
        };
        cacheData.lastUpdated = new Date().toISOString();
        return cacheData;
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Generate default greeting
   */
  private generateDefaultGreeting(): string {
    const greetings = [
      "Good morning! Here's your daily rundown of yesterday's Slack activity. Let's make today productive! 🚀",
      "Rise and shine! Here's what happened in your Slack channels yesterday. Ready to tackle today? 💪",
      "Good morning! Your Slack summary is ready. Let's dive into yesterday's key discussions and decisions. 📊",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{ tokensUsed: number; requestsMade: number }> {
    try {
      const cacheData = await cacheStorage.read();
      let tokensUsed = 0;
      let requestsMade = 0;

      Object.values(cacheData.cache).forEach((item: any) => {
        if (item.data && item.data.tokensUsed) {
          tokensUsed += item.data.tokensUsed;
          requestsMade++;
        }
      });

      return { tokensUsed, requestsMade };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { tokensUsed: 0, requestsMade: 0 };
    }
  }
}
