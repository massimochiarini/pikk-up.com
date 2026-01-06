# 🚀 Deployment Guide

Complete guide for deploying your Pickup web app to production.

## Option 1: Vercel (Recommended - Easiest)

Vercel is made by the creators of Next.js and offers the best performance.

### Steps:

1. **Push to GitHub**
   ```bash
   cd /Users/massimo/Desktop/pickup/pickup-web
   git init
   git add .
   git commit -m "Initial commit - Pickup web app"
   git branch -M main
   git remote add origin https://github.com/yourusername/pickup-web.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up / Sign in with GitHub
   - Click "New Project"
   - Import your `pickup-web` repository
   - Configure:
     - Framework: Next.js (auto-detected)
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   
   In Vercel dashboard → Settings → Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-project.vercel.app`

### Custom Domain

1. Go to Vercel → Settings → Domains
2. Add your domain (e.g., `pickup.yoursite.com`)
3. Update DNS records as instructed
4. SSL certificate is automatic!

### Automatic Deployments

Every push to `main` branch will automatically deploy to production.

---

## Option 2: Netlify

Similar to Vercel, great for Next.js apps.

### Steps:

1. Push code to GitHub (same as above)
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Connect to GitHub and select your repo
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables in Site Settings → Build & Deploy
7. Deploy!

---

## Option 3: Railway

Good option if you want more control or need a database.

### Steps:

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `pickup-web` repository
5. Add environment variables
6. Railway will auto-detect Next.js and deploy

**Cost:** Free tier includes $5/month credit

---

## Option 4: Self-Hosted (VPS/DigitalOcean/AWS)

For full control and customization.

### Requirements:
- Ubuntu/Debian server
- Node.js 18+ installed
- Nginx (reverse proxy)
- PM2 (process manager)

### Steps:

1. **Install Node.js on server**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone your repository**
   ```bash
   git clone https://github.com/yourusername/pickup-web.git
   cd pickup-web
   npm install
   ```

3. **Create `.env.local`**
   ```bash
   nano .env.local
   # Add your Supabase credentials
   ```

4. **Build the app**
   ```bash
   npm run build
   ```

5. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

6. **Start the app**
   ```bash
   pm2 start npm --name "pickup-web" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable SSL with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Post-Deployment Checklist

### 1. Update Supabase Settings

**Authentication:**
- Go to Supabase → Authentication → URL Configuration
- Add your production URL to "Site URL"
- Add your production URL to "Redirect URLs"

**CORS:**
- Go to Supabase → Settings → API
- Ensure your production domain is allowed

### 2. Update App Links

If you reference URLs in your app (like legal pages), update them:
- `/settings/page.tsx` - Help & FAQ link
- Update any hardcoded URLs to use environment variables

### 3. Configure DNS (if using custom domain)

**For www and non-www:**
```
A Record: @ → Your server IP
CNAME: www → your-project.vercel.app
```

### 4. Update Info.plist (iOS App)

If you want to link from iOS app to web app, add your web URL.

### 5. Test Everything

- [ ] Sign up works
- [ ] Sign in works
- [ ] Creating games works
- [ ] Viewing games works
- [ ] RSVPs work
- [ ] Profile updates work
- [ ] Messages load
- [ ] Settings work
- [ ] Account deletion works
- [ ] Legal pages load

### 6. Monitor Performance

**Vercel:**
- Check Analytics dashboard
- Review Web Vitals

**Self-hosted:**
```bash
pm2 logs pickup-web
pm2 monit
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anon/public key |

**Note:** All variables starting with `NEXT_PUBLIC_` are exposed to the browser.

---

## Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      # Add your deployment steps here
```

---

## Monitoring & Analytics

### Add Google Analytics (Optional)

1. Get your GA4 tracking ID
2. Create `lib/gtag.ts`:
   ```typescript
   export const GA_TRACKING_ID = 'G-XXXXXXXXXX'
   ```
3. Add to `app/layout.tsx`

### Error Tracking (Optional)

Consider adding:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Vercel Analytics** - Built-in with Vercel

---

## Scaling Considerations

When your app grows:

1. **CDN**: Vercel includes this automatically
2. **Database**: Supabase scales with your plan
3. **Caching**: Consider Redis for session storage
4. **Load Balancing**: Multiple server instances
5. **Image Optimization**: Use Supabase Storage or Cloudinary

---

## Rollback Strategy

### Vercel:
- Go to Deployments
- Click "..." on previous deployment
- Click "Promote to Production"

### Self-hosted:
```bash
git log --oneline
git checkout <previous-commit>
npm install
npm run build
pm2 restart pickup-web
```

---

## Security Best Practices

1. ✅ Never commit `.env.local` to Git
2. ✅ Use environment variables for all secrets
3. ✅ Enable Supabase RLS policies
4. ✅ Keep dependencies updated: `npm audit`
5. ✅ Use HTTPS in production (automatic with Vercel/Netlify)
6. ✅ Set up CORS properly in Supabase
7. ✅ Implement rate limiting if needed

---

## Cost Estimates

### Vercel
- **Hobby (Free)**: Perfect for getting started
- **Pro ($20/mo)**: More bandwidth and features
- **Enterprise**: Custom pricing

### Netlify
- **Free**: 100GB bandwidth/month
- **Pro ($19/mo)**: More bandwidth and features

### Railway
- **Free**: $5 monthly credit
- **Developer ($5/mo)**: $5 base + usage

### Self-Hosted (DigitalOcean)
- **Basic Droplet**: $6-12/month
- **+ Domain**: $10-15/year
- **Total**: ~$10-15/month

---

## Need Help?

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)

**Support:** massimochiarini25@gmail.com

