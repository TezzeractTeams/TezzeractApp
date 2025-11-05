# 🚀 Quick Start Guide

## Step 1: Install Dependencies

```bash
cd TezzeractApp
pnpm install
```

If you see a warning about build scripts, run:
```bash
pnpm rebuild bcrypt esbuild
```

## Step 2: Start Development Servers

Run both frontend and backend together:
```bash
pnpm dev
```

This will start:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

## Step 3: Login

Open http://localhost:3000 in your browser.

**Demo Login Credentials:**
- Email: `admin@tezzeract.com`
- Password: `password123`

Or use any email/password (demo mode accepts all credentials)

## Step 4: Explore the Tabs

After login, you'll see the vertical sidebar with 4 tabs:

1. **👥 Talent Search** - Candidate and job management
2. **📊 Social Media** - Multi-platform analytics dashboard
3. **💬 Chat** - Real-time messaging (UI only for now)
4. **⚙️ Settings** - Configuration (placeholder)

## 🎨 What's Included

### Frontend (React + Vite)
- ✅ VS Code-style vertical sidebar navigation
- ✅ 3 fully designed sample pages
- ✅ Tailwind CSS with gradient theme (same as tezzeractDash)
- ✅ shadcn/ui components (Button, Card, Input)
- ✅ React Router for navigation
- ✅ Responsive design

### Backend (Express + TypeScript)
- ✅ JWT authentication (access + refresh tokens)
- ✅ Protected API routes
- ✅ Sample endpoints for all features
- ✅ Mock data (ready for database integration)
- ✅ CORS configured
- ✅ TypeScript with hot reload

### Monorepo
- ✅ pnpm workspaces
- ✅ Shared TypeScript types
- ✅ Concurrent dev mode

## 📝 Next Steps

### 1. Connect to Database
Replace mock data with real database queries:
- Add Supabase or PostgreSQL
- Update controllers to use database

### 2. Implement Real Authentication
- Hash passwords properly
- Store users in database
- Add refresh token rotation

### 3. Add Real-time Chat
- Install Socket.io
- Implement WebSocket server
- Connect chat UI to Socket.io

### 4. Integrate External APIs
- Twitter/X API
- Facebook/Meta API
- Google Analytics API
- YouTube API

### 5. Migrate TezzeractDash
- Copy components from tezzeractDash
- Move to `/social` route
- Connect to existing integrations

## 🛠️ Development Tips

### Run Frontend Only
```bash
pnpm dev:client
```

### Run Backend Only
```bash
pnpm dev:server
```

### Build for Production
```bash
pnpm build
```

### Check API Health
```bash
curl http://localhost:5000/api/health
```

### Test Authentication
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📂 Key Files to Edit

### Add New Page
1. Create component in `client/src/features/[feature]/pages/`
2. Add route in `client/src/App.tsx`

### Add New API Endpoint
1. Create route in `server/src/routes/`
2. Create controller in `server/src/controllers/`
3. Add to `server/src/server.ts`

### Add Shared Type
1. Edit `shared/types/index.ts`
2. Import in client/server as needed

## 🎯 Architecture Decisions

### Why This Structure?
- **Feature-based folders** - Easy to find related code
- **Monorepo** - Share types, single deployment
- **pnpm workspaces** - Fast, efficient package management
- **TypeScript everywhere** - Type safety across stack

### Why React + Express?
- Your team knows MERN stack
- Full control over backend
- Easy to scale
- Industry standard

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Dependencies Not Installing
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules
pnpm install
```

### TypeScript Errors
```bash
# Rebuild TypeScript
pnpm --filter client build
pnpm --filter server build
```

## 📞 Need Help?

- Check `README.md` for full documentation
- See `ENV_EXAMPLE.md` for environment setup
- Review code comments for inline documentation

---

**Happy coding! 🎉**

