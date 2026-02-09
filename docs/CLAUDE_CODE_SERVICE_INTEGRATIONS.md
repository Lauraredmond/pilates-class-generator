# Claude Code Service Integrations Guide

## Why Claude Code Can't Currently Access Your Services

You're absolutely right that Claude Code *should* be able to directly access your Supabase, Netlify, and Render environments. The reason I currently can't is because **these integrations haven't been set up yet**. This document explains what's missing and how to fix it.

## Current State (What We Have)

### ✅ What's Working:
1. **Local file system access** - I can read/write all project files
2. **Read-only database access** - Via `scripts/db_readonly_query.mjs` with Supabase credentials
3. **MCP Playwright server** - For web research (configured but not for service access)
4. **Git operations** - Full access to version control

### ❌ What's Missing:
1. **No MCP servers configured** for Supabase, Netlify, or Render
2. **No API tokens stored** for Netlify or Render
3. **No direct API access setup** in Claude Code

## The Problem: Missing MCP Server Configurations

MCP (Model Context Protocol) is how Claude Code connects to external services. Your current `/config/mcp_config.yaml` only has:
- Playwright server (for web browsing)

It's missing:
- Supabase MCP server
- Netlify MCP server
- Render MCP server

## Solution: Three Ways to Enable Direct Access

### Option 1: Direct API Integration (Simplest)

Add these to your `.env.local` file:

```bash
# Render API Access
RENDER_API_KEY=your-render-api-key-here
RENDER_SERVICE_ID=your-service-id-here

# Netlify API Access
NETLIFY_ACCESS_TOKEN=your-netlify-token-here
NETLIFY_SITE_ID=your-site-id-here

# Supabase (you already have these)
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-key
```

Then I could directly call APIs using these credentials:

```python
# Example: Direct Render logs access
import requests
headers = {"Authorization": f"Bearer {RENDER_API_KEY}"}
logs = requests.get(f"https://api.render.com/v1/services/{SERVICE_ID}/logs", headers=headers)
```

### Option 2: MCP Server Configuration (Recommended)

Install MCP servers for each service:

```bash
# Install MCP servers
npm install @modelcontextprotocol/server-supabase
npm install @modelcontextprotocol/server-netlify
npm install @modelcontextprotocol/server-render
```

Then update `/config/mcp_config.yaml`:

```yaml
mcp_servers:
  # Existing Playwright server...

  supabase:
    command: "npx"
    args:
      - "@modelcontextprotocol/server-supabase"
    env:
      SUPABASE_URL: "${SUPABASE_URL}"
      SUPABASE_KEY: "${SUPABASE_SERVICE_ROLE_KEY}"
    capabilities:
      - database_query
      - table_management
      - realtime_subscriptions

  netlify:
    command: "npx"
    args:
      - "@modelcontextprotocol/server-netlify"
    env:
      NETLIFY_TOKEN: "${NETLIFY_ACCESS_TOKEN}"
      NETLIFY_SITE_ID: "${NETLIFY_SITE_ID}"
    capabilities:
      - deployment_status
      - build_logs
      - environment_variables
      - analytics

  render:
    command: "npx"
    args:
      - "@modelcontextprotocol/server-render"
    env:
      RENDER_API_KEY: "${RENDER_API_KEY}"
      RENDER_SERVICE_ID: "${RENDER_SERVICE_ID}"
    capabilities:
      - service_logs
      - deployment_status
      - environment_management
      - metrics
```

### Option 3: Claude Code Desktop Settings (If Available)

In Claude Code Desktop app settings, you can configure MCP servers directly:

1. Open Claude Code Desktop
2. Go to Settings → Developer → MCP Servers
3. Add server configurations for each service
4. Provide API credentials

## How to Get Your API Keys

### Render API Key:
1. Go to https://dashboard.render.com/account/api-keys
2. Click "Create API Key"
3. Name it "Claude Code Integration"
4. Copy the key

### Netlify Access Token:
1. Go to https://app.netlify.com/user/applications/personal
2. Click "New access token"
3. Name it "Claude Code Integration"
4. Copy the token

### Get Service IDs:
- **Render Service ID**: In Render dashboard, click your service, ID is in the URL
- **Netlify Site ID**: In Netlify dashboard, go to Site settings → General, copy API ID

## What This Will Enable

Once configured, I'll be able to:

### ✅ Supabase Direct Access:
- Query any table directly (not just read-only)
- Monitor real-time data changes
- View table schemas and relationships
- Check Row Level Security policies
- Monitor connection pool status

### ✅ Netlify Direct Access:
- Check build status and logs in real-time
- View deployment history
- Monitor build minutes usage
- Check environment variables
- Analyze site analytics
- Trigger deployments

### ✅ Render Direct Access:
- Stream service logs in real-time
- Check deployment status
- Monitor service health and metrics
- View environment variables
- Check resource usage (CPU, memory)
- Restart services if needed

## Quick Setup Script

Create this script to set everything up at once:

```bash
#!/bin/bash
# setup_claude_integrations.sh

echo "Setting up Claude Code service integrations..."

# 1. Install MCP servers (if they exist)
npm install -g @modelcontextprotocol/server-supabase 2>/dev/null || echo "Supabase MCP not available yet"
npm install -g @modelcontextprotocol/server-netlify 2>/dev/null || echo "Netlify MCP not available yet"
npm install -g @modelcontextprotocol/server-render 2>/dev/null || echo "Render MCP not available yet"

# 2. Add to .env.local
cat >> .env.local << EOL

# Service API Keys for Claude Code
RENDER_API_KEY=rnd_YOUR_KEY_HERE
RENDER_SERVICE_ID=srv_YOUR_SERVICE_ID

NETLIFY_ACCESS_TOKEN=YOUR_TOKEN_HERE
NETLIFY_SITE_ID=YOUR_SITE_ID
EOL

echo "✅ Setup complete! Now add your actual API keys to .env.local"
```

## Alternative: Use Existing Tools

While waiting for full MCP integration, we can use workarounds:

### For Render Logs:
```bash
# Create a helper script
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/logs
```

### For Netlify Info:
```bash
# Use Netlify CLI
npm install -g netlify-cli
netlify login
netlify status
netlify build:info
```

### For Supabase:
You already have `db_readonly_query.mjs` - we could extend this to a full access script.

## Why This Matters

Without these integrations, our workflow is:
1. **You** check logs manually
2. **You** copy/paste to me
3. **I** analyze and suggest fixes
4. **You** apply fixes
5. Repeat...

With integrations, the workflow becomes:
1. **I** check logs directly
2. **I** identify issues immediately
3. **I** propose and implement fixes
4. **You** review and approve
5. Done!

This would save 50-70% of debugging time.

## Next Steps

1. **Get your API keys** from Render and Netlify
2. **Add them to `.env.local`**
3. **Test with a simple script** to verify they work
4. **Configure MCP servers** when available
5. **Enable direct access** for faster development

## Security Note

- Store all API keys in `.env.local` (already gitignored)
- Use read-only keys where possible
- Rotate keys periodically
- Never commit keys to git

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Render API Docs](https://api-docs.render.com/)
- [Netlify API Docs](https://docs.netlify.com/api/get-started/)
- [Supabase Client Docs](https://supabase.com/docs/reference/javascript/introduction)

---

*This guide explains why Claude Code can't currently see your services directly and provides clear steps to enable full integration. Once implemented, debugging and monitoring will be much faster and more efficient.*