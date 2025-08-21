import { squadConfigManager, SquadConfig, ChannelConfig, PersonConfig, TagConfig } from '../config/squads';
import { userStorage, channelStorage, tagStorage } from '../utils/storage';
import { User, Channel, Tag } from '../types';
import { CustomError } from '../types';

export class SquadService {
  private configManager = squadConfigManager;

  /**
   * Initialize squad data in JSON storage from configuration
   */
  async initializeSquadData(): Promise<void> {
    try {
      const squads = this.configManager.getAllSquads();
      
      // Initialize users from squad configurations
      const users: User[] = [];
      squads.forEach(squad => {
        squad.people.forEach(person => {
          users.push({
            id: person.id,
            name: person.name,
            email: person.email || '',
            squad: squad.id,
            role: person.role,
            avatar: person.avatar,
            commonTags: person.commonTags,
            createdAt: new Date(),
          });
        });
      });

      // Initialize channels from squad configurations
      const channels: Channel[] = [];
      squads.forEach(squad => {
        squad.channels.forEach(channel => {
          channels.push({
            id: channel.id,
            name: channel.name,
            squad: squad.id,
            isPrivate: false, // Will be updated from Slack API
            memberCount: 0, // Will be updated from Slack API
            isConnected: false, // Will be set by user
            createdAt: new Date(),
          });
        });
      });

      // Initialize tags from squad configurations
      const tags: Tag[] = [];
      squads.forEach(squad => {
        squad.tags.forEach(tag => {
          tags.push({
            id: tag.id,
            name: tag.name,
            category: tag.category,
            confidence: tag.confidence,
            usageCount: 0,
            createdAt: new Date(),
            lastUsed: new Date(),
          });
        });
      });

      // Update storage with squad data
      await userStorage.update(data => {
        // Merge with existing users, preserving any additional data
        const existingUsers = new Map(data.users.map(u => [u.id, u]));
        users.forEach(user => {
          if (existingUsers.has(user.id)) {
            // Preserve existing data but update squad info
            const existing = existingUsers.get(user.id)!;
            existingUsers.set(user.id, { ...existing, squad: user.squad, commonTags: user.commonTags });
          } else {
            existingUsers.set(user.id, user);
          }
        });
        data.users = Array.from(existingUsers.values());
        data.lastUpdated = new Date().toISOString();
        return data;
      });

      await channelStorage.update(data => {
        // Merge with existing channels, preserving connection status
        const existingChannels = new Map(data.channels.map(c => [c.id, c]));
        channels.forEach(channel => {
          if (existingChannels.has(channel.id)) {
            // Preserve existing connection status
            const existing = existingChannels.get(channel.id)!;
            existingChannels.set(channel.id, { ...existing, squad: channel.squad });
          } else {
            existingChannels.set(channel.id, channel);
          }
        });
        data.channels = Array.from(existingChannels.values());
        data.lastUpdated = new Date().toISOString();
        return data;
      });

      await tagStorage.update(data => {
        // Merge with existing tags, preserving usage stats
        const existingTags = new Map(data.tags.map(t => [t.id, t]));
        tags.forEach(tag => {
          if (existingTags.has(tag.id)) {
            // Preserve existing usage stats
            const existing = existingTags.get(tag.id)!;
            existingTags.set(tag.id, { ...existing, confidence: tag.confidence });
          } else {
            existingTags.set(tag.id, tag);
          }
        });
        data.tags = Array.from(existingTags.values());
        data.lastUpdated = new Date().toISOString();
        return data;
      });

    } catch (error) {
      console.error('Error initializing squad data:', error);
      throw new CustomError('Failed to initialize squad data', 500);
    }
  }

  /**
   * Get all squads
   */
  async getAllSquads(): Promise<SquadConfig[]> {
    return this.configManager.getAllSquads();
  }

  /**
   * Get main squads (no parent)
   */
  async getMainSquads(): Promise<SquadConfig[]> {
    return this.configManager.getMainSquads();
  }

  /**
   * Get subsquads of a main squad
   */
  async getSubsquads(parentSquadId: string): Promise<SquadConfig[]> {
    return this.configManager.getSubsquads(parentSquadId);
  }

  /**
   * Get squad by ID
   */
  async getSquad(squadId: string): Promise<SquadConfig | undefined> {
    return this.configManager.getSquad(squadId);
  }

  /**
   * Get all channels for a squad (including subsquads)
   */
  async getSquadChannels(squadId: string): Promise<ChannelConfig[]> {
    return this.configManager.getSquadChannels(squadId);
  }

  /**
   * Get all people for a squad (including subsquads)
   */
  async getSquadPeople(squadId: string): Promise<PersonConfig[]> {
    return this.configManager.getSquadPeople(squadId);
  }

  /**
   * Get all tags for a squad (including subsquads)
   */
  async getSquadTags(squadId: string): Promise<TagConfig[]> {
    return this.configManager.getSquadTags(squadId);
  }

  /**
   * Find squad by channel name
   */
  async findSquadByChannel(channelName: string): Promise<SquadConfig | undefined> {
    return this.configManager.findSquadByChannel(channelName);
  }

  /**
   * Find squad by person name
   */
  async findSquadByPerson(personName: string): Promise<SquadConfig | undefined> {
    return this.configManager.findSquadByPerson(personName);
  }

  /**
   * Add new squad
   */
  async addSquad(squad: SquadConfig): Promise<void> {
    this.configManager.addSquad(squad);
    // Reinitialize data to include new squad
    await this.initializeSquadData();
  }

  /**
   * Update squad
   */
  async updateSquad(squadId: string, updates: Partial<SquadConfig>): Promise<boolean> {
    const success = this.configManager.updateSquad(squadId, updates);
    if (success) {
      // Reinitialize data to reflect changes
      await this.initializeSquadData();
    }
    return success;
  }

  /**
   * Remove squad
   */
  async removeSquad(squadId: string): Promise<boolean> {
    const success = this.configManager.removeSquad(squadId);
    if (success) {
      // Reinitialize data to reflect changes
      await this.initializeSquadData();
    }
    return success;
  }

  /**
   * Add channel to squad
   */
  async addChannelToSquad(squadId: string, channel: ChannelConfig): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    squad.channels.push(channel);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Remove channel from squad
   */
  async removeChannelFromSquad(squadId: string, channelId: string): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    const index = squad.channels.findIndex(c => c.id === channelId);
    if (index === -1) return false;

    squad.channels.splice(index, 1);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Add person to squad
   */
  async addPersonToSquad(squadId: string, person: PersonConfig): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    squad.people.push(person);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Remove person from squad
   */
  async removePersonFromSquad(squadId: string, personId: string): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    const index = squad.people.findIndex(p => p.id === personId);
    if (index === -1) return false;

    squad.people.splice(index, 1);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Add tag to squad
   */
  async addTagToSquad(squadId: string, tag: TagConfig): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    squad.tags.push(tag);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Remove tag from squad
   */
  async removeTagFromSquad(squadId: string, tagId: string): Promise<boolean> {
    const squad = this.configManager.getSquad(squadId);
    if (!squad) return false;

    const index = squad.tags.findIndex(t => t.id === tagId);
    if (index === -1) return false;

    squad.tags.splice(index, 1);
    await this.initializeSquadData();
    return true;
  }

  /**
   * Export configuration to JSON
   */
  async exportConfiguration(): Promise<string> {
    return this.configManager.exportToJson();
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(json: string): Promise<void> {
    this.configManager.importFromJson(json);
    await this.initializeSquadData();
  }

  /**
   * Get squad hierarchy for UI display
   */
  async getSquadHierarchy(): Promise<Array<{
    squad: SquadConfig;
    subsquads: SquadConfig[];
    channelCount: number;
    peopleCount: number;
    tagCount: number;
  }>> {
    const mainSquads = this.configManager.getMainSquads();
    
    return mainSquads.map(squad => {
      const subsquads = this.configManager.getSubsquads(squad.id);
      const allChannels = this.configManager.getSquadChannels(squad.id);
      const allPeople = this.configManager.getSquadPeople(squad.id);
      const allTags = this.configManager.getSquadTags(squad.id);

      return {
        squad,
        subsquads,
        channelCount: allChannels.length,
        peopleCount: allPeople.length,
        tagCount: allTags.length,
      };
    });
  }

  /**
   * Get squad statistics
   */
  async getSquadStats(): Promise<{
    totalSquads: number;
    totalMainSquads: number;
    totalSubsquads: number;
    totalChannels: number;
    totalPeople: number;
    totalTags: number;
  }> {
    const allSquads = this.configManager.getAllSquads();
    const mainSquads = this.configManager.getMainSquads();
    const subsquads = allSquads.filter(squad => squad.parentSquad);

    let totalChannels = 0;
    let totalPeople = 0;
    let totalTags = 0;

    allSquads.forEach(squad => {
      totalChannels += squad.channels.length;
      totalPeople += squad.people.length;
      totalTags += squad.tags.length;
    });

    return {
      totalSquads: allSquads.length,
      totalMainSquads: mainSquads.length,
      totalSubsquads: subsquads.length,
      totalChannels,
      totalPeople,
      totalTags,
    };
  }
}
