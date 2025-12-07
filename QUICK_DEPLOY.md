# 🚀 Quick Deploy to Hostinger - TL;DR Version

## Prerequisites
- ✅ Hostinger Cloud/Business hosting with Node.js 18+
- ✅ Supabase configured
- ✅ SSH access to server

---

## 5-Minute Deployment

### 1️⃣ Prepare Locally (2 minutes)

```bash
# Create production environment file
cp .env.production.example .env.production

# Edit with your Supabase credentials
nano .env.production
```

Add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

```bash
# Test build
npm run deploy:check
```

---

### 2️⃣ Upload to Hostinger (1 minute)

**Method A - Git (Recommended):**
```bash
# On your server (SSH)
cd ~/public_html
git clone <your-repo-url> heyprodata
cd heyprodata

# Upload env file from local machine
scp .env.production username@server-ip:~/public_html/heyprodata/
```

**Method B - FTP:**
- Upload project folder via FileZilla
- Upload `.env.production` separately

---

### 3️⃣ Build & Run on Server (2 minutes)

```bash
# SSH into server
ssh username@server-ip

# Navigate to project
cd ~/public_html/heyprodata

# Install & Build
npm install
npm run build

# Install PM2
npm install -g pm2

# Start app
pm2 start ecosystem.config.js

# Auto-start on reboot
pm2 startup
pm2 save
```

---

### 4️⃣ Configure Domain

**Hostinger Control Panel:**
1. Go to **Advanced → Node.js**
2. Create application:
   - Root: `/public_html/heyprodata`
   - URL: `https://yourdomain.com`
   - Node version: 18+
3. Save

---

## ✅ Verify

```bash
# Check status
pm2 status

# View logs
pm2 logs heyprodata

# Test in browser
https://yourdomain.com
https://yourdomain.com/api/health
```

---

## 🔄 Future Updates

```bash
# SSH to server
cd ~/public_html/heyprodata
git pull
npm install
npm run build
pm2 restart heyprodata
```

---

## 🆘 Troubleshooting

**App not starting?**
```bash
pm2 logs heyprodata --err
```

**Port conflict?**
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart heyprodata
```

**Build failing?**
```bash
rm -rf node_modules .next
npm install
npm run build
```

---

## 📚 Full Documentation

- **Complete Guide**: See `HOSTINGER_DEPLOYMENT_GUIDE.md`
- **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Support**: Hostinger 24/7 live chat

---

**That's it! Your app should be live! 🎉**
