// Vercel serverless API for Newsroom Dashboard
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import our squad configuration
const { squadConfigManager } = require('./squads');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Squad API endpoints
app.get('/api/squads', (req, res) => {
  try {
    const squads = squadConfigManager.getAllSquads();
    res.json({
      success: true,
      data: squads,
      message: 'Squads retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/squads/main', (req, res) => {
  try {
    const squads = squadConfigManager.getMainSquads();
    res.json({
      success: true,
      data: squads,
      message: 'Main squads retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/squads/hierarchy', (req, res) => {
  try {
    const mainSquads = squadConfigManager.getMainSquads();
    const hierarchy = mainSquads.map(squad => {
      const subsquads = squadConfigManager.getSubsquads(squad.id);
      const allChannels = squadConfigManager.getSquadChannels(squad.id);
      const allPeople = squadConfigManager.getSquadPeople(squad.id);
      const allTags = squadConfigManager.getSquadTags(squad.id);

      return {
        squad,
        subsquads,
        channelCount: allChannels.length,
        peopleCount: allPeople.length,
        tagCount: allTags.length,
      };
    });

    res.json({
      success: true,
      data: hierarchy,
      message: 'Squad hierarchy retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/squads/stats', (req, res) => {
  try {
    const allSquads = squadConfigManager.getAllSquads();
    const mainSquads = squadConfigManager.getMainSquads();
    const subsquads = allSquads.filter(squad => squad.parentSquad);

    let totalChannels = 0;
    let totalPeople = 0;
    let totalTags = 0;

    allSquads.forEach(squad => {
      totalChannels += squad.channels.length;
      totalPeople += squad.people.length;
      totalTags += squad.tags.length;
    });

    const stats = {
      totalSquads: allSquads.length,
      totalMainSquads: mainSquads.length,
      totalSubsquads: subsquads.length,
      totalChannels,
      totalPeople,
      totalTags,
    };

    res.json({
      success: true,
      data: stats,
      message: 'Squad statistics retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/squads/:squadId', (req, res) => {
  try {
    const { squadId } = req.params;
    const squad = squadConfigManager.getSquad(squadId);
    
    if (!squad) {
      return res.status(404).json({
        success: false,
        error: 'Squad not found',
      });
    }

    res.json({
      success: true,
      data: squad,
      message: 'Squad retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/squads/:parentSquadId/subsquads', (req, res) => {
  try {
    const { parentSquadId } = req.params;
    const subsquads = squadConfigManager.getSubsquads(parentSquadId);
    
    res.json({
      success: true,
      data: subsquads,
      message: 'Subsquads retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Mock authentication endpoints for testing
app.post('/api/auth/slack-login', (req, res) => {
  // Mock response for testing
  res.json({
    success: true,
    data: {
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        teamId: 'test-team',
        teamName: 'Test Team',
        accessToken: 'mock-token',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      channels: [],
    },
    message: 'Mock authentication successful',
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: false,
    },
    message: 'Authentication status retrieved',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Export for Vercel
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  });
}
