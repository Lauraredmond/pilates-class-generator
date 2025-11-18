# Render.com Deployment Guide

This guide walks you through deploying the Pilates Class Generator backend to Render.com.

## Prerequisites

- GitHub repository: `https://github.com/Lauraredmond/pilates-class-generator`
- Render.com account (sign up at https://render.com)
- Supabase credentials (from your `.env` file)

## Step-by-Step Deployment

### 1. Sign Up / Log In to Render
Go to https://render.com and sign in with GitHub

### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect to your GitHub repository: `Lauraredmond/pilates-class-generator`
3. Click **"Connect"**

### 3. Configure Service Settings

**Basic Settings:**
- **Name:** `pilates-class-generator-api` (or any name you prefer)
- **Region:** Oregon (US West) or closest to you
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:** `cd backend && pip install -r requirements.txt`
- **Start Command:** `cd backend && uvicorn api.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Select **Free** tier

### 4. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```
SUPABASE_URL=https://lixvcebtwusmaipodcpc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeHZjZWJ0d3VzbWFpcG9kY3BjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEzNzA0MiwiZXhwIjoyMDc4NzEzMDQyfQ.-4z1GKTM5csj5hO3rY34xG4ZvAoWwIEabVajOY_fiXM
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeHZjZWJ0d3VzbWFpcG9kY3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzcwNDIsImV4cCI6MjA3ODcxMzA0Mn0.BkuYbF3eqSbZi2ILnAFkE3pyTPu-d4FRg1PNP1nfD6Y
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE
PYTHON_VERSION=3.11.0
```

**Optional (can leave empty for now):**
```
REDIS_URL=(leave empty - not using Redis yet)
MCP_PLAYWRIGHT_URL=(leave empty - not using MCP yet)
```

### 5. Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying (takes 3-5 minutes)
3. Watch the logs for any errors

### 6. Get Your Backend URL
Once deployed, you'll get a URL like:
```
https://pilates-class-generator-api.onrender.com
```

### 7. Test the Backend
Visit:
```
https://your-render-url.onrender.com/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### 8. Update Frontend Environment Variable

Go to **Netlify Dashboard** → **Site settings** → **Environment variables**

Update:
```
VITE_API_URL = https://your-render-url.onrender.com
```

Then trigger a new deploy in Netlify.

## Important Notes

### Free Tier Limitations
- **Spins down after 15 minutes of inactivity**
- First request after spin-down takes ~30 seconds
- 750 hours/month of usage (plenty for development)

### Keeping Service Awake (Optional)
To prevent spin-down, you can:
1. Upgrade to paid tier ($7/month for starter)
2. Use a service like UptimeRobot to ping your health endpoint every 14 minutes

### CORS Configuration
The backend is already configured to allow requests from any origin in development. For production, you may want to restrict CORS to only your Netlify domain.

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Verify `requirements.txt` is in `backend/` folder
- Ensure Python version is 3.11

### Service Crashes on Start
- Check the logs for error messages
- Verify all environment variables are set correctly
- Make sure Supabase credentials are correct

### Health Check Fails
- Verify the start command is correct
- Check if port is binding correctly (should use `$PORT` environment variable)
- Look for errors in service logs

## Monitoring

After deployment, you can:
- View logs in Render dashboard
- Monitor uptime and performance
- Set up email alerts for service failures

---

**Deployment completed successfully?** Update `VITE_API_URL` in Netlify and your app will be fully functional!
