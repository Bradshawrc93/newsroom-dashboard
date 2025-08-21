# Newsroom Dashboard

A personalized Slack dashboard designed for product ops managers to monitor and summarize activities across relevant channels. This app focuses on squads/teams within the product organization.

## 🎯 Key Features

- **Daily Overviews**: Quick summaries of yesterday's Slack activity with AI-generated insights
- **Smart Filtering**: Sort, filter, and search by person, keyword, channel, or squad
- **Learning System**: AI learns associations over time to reduce API calls and improve efficiency
- **Lightweight Storage**: Local data storage with message IDs, tags, and metadata
- **Expandable UI**: Room for future integrations (Notion, weekly reports, etc.)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 📋 Technical Specifications

See [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) for detailed technical requirements and architecture.

## 🛠 Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite for lightweight storage
- **APIs**: Slack API, OpenAI API
- **Styling**: Tailwind CSS
- **State Management**: Zustand

## 📁 Project Structure

```
newsroom-dashboard/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
├── shared/            # Shared types and utilities
├── docs/              # Documentation
└── scripts/           # Build and deployment scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
