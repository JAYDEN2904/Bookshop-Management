# 🚀 Deployment Guide - Bookshop Management System

This guide covers deployment strategies for both the frontend (React + Vite) and backend (Node.js + Express) components of the Bookshop Management System.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Domain & SSL Setup](#domain--ssl-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)

## 🎯 Prerequisites

### Required Tools
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **PostgreSQL** database
- **Domain name** (optional but recommended)

### Recommended Services
- **Backend Hosting**: Railway, Render, Heroku, or DigitalOcean
- **Frontend Hosting**: Vercel, Netlify, or GitHub Pages
- **Database**: Railway PostgreSQL, Supabase, or AWS RDS
- **File Storage**: AWS S3, Cloudinary, or similar

## 🎨 Deployment Options

### Option 1: Modern Cloud Platforms (Recommended)

#### Backend
- **Railway** - Easy deployment, built-in PostgreSQL
- **Render** - Free tier available, good for Node.js
- **Heroku** - Mature platform, good documentation

#### Frontend
- **Vercel** - Optimized for React/Vite, excellent performance
- **Netlify** - Great for static sites, good free tier
- **GitHub Pages** - Free, good for simple deployments

### Option 2: VPS/Cloud Server

#### Providers
- **DigitalOcean** - $5/month droplets
- **AWS EC2** - Pay-as-you-go
- **Google Cloud Platform** - Free tier available
- **Azure** - Good integration options

### Option 3: Docker Deployment

#### Benefits
- Consistent environments
- Easy scaling
- Portable across platforms

## 🔧 Backend Deployment

### Step 1: Prepare Backend for Production

1. **Update package.json**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy"
  }
}
```

2. **Create production environment file**
```bash
# backend/.env.production
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL="postgresql://username:password@host:5432/bookshop_db"
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

3. **Update server.ts for production**
```typescript
// Add production-specific middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}
```

### Step 2: Deploy to Railway (Recommended)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and initialize**
```bash
railway login
cd backend
railway init
```

3. **Configure environment variables**
```bash
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="your-postgresql-url"
railway variables set JWT_SECRET="your-secret"
railway variables set FRONTEND_URL="https://your-frontend-domain.com"
```

4. **Deploy**
```bash
railway up
```

### Step 3: Deploy to Render

1. **Connect GitHub repository**
2. **Create new Web Service**
3. **Configure build settings**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Set environment variables**
5. **Deploy**

## 🎨 Frontend Deployment

### Step 1: Prepare Frontend for Production

1. **Create environment configuration**
```typescript
// frontend/src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: '/api/auth',
    books: '/api/books',
    students: '/api/students',
    suppliers: '/api/suppliers',
    purchases: '/api/purchases',
    reports: '/api/reports',
  },
};
```

2. **Update Vite configuration**
```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

3. **Create environment files**
```bash
# frontend/.env.production
VITE_API_URL=https://your-backend-domain.com
VITE_APP_NAME=Bookshop Management System
```

### Step 2: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**
   - `VITE_API_URL`: Your backend URL

### Step 3: Deploy to Netlify

1. **Connect GitHub repository**
2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set environment variables**
4. **Deploy**

## 🗄️ Database Setup

### Option 1: Railway PostgreSQL (Recommended)

1. **Create PostgreSQL database**
```bash
railway add
# Select PostgreSQL
```

2. **Get connection string**
```bash
railway variables
```

3. **Run migrations**
```bash
railway run npm run db:migrate
```

### Option 2: Supabase

1. **Create Supabase project**
2. **Get connection string**
3. **Update DATABASE_URL**
4. **Run migrations**

### Option 3: AWS RDS

1. **Create RDS instance**
2. **Configure security groups**
3. **Get connection string**
4. **Run migrations**

## ⚙️ Environment Configuration

### Backend Environment Variables

```bash
# Production
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://username:password@host:5432/bookshop_db
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
BCRYPT_ROUNDS=12
```

### Frontend Environment Variables

```bash
# Production
VITE_API_URL=https://your-backend-domain.com
VITE_APP_NAME=Bookshop Management System
```

## 🌐 Domain & SSL Setup

### Custom Domain Configuration

1. **Purchase domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS**
   - Frontend: CNAME to Vercel/Netlify
   - Backend: CNAME to Railway/Render
3. **SSL certificates** (automatic with modern platforms)

### SSL Configuration

Most modern platforms provide automatic SSL:
- **Vercel**: Automatic HTTPS
- **Netlify**: Automatic HTTPS
- **Railway**: Automatic HTTPS
- **Render**: Automatic HTTPS

## 📊 Monitoring & Maintenance

### Health Checks

1. **Backend health endpoint**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});
```

2. **Frontend health check**
```typescript
// Add to your main App component
useEffect(() => {
  const checkHealth = async () => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/health`);
      if (!response.ok) {
        console.error('Backend health check failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  };
  
  checkHealth();
  const interval = setInterval(checkHealth, 300000); // 5 minutes
  return () => clearInterval(interval);
}, []);
```

### Logging

1. **Backend logging**
```typescript
// Add structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Performance Monitoring

1. **Add monitoring tools**
   - **Sentry** for error tracking
   - **New Relic** for performance monitoring
   - **LogRocket** for session replay

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy to Railway/Render

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy to Vercel/Netlify
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure FRONTEND_URL is correctly set
   - Check CORS configuration in backend

2. **Database connection issues**
   - Verify DATABASE_URL format
   - Check database accessibility

3. **Build failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Environment variables**
   - Ensure all required variables are set
   - Check variable naming conventions

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review error logs
3. Test locally with production environment
4. Contact platform support if needed

## 🎯 Next Steps

1. **Choose deployment platform**
2. **Set up database**
3. **Configure environment variables**
4. **Deploy backend**
5. **Deploy frontend**
6. **Set up custom domain**
7. **Configure monitoring**
8. **Test thoroughly**

---

**Happy Deploying! 🚀**






