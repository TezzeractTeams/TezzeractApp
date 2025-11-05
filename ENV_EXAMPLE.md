# Environment Variables Setup

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client Configuration
CLIENT_URL=http://localhost:3000

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Database (Add your database connection string)
# DATABASE_URL=postgresql://user:password@localhost:5432/tezzeractapp

# External APIs (Add your API keys)
# TWITTER_API_KEY=
# FACEBOOK_API_KEY=
# GOOGLE_API_KEY=
```

## Important Notes

1. **Never commit `.env` files to git**
2. **Change the JWT secrets in production** - use long random strings
3. **Add your database connection string** when you set up the database
4. **Add API keys** for external integrations (Twitter, Facebook, etc.)

