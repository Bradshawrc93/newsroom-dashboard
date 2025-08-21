# Deployment Guide - Newsroom Dashboard

This guide will help you deploy the Newsroom Dashboard to a live environment for testing and production use.

## 🚀 Quick Deploy to Vercel (Recommended)

The easiest way to deploy the Newsroom Dashboard is using Vercel, which will host both the frontend and API.

### Prerequisites

1. **Node.js 18+** installed on your machine
2. **Git** for version control
3. **Vercel account** (free at [vercel.com](https://vercel.com))

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# Run the deployment script
./scripts/deploy-vercel.sh
```

Or manually:

```bash
# Install dependencies
cd api && npm install && cd ..
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Deploy to Vercel
vercel --prod
```

### Step 4: Configure Environment Variables

After deployment, go to your Vercel dashboard and add these environment variables:

```bash
# Slack Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret

# Frontend URL (will be your Vercel domain)
FRONTEND_URL=https://your-app.vercel.app
```

## 🔧 Alternative Deployment Options

### Option 1: Railway (Backend) + Vercel (Frontend)

#### Backend on Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Deploy backend:**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Set environment variables in Railway dashboard**

#### Frontend on Vercel

1. **Deploy frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Update API URL in frontend:**
   ```bash
   # Set environment variable in Vercel dashboard
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```

### Option 2: Render (Full Stack)

1. **Connect your GitHub repository to Render**
2. **Create a new Web Service**
3. **Set build command:** `npm run build`
4. **Set start command:** `npm run start`
5. **Add environment variables**

### Option 3: Netlify (Frontend) + Heroku (Backend)

#### Frontend on Netlify

1. **Connect GitHub repository to Netlify**
2. **Set build command:** `cd frontend && npm run build`
3. **Set publish directory:** `frontend/dist`
4. **Add environment variables**

#### Backend on Heroku

1. **Install Heroku CLI**
2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set SLACK_CLIENT_ID=your_id
   heroku config:set SLACK_CLIENT_SECRET=your_secret
   # ... other variables
   ```

## 📋 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SLACK_CLIENT_ID` | Your Slack app client ID | `123456789.123456789` |
| `SLACK_CLIENT_SECRET` | Your Slack app client secret | `your_secret_here` |
| `SLACK_SIGNING_SECRET` | Your Slack app signing secret | `your_signing_secret` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `JWT_SECRET` | Secure random string for JWT | `your_secure_secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

## 🔗 Slack App Configuration

After deployment, update your Slack app settings:

1. **Go to [api.slack.com/apps](https://api.slack.com/apps)**
2. **Select your app**
3. **Update OAuth & Permissions:**
   - Redirect URLs: `https://your-domain.com/auth/callback`
4. **Update Event Subscriptions:**
   - Request URL: `https://your-domain.com/api/slack/events`
5. **Update Interactivity & Shortcuts:**
   - Request URL: `https://your-domain.com/api/slack/interactions`

## 🧪 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Squad API Test

```bash
curl https://your-domain.com/api/squads/hierarchy
```

Expected response:
```json
{
  "success": true,
  "data": [...],
  "message": "Squad hierarchy retrieved successfully"
}
```

### 3. Frontend Test

1. **Visit your deployed URL**
2. **Navigate to `/squads`**
3. **Verify squad hierarchy displays correctly**
4. **Test squad expansion/collapse**

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Frontend can't connect to API
**Solution:** Check `FRONTEND_URL` environment variable

#### 2. Authentication Errors

**Problem:** Slack login not working
**Solution:** Verify Slack app configuration and redirect URLs

#### 3. Build Errors

**Problem:** Frontend build fails
**Solution:** Check Node.js version (requires 18+)

#### 4. API Not Responding

**Problem:** API endpoints return 404
**Solution:** Check Vercel configuration and routes

### Debug Commands

```bash
# Check API health
curl https://your-domain.com/health

# Test squad endpoints
curl https://your-domain.com/api/squads

# Check frontend build
cd frontend && npm run build

# Check API locally
cd api && npm start
```

## 📊 Monitoring

### Vercel Analytics

- **Performance:** Built-in analytics in Vercel dashboard
- **Function logs:** View API function logs
- **Error tracking:** Automatic error reporting

### Custom Monitoring

Add monitoring endpoints:

```bash
# Health check with details
curl https://your-domain.com/health

# Squad statistics
curl https://your-domain.com/api/squads/stats
```

## 🔄 Updates and Maintenance

### Updating the Application

1. **Push changes to GitHub**
2. **Vercel will automatically redeploy**
3. **Or manually trigger:**
   ```bash
   vercel --prod
   ```

### Environment Variable Updates

1. **Go to Vercel dashboard**
2. **Navigate to Settings > Environment Variables**
3. **Update values as needed**
4. **Redeploy if necessary**

### Database/Storage Updates

The application uses JSON files for storage. In production:

1. **Backup existing data**
2. **Update squad configuration**
3. **Redeploy application**
4. **Data will be reinitialized from configuration**

## 🚀 Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Slack app configured with production URLs
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Custom domain configured (optional)
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Performance tested
- [ ] Security reviewed

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Review Vercel deployment logs**
3. **Test locally first**
4. **Check environment variables**
5. **Verify Slack app configuration**

## 🔗 Quick Links

- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Slack API:** [api.slack.com](https://api.slack.com)
- **OpenAI API:** [platform.openai.com](https://platform.openai.com)
- **Project Repository:** Your GitHub repo URL
