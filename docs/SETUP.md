# Newsroom Dashboard - Setup Guide

This guide will help you set up the Newsroom Dashboard project for local development.

## Prerequisites

- Node.js 18+ 
- npm 8+
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newsroom-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   # From the root directory
   npm run dev
   ```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Environment Configuration

### Required API Keys

1. **Slack API**
   - Create a Slack app at https://api.slack.com/apps
   - Get your Client ID, Client Secret, and Bot Token
   - Add the following OAuth scopes:
     - `channels:read`
     - `channels:history`
     - `users:read`
     - `users:read.email`

2. **OpenAI API**
   - Get an API key from https://platform.openai.com/api-keys
   - Ensure you have access to GPT-4

### Environment Variables

Copy `env.example` to `.env` and fill in the following:

```env
# Slack Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-your_bot_token
SLACK_USER_TOKEN=xoxp-your_user_token

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_key_here
```

## Project Structure

```
newsroom-dashboard/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API service functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── public/        # Static assets
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── routes/        # API route definitions
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── prisma/        # Database schema and migrations
├── shared/            # Shared types and utilities
│   └── src/
│       ├── types/         # Common type definitions
│       └── utils/         # Shared utility functions
└── docs/              # Documentation
```

## Development Workflow

### Backend Development

1. **Database changes**
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npm run db:migrate
   npm run db:generate
   ```

2. **API development**
   ```bash
   cd backend
   npm run dev  # Starts with hot reload
   ```

3. **Testing**
   ```bash
   cd backend
   npm run test
   ```

### Frontend Development

1. **Component development**
   ```bash
   cd frontend
   npm run dev  # Starts with hot reload
   ```

2. **Testing**
   ```bash
   cd frontend
   npm run test
   npm run test:ui  # Visual test runner
   ```

### Shared Package

1. **Building shared types**
   ```bash
   cd shared
   npm run build
   ```

## Database Management

### Prisma Studio

View and edit your database through Prisma Studio:

```bash
cd backend
npm run db:studio
```

### Database Migrations

```bash
cd backend
# Create a new migration
npm run db:migrate

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in the respective package.json or .env file
   - Kill the process using the port: `lsof -ti:3000 | xargs kill -9`

2. **Database connection issues**
   - Ensure the DATABASE_URL is correct in .env
   - Run `npm run db:generate` to regenerate Prisma client

3. **API key issues**
   - Verify all API keys are correct in .env
   - Check API key permissions and scopes

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Rebuild shared package: `cd shared && npm run build`

### Getting Help

- Check the [Technical Specifications](./TECHNICAL_SPECS.md)
- Review the API documentation
- Check the logs in the console for error messages

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.
