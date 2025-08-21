// Squad Configuration for serverless API
const SQUAD_CONFIGS = [
  {
    id: 'general',
    name: 'General',
    description: 'General product and company-wide discussions',
    channels: [
      {
        id: 'product',
        name: 'product',
        squad: 'general',
        isPrimary: true,
        description: 'General product discussions'
      },
      {
        id: 'core-engineering',
        name: 'core-engineering',
        squad: 'general',
        isPrimary: false,
        description: 'Core engineering discussions'
      }
    ],
    tags: [
      {
        id: 'product',
        name: 'Product',
        category: 'keyword',
        squad: 'general',
        confidence: 0.9
      }
    ],
    people: [
      {
        id: 'voice',
        name: 'Voice',
        squad: 'general',
        commonTags: ['product']
      }
    ]
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Voice AI and related implementations',
    channels: [
      {
        id: 'thoughtful-access-voice-ai',
        name: 'thoughtful-access-voice-ai',
        squad: 'voice',
        isPrimary: true,
        description: 'Primary voice AI discussions'
      },
      {
        id: 'nox-health',
        name: 'nox-health',
        squad: 'voice',
        isPrimary: false,
        description: 'Voice implementation in Nox Health',
        relatedChannels: ['thoughtful-access-voice-ai']
      },
      {
        id: 'orthofi',
        name: 'orthofi',
        squad: 'voice',
        isPrimary: false,
        description: 'Voice implementation in OrthoFi',
        relatedChannels: ['thoughtful-access-voice-ai']
      }
    ],
    tags: [],
    people: [
      {
        id: 'jake-mcclanahan',
        name: 'Jake McClanahan',
        squad: 'voice',
        commonTags: ['voice', 'ai']
      },
      {
        id: 'aneesh-kanakamedala',
        name: 'Aneesh Kanakamedala',
        squad: 'voice',
        commonTags: ['voice', 'ai']
      }
    ]
  },
  {
    id: 'core-rcm',
    name: 'Core RCM',
    description: 'Core Revenue Cycle Management',
    subsquads: ['epic', 'portal-agg'],
    channels: [],
    tags: [],
    people: []
  },
  {
    id: 'epic',
    name: 'EPIC',
    description: 'EPIC subsquad under Core RCM',
    parentSquad: 'core-rcm',
    channels: [
      {
        id: 'thoughtful-epic',
        name: 'thoughtful-epic',
        squad: 'epic',
        isPrimary: true,
        description: 'EPIC-related discussions'
      }
    ],
    tags: [],
    people: [
      {
        id: 'jasmine-shah',
        name: 'Jasmine Shah',
        squad: 'epic',
        commonTags: ['epic', 'rcm']
      }
    ]
  },
  {
    id: 'portal-agg',
    name: 'Portal Agg',
    description: 'Portal Aggregator subsquad under Core RCM',
    parentSquad: 'core-rcm',
    channels: [
      {
        id: 'portal-aggregator',
        name: 'portal-aggregator',
        squad: 'portal-agg',
        isPrimary: true,
        description: 'Portal aggregator discussions'
      }
    ],
    tags: [],
    people: [
      {
        id: 'craig-gifford-portal',
        name: 'Craig Gifford',
        squad: 'portal-agg',
        commonTags: ['portal', 'aggregator', 'rcm']
      }
    ]
  },
  {
    id: 'hitl',
    name: 'HITL',
    description: 'Human in the Loop',
    channels: [
      {
        id: 'hitl-squad',
        name: 'hitl-squad',
        squad: 'hitl',
        isPrimary: true,
        description: 'Primary HITL discussions'
      },
      {
        id: 'biowound',
        name: 'BioWound',
        squad: 'hitl',
        isPrimary: false,
        description: 'HITL implementation in BioWound',
        relatedChannels: ['hitl-squad']
      },
      {
        id: 'legent',
        name: 'Legent',
        squad: 'hitl',
        isPrimary: false,
        description: 'HITL implementation in Legent',
        relatedChannels: ['hitl-squad']
      }
    ],
    tags: [
      {
        id: 'arc',
        name: 'Arc',
        category: 'keyword',
        squad: 'hitl',
        confidence: 0.8
      },
      {
        id: 'access',
        name: 'Access',
        category: 'keyword',
        squad: 'hitl',
        confidence: 0.8
      }
    ],
    people: [
      {
        id: 'craig-gifford-hitl',
        name: 'Craig Gifford',
        squad: 'hitl',
        commonTags: ['hitl', 'arc', 'access']
      },
      {
        id: 'andrew-armaneous',
        name: 'Andrew Armaneous',
        squad: 'hitl',
        commonTags: ['hitl', 'arc', 'access']
      },
      {
        id: 'danny-mathieson-hitl',
        name: 'Danny Mathieson',
        squad: 'hitl',
        commonTags: ['hitl', 'arc', 'access']
      }
    ]
  },
  {
    id: 'customer-facing',
    name: 'Customer Facing',
    description: 'Customer-facing features and support',
    channels: [],
    tags: [],
    people: [
      {
        id: 'olivia-demir',
        name: 'Olivia Demir',
        squad: 'customer-facing',
        commonTags: ['customer', 'support']
      },
      {
        id: 'danny-mathieson-customer',
        name: 'Danny Mathieson',
        squad: 'customer-facing',
        commonTags: ['customer', 'support']
      }
    ]
  },
  {
    id: 'thoughthub',
    name: 'ThoughtHub',
    description: 'ThoughtHub platform and features',
    channels: [
      {
        id: 'thoughthub',
        name: 'thoughthub',
        squad: 'thoughthub',
        isPrimary: true,
        description: 'ThoughtHub discussions'
      }
    ],
    tags: [],
    people: [
      {
        id: 'quenby-mitchell',
        name: 'Quenby Mitchell',
        squad: 'thoughthub',
        commonTags: ['thoughthub']
      },
      {
        id: 'darrin-eden',
        name: 'Darrin Eden',
        squad: 'thoughthub',
        commonTags: ['thoughthub']
      },
      {
        id: 'sean-albito',
        name: 'Sean Albito',
        squad: 'thoughthub',
        commonTags: ['thoughthub']
      },
      {
        id: 'peter-agnew',
        name: 'Peter Agnew',
        squad: 'thoughthub',
        commonTags: ['thoughthub']
      }
    ]
  },
  {
    id: 'developer-efficiency',
    name: 'Developer Efficiency',
    description: 'Developer tools and workflow improvements',
    channels: [
      {
        id: 'dd-worfklow-engine-partnership',
        name: 'dd-worfklow-engine-partnership',
        squad: 'developer-efficiency',
        isPrimary: true,
        description: 'Developer workflow engine partnership'
      }
    ],
    tags: [],
    people: [
      {
        id: 'jhonatan-lopes',
        name: 'Jhonatan Lopes',
        squad: 'developer-efficiency',
        commonTags: ['developer', 'workflow', 'efficiency']
      },
      {
        id: 'phil-bjorge-dev',
        name: 'Phil Bjorge',
        squad: 'developer-efficiency',
        commonTags: ['developer', 'workflow', 'efficiency']
      },
      {
        id: 'asa-downs',
        name: 'Asa Downs',
        squad: 'developer-efficiency',
        commonTags: ['developer', 'workflow', 'efficiency']
      }
    ]
  },
  {
    id: 'data',
    name: 'Data',
    description: 'Data analytics and reporting',
    channels: [
      {
        id: 'reporting-sdk',
        name: 'reporting-sdk',
        squad: 'data',
        isPrimary: true,
        description: 'Reporting SDK discussions'
      }
    ],
    tags: [],
    people: []
  },
  {
    id: 'medical-coding',
    name: 'Medical Coding',
    description: 'Medical coding and billing',
    channels: [],
    tags: [],
    people: []
  },
  {
    id: 'deep-research',
    name: 'Deep Research',
    description: 'Research and development initiatives',
    channels: [
      {
        id: 'pathfinder-toolforge-alpha',
        name: 'pathfinder-toolforge-alpha',
        squad: 'deep-research',
        isPrimary: true,
        description: 'Pathfinder Toolforge Alpha discussions'
      }
    ],
    tags: [
      {
        id: 'toolforge',
        name: 'Toolforge',
        category: 'keyword',
        squad: 'deep-research',
        confidence: 0.9
      },
      {
        id: 'pathfinder',
        name: 'pathfinder',
        category: 'keyword',
        squad: 'deep-research',
        confidence: 0.9
      }
    ],
    people: [
      {
        id: 'phil-bjorge-research',
        name: 'Phil Bjorge',
        squad: 'deep-research',
        commonTags: ['toolforge', 'pathfinder', 'research']
      }
    ]
  }
];

// Squad configuration manager
class SquadConfigManager {
  constructor(configs = SQUAD_CONFIGS) {
    this.configs = configs;
  }

  getAllSquads() {
    return this.configs;
  }

  getMainSquads() {
    return this.configs.filter(squad => !squad.parentSquad);
  }

  getSubsquads(parentSquadId) {
    return this.configs.filter(squad => squad.parentSquad === parentSquadId);
  }

  getSquad(squadId) {
    return this.configs.find(squad => squad.id === squadId);
  }

  getSquadChannels(squadId) {
    const squad = this.getSquad(squadId);
    if (!squad) return [];

    let channels = [...squad.channels];

    if (squad.subsquads) {
      squad.subsquads.forEach(subsquadId => {
        const subsquad = this.getSquad(subsquadId);
        if (subsquad) {
          channels.push(...subsquad.channels);
        }
      });
    }

    return channels;
  }

  getSquadPeople(squadId) {
    const squad = this.getSquad(squadId);
    if (!squad) return [];

    let people = [...squad.people];

    if (squad.subsquads) {
      squad.subsquads.forEach(subsquadId => {
        const subsquad = this.getSquad(subsquadId);
        if (subsquad) {
          people.push(...subsquad.people);
        }
      });
    }

    return people;
  }

  getSquadTags(squadId) {
    const squad = this.getSquad(squadId);
    if (!squad) return [];

    let tags = [...squad.tags];

    if (squad.subsquads) {
      squad.subsquads.forEach(subsquadId => {
        const subsquad = this.getSquad(subsquadId);
        if (subsquad) {
          tags.push(...subsquad.tags);
        }
      });
    }

    return tags;
  }
}

const squadConfigManager = new SquadConfigManager();

module.exports = { squadConfigManager, SQUAD_CONFIGS };
