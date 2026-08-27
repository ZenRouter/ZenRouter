# Installation

Detailed installation guide for ZenRouter with troubleshooting tips.

---

## Requirements

### System Requirements

- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher (comes with Node.js)
- **OS**: macOS, Linux, Windows (WSL recommended)
- **Disk Space**: ~200MB for installation

### Check Your Version

```bash
node --version
# Should show v20.x.x or higher

npm --version
# Should show 10.x.x or higher
```

**Don't have Node.js?** Install from [nodejs.org](https://nodejs.org/)

---

## Installation Methods

### Method 1: Global Installation (Recommended)

Install ZenRouter globally to use from anywhere:

```bash
npm install -g zenrouter
```

**Start ZenRouter:**

```bash
zenrouter
```

**Benefits:**
- ✅ Run from any directory
- ✅ Simple command: `zenrouter`
- ✅ Auto-updates with `npm update -g zenrouter`

### Method 2: Local Installation

Install in a specific project:

```bash
mkdir my-zenrouter
cd my-zenrouter
npm install zenrouter
```

**Start ZenRouter:**

```bash
npx zenrouter
```

**Benefits:**
- ✅ Isolated per project
- ✅ Version control per project
- ✅ No global namespace pollution

### Method 3: From Source (Development)

Clone and build from GitHub:

```bash
git clone https://github.com/ZenRouter/ZenRouter.git
cd zenrouter/app
npm install
npm run build
npm start
```

**Benefits:**
- ✅ Latest development features
- ✅ Contribute to development
- ✅ Custom modifications

---

## First Run

### Start the Server

```bash
zenrouter
```

**What happens:**
1. Server starts on `http://localhost:20128`
2. Dashboard opens automatically in browser
3. Data directory created at `~/.zenrouter`
4. API key generated automatically

### Dashboard Login

**Default credentials:**
- Password: `12345678`

**⚠️ Change password immediately:**
1. Login to dashboard
2. Settings → Change Password
3. Use strong password

### Get Your API Key

```
Dashboard → Settings → API Keys
→ Copy your API key
→ Use in CLI tools
```

**Example API key format:**
```
zen_123456787890abcdef123456787890abcdef
```

---

## Verify Installation

### Check Server Status

```bash
curl http://localhost:20128/health
```

**Expected response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### List Available Models

```bash
curl http://localhost:20128/v1/models \
  -H "Authorization: Bearer your-api-key"
```

**Expected response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "cc/claude-opus-4-5-20251101",
      "object": "model",
      "created": 123456787890,
      "owned_by": "claude-code"
    }
  ]
}
```

### Test Chat Completion

```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cc/claude-opus-4-5-20251101",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

---

## Configuration

### Environment Variables

Create `.env` file or set environment variables:

```bash
# Security (REQUIRED in production)
export JWT_SECRET="your-secure-secret-change-this"
export INITIAL_PASSWORD="your-password"

# Storage
export DATA_DIR="~/.zenrouter"

# Server
export PORT="20128"
export NODE_ENV="production"

# Logging
export ENABLE_REQUEST_LOGS="false"
```

### Data Directory

**Default location:** `~/.zenrouter`

**Contents:**
```
~/.zenrouter/
  ├── db.json           # Database (providers, combos, usage)
  ├── api-keys.json     # API keys
  └── logs/             # Request logs (if enabled)
```

**Change location:**

```bash
export DATA_DIR="/custom/path"
zenrouter
```

### Port Configuration

**Default port:** `20128`

**Change port:**

```bash
export PORT="3000"
zenrouter
```

**Or use command line:**

```bash
zenrouter --port 3000
```

---

## Troubleshooting

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::20128
```

**Solution 1: Kill existing process**

```bash
# Find process using port 20128
lsof -i :20128

# Kill process
kill -9 <PID>
```

**Solution 2: Use different port**

```bash
zenrouter --port 3000
```

### Permission Denied

**Error:**
```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/zenrouter'
```

**Solution: Use sudo (not recommended) or fix npm permissions**

```bash
# Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Then install again
npm install -g zenrouter
```

### Node.js Version Too Old

**Error:**
```
Error: The engine "node" is incompatible with this module
```

**Solution: Update Node.js**

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from nodejs.org
```

### Dashboard Not Opening

**Issue:** Dashboard doesn't open automatically

**Solution 1: Open manually**

```
http://localhost:20128
```

**Solution 2: Check firewall**

```bash
# macOS: Allow Node.js in System Preferences → Security
# Linux: Check iptables
# Windows: Check Windows Firewall
```

### Cannot Connect to Providers

**Issue:** OAuth login fails or API key invalid

**Solution 1: Check internet connection**

```bash
ping google.com
```

**Solution 2: Check provider status**

- Claude Code: [status.anthropic.com](https://status.anthropic.com)
- OpenAI: [status.openai.com](https://status.openai.com)
- Gemini: [status.cloud.google.com](https://status.cloud.google.com)

**Solution 3: Regenerate API key**

```
Dashboard → Provider → Disconnect → Reconnect
```

### High Memory Usage

**Issue:** ZenRouter using too much RAM

**Solution: Restart server**

```bash
# Stop
pkill -f zenrouter

# Start
zenrouter
```

**Or use PM2 for auto-restart:**

```bash
npm install -g pm2
pm2 start zenrouter --name zenrouter
pm2 save
```

---

## Deployment Options

### Local Development

```bash
npm install -g zenrouter
zenrouter
```

**Use case:** Personal coding, testing

### VPS/Cloud Server

```bash
# Install
npm install -g zenrouter

# Configure
export JWT_SECRET="your-secure-secret"
export INITIAL_PASSWORD="your-password"
export NODE_ENV="production"

# Start with PM2
npm install -g pm2
pm2 start zenrouter --name zenrouter
pm2 save
pm2 startup
```

**Use case:** Team access, remote coding

### Docker

```bash
docker pull joyccn/zenrouter:latest

docker run -d \
  -p 20128:20128 \
  -e JWT_SECRET="your-secure-secret" \
  -e INITIAL_PASSWORD="your-password" \
  -v zenrouter-data:/root/.zenrouter \
  --name zenrouter \
  joyccn/zenrouter:latest
```

**Use case:** Containerized deployment, Kubernetes

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:20128;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        
        # SSE support for streaming
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

**Use case:** HTTPS, custom domain, load balancing

---

## Uninstallation

### Remove Global Installation

```bash
npm uninstall -g zenrouter
```

### Remove Data Directory

```bash
rm -rf ~/.zenrouter
```

### Remove Configuration

```bash
# Remove environment variables from shell config
nano ~/.bashrc  # or ~/.zshrc
# Delete zenrouter-related exports
```

---

## Next Steps

- [Getting Started Guide](../getting-started.md) - Connect providers and start coding
- [Features](../features/) - Explore quota tracking, combos, deployment
- [Troubleshooting](../troubleshooting.md) - Fix common issues

---

## Need Help?

- **Website**: [GitHub](https://github.com/ZenRouter/ZenRouter)
- **GitHub**: [github.com/ZenRouter/ZenRouter](https://github.com/ZenRouter/ZenRouter)
- **Issues**: [github.com/ZenRouter/ZenRouter/issues](https://github.com/ZenRouter/ZenRouter/issues)
