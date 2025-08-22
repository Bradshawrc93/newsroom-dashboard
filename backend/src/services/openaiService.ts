import OpenAI from 'openai';
import { CustomError } from '../types';

export interface TagSuggestion {
  tag: string;
  category: 'squad' | 'keyword' | 'urgency' | 'type';
  confidence: number;
  reasoning?: string;
}

export interface TaggingResponse {
  suggestions: TagSuggestion[];
  summary?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SummaryRequest {
  messages: Array<{
    id: string;
    text: string;
    channelName: string;
    userName: string;
    timestamp: Date;
    squad?: string;
    tags?: string[];
    importance?: number;
  }>;
  dateRange: {
    start: Date;
    end: Date;
  };
  squads: string[];
}

export interface SummaryResponse {
  executiveSummary: string;
  keyDevelopments: string[];
  blockingIssues: string[];
  achievements: string[];
  actionItems: string[];
  teamSentiment: 'positive' | 'neutral' | 'concerning';
  activityMetrics: {
    totalMessages: number;
    activeSquads: string[];
    topChannels: string[];
  };
}

export class OpenAIService {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new CustomError('OpenAI API key is required', 500);
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '1000');
  }

  /**
   * Analyze a message and suggest relevant tags
   */
  async analyzeMessage(
    messageText: string,
    channelName: string,
    userName: string,
    squadContext?: string[]
  ): Promise<TaggingResponse> {
    try {
      const prompt = this.buildTaggingPrompt(messageText, channelName, userName, squadContext);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing Slack messages from product teams and assigning relevant tags. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3, // Lower temperature for more consistent tagging
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new CustomError('No response from OpenAI', 500);
      }

      try {
        const response = JSON.parse(content) as TaggingResponse;
        return this.validateTaggingResponse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new CustomError('Invalid response format from OpenAI', 500);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to analyze message with AI', 500);
    }
  }

  /**
   * Generate a daily summary from messages
   */
  async generateDailySummary(request: SummaryRequest): Promise<SummaryResponse> {
    try {
      const prompt = this.buildSummaryPrompt(request);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an executive assistant creating daily summaries for a product operations manager. Focus on actionable insights and key developments. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000, // Longer for summaries
        temperature: 0.4,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new CustomError('No response from OpenAI', 500);
      }

      try {
        const response = JSON.parse(content) as SummaryResponse;
        return this.validateSummaryResponse(response, request);
      } catch (parseError) {
        console.error('Failed to parse OpenAI summary response:', content);
        throw new CustomError('Invalid summary response format from OpenAI', 500);
      }
    } catch (error) {
      console.error('OpenAI summary API error:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to generate summary with AI', 500);
    }
  }

  /**
   * Build the tagging prompt for OpenAI
   */
  private buildTaggingPrompt(
    messageText: string,
    channelName: string,
    userName: string,
    squadContext?: string[]
  ): string {
    const squads = squadContext || [
      'voice-ai', 'core-rcm', 'epic', 'portal-aggregator', 'hitl', 'thoughthub',
      'nox-health', 'orthofi', 'biowound', 'legent', 'general'
    ];

    return `Analyze this Slack message and suggest relevant tags:

Message: "${messageText}"
Channel: #${channelName}
User: ${userName}

Available squads/products: ${squads.join(', ')}

Assign tags from these categories:

1. SQUAD/PRODUCT: Which team/product this relates to
   - voice-ai, core-rcm, epic, portal-aggregator, hitl, thoughthub
   - nox-health, orthofi, biowound, legent, general

2. KEYWORDS: Technical/business keywords
   - deployment, bug-fix, feature, integration, testing, performance
   - meeting, decision, update, announcement, question, discussion

3. URGENCY: How urgent/important this seems
   - routine, important, urgent, critical

4. TYPE: What kind of message this is
   - status-update, question, announcement, issue, achievement, discussion

Return JSON in this exact format:
{
  "suggestions": [
    {
      "tag": "tag-name",
      "category": "squad|keyword|urgency|type",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }
  ],
  "urgencyLevel": "low|medium|high|critical"
}

Only suggest tags that are clearly relevant with confidence > 0.6.`;
  }

  /**
   * Build the summary prompt for OpenAI
   */
  private buildSummaryPrompt(request: SummaryRequest): string {
    const messagesBySquad = this.groupMessagesBySquad(request.messages);
    const dateStr = request.dateRange.start.toDateString();
    
    let messagesText = '';
    Object.entries(messagesBySquad).forEach(([squad, messages]) => {
      messagesText += `\n## ${squad.toUpperCase()} SQUAD (${messages.length} messages)\n`;
      messages.slice(0, 10).forEach(msg => { // Limit to prevent token overflow
        messagesText += `- [${msg.channelName}] ${msg.userName}: ${msg.text.slice(0, 200)}...\n`;
      });
    });

    return `Analyze these Slack messages from ${dateStr} and create an executive summary:

${messagesText}

Total messages: ${request.messages.length}
Active squads: ${request.squads.join(', ')}

Create a comprehensive summary in JSON format:
{
  "executiveSummary": "2-3 sentence overview of the day's key activities",
  "keyDevelopments": ["Important developments", "Major announcements"],
  "blockingIssues": ["Issues that need attention", "Blockers mentioned"],
  "achievements": ["Wins and completions", "Milestones reached"],
  "actionItems": ["Follow-ups needed", "Decisions pending"],
  "teamSentiment": "positive|neutral|concerning",
  "activityMetrics": {
    "totalMessages": ${request.messages.length},
    "activeSquads": ["list", "of", "active", "squads"],
    "topChannels": ["most", "active", "channels"]
  }
}

Focus on actionable insights for a product operations manager.`;
  }

  /**
   * Group messages by squad for better organization
   */
  private groupMessagesBySquad(messages: SummaryRequest['messages']): Record<string, SummaryRequest['messages']> {
    const grouped: Record<string, SummaryRequest['messages']> = {};
    
    messages.forEach(message => {
      const squad = message.squad || 'general';
      if (!grouped[squad]) {
        grouped[squad] = [];
      }
      grouped[squad].push(message);
    });

    return grouped;
  }

  /**
   * Validate and sanitize tagging response
   */
  private validateTaggingResponse(response: TaggingResponse): TaggingResponse {
    if (!response.suggestions || !Array.isArray(response.suggestions)) {
      throw new CustomError('Invalid tagging response structure', 500);
    }

    // Filter out low-confidence suggestions
    response.suggestions = response.suggestions.filter(s => 
      s.confidence >= 0.6 && 
      s.tag && 
      s.category &&
      ['squad', 'keyword', 'urgency', 'type'].includes(s.category)
    );

    // Ensure urgency level is valid
    if (!['low', 'medium', 'high', 'critical'].includes(response.urgencyLevel)) {
      response.urgencyLevel = 'medium';
    }

    return response;
  }

  /**
   * Validate and sanitize summary response
   */
  private validateSummaryResponse(response: SummaryResponse, request: SummaryRequest): SummaryResponse {
    // Ensure all required fields exist
    response.executiveSummary = response.executiveSummary || 'No summary available';
    response.keyDevelopments = response.keyDevelopments || [];
    response.blockingIssues = response.blockingIssues || [];
    response.achievements = response.achievements || [];
    response.actionItems = response.actionItems || [];
    
    if (!['positive', 'neutral', 'concerning'].includes(response.teamSentiment)) {
      response.teamSentiment = 'neutral';
    }

    // Ensure activity metrics exist
    if (!response.activityMetrics) {
      response.activityMetrics = {
        totalMessages: request.messages.length,
        activeSquads: request.squads,
        topChannels: [...new Set(request.messages.map(m => m.channelName))].slice(0, 5)
      };
    }

    return response;
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}
