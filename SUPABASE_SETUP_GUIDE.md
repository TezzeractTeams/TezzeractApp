# 🚀 Supabase Integration Setup Guide

## ✅ What's Been Done

I've successfully integrated Supabase with your TezzeractApp! Here's what was implemented:

### Backend (Server)
1. ✅ Added `@supabase/supabase-js` to dependencies
2. ✅ Created Supabase config file (`server/src/config/supabase.ts`)
3. ✅ Updated talent controller to fetch from Supabase database
4. ✅ Added search and filter functionality
5. ✅ Created CRUD endpoints for talents

### Frontend (Client)
1. ✅ Created talent service (`client/src/shared/services/talentService.ts`)
2. ✅ Updated TalentPage to use real API data
3. ✅ Added search functionality that queries the database

## 📋 Setup Steps (What You Need to Do)

### Step 1: Install Dependencies

```bash
# In the root directory
cd "/Users/wehan/Documents/Tezzeract/Tezzeract AI/TezzeractApp"

# Install server dependencies
cd server
pnpm install

# Install client dependencies (if needed)
cd ../client
pnpm install
```

### Step 2: Create Server .env File

Create a `.env` file in the `server` directory:

```bash
cd server
cat > .env << 'EOF'
PORT=5001
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
SUPABASE_URL=https://zxuyluplyamcdfruxhxc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTE1MDUsImV4cCI6MjA3MDU2NzUwNX0.ckraA5wFHekxNewcPeTC2U98Xc5DBjhXHRlgMi6Nhjo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5MTUwNSwiZXhwIjoyMDcwNTY3NTA1fQ.mQA03QR3SXeR_ZpiVnZm1hQ1kYDRNXM_wAZwYQDZuP0
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro
EOF
```

### Step 3: Create Client .env.local File

Create a `.env.local` file in the `client` directory:

```bash
cd ../client
echo "VITE_API_URL=http://localhost:5001/api" > .env.local
```

### Step 4: Verify Supabase Table Structure

Make sure your `talents` table in Supabase has these columns:
- `id` (uuid, primary key)
- `name` (text)
- `skills` (text[] or jsonb array)
- `experience_years` (integer)
- `availability` (boolean)
- `image_url` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Step 5: Start the Application

```bash
# Terminal 1 - Start the server
cd server
pnpm dev

# Terminal 2 - Start the client
cd client
pnpm dev
```

## 🎯 API Endpoints

### Talents
- `GET /api/talent/talents` - Get all talents (with optional filters)
  - Query params: `search`, `skills`, `availability`, `minExperience`, `maxExperience`
- `GET /api/talent/talents/:id` - Get single talent
- `POST /api/talent/talents` - Create new talent
- `PUT /api/talent/talents/:id` - Update talent
- `DELETE /api/talent/talents/:id` - Delete talent

### Example API Calls

```bash
# Get all talents
curl http://localhost:5001/api/talent/talents

# Search by name
curl "http://localhost:5001/api/talent/talents?search=John"

# Filter by availability
curl "http://localhost:5001/api/talent/talents?availability=true"

# Filter by skills
curl "http://localhost:5001/api/talent/talents?skills=React,Node.js"

# Filter by experience
curl "http://localhost:5001/api/talent/talents?minExperience=3&maxExperience=7"
```

## 🧪 Testing

1. **Test Server Health:**
   ```bash
   curl http://localhost:5001/api/health
   ```

2. **Test Talents Endpoint:**
   ```bash
   curl http://localhost:5001/api/talent/talents
   ```

3. **Test Frontend:**
   - Go to `http://localhost:3000/talent`
   - You should see talents from your Supabase database
   - Try searching for talents using the chat interface

## 🔍 Features Implemented

### Search & Filter
- ✅ Search talents by name
- ✅ Filter by skills
- ✅ Filter by availability status
- ✅ Filter by experience years (min/max)

### CRUD Operations
- ✅ Create new talents
- ✅ Read/fetch talents
- ✅ Update existing talents
- ✅ Delete talents

### Frontend Integration
- ✅ Real-time data fetching from Supabase
- ✅ Search functionality in chat interface
- ✅ Loading states
- ✅ Error handling

## 🐛 Troubleshooting

### Issue: "Failed to fetch talents"
**Solution:** Make sure:
1. Server is running on port 5001
2. .env file exists in server directory
3. Supabase credentials are correct
4. Talents table exists in Supabase

### Issue: "CORS Error"
**Solution:** Server is configured to allow `http://localhost:3000`. If using a different port, update `CLIENT_URL` in server/.env

### Issue: "No talents showing"
**Solution:** 
1. Check if you have data in your Supabase `talents` table
2. Check browser console for errors
3. Verify API is responding: `curl http://localhost:5001/api/talent/talents`

## 📝 Next Steps

1. Add more sample data to your Supabase `talents` table
2. Test the search functionality
3. Implement AI-powered talent matching (optional)
4. Add authentication to protect API endpoints
5. Deploy to production

## 🎉 You're All Set!

Your TezzeractApp is now connected to Supabase and ready to fetch real talent data!

