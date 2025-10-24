# 🚀 Deployment Guide

## 📋 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Face detection models downloaded
- [ ] Application tested locally
- [ ] Production build tested
- [ ] Admin user created
- [ ] Firestore rules updated
- [ ] Storage rules updated

## 🔥 Deploy to Firebase Hosting

Firebase Hosting provides fast, secure hosting for web apps.

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase in Project

```bash
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"
firebase init hosting
```

Select:
- Use existing project (select your project)
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`
- Don't overwrite `dist/index.html` if asked

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy

```bash
firebase deploy --only hosting
```

Your app will be available at: `https://your-project.web.app`

### Optional: Custom Domain

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow DNS configuration steps
4. Wait for SSL certificate provisioning

## ☁️ Deploy to Vercel

Vercel offers excellent performance and DX for React apps.

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
cd "/Users/mac/Desktop/web check in theo dõi thời gian online"
vercel --prod
```

### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - etc.
3. Redeploy

### Optional: Custom Domain

1. Go to Project Settings > Domains
2. Add your domain
3. Configure DNS as instructed

## 🌐 Deploy to Netlify

Netlify is great for static sites with easy deployment.

### Method 1: Drag & Drop

1. Build the project:
```bash
npm run build
```

2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder

### Method 2: Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login:
```bash
netlify login
```

3. Deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Configure Environment Variables

In Netlify Dashboard:
1. Site Settings > Environment Variables
2. Add all Firebase config variables
3. Trigger redeploy

### Optional: Continuous Deployment

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy automatically on push

## 🐳 Deploy with Docker

For containerized deployment.

### 1. Create Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Create nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /models {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Build Docker Image

```bash
docker build -t time-tracking-system .
```

### 4. Run Container

```bash
docker run -p 80:80 time-tracking-system
```

### 5. Deploy to Cloud

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/time-tracking
gcloud run deploy --image gcr.io/PROJECT_ID/time-tracking --platform managed
```

#### AWS ECS
```bash
aws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com
docker tag time-tracking-system:latest aws_account_id.dkr.ecr.region.amazonaws.com/time-tracking-system:latest
docker push aws_account_id.dkr.ecr.region.amazonaws.com/time-tracking-system:latest
```

## 🔧 Environment Variables for Production

Create `.env.production`:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Configuration
VITE_CAPTCHA_INTERVAL_MINUTES=30
VITE_CAPTCHA_MAX_ATTEMPTS=3
VITE_CAPTCHA_TIMEOUT_SECONDS=180
VITE_FACE_CHECK_INTERVAL=5
VITE_FACE_MATCH_THRESHOLD=0.6

# Optional: Analytics
VITE_ANALYTICS_ID=your_analytics_id
```

## 🔒 Security Checklist

### Before Going Live

- [ ] Change all default passwords
- [ ] Update Firebase security rules
- [ ] Enable Firebase App Check
- [ ] Configure CORS properly
- [ ] Set up SSL/HTTPS
- [ ] Enable rate limiting
- [ ] Configure CSP headers
- [ ] Review all API keys
- [ ] Set up monitoring
- [ ] Configure backups

### Firebase Security Rules

Update Firestore Rules:
```javascript
// Tighten production rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add rate limiting
    // Add more specific permissions
    // Remove any test/development rules
  }
}
```

### App Check (Recommended)

1. Enable App Check in Firebase Console
2. Register your domain
3. Add App Check SDK:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-key'),
  isTokenAutoRefreshEnabled: true
});
```

## 📊 Monitoring & Analytics

### Firebase Analytics

Already integrated via Firebase config.

### Error Tracking

Add Sentry:

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

Firebase Performance:

```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # Add other env vars
      
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## 🚦 Health Checks

Create `public/health.json`:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "auto-generated"
}
```

Access via: `https://your-domain.com/health.json`

## 📈 Performance Optimization

### Pre-deployment
- Run `npm run build` and check bundle size
- Analyze with `vite build --mode production`
- Test with Lighthouse
- Optimize images
- Enable compression

### Post-deployment
- Set up CDN (Cloudflare, etc.)
- Enable caching headers
- Monitor Core Web Vitals
- Set up error tracking

## 🔙 Backup Strategy

### Firestore Backup

```bash
# Automated daily backups
gcloud firestore export gs://your-backup-bucket
```

### Code Backup
- Use Git for version control
- Tag releases: `git tag v1.0.0`
- Keep production branch protected

## 📞 Post-Deployment Support

### Monitoring Checklist
- [ ] Check deployment logs
- [ ] Test all critical paths
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test on different devices
- [ ] Check face recognition accuracy
- [ ] Verify CAPTCHA system
- [ ] Test notifications

### Rollback Plan

If issues arise:

```bash
# Firebase Hosting
firebase hosting:rollback

# Vercel
vercel rollback

# Netlify
# Use Netlify dashboard to rollback to previous deploy
```

---

**Deployment Complete! 🎉**

Monitor your application at:
- Firebase Console: https://console.firebase.google.com
- Hosting URL: https://your-project.web.app
- Analytics: Firebase Analytics dashboard

