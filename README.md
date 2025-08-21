# Newsroom Dashboard

A personalized Slack monitoring application designed for product operations managers. It provides AI-powered summaries of Slack activity across relevant channels, with intelligent filtering and learning capabilities.

## 🎯 Key Features

- **Daily Activity Summaries**: Generate AI-powered summaries of yesterday's Slack activity with morning greetings
- **Smart Filtering**: Enable filtering by person, keyword, channel, or squad with intuitive UI
- **Learning System**: Reduce AI API calls through learned associations and user tagging
- **Lightweight Storage**: Efficient JSON-based data management for easy deployment
- **Expandable Architecture**: Support for future integrations (Notion, etc.)
- **Quick Deployment**: Web-hostable solution without complex database setup

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Slack App credentials
- OpenAI API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newsroom-dashboard
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup.sh
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API credentials
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Open the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Slack API Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Slack App Setup

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Create a new app
3. Add the following OAuth scopes:
   - `channels:read`
   - `channels:history`
   - `users:read`
   - `users:read.email`
4. Set the redirect URL to: `http://localhost:3000/login`
5. Copy the Client ID and Client Secret to your `.env` file

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: Node.js, Express, TypeScript
- **Storage**: JSON files with atomic operations
- **AI**: OpenAI GPT-4 for summarization
- **Authentication**: Slack OAuth 2.0 with JWT

## 📁 Project Structure

```
newsroom-dashboard/
├── backend/           # Node.js/Express API
├── frontend/          # React application
├── shared/            # Shared types and utilities
├── data/              # JSON storage files
├── scripts/           # Build and setup scripts
└── docs/              # Documentation
```

## 📋 Technical Specifications

See [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) for detailed technical requirements and architecture.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run setup` - Install dependencies and build packages

### API Endpoints

- `POST /api/auth/slack-login` - Slack OAuth login
- `GET /api/auth/me` - Get current user
- `GET /api/messages` - Get messages with filters
- `GET /api/channels` - Get connected channels
- `POST /api/summaries/generate` - Generate AI summary
- `GET /api/analytics/usage` - Get usage statistics

## 🚀 Deployment

The application is designed for easy deployment to any web hosting platform:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folders**
   - Frontend: Deploy `frontend/dist` to your web server
   - Backend: Deploy `backend/dist` to your Node.js hosting

3. **Set up environment variables** on your hosting platform

4. **Configure your domain** and update Slack app redirect URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
