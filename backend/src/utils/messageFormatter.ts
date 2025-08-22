import { Message, User } from '../types';

export interface FormattedMessage extends Message {
  formattedText: string;
  slackPermalink?: string;
}

export class MessageFormatter {
  private users: Map<string, User> = new Map();

  constructor(users: User[] = []) {
    users.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  /**
   * Format a Slack message by resolving mentions and cleaning URLs
   */
  formatMessage(message: Message): FormattedMessage {
    let formattedText = message.text;

    // Replace user mentions (<@U123456>) with actual names
    formattedText = this.resolveUserMentions(formattedText);

    // Clean up channel mentions (<#C123456|channel-name>)
    formattedText = this.resolveChannelMentions(formattedText);

    // Clean up URLs (<https://example.com|display text>)
    formattedText = this.cleanupUrls(formattedText);

    // Generate Slack permalink
    const slackPermalink = this.generateSlackPermalink(message);

    return {
      ...message,
      formattedText,
      slackPermalink
    };
  }

  /**
   * Batch format multiple messages
   */
  formatMessages(messages: Message[]): FormattedMessage[] {
    return messages.map(message => this.formatMessage(message));
  }

  /**
   * Resolve user mentions from <@U123456> to @Username
   */
  private resolveUserMentions(text: string): string {
    return text.replace(/<@([UW][A-Z0-9]+)(\|([^>]+))?>/g, (match, userId, pipe, displayName) => {
      // If there's a display name in the mention, use it
      if (displayName) {
        return `@${displayName}`;
      }

      // Otherwise, look up the user
      const user = this.users.get(userId);
      if (user) {
        return `@${user.name}`;
      }

      // Fallback to the user ID if we can't resolve it
      return `@${userId}`;
    });
  }

  /**
   * Resolve channel mentions from <#C123456|channel-name> to #channel-name
   */
  private resolveChannelMentions(text: string): string {
    return text.replace(/<#([CD][A-Z0-9]+)\|([^>]+)>/g, (match, channelId, channelName) => {
      return `#${channelName}`;
    });
  }

  /**
   * Clean up URLs from <https://example.com|display text> to display text
   * or from <https://example.com> to a cleaner format
   */
  private cleanupUrls(text: string): string {
    // Handle URLs with display text: <https://example.com|display text>
    text = text.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, (match, url, displayText) => {
      return `[${displayText}](${url})`;
    });

    // Handle plain URLs: <https://example.com>
    text = text.replace(/<(https?:\/\/[^>]+)>/g, (match, url) => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        return `[${domain}](${url})`;
      } catch (e) {
        return url;
      }
    });

    return text;
  }

  /**
   * Generate Slack permalink for a message
   */
  private generateSlackPermalink(message: Message): string {
    // Extract timestamp from message ID (format: channelId.timestamp.threadId)
    const parts = message.id.split('.');
    if (parts.length >= 2) {
      const channelId = parts[0];
      const timestamp = parts[1];
      
      // Slack permalink format: https://workspace.slack.com/archives/CHANNEL_ID/pTIMESTAMP
      // Note: We'll need the workspace domain, for now using a placeholder
      return `https://thoughtfulai.slack.com/archives/${channelId}/p${timestamp}`;
    }

    return '';
  }

  /**
   * Update user cache with new users
   */
  updateUsers(users: User[]): void {
    users.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  /**
   * Extract mentions from a message
   */
  extractMentions(text: string): { userIds: string[]; channelIds: string[] } {
    const userIds: string[] = [];
    const channelIds: string[] = [];

    // Extract user mentions
    const userMatches = text.match(/<@([UW][A-Z0-9]+)/g);
    if (userMatches) {
      userMatches.forEach(match => {
        const userId = match.replace('<@', '');
        if (!userIds.includes(userId)) {
          userIds.push(userId);
        }
      });
    }

    // Extract channel mentions
    const channelMatches = text.match(/<#([CD][A-Z0-9]+)/g);
    if (channelMatches) {
      channelMatches.forEach(match => {
        const channelId = match.replace('<#', '');
        if (!channelIds.includes(channelId)) {
          channelIds.push(channelId);
        }
      });
    }

    return { userIds, channelIds };
  }

  /**
   * Check if a message contains urgent keywords
   */
  isUrgent(text: string): boolean {
    const urgentKeywords = [
      'urgent', 'critical', 'emergency', 'asap', 'immediately',
      'breaking', 'down', 'outage', 'failed', 'error'
    ];

    const lowerText = text.toLowerCase();
    return urgentKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract action items from a message
   */
  extractActionItems(text: string): string[] {
    const actionItems: string[] = [];
    
    // Look for common action item patterns
    const patterns = [
      /(?:todo|to do|action item|ai):\s*(.+?)(?:\n|$)/gi,
      /(?:need to|should|must)\s+(.+?)(?:\n|\.|\?|!|$)/gi,
      /(?:\[ \]|\-\s*\[ \])\s*(.+?)(?:\n|$)/gi, // Checkboxes
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const item = match[1].trim();
        if (item && item.length > 5) { // Filter out very short items
          actionItems.push(item);
        }
      }
    });

    return actionItems;
  }
}
