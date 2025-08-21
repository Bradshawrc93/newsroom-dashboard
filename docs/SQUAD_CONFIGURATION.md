# Squad Configuration System

The Newsroom Dashboard includes a comprehensive squad configuration system that allows you to easily manage your team structure, channels, people, and tags. This system supports hierarchical squads (main squads with subsquads) and provides both programmatic and manual update capabilities.

## Overview

The squad configuration system consists of:

1. **Configuration File**: `backend/src/config/squads.ts` - Contains all squad definitions
2. **Service Layer**: `backend/src/services/squadService.ts` - Manages squad operations
3. **API Endpoints**: `backend/src/routes/squads.ts` - RESTful API for squad management
4. **Frontend Component**: `frontend/src/components/SquadManager.tsx` - UI for managing squads
5. **JSON Storage Integration**: Automatically syncs with the JSON storage system

## Current Squad Structure

Based on your provided information, the system includes the following squads:

### Main Squads
- **General** - Company-wide discussions
- **Voice** - Voice AI and implementations
- **Core RCM** - Revenue Cycle Management (with subsquads)
- **HITL** - Human in the Loop
- **Customer Facing** - Customer support and features
- **ThoughtHub** - ThoughtHub platform
- **Developer Efficiency** - Developer tools and workflows
- **Data** - Data analytics and reporting
- **Medical Coding** - Medical coding and billing
- **Deep Research** - Research and development

### Subsquads
- **EPIC** (under Core RCM)
- **Portal Agg** (under Core RCM)

## How to Update Squad Configuration

### Method 1: Manual File Editing (Recommended for bulk changes)

Edit the `backend/src/config/squads.ts` file directly:

```typescript
export const SQUAD_CONFIGS: SquadConfig[] = [
  {
    id: 'your-squad-id',
    name: 'Your Squad Name',
    description: 'Description of your squad',
    parentSquad: 'parent-squad-id', // Optional, for subsquads
    channels: [
      {
        id: 'channel-id',
        name: 'channel-name',
        squad: 'your-squad-id',
        isPrimary: true,
        description: 'Channel description'
      }
    ],
    tags: [
      {
        id: 'tag-id',
        name: 'tag-name',
        category: 'keyword', // 'keyword' | 'person' | 'squad' | 'custom'
        squad: 'your-squad-id',
        confidence: 0.9
      }
    ],
    people: [
      {
        id: 'person-id',
        name: 'Person Name',
        email: 'person@company.com',
        squad: 'your-squad-id',
        role: 'developer',
        commonTags: ['tag1', 'tag2']
      }
    ],
    subsquads: ['subsquad-id-1', 'subsquad-id-2'] // Optional
  }
];
```

### Method 2: API Endpoints (Recommended for individual changes)

Use the RESTful API endpoints to manage squads:

```bash
# Get all squads
GET /api/squads

# Get squad hierarchy
GET /api/squads/hierarchy

# Add new squad
POST /api/squads
{
  "id": "new-squad",
  "name": "New Squad",
  "description": "Description",
  "channels": [],
  "tags": [],
  "people": []
}

# Add channel to squad
POST /api/squads/{squadId}/channels
{
  "id": "new-channel",
  "name": "new-channel",
  "squad": "squad-id",
  "isPrimary": false
}

# Add person to squad
POST /api/squads/{squadId}/people
{
  "id": "new-person",
  "name": "New Person",
  "squad": "squad-id",
  "commonTags": ["tag1"]
}

# Add tag to squad
POST /api/squads/{squadId}/tags
{
  "id": "new-tag",
  "name": "new-tag",
  "category": "keyword",
  "squad": "squad-id",
  "confidence": 0.8
}
```

### Method 3: Frontend Interface

Use the Squad Manager component in the frontend:

1. Navigate to `/squads` in the application
2. Click on squad cards to expand them
3. Use the "Add" buttons to add channels, people, or tags
4. Use the edit/delete buttons to modify existing items

## Configuration File Structure

### SquadConfig Interface

```typescript
interface SquadConfig {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description?: string;          // Optional description
  parentSquad?: string;          // Parent squad ID (for subsquads)
  channels: ChannelConfig[];     // Associated channels
  tags: TagConfig[];            // Associated tags
  people: PersonConfig[];       // Squad members
  subsquads?: string[];         // Subsquad IDs
}
```

### ChannelConfig Interface

```typescript
interface ChannelConfig {
  id: string;                    // Unique identifier
  name: string;                  // Channel name
  squad: string;                 // Squad ID
  isPrimary: boolean;           // Primary channel for the squad
  description?: string;         // Optional description
  relatedChannels?: string[];   // Related channel names
}
```

### PersonConfig Interface

```typescript
interface PersonConfig {
  id: string;                    // Unique identifier
  name: string;                  // Person's name
  email?: string;               // Email address
  squad: string;                // Squad ID
  role?: string;                // Role in the squad
  avatar?: string;              // Avatar URL
  commonTags: string[];         // Associated tags
}
```

### TagConfig Interface

```typescript
interface TagConfig {
  id: string;                    // Unique identifier
  name: string;                  // Tag name
  category: 'keyword' | 'person' | 'squad' | 'custom';
  squad?: string;               // Associated squad
  description?: string;         // Optional description
  confidence: number;           // Confidence score (0-1)
}
```

## Automatic Data Synchronization

The squad configuration system automatically:

1. **Initializes JSON Storage**: When the server starts, squad data is automatically loaded into the JSON storage system
2. **Updates Storage**: Any changes to squad configuration are immediately reflected in the JSON files
3. **Preserves Data**: Existing data (like connection status, usage stats) is preserved when updating configurations
4. **Maintains Consistency**: Ensures consistency between the configuration file and JSON storage

## Best Practices

### Naming Conventions

- **Squad IDs**: Use kebab-case (e.g., `voice`, `core-rcm`, `developer-efficiency`)
- **Channel IDs**: Use the actual Slack channel name
- **Person IDs**: Use kebab-case with full name (e.g., `jake-mcclanahan`)
- **Tag IDs**: Use kebab-case (e.g., `voice-ai`, `bug-fix`)

### Organization

- **Primary Channels**: Mark the main discussion channel for each squad as `isPrimary: true`
- **Related Channels**: Use `relatedChannels` to link implementation channels to main channels
- **Common Tags**: Include relevant tags in `commonTags` for people to improve AI learning
- **Descriptions**: Provide clear descriptions for better organization

### Hierarchy Management

- **Main Squads**: Don't include `parentSquad` for top-level squads
- **Subsquads**: Include `parentSquad` and add the subsquad ID to the parent's `subsquads` array
- **Inheritance**: Subsquads automatically inherit channels, people, and tags from their parent

## Testing

Run the test script to verify your configuration:

```bash
node scripts/test-squads.js
```

This will show:
- Total number of squads, channels, and people
- Hierarchy support verification
- Squad type validation

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/squads` | Get all squads |
| GET | `/api/squads/main` | Get main squads only |
| GET | `/api/squads/hierarchy` | Get squad hierarchy with counts |
| GET | `/api/squads/stats` | Get squad statistics |
| GET | `/api/squads/{id}` | Get specific squad |
| GET | `/api/squads/{id}/subsquads` | Get subsquads of a squad |
| POST | `/api/squads` | Create new squad |
| PUT | `/api/squads/{id}` | Update squad |
| DELETE | `/api/squads/{id}` | Delete squad |
| POST | `/api/squads/{id}/channels` | Add channel to squad |
| DELETE | `/api/squads/{id}/channels/{channelId}` | Remove channel from squad |
| POST | `/api/squads/{id}/people` | Add person to squad |
| DELETE | `/api/squads/{id}/people/{personId}` | Remove person from squad |
| POST | `/api/squads/{id}/tags` | Add tag to squad |
| DELETE | `/api/squads/{id}/tags/{tagId}` | Remove tag from squad |
| GET | `/api/squads/export/config` | Export configuration as JSON |
| POST | `/api/squads/import/config` | Import configuration from JSON |

## Troubleshooting

### Common Issues

1. **Duplicate IDs**: Ensure all IDs are unique across the entire configuration
2. **Missing References**: When adding subsquads, make sure the parent squad exists
3. **Invalid Categories**: Tag categories must be one of: `keyword`, `person`, `squad`, `custom`
4. **Confidence Scores**: Tag confidence must be between 0 and 1

### Data Recovery

If the JSON storage becomes corrupted:

1. Stop the server
2. Delete the corrupted JSON files in `backend/data/`
3. Restart the server - it will automatically reinitialize from the configuration file

### Validation

The system includes automatic validation for:
- Required fields
- Data types
- Reference integrity
- Confidence score ranges

## Future Enhancements

Planned improvements include:
- Bulk import/export via CSV
- Visual squad hierarchy editor
- Automatic Slack channel discovery
- Tag suggestion system
- Squad analytics and metrics
