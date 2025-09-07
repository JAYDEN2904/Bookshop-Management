# Environment Variables for Deployment

## Frontend (Vercel) Environment Variables

Add these environment variables in your Vercel dashboard:

### Required Variables:
```
VITE_API_URL=https://your-backend-url.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Add in Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Redeploy your project

## Backend (Render/Railway/etc.) Environment Variables

Add these environment variables in your backend deployment platform:

### Required Variables:
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
```

### How to Add in Render:
1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment tab
4. Add each variable above
5. Redeploy your service

## Docker Deployment

If using Docker, update your docker-compose.yml with the Supabase variables instead of JWT.
