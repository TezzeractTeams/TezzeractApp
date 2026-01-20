# 🔑 Environment Variables Setup Guide

## Quick Answer: You DON'T Need JWT Secrets!

Your app uses **Supabase authentication**, not JWT tokens. You only need Supabase credentials.

---

## ✅ What You Actually Need

### 1. Supabase Credentials (Required)

Get these from your Supabase Dashboard:

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these values:

   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` 
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

---

## 📝 Setup Instructions

### Step 1: Create Server `.env` File

Create a file at `server/.env`:

```bash
cd server
touch .env
```

Add these variables:

```env
# Server Configuration
PORT=5001
CLIENT_URL=http://localhost:3000

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google Gemini (for AI content suggestions and talent search)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro

# JWT Secrets (OPTIONAL - only if using legacy auth endpoints)
# You can generate random strings or leave these out
JWT_SECRET=any-random-string-here
JWT_REFRESH_SECRET=any-random-string-here
```

### Step 2: Create Client `.env.local` File

Create a file at `client/.env.local`:

```bash
cd client
touch .env.local
```

Add these variables:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:5001/api
```

---

## 🔐 How to Get Supabase Credentials

### Option 1: Use Existing Project

If you already have a Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. You'll see:
   - **Project URL** - Copy this for `SUPABASE_URL`
   - **Project API keys** section:
     - **anon public** - Copy this for `SUPABASE_ANON_KEY`
     - **service_role** - Copy this for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Secret!)

### Option 2: Create New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)
5. Go to **Settings** → **API** to get credentials

---

## 🎯 Quick Setup Command

If you already have your Supabase credentials, run this:

```bash
# In the server directory
cd server
cat > .env << 'EOF'
PORT=5001
CLIENT_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
EOF

# In the client directory
cd ../client
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:5001/api
EOF
```

Replace `your_supabase_url_here`, `your_anon_key_here`, etc. with your actual values.

---

## ❓ About JWT Secrets

**Q: Do I need JWT_SECRET and JWT_REFRESH_SECRET?**

**A: No!** Your app uses Supabase authentication. JWT secrets are only used by legacy auth endpoints (`/api/auth/login` and `/api/auth/register`) which you probably aren't using.

**If you want to use those legacy endpoints**, you can generate random strings:

```bash
# Generate random JWT secrets (optional)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it twice to get two different secrets.

**But you don't need them** if you're using Supabase auth (which is the default).

---

## ✅ Verification

After setting up, verify your configuration:

1. **Check server `.env` exists:**
   ```bash
   ls server/.env
   ```

2. **Check client `.env.local` exists:**
   ```bash
   ls client/.env.local
   ```

3. **Start the server:**
   ```bash
   cd server
   pnpm dev
   ```
   
   You should see:
   ```
   🚀 Server running on http://localhost:5001
   📡 API available at http://localhost:5001/api
   ```
   
   If you see warnings about missing Supabase credentials, check your `.env` file.

4. **Start the client:**
   ```bash
   cd client
   pnpm dev
   ```

---

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in `server/` directory
- Check that variable names are correct (no typos)
- Restart the server after creating/updating `.env`

### "Invalid or expired token"
- Check that `SUPABASE_ANON_KEY` matches between client and server
- Verify `SUPABASE_URL` is correct
- Make sure you're using the same Supabase project

### "Authentication required but not configured"
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to server `.env`
- Restart the server

---

## 📚 Summary

**You need:**
- ✅ Supabase URL
- ✅ Supabase Anon Key (public)
- ✅ Supabase Service Role Key (secret, server only)
- ✅ Google Gemini API Key (for AI content suggestions and talent search)

**You DON'T need:**
- ❌ JWT_SECRET (unless using legacy auth)
- ❌ JWT_REFRESH_SECRET (unless using legacy auth)

---

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API Keys](https://makersuite.google.com/app/apikey)

