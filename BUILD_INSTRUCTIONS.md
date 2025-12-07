# 🏗️ Build Instructions

## Important: Environment Variables Required

Your application **requires** environment variables to build successfully. The build will fail if these are not configured.

---

## For Local Development

### 1. Create `.env.local`

```bash
cp .env.local.example .env.local
```

### 2. Add Your Supabase Credentials

Edit `.env.local` with your Supabase project details:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### 3. Build

```bash
npm install
npm run build
```

---

## For Production (Hostinger)

### 1. Create `.env.production`

```bash
cp .env.production.example .env.production
```

### 2. Add Production Credentials

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
NODE_ENV=production
```

### 3. Build on Server

After uploading to Hostinger:

```bash
npm install --production=false
npm run build
```

---

## Common Build Errors

### Error: "supabaseUrl is required"

**Cause**: Environment variables not set

**Solution**: 
1. Ensure `.env.local` (dev) or `.env.production` (prod) exists
2. Verify file contains all required Supabase variables
3. Restart build

### Error: "Module not found"

**Cause**: Dependencies not installed

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: TypeScript errors

The build is configured to ignore TypeScript errors in production:
```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: true
}
```

If you want strict TypeScript checking, set `ignoreBuildErrors: false`

---

## Build Output

Successful build creates:
- `.next/` folder with optimized production files
- Static assets in `.next/static/`
- Server components in `.next/server/`

**Build size**: Approximately 100-200 MB (typical for Next.js apps)

---

## Next Steps After Building

### Local Development
```bash
npm start
# Visit http://localhost:3000
```

### Production (Hostinger)
```bash
pm2 start ecosystem.config.js
# or
npm start
```

---

## Environment Variable Priority

Next.js loads environment variables in this order (highest priority first):

1. `.env.production.local` (production only, ignored by Git)
2. `.env.local` (loaded in all environments except test, ignored by Git)
3. `.env.production` (production only)
4. `.env.development` (development only)
5. `.env` (all environments)

For Hostinger deployment, use **`.env.production`**

---

## Security Notes

⚠️ **NEVER** commit these files to Git:
- `.env.local`
- `.env.production`
- `.env*.local`

✅ These are already in `.gitignore`

---

## Need Help?

- Check `HOSTINGER_DEPLOYMENT_GUIDE.md` for full deployment steps
- See `DEPLOYMENT_CHECKLIST.md` for pre-deployment verification
- See `QUICK_DEPLOY.md` for rapid deployment guide
