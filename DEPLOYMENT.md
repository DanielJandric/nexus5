# Deployment Guide - Cloud Platforms

## 🚀 Railway Deployment (Recommended)

### 1. Prerequisites
- Railway account: https://railway.app
- GitHub repository with your code

### 2. Deploy Steps
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Environment Variables
Set in Railway dashboard:
- `DATABASE_URL` (auto-configured with PostgreSQL addon)
- `OPENAI_API_KEY` (optional)
- `OPENWEATHER_API_KEY` (optional)
- `JWT_SECRET` (generate random string)

### 4. Custom Domain
- Go to Railway dashboard
- Add custom domain in Settings
- Configure DNS CNAME record

---

## 🔷 Heroku Deployment

### 1. Prerequisites
- Heroku account: https://heroku.com
- Heroku CLI installed

### 2. Deploy Steps
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

### 3. Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set INIT_DB=true
heroku config:set OPENAI_API_KEY=your_key
heroku config:set JWT_SECRET=your_secret
```

---

## 🟢 Render Deployment

### 1. Prerequisites
- Render account: https://render.com
- GitHub repository

### 2. Deploy Steps
1. Connect GitHub repository
2. Choose "Web Service"
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node.js

### 3. Database
1. Create PostgreSQL database
2. Copy connection string
3. Set as `DATABASE_URL` environment variable

---

## 🐳 Docker Deployment

### Local Development
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access application
http://localhost:3000
```

### Production Deployment
```bash
# Build image
docker build -t ticket-system .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=your_postgres_url \
  -e NODE_ENV=production \
  ticket-system
```

---

## 🔧 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | development |
| `PORT` | Server port | No | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `INIT_DB` | Initialize database on startup | No | false |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | - |
| `OPENWEATHER_API_KEY` | Weather API key | No | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `LOG_LEVEL` | Logging level | No | info |

---

## 🔍 Health Checks

All platforms support health checks via:
- **Endpoint**: `/api/health`
- **Method**: GET
- **Response**: JSON with system status

---

## 📊 Monitoring

### Built-in Monitoring
- Health check endpoint
- Performance metrics
- Error logging
- Database connection status

### External Monitoring (Optional)
- **Uptime Robot**: Free uptime monitoring
- **New Relic**: Application performance
- **Sentry**: Error tracking
- **LogDNA**: Log aggregation

---

## 🔒 Security Checklist

- ✅ Environment variables secured
- ✅ HTTPS/SSL enabled
- ✅ Database connections encrypted
- ✅ JWT secrets randomized
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation active

---

## 🚀 Quick Start Commands

### Railway (Fastest)
```bash
npx @railway/cli deploy
```

### Heroku
```bash
git push heroku main
```

### Render
```bash
# Connect via GitHub - automatic deployment
```

### Docker
```bash
docker-compose up --build
```

