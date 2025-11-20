# OAuth Integration Setup Guide

This guide explains how to set up OAuth integrations for connecting your app to various platforms (Google Analytics, YouTube Analytics, Meta/Facebook, and Twitter/X).

## 📋 Prerequisites

1. **Database Setup**: Run the migration to create the `platform_connections` table:
   ```sql
   -- Run this in your Supabase SQL editor
   -- File: server/migrations/create_platform_connections.sql
   ```

2. **Environment Variables**: Add the following to your `server/.env` file:

## 🔑 Required Environment Variables

Add these to your `server/.env` file:

```env
# Server Configuration
PORT=5001
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5001/api

# Google OAuth (for Google Analytics and YouTube Analytics)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Meta/Facebook OAuth
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Twitter/X OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

## 🚀 Platform Setup Instructions

### 1. Google OAuth (Google Analytics & YouTube Analytics)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Analytics API
   - YouTube Data API v3
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for testing) or Internal (for workspace)
   - Add scopes:
     - `https://www.googleapis.com/auth/analytics.readonly`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
6. Add authorized redirect URIs:
   - `http://localhost:5001/api/social/oauth/google/callback` (development)
   - `https://yourdomain.com/api/social/oauth/google/callback` (production)
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### 2. Meta/Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add **Facebook Login** product
4. Go to **Settings** → **Basic**:
   - Add **App Domains**: `localhost` (development), your domain (production)
   - Add **Privacy Policy URL** and **Terms of Service URL**
5. Go to **Facebook Login** → **Settings**:
   - Add **Valid OAuth Redirect URIs**:
     - `http://localhost:5001/api/social/oauth/meta/callback` (development)
     - `https://yourdomain.com/api/social/oauth/meta/callback` (production)
6. Go to **Settings** → **Basic**:
   - Copy **App ID** → `META_APP_ID`
   - Copy **App Secret** → `META_APP_SECRET`
7. Add required permissions:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`

### 3. Twitter/X OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app
3. Set up OAuth 2.0:
   - Go to **App Settings** → **User authentication settings**
   - Enable **OAuth 2.0**
   - Set **App permissions**: Read and Write (or Read only)
   - Add **Callback URI / Redirect URL**:
     - `http://localhost:5001/api/social/oauth/twitter/callback` (development)
     - `https://yourdomain.com/api/social/oauth/twitter/callback` (production)
   - Set **Type of App**: Web App
4. Copy **Client ID** and **Client Secret** to your `.env` file
5. Note: Twitter OAuth 2.0 uses PKCE (Proof Key for Code Exchange)

## 📊 Database Schema

The `platform_connections` table stores OAuth tokens and connection status:

- `user_id`: UUID reference to the user
- `platform_id`: Platform identifier (google_analytics, youtube, meta, twitter)
- `platform_name`: Display name
- `access_token`: OAuth access token (encrypted in production)
- `refresh_token`: OAuth refresh token (if available)
- `token_expires_at`: Token expiration timestamp
- `connected_at`: When the connection was established
- `last_sync_at`: Last data sync timestamp

## 🔄 OAuth Flow

1. **User clicks "Connect"** → Frontend calls `/api/social/platforms/:platform/connect`
2. **Backend generates OAuth URL** → Returns authorization URL with state token
3. **Frontend opens OAuth window** → User authorizes on platform
4. **Platform redirects to callback** → `/api/social/oauth/:platform/callback`
5. **Backend exchanges code for tokens** → Stores tokens in database
6. **Backend redirects to frontend** → `/settings?integration&success=connected`
7. **Frontend refreshes platform list** → Shows connected status

## 🛠️ Testing

1. Start your server:
   ```bash
   cd server
   pnpm dev
   ```

2. Start your client:
   ```bash
   cd client
   pnpm dev
   ```

3. Navigate to Settings → Integration tab
4. Click "Connect" on any platform
5. Complete OAuth flow in the popup window
6. Verify connection status updates

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all OAuth credentials
3. **Encrypt tokens** in production (consider using Supabase Vault or similar)
4. **Validate state tokens** to prevent CSRF attacks
5. **Use HTTPS** in production for OAuth callbacks
6. **Rotate secrets** regularly
7. **Monitor token expiration** and refresh automatically

## 🐛 Troubleshooting

### "OAuth credentials not configured"
- Check that all required environment variables are set in `server/.env`
- Restart the server after adding environment variables

### "Invalid redirect URI"
- Ensure callback URLs match exactly in platform settings
- Check for trailing slashes or protocol mismatches

### "Invalid state token"
- State tokens expire after 10 minutes
- Try connecting again if the OAuth window was open too long

### "Database error"
- Ensure the `platform_connections` table exists in Supabase
- Check RLS (Row Level Security) policies are configured correctly
- Verify user authentication is working

## 📝 Next Steps

After setting up OAuth:

1. **Implement token refresh** for expired tokens
2. **Add data syncing** to fetch analytics from connected platforms
3. **Create dashboard widgets** to display platform metrics
4. **Add error handling** for API rate limits
5. **Implement webhooks** for real-time updates (if supported)

## 🔗 Useful Links

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Meta OAuth Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)

