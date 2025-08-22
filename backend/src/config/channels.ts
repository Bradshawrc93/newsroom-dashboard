/**
 * Channel configuration for newsroom dashboard
 * Maps channel IDs to their human-readable names and squad information
 */

export interface ChannelConfig {
  id: string;
  name: string;
  squad: string;
  description?: string;
}

export const MONITORED_CHANNELS: ChannelConfig[] = [
  {
    id: 'C08T8ARC5T9',
    name: 'product',
    squad: 'Product',
    description: 'Product team discussions'
  },
  {
    id: 'C02SR2HBLSW',
    name: 'core-engineering',
    squad: 'Core Engineering',
    description: 'Core engineering team discussions'
  },
  {
    id: 'C094CGAPB4K',
    name: 'thoughtful-access-voice-ai',
    squad: 'Voice',
    description: 'Voice AI squad discussions'
  },
  {
    id: 'C07EWEZ5Q69',
    name: 'nox-health',
    squad: 'Voice',
    description: 'Voice implementation at Nox Health'
  },
  {
    id: 'C08B59EMX55',
    name: 'orthofi',
    squad: 'Voice',
    description: 'Voice implementation at OrthoFi'
  },
  {
    id: 'C09835Y2Y94',
    name: 'thoughtful-epic',
    squad: 'EPIC',
    description: 'EPIC squad discussions'
  },
  {
    id: 'C08AGEU8EUE',
    name: 'portal-aggregator',
    squad: 'Portal Agg',
    description: 'Portal aggregator squad discussions'
  },
  {
    id: 'C0906H1DEUA',
    name: 'hitl-squad',
    squad: 'HITL',
    description: 'Human-in-the-loop squad discussions'
  },
  {
    id: 'C084QKSUSTY',
    name: 'thoughthub',
    squad: 'ThoughtHub',
    description: 'ThoughtHub squad discussions'
  },
  {
    id: 'C096L7VURLH',
    name: 'dd-worfklow-engine-partnership',
    squad: 'Developer Efficiency',
    description: 'Developer efficiency squad discussions'
  },
  {
    id: 'C08KTT61AMD',
    name: 'reporting-sdk',
    squad: 'Data',
    description: 'Data squad discussions'
  },
  {
    id: 'C08ERU69JFP',
    name: 'pathfinder-toolforge-alpha',
    squad: 'Deep Research',
    description: 'Deep research squad discussions'
  }
];

// Helper functions
export const getChannelIds = (): string[] => {
  return MONITORED_CHANNELS.map(channel => channel.id);
};

export const getChannelById = (id: string): ChannelConfig | undefined => {
  return MONITORED_CHANNELS.find(channel => channel.id === id);
};

export const getChannelsBySquad = (squad: string): ChannelConfig[] => {
  return MONITORED_CHANNELS.filter(channel => channel.squad === squad);
};

export const getSquads = (): string[] => {
  return [...new Set(MONITORED_CHANNELS.map(channel => channel.squad))];
};
