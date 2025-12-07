# 🚀 Hostinger Deployment Guide for HeyProData

## Prerequisites Checklist

- ✅ Hostinger Cloud/Business Hosting with Node.js support
- ✅ Supabase project configured with database tables
- ✅ Node.js 18+ installed on your hosting
- ✅ SSH access to your Hostinger server
- ✅ Domain/subdomain configured

---

## 📋 Deployment Overview

Your application will be deployed using the following stack:
- **Frontend & Backend**: Next.js 15 (runs on Node.js)
- **Database**: Supabase (PostgreSQL)
- **Process Manager**: PM2 (for keeping app running)
- **Port**: 3000 (default, configurable)

---

## 🔧 Step 1: Prepare Environment Variables

### 1.1 Create Production Environment File

On your LOCAL machine, create `.env.production` file:

```bash
cp .env.production.example .env.production
```

### 1.2 Fill in Your Supabase Credentials

Edit `.env.production` with your actual values:

```env
# Get from: https://app.supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Your production domain (update after knowing your domain)
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com

GOOGLE_ANALYTICS_ID=
NODE_ENV=production
PORT=3000
```

**Important**: Keep `.env.production` file SECURE. Never commit it to Git!

---

## 🏗️ Step 2: Build Your Application Locally

### 2.1 Test Production Build

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Create production build
npm run build

# Test production build locally
npm start
```

If the build succeeds and runs on `http://localhost:3000`, you're ready!

---

## 📤 Step 3: Upload to Hostinger

### Method A: Using Git (Recommended)

#### 3.1 Connect via SSH

```bash
ssh username@your-server-ip
```

#### 3.2 Navigate to Your Web Directory

```bash
cd ~/public_html
# or cd ~/domains/yourdomain.com/public_html
```

#### 3.3 Clone Your Repository

```bash
git clone <your-repository-url> heyprodata
cd heyprodata
```

#### 3.4 Upload Environment Variables

On your LOCAL machine, securely copy `.env.production`:

```bash
scp .env.production username@your-server-ip:~/public_html/heyprodata/.env.production
```

### Method B: Using FTP/SFTP

1. Use FileZilla or similar FTP client
2. Connect to your Hostinger server
3. Upload entire project folder to `public_html/heyprodata/`
4. Upload `.env.production` file separately

**IMPORTANT**: Do NOT upload:
- `node_modules/` (will install on server)
- `.next/` (will build on server)
- `.git/` (optional, but recommended to keep)

---

## ⚙️ Step 4: Setup on Hostinger Server

### 4.1 SSH into Your Server

```bash
ssh username@your-server-ip
```

### 4.2 Navigate to Project Directory

```bash
cd ~/public_html/heyprodata
```

### 4.3 Verify Node.js Version

```bash
node --version
# Should be v18.x or higher
```

If Node.js version is too old, update via Hostinger control panel:
- Go to **Advanced → Select PHP Version**
- Select **Node.js** section
- Choose **Node.js 18 LTS** or higher

### 4.4 Install Dependencies

```bash
npm install --production=false
```

### 4.5 Build the Application

```bash
npm run build
```

This will create optimized production build in `.next/` folder.

---

## 🚀 Step 5: Run the Application

### Option A: Using PM2 (Recommended for Production)

#### 5.1 Install PM2 Globally

```bash
npm install -g pm2
```

#### 5.2 Create Logs Directory

```bash
mkdir -p logs
```

#### 5.3 Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

#### 5.4 Setup PM2 to Start on Server Reboot

```bash
pm2 startup
pm2 save
```

#### 5.5 Verify Application is Running

```bash
pm2 status
pm2 logs heyprodata
```

### Option B: Using npm start (Basic)

```bash
# Run in foreground (will stop when you close SSH)
npm start

# Or run in background using nohup
nohup npm start > logs/app.log 2>&1 &
```

---

## 🌐 Step 6: Configure Domain & Proxy

### 6.1 Setup Reverse Proxy in Hostinger

Your Next.js app runs on port 3000, but you need to access it via your domain.

#### Via Hostinger Control Panel:

1. Go to **Advanced → Node.js**
2. Click **Create Application**
3. Fill in:
   - **Application Root**: `/public_html/heyprodata`
   - **Application URL**: `https://yourdomain.com`
   - **Application Startup File**: `ecosystem.config.js` or leave default
   - **Node.js Version**: 18.x or higher
4. Click **Create**

#### Via Apache .htaccess (Alternative):

Create `/public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTP:X-Forwarded-Proto} !https
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### 6.2 Update Environment Variable

Edit `.env.production` on server:

```bash
nano .env.production
```

Update:
```env
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

Save (Ctrl+X, Y, Enter)

### 6.3 Restart Application

```bash
pm2 restart heyprodata
# or
pm2 reload ecosystem.config.js
```

---

## ✅ Step 7: Verify Deployment

### 7.1 Check Application Health

Visit in your browser:
- `https://yourdomain.com` - Should show your app
- `https://yourdomain.com/api/health` - Should return health check

### 7.2 Monitor Logs

```bash
# View PM2 logs
pm2 logs heyprodata

# View error logs
tail -f logs/pm2-error.log

# View output logs
tail -f logs/pm2-out.log
```

### 7.3 Check PM2 Status

```bash
pm2 status
```

Should show:
```
┌─────┬──────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ restart │ uptime   │
├─────┼──────────────┼─────────┼─────────┼──────────┤
│ 0   │ heyprodata   │ online  │ 0       │ 5m       │
└─────┴──────────────┴─────────┴─────────┴──────────┘
```

---

## 🔄 Step 8: Deploy Updates (Future Updates)

When you make changes to your app:

### 8.1 Pull Latest Changes

```bash
cd ~/public_html/heyprodata
git pull origin main
```

### 8.2 Install New Dependencies (if any)

```bash
npm install
```

### 8.3 Rebuild Application

```bash
npm run build
```

### 8.4 Restart PM2

```bash
pm2 restart heyprodata
# or for zero-downtime restart:
pm2 reload heyprodata
```

---

## 🛠️ Useful PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs heyprodata

# View only error logs
pm2 logs heyprodata --err

# Monitor CPU/Memory
pm2 monit

# Restart app
pm2 restart heyprodata

# Stop app
pm2 stop heyprodata

# Delete app from PM2
pm2 delete heyprodata

# View detailed info
pm2 show heyprodata
```

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env.production
PORT=3001
```

### Issue: Application crashes on startup

```bash
# Check error logs
pm2 logs heyprodata --err

# Common causes:
# 1. Missing environment variables
# 2. Node.js version mismatch
# 3. Build files missing (.next folder)
```

### Issue: "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart heyprodata
```

### Issue: 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check if port is correct in proxy config
# Verify .htaccess or Node.js app settings
```

### Issue: Environment variables not working

```bash
# Verify .env.production exists
ls -la | grep .env

# Check file contents (be careful not to expose secrets)
cat .env.production | grep NEXT_PUBLIC

# Restart after env changes
pm2 restart heyprodata
```

---

## 📊 Performance Optimization

### Enable Compression

Next.js has built-in compression. Ensure it's enabled in production.

### Setup CDN (Optional)

For static assets, consider using:
- Cloudflare (free)
- Hostinger's built-in CDN

### Database Optimization

Ensure your Supabase:
- Has proper indexes
- RLS policies are optimized
- Connection pooling is enabled

---

## 🔒 Security Checklist

- ✅ `.env.production` has restricted permissions (600)
  ```bash
  chmod 600 .env.production
  ```

- ✅ Firewall rules configured (if VPS)
  ```bash
  # Allow only necessary ports
  ufw allow 22    # SSH
  ufw allow 80    # HTTP
  ufw allow 443   # HTTPS
  ufw enable
  ```

- ✅ SSL certificate installed (HTTPS)
  - Use Hostinger's free SSL or Let's Encrypt

- ✅ Environment variables never committed to Git
  - Check `.gitignore` includes `.env*`

- ✅ Regular backups configured
  - Database (Supabase has automatic backups)
  - Application files

---

## 📞 Support Resources

### Hostinger Support
- **Live Chat**: Available 24/7 in control panel
- **Knowledge Base**: https://support.hostinger.com

### Next.js Documentation
- **Deployment**: https://nextjs.org/docs/deployment
- **Production Checklist**: https://nextjs.org/docs/going-to-production

### Supabase Documentation
- **Production Checklist**: https://supabase.com/docs/guides/platform/going-to-production

---

## ✨ Quick Reference

### File Locations on Server
```
~/public_html/heyprodata/
├── .env.production          # Environment variables (SECURE)
├── .next/                   # Build output (generated)
├── node_modules/            # Dependencies (installed)
├── ecosystem.config.js      # PM2 configuration
├── package.json             # Project manifest
└── logs/                    # Application logs
```

### Essential Commands
```bash
# Deploy/Update
git pull && npm install && npm run build && pm2 restart heyprodata

# Check status
pm2 status

# View logs
pm2 logs heyprodata --lines 50

# Monitor resources
pm2 monit
```

---

## 🎉 Deployment Complete!

Your HeyProData application should now be live on Hostinger!

**Next Steps:**
1. Test all features on production
2. Setup monitoring/analytics
3. Configure automated backups
4. Setup CI/CD (optional)
5. Monitor performance and errors

**Remember**: After each code change, rebuild and restart:
```bash
npm run build && pm2 restart heyprodata
```

Good luck with your deployment! 🚀
