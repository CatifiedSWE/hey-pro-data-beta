# 📋 Pre-Deployment Checklist for Hostinger

## ✅ Before You Deploy

### 1. Environment Configuration
- [ ] `.env.production` file created with all required variables
- [ ] Supabase credentials verified and working
- [ ] Production domain URL configured
- [ ] All API keys and secrets are production-ready (not dev/test keys)

### 2. Supabase Setup
- [ ] Supabase project is in production mode (not paused)
- [ ] All database tables created and migrated
- [ ] Row Level Security (RLS) policies enabled and tested
- [ ] Database indexes created for performance
- [ ] Storage buckets created with proper policies
- [ ] Authentication providers configured (Google OAuth if used)
- [ ] Email templates configured (if using email auth)

### 3. Code Quality
- [ ] All console.log() and debug code removed/disabled
- [ ] Error handling implemented for all API routes
- [ ] Loading states and error messages user-friendly
- [ ] No hardcoded URLs or credentials in code
- [ ] All environment variables use proper Next.js prefix (NEXT_PUBLIC_ for client-side)

### 4. Testing
- [ ] Application builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] All pages load without errors
- [ ] Authentication flow works (login, signup, logout)
- [ ] API routes tested and working
- [ ] File uploads work correctly
- [ ] Responsive design tested on mobile/tablet/desktop

### 5. Performance
- [ ] Images optimized (using Next.js Image component)
- [ ] Large dependencies reviewed
- [ ] Unnecessary packages removed
- [ ] Build output size is reasonable
- [ ] API routes have proper error handling and timeouts

### 6. Security
- [ ] `.env*` files added to `.gitignore`
- [ ] No sensitive data in Git repository
- [ ] API routes validate authentication
- [ ] CORS configured properly
- [ ] Rate limiting considered for public endpoints
- [ ] SQL injection prevention (using Supabase parameterized queries)

### 7. Hostinger Requirements
- [ ] Node.js 18+ available on hosting
- [ ] SSH access credentials ready
- [ ] Domain/subdomain configured and pointing to Hostinger
- [ ] SSL certificate will be installed (Hostinger provides free SSL)
- [ ] Sufficient disk space and memory for application

### 8. Deployment Files
- [ ] `ecosystem.config.js` configured for PM2
- [ ] `.env.production.example` created as template
- [ ] `HOSTINGER_DEPLOYMENT_GUIDE.md` reviewed
- [ ] Deployment scripts tested locally

### 9. Post-Deployment Monitoring
- [ ] Error tracking setup (Sentry, LogRocket, or similar)
- [ ] Analytics configured (Google Analytics if used)
- [ ] Uptime monitoring setup (optional but recommended)
- [ ] Backup strategy planned
- [ ] Rollback plan documented

### 10. Documentation
- [ ] README.md updated with production info
- [ ] API documentation current
- [ ] Deployment process documented
- [ ] Team members have access to necessary credentials

---

## 🚨 Critical Security Items

### Environment Variables to NEVER Commit:
```
.env.local
.env.production
.env.development
```

### Verify .gitignore includes:
```gitignore
# Environment
.env
.env.local
.env.production
.env.development
.env*.local

# Build
.next/
out/
build/

# Dependencies
node_modules/

# Logs
logs/
*.log
npm-debug.log*

# PM2
.pm2/
```

---

## 📝 Quick Start Deployment

Once all items above are checked:

1. **Create `.env.production`**
   ```bash
   cp .env.production.example .env.production
   # Edit with your actual values
   ```

2. **Test Build Locally**
   ```bash
   npm install
   npm run build
   npm start
   # Test at http://localhost:3000
   ```

3. **Follow Deployment Guide**
   - See `HOSTINGER_DEPLOYMENT_GUIDE.md` for complete steps

---

## 🎯 Go/No-Go Decision

**READY TO DEPLOY** if:
- ✅ All critical items above are checked
- ✅ Local production build works perfectly
- ✅ Supabase is configured and tested
- ✅ Environment variables are ready
- ✅ Hostinger server is prepared

**DO NOT DEPLOY YET** if:
- ❌ Build fails or has errors
- ❌ Supabase is not properly configured
- ❌ Authentication doesn't work
- ❌ Critical features are broken
- ❌ Environment variables are missing

---

## 📞 Emergency Contacts

**If deployment fails:**
1. Check PM2 logs: `pm2 logs heyprodata`
2. Review Hostinger support: Live chat in control panel
3. Check Supabase logs: Dashboard → Logs
4. Rollback: `git checkout <previous-commit>` and rebuild

---

**Last Updated**: January 2025
**Deployment Target**: Hostinger Cloud/Business Hosting with Node.js
