# Railway Deployment Guide for FinPal Pocket Planner

This guide will help you deploy your FinPal Pocket Planner application to Railway.

## Files Added for Railway Deployment

The following configuration files have been added to the `dev` branch:

- `nixpacks.toml` - Nixpacks configuration for build process
- `Caddyfile` - Caddy web server configuration for serving static files
- `railway.toml` - Railway-specific deployment configuration
- `.env.example` - Template for required environment variables

## Railway Setup Steps

### 1. Create New Railway Project

1. Go to [Railway](https://railway.app) and log in to your account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `dev` branch
4. Railway will automatically detect the configuration and start building

### 2. Configure Environment Variables

In your Railway project dashboard, go to the Variables tab and add:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**
- Log in to your [Supabase Dashboard](https://app.supabase.com)
- Go to your project settings
- Navigate to API settings
- Copy the Project URL and anon/public key

### 3. Deploy

Once you've added the environment variables:
1. Railway will automatically trigger a new deployment
2. The build process will run `npm run build` to create the production bundle
3. Caddy will serve the static files from the `dist` folder
4. Your app will be available at the Railway-provided URL

### 4. Custom Domain (Optional)

To add a custom domain:
1. In Railway dashboard, go to Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Railway

## How It Works

### Build Process
1. Railway uses Nixpacks to detect and build your Node.js application
2. Runs `npm install` to install dependencies
3. Runs `npm run build` to create production build in `dist/` folder
4. Installs and configures Caddy web server

### Runtime
1. Caddy serves static files from `dist/` directory
2. Handles SPA routing by redirecting all routes to `index.html`
3. Enables gzip compression for better performance
4. Provides health check endpoint at `/health`

## Production Benefits

- **Performance**: Caddy is optimized for serving static files
- **Cost-effective**: Much lower resource usage than running Vite dev server
- **Scalable**: Proper production setup handles traffic efficiently
- **SEO-friendly**: Proper meta tags and titles configured

## Troubleshooting

### Build Fails
- Check that all environment variables are properly set
- Ensure the `dev` branch is selected in Railway
- Review build logs in Railway dashboard

### App Not Loading
- Verify environment variables are correct
- Check that your Supabase project is accessible
- Review application logs in Railway dashboard

### Performance Issues
- Monitor resource usage in Railway dashboard
- Consider optimizing bundle size if needed
- Review Caddy logs for any serving issues

## Supabase Configuration

Make sure your Supabase project is configured for production:
1. Check that RLS (Row Level Security) policies are properly set
2. Verify authentication settings allow your Railway domain
3. Test database connections and permissions

Your app should now be successfully deployed on Railway with optimal performance and cost efficiency!