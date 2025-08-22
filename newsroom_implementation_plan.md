# Newsroom Dashboard Implementation Plan

## 🎯 Project Overview

Build an intelligent Slack newsroom dashboard that aggregates, categorizes, and prioritizes product-related conversations across multiple channels, providing daily summaries and actionable insights for product operations management.

## 📋 Current State Assessment

### ✅ What's Already Built
- **Backend Infrastructure**: Express.js API with TypeScript, Prisma schema, JSON storage
- **Squad Configuration System**: Hierarchical team structure with channels, people, and tags
- **Frontend Foundation**: React + TypeScript with Tailwind CSS, routing setup
- **Deployment Configuration**: Vercel, Railway, and Netlify deployment scripts
- **Sample Data**: Mock messages, users, channels with importance scoring structure

### 🔧 What Needs Implementation
- **Slack Integration**: Real-time message fetching and webhook handling
- **AI/ML Pipeline**: OpenAI integration for tagging, importance scoring, and summarization
- **Dashboard UI**: Message display, filtering, and interaction components
- **Learning System**: Tag correction and model improvement functionality

---

## 🚀 Implementation Roadmap

### Phase 1: Core Slack Integration (Week 1-2)

#### 1.1 Slack Authentication & Connection
**Priority: Critical**

```typescript
// Implement in src/services/slackService.ts
- Set up Slack OAuth flow
- Handle workspace connection
- Store access tokens securely
- Test connection with squad-configured channels
```

**Files to Create/Modify:**
- `backend/src/services/slackService.ts`
- `backend/src/controllers/authController.ts`
- `backend/src/routes/auth.ts`
- `frontend/src/components/SlackAuth.tsx`

**Testing Strategy:**
1. Connect to your actual Slack workspace
2. Verify access to all channels in squad configuration
3. Test token refresh and error handling

#### 1.2 Real-time Message Fetching
**Priority: Critical**

```typescript
// Implement message fetching and storage
- Fetch historical messages (last 7 days initially)
- Set up webhook for real-time updates
- Store messages in JSON format matching current schema
- Handle rate limiting and pagination
```

**Files to Create/Modify:**
- `backend/src/services/messageService.ts`
- `backend/src/controllers/messageController.ts`
- `backend/src/routes/messages.ts`
- `backend/src/webhooks/slackWebhook.ts`

**Testing Strategy:**
1. Fetch messages from `thoughtful-access-voice-ai` channel
2. Verify message structure matches schema
3. Test real-time updates with new messages
4. Validate rate limiting doesn't break functionality

### Phase 2: AI/ML Pipeline (Week 2-3)

#### 2.1 Automatic Tagging System
**Priority: High**

```typescript
// Implement OpenAI-based tagging
- Analyze message content for squad/product relevance
- Use squad configuration for context
- Generate confidence scores for tags
- Store tag associations in MessageTag format
```

**Files to Create/Modify:**
- `backend/src/services/aiService.ts`
- `backend/src/services/taggingService.ts`
- `backend/src/utils/openaiClient.ts`

**AI Prompt Strategy:**
```
Given this Slack message: "{message_text}"

Squad context: {squad_names_and_descriptions}
Channel: {channel_name}
User: {user_name}

Analyze and assign relevant tags from these categories:
- Squad/Product: voice, core-rcm, epic, portal-agg, hitl, etc.
- Keywords: deployment, bug-fix, feature, integration, etc.
- Urgency: urgent, routine, fyi

Return JSON with tag suggestions and confidence scores (0-1).
```

**Testing Strategy:**
1. Process real messages from each squad's primary channel
2. Verify tag accuracy against manual classification
3. Test confidence score distribution
4. Validate tag consistency across similar messages

#### 2.2 Importance Scoring Algorithm
**Priority: High**

```typescript
// Implement importance calculation
- Factor in emoji reactions (count and variety)
- Weight threaded replies and unique respondents
- Consider message length and keywords
- Apply squad-specific importance multipliers
```

**Algorithm Design:**
```typescript
const calculateImportance = (message) => {
  const emojiScore = (emojiCount * 0.1) + (uniqueEmojiTypes * 0.05);
  const threadScore = (replyCount * 0.15) + (uniqueRepliers * 0.2);
  const contentScore = analyzeKeywords(message.text) * 0.3;
  const squadMultiplier = getSquadImportanceMultiplier(message.squad);
  
  return Math.min((emojiScore + threadScore + contentScore) * squadMultiplier, 1.0);
};
```

**Testing Strategy:**
1. Calculate scores for existing messages with known importance
2. Compare against manual importance rankings
3. Adjust weights based on accuracy
4. Test edge cases (no reactions, long threads, etc.)

### Phase 3: Dashboard UI Development (Week 3-4)

#### 3.1 Home Dashboard - Message Organization
**Priority: Critical**

```typescript
// Main dashboard component
- Group messages by Squad/Product
- Display with importance-based ordering
- Show parent message with thread preview
- Implement dismiss functionality
```

**Components to Build:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/MessageCard.tsx`
- `frontend/src/components/SquadSection.tsx`
- `frontend/src/components/ThreadPreview.tsx`

**UI Structure:**
```
Dashboard
├── Daily Summary (AI-generated)
├── Squad Sections (Core RCM, Voice, HITL, etc.)
│   ├── Message Cards (sorted by importance)
│   │   ├── Parent Message
│   │   ├── Importance Score Badge
│   │   ├── Tags
│   │   └── Thread Count
│   └── Show More/Less
└── Dismissed Messages (collapsible)
```

**Testing Strategy:**
1. Load real messages from each squad
2. Verify correct grouping and sorting
3. Test message interaction (expand, dismiss)
4. Validate responsive design

#### 3.2 Thread Detail Modal
**Priority: High**

```typescript
// Full thread view component
- Display parent message with full context
- Show all replies in chronological order
- Allow tag editing and importance adjustment
- Provide dismiss/mark as read functionality
```

**Components to Build:**
- `frontend/src/components/ThreadModal.tsx`
- `frontend/src/components/MessageThread.tsx`
- `frontend/src/components/TagEditor.tsx`

**Testing Strategy:**
1. Open threads from different channels
2. Test tag editing functionality
3. Verify thread context and formatting
4. Test keyboard navigation and accessibility

### Phase 4: AI Summarization (Week 4-5)

#### 4.1 Daily Summary Generation
**Priority: High**

```typescript
// Implement daily digest creation
- Aggregate messages from previous day
- Generate executive summary using OpenAI
- Highlight key decisions and action items
- Include activity metrics and trends
```

**Summary Prompt Strategy:**
```
Analyze these Slack messages from our product teams:

Messages: {grouped_by_squad_messages}
Squads: Voice AI, Core RCM, HITL, ThoughtHub, etc.

Create an executive summary including:
1. Key developments and decisions
2. Blocking issues or concerns
3. Notable achievements
4. Action items requiring follow-up
5. Overall team sentiment and momentum

Keep it concise but comprehensive for a product operations manager.
```

**Files to Create/Modify:**
- `backend/src/services/summaryService.ts`
- `frontend/src/components/DailySummary.tsx`
- `backend/src/schedulers/dailySummaryJob.ts`

**Testing Strategy:**
1. Generate summaries from real message data
2. Compare AI summaries with manual daily reports
3. Test summary quality across different message volumes
4. Validate summary storage and retrieval

### Phase 5: Advanced Features (Week 5-6)

#### 5.1 Message Search & Filtering
**Priority: Medium**

```typescript
// Implement comprehensive search
- Full-text search across messages
- Filter by date range, channel, user, tags
- Search within specific squads/products
- Save search queries for repeated use
```

**Components to Build:**
- `frontend/src/pages/Messages.tsx`
- `frontend/src/components/SearchFilters.tsx`
- `frontend/src/components/MessageList.tsx`

#### 5.2 Custom Reports
**Priority: Medium**

```typescript
// Implement report generation
- Select date ranges, squads, and tags
- Generate custom summaries and analytics
- Export reports as PDF or markdown
- Schedule recurring reports
```

**Components to Build:**
- `frontend/src/pages/Reports.tsx`
- `frontend/src/components/ReportBuilder.tsx`
- `backend/src/services/reportService.ts`

#### 5.3 Learning System
**Priority: Medium**

```typescript
// Implement tag correction learning
- Allow manual tag corrections
- Store corrections in associations.json
- Improve future tagging accuracy
- Track learning effectiveness metrics
```

**Files to Create/Modify:**
- `backend/src/services/learningService.ts`
- `frontend/src/components/TagCorrection.tsx`
- `backend/src/utils/learningAlgorithm.ts`

### Phase 6: Analytics & Optimization (Week 6-7)

#### 6.1 Analytics Dashboard
**Priority: Low**

```typescript
// Implement analytics and insights
- Team activity levels over time
- Most active channels and users
- Tag distribution and trends
- Message volume and engagement metrics
```

**Components to Build:**
- `frontend/src/pages/Analytics.tsx`
- `frontend/src/components/ActivityChart.tsx`
- `frontend/src/components/MetricsCard.tsx`

---

## 🧪 Testing Strategy with Real Slack Data

### Testing Environment Setup

#### 1. Create Test Slack Workspace
```bash
# Option 1: Use existing workspace (recommended)
- Connect to your actual product team Slack
- Start with read-only access to minimize disruption
- Focus on channels: thoughtful-access-voice-ai, hitl-squad, portal-aggregator

# Option 2: Create dedicated test workspace
- Invite core team members
- Recreate channel structure
- Import historical messages (if possible)
```

#### 2. Test Data Collection Strategy
```typescript
// Start with specific channels for each squad
const testChannels = {
  voice: ['thoughtful-access-voice-ai', 'nox-health', 'orthofi'],
  hitl: ['hitl-squad', 'biowound', 'legent'],
  coreRcm: ['thoughtful-epic', 'portal-aggregator'],
  general: ['product', 'core-engineering']
};

// Collect 7 days of messages initially
// Expand to 30 days once basic functionality works
```

### Validation Tests

#### 1. Squad Classification Accuracy
```typescript
// Test: Can the system correctly identify which squad a message belongs to?
const testCases = [
  {
    message: "Voice AI accuracy improved to 94% in OrthoFi integration",
    expectedSquad: "voice",
    channel: "orthofi"
  },
  {
    message: "Portal aggregator processing 2.3M transactions daily",
    expectedSquad: "core-rcm",
    channel: "portal-aggregator"
  }
  // Add 50+ real examples
];

// Success criteria: >85% accuracy
```

#### 2. Importance Scoring Validation
```typescript
// Test: Do importance scores align with human judgment?
const manualImportanceRatings = [
  { messageId: "msg_001", humanRating: 0.9, reason: "Major deployment announcement" },
  { messageId: "msg_002", humanRating: 0.6, reason: "Routine update" },
  // Rate 100+ real messages manually
];

// Success criteria: Correlation coefficient >0.7 with human ratings
```

#### 3. Tag Accuracy Assessment
```typescript
// Test: Are AI-generated tags relevant and complete?
const tagValidationTests = [
  {
    message: "Just deployed the new authentication system to staging",
    expectedTags: ["deployment", "authentication", "staging"],
    squadContext: "general"
  }
  // Add 200+ real examples
];

// Success criteria: >80% tag precision, >70% tag recall
```

#### 4. Summary Quality Evaluation
```typescript
// Test: Are daily summaries comprehensive and accurate?
const summaryTests = [
  {
    date: "2025-08-21",
    keyEvents: [
      "Voice AI beta testing shows 87% satisfaction",
      "Authentication system deployed to staging",
      "Portal aggregator integration completed"
    ],
    expectedInSummary: ["voice AI", "authentication", "portal"],
    actualSummary: "" // Generated by AI
  }
];

// Success criteria: All key events mentioned, no hallucinations
```

### Performance Testing

#### 1. Real-time Processing
```bash
# Test message processing speed
- Target: <2 seconds from Slack webhook to dashboard update
- Test with burst of 10+ messages in quick succession
- Verify no message loss during peak activity
```

#### 2. API Response Times
```bash
# Test dashboard loading performance
GET /api/messages/dashboard  # Target: <1 second
GET /api/summaries/daily     # Target: <500ms
GET /api/squads/hierarchy    # Target: <200ms
```

#### 3. OpenAI Rate Limiting
```typescript
// Test AI service resilience
- Process 100+ messages in batches
- Verify graceful handling of rate limits
- Test fallback behaviors when API is unavailable
```

### User Acceptance Testing

#### 1. Product Manager Workflow
```typescript
// Scenario: Daily morning routine
1. Open dashboard at 9 AM
2. Review overnight messages by importance
3. Read AI-generated daily summary
4. Drill into specific squad activities
5. Dismiss non-actionable messages
6. Flag items requiring follow-up

// Success criteria: Complete workflow in <10 minutes
```

#### 2. Cross-Squad Visibility
```typescript
// Scenario: Understanding dependencies
1. Search for messages mentioning "Epic integration"
2. Filter to show Core RCM and Voice squad interactions
3. Generate custom report for stakeholder update

// Success criteria: Find relevant cross-squad discussions
```

### Continuous Monitoring

#### 1. Data Quality Metrics
```typescript
const monitoringMetrics = {
  messageIngestionRate: "messages/hour",
  tagAccuracyTrend: "weekly accuracy percentage",
  userEngagement: "daily active users",
  dismissalRate: "percentage of messages dismissed",
  searchUsage: "searches per user per day"
};
```

#### 2. Error Tracking
```typescript
// Monitor and alert on:
- Slack API connection failures
- OpenAI API errors or timeouts
- Message processing failures
- User authentication issues
```

---

## 🎯 Success Criteria

### Phase 1 Success Metrics
- [ ] Successfully authenticate with Slack workspace
- [ ] Fetch and display messages from all configured channels
- [ ] Real-time message updates working
- [ ] Message data structure matches schema

### Phase 2 Success Metrics
- [ ] AI tagging accuracy >80% on validation set
- [ ] Importance scores correlate >0.7 with human ratings
- [ ] Processing time <2 seconds per message
- [ ] All OpenAI errors handled gracefully

### Phase 3 Success Metrics
- [ ] Dashboard loads in <2 seconds
- [ ] Users can complete daily review in <10 minutes
- [ ] Thread details display correctly for all message types
- [ ] Mobile responsive design works

### Phase 4 Success Metrics
- [ ] Daily summaries capture all major events
- [ ] No hallucinated information in summaries
- [ ] Summary generation completes in <30 seconds
- [ ] Users find summaries useful (>4/5 rating)

### Final Success Metrics
- [ ] Product managers use daily (5+ days/week)
- [ ] Reduces time spent monitoring Slack by >50%
- [ ] Improves cross-team visibility (measurable via surveys)
- [ ] Zero critical bugs in production for 2+ weeks

---

## 🚨 Risk Mitigation

### Technical Risks
1. **Slack Rate Limiting**: Implement exponential backoff and message queuing
2. **OpenAI Costs**: Set monthly budget limits and optimize prompt efficiency
3. **Data Accuracy**: Implement human feedback loops and accuracy monitoring
4. **Performance Issues**: Use caching, pagination, and lazy loading

### Product Risks
1. **Low Adoption**: Involve target users in design process, gather feedback early
2. **Information Overload**: Start with conservative filtering, allow customization
3. **Privacy Concerns**: Implement proper access controls and audit logging
4. **Maintenance Overhead**: Build comprehensive monitoring and alerting

### Business Risks
1. **Slack API Changes**: Monitor Slack changelog, implement version handling
2. **Cost Escalation**: Monitor usage metrics, implement cost controls
3. **Team Changes**: Document thoroughly, implement knowledge transfer

---

## 📞 Next Steps

### Immediate Actions (Next 24 hours)
1. **Set up Slack App**: Create development Slack app with required scopes
2. **Configure Environment**: Add Slack and OpenAI API keys to .env
3. **Test Squad Configuration**: Run `./scripts/test-squads.js` to verify setup
4. **Start Development**: Begin with Phase 1.1 - Slack Authentication

### Week 1 Goals
1. Complete Slack integration and message fetching
2. Test with real data from 2-3 channels
3. Implement basic message display in dashboard
4. Get feedback from primary user (you!)

### Decision Points
1. **Squad vs Product Organization**: Confirm final preference after seeing real data
2. **Importance Score Weights**: Adjust based on real message analysis
3. **AI Model Selection**: Test GPT-4 vs GPT-3.5-turbo for cost/accuracy balance
4. **Deployment Strategy**: Choose between Vercel, Railway, or hybrid approach

Ready to start building! 🚀