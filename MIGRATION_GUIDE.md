# 🔄 Migration Guide: TezzeractDash → TezzeractApp

This guide explains how to migrate your existing **TezzeractDash** (Next.js) into the new **TezzeractApp** (React + Express) as the Social Media tab.

---

## 📋 Overview

**Current State:**
- TezzeractDash: Standalone Next.js app with social media features
- TezzeractApp: New monorepo with 3 tabs (Talent, Social, Chat)

**Goal:**
- Move TezzeractDash features into TezzeractApp `/social` route
- Keep all existing functionality (Twitter, Meta, YouTube, Google Analytics)
- Maintain same UI/styling

---

## 🎯 Migration Strategy

### Phase 1: Setup (Week 1)
1. ✅ Create TezzeractApp monorepo structure
2. ✅ Set up React + Express with TypeScript
3. ✅ Copy Tailwind config and styling
4. ✅ Copy shadcn/ui components
5. ✅ Create vertical sidebar navigation

### Phase 2: Move Components (Week 2)
1. Copy dashboard components
2. Copy calendar components
3. Copy settings components
4. Copy setup/onboarding components
5. Update import paths

### Phase 3: Move API Routes (Week 3)
1. Convert Next.js API routes → Express routes
2. Move integration logic (Twitter, Meta, etc.)
3. Update API endpoints
4. Test all integrations

### Phase 4: Move Database Logic (Week 4)
1. Keep Supabase client
2. Update database queries
3. Test data persistence
4. Migrate existing data (if needed)

### Phase 5: Testing & Polish (Week 5)
1. Test all features
2. Fix bugs
3. Update documentation
4. Deploy

---

## 📁 File Mapping

### Components Migration

| TezzeractDash (Next.js) | TezzeractApp (React) |
|-------------------------|----------------------|
| `src/components/dashboard/` | `client/src/features/social/components/dashboard/` |
| `src/components/calendar/` | `client/src/features/social/components/calendar/` |
| `src/components/settings/` | `client/src/features/social/components/settings/` |
| `src/components/setup/` | `client/src/features/social/components/setup/` |
| `src/components/ui/` | `client/src/shared/components/ui/` (already done) |

### Pages Migration

| TezzeractDash (Next.js) | TezzeractApp (React) |
|-------------------------|----------------------|
| `src/app/(dashboard)/dashboard/page.tsx` | `client/src/features/social/pages/DashboardPage.tsx` |
| `src/app/(dashboard)/calendar/page.tsx` | `client/src/features/social/pages/CalendarPage.tsx` |
| `src/app/(dashboard)/settings/page.tsx` | `client/src/features/social/pages/SettingsPage.tsx` |
| `src/app/(dashboard)/setup/page.tsx` | `client/src/features/social/pages/SetupPage.tsx` |

### API Routes Migration

| TezzeractDash (Next.js) | TezzeractApp (Express) |
|-------------------------|------------------------|
| `src/app/api/integrations/twitter/` | `server/src/routes/integrations/twitter.routes.ts` |
| `src/app/api/integrations/meta/` | `server/src/routes/integrations/meta.routes.ts` |
| `src/app/api/integrations/google-analytics/` | `server/src/routes/integrations/google-analytics.routes.ts` |
| `src/app/api/integrations/youtube/` | `server/src/routes/integrations/youtube.routes.ts` |

---

## 🔧 Step-by-Step Migration

### Step 1: Copy Dashboard Components

```bash
# From TezzeractDash root
cd /path/to/tezzeractDash

# Copy dashboard components
cp -r src/components/dashboard ../TezzeractApp/client/src/features/social/components/

# Copy calendar components
cp -r src/components/calendar ../TezzeractApp/client/src/features/social/components/

# Copy settings components
cp -r src/components/settings ../TezzeractApp/client/src/features/social/components/

# Copy setup components
cp -r src/components/setup ../TezzeractApp/client/src/features/social/components/
```

### Step 2: Update Import Paths

**Before (Next.js):**
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
```

**After (React):**
```typescript
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { createClient } from '@/shared/lib/supabase/client';
```

**Find and Replace:**
```bash
# In all copied files
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/components\/ui/@\/shared\/components\/ui/g' {} +
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/lib/@\/shared\/lib/g' {} +
```

### Step 3: Convert Pages to Components

**Before (Next.js page):**
```typescript
// src/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

**After (React component):**
```typescript
// client/src/features/social/pages/DashboardPage.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

**Changes needed:**
1. Remove `export const metadata` (Next.js specific)
2. Remove server components logic
3. Convert `useRouter()` from Next.js to React Router
4. Convert `useSearchParams()` to React Router equivalent

### Step 4: Convert API Routes

**Before (Next.js API route):**
```typescript
// src/app/api/integrations/twitter/data/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  
  // ... logic
  
  return Response.json({ data });
}
```

**After (Express route):**
```typescript
// server/src/routes/integrations/twitter.routes.ts
import { Router } from 'express';
import { getTwitterData } from '../controllers/twitter.controller.js';

const router = Router();
router.get('/data', getTwitterData);
export default router;

// server/src/controllers/twitter.controller.ts
export const getTwitterData = async (req: Request, res: Response) => {
  const { platform } = req.query;
  
  // ... logic
  
  res.json({ data });
};
```

### Step 5: Update API Calls

**Before (Next.js):**
```typescript
const response = await fetch('/api/integrations/twitter/data');
const data = await response.json();
```

**After (React with Axios):**
```typescript
import api from '@/shared/utils/api';

const response = await api.get('/integrations/twitter/data');
const data = response.data;
```

### Step 6: Move Integration Services

```bash
# Copy integration services
cp -r src/lib/integrations ../TezzeractApp/server/src/services/

# Update imports in services
# Change relative imports to match new structure
```

### Step 7: Move Supabase Client

```bash
# Copy Supabase setup
cp -r src/lib/supabase ../TezzeractApp/client/src/shared/lib/
```

**Update Supabase usage:**
```typescript
// Keep using Supabase for database
// But authentication now handled by Express JWT
```

### Step 8: Update Router

**Add social routes to App.tsx:**
```typescript
// client/src/App.tsx
import DashboardPage from './features/social/pages/DashboardPage';
import CalendarPage from './features/social/pages/CalendarPage';
import SettingsPage from './features/social/pages/SettingsPage';
import SetupPage from './features/social/pages/SetupPage';

<Route path="/social">
  <Route index element={<DashboardPage />} />
  <Route path="calendar" element={<CalendarPage />} />
  <Route path="settings" element={<SettingsPage />} />
  <Route path="setup" element={<SetupPage />} />
</Route>
```

---

## 🔑 Key Differences to Handle

### 1. Routing

**Next.js:**
```typescript
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

**React Router:**
```typescript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/social/dashboard');
```

### 2. Server Components

**Next.js:** Has server components (fetch data on server)  
**React:** All components are client-side

**Solution:** Move data fetching to `useEffect` or React Query

```typescript
// Before (Next.js server component)
async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// After (React client component)
function DashboardPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <Dashboard data={data} />;
}
```

### 3. API Routes

**Next.js:** API routes in `app/api/`  
**Express:** Routes in `server/src/routes/`

**Solution:** Convert all Next.js API routes to Express routes

### 4. Environment Variables

**Next.js:** `NEXT_PUBLIC_` prefix for client-side  
**React:** `VITE_` prefix for client-side

**Update .env:**
```bash
# Before
NEXT_PUBLIC_SUPABASE_URL=...

# After
VITE_SUPABASE_URL=...
```

**Update code:**
```typescript
// Before
process.env.NEXT_PUBLIC_SUPABASE_URL

// After
import.meta.env.VITE_SUPABASE_URL
```

---

## ✅ Migration Checklist

### Components
- [ ] Copy dashboard components
- [ ] Copy calendar components
- [ ] Copy settings components
- [ ] Copy setup components
- [ ] Update all import paths
- [ ] Test component rendering

### Pages
- [ ] Convert dashboard page
- [ ] Convert calendar page
- [ ] Convert settings page
- [ ] Convert setup page
- [ ] Update routing in App.tsx
- [ ] Test navigation

### API Routes
- [ ] Convert Twitter integration
- [ ] Convert Meta integration
- [ ] Convert Google Analytics integration
- [ ] Convert YouTube integration
- [ ] Update API base URL in frontend
- [ ] Test all API calls

### Database
- [ ] Copy Supabase client setup
- [ ] Update database queries
- [ ] Test data persistence
- [ ] Migrate existing data (if needed)

### Authentication
- [ ] Integrate with new JWT auth
- [ ] Update login flow
- [ ] Update protected routes
- [ ] Test authentication

### Styling
- [ ] Verify Tailwind classes work
- [ ] Check gradient styles
- [ ] Test responsive design
- [ ] Fix any styling issues

### Testing
- [ ] Test all features manually
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Fix bugs

---

## 🐛 Common Issues & Solutions

### Issue 1: Import Errors

**Error:** `Cannot find module '@/components/ui/button'`

**Solution:** Update import path to `@/shared/components/ui/Button`

### Issue 2: useRouter Not Working

**Error:** `useRouter is not a function`

**Solution:** Change from Next.js router to React Router:
```typescript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
```

### Issue 3: Environment Variables Undefined

**Error:** `process.env.NEXT_PUBLIC_API_URL is undefined`

**Solution:** Use Vite env vars:
```typescript
import.meta.env.VITE_API_URL
```

### Issue 4: API Calls Failing

**Error:** `404 Not Found`

**Solution:** Update API base URL:
```typescript
// Before
fetch('/api/integrations/twitter')

// After
fetch('http://localhost:5000/api/integrations/twitter')
// Or use the api client
import api from '@/shared/utils/api';
api.get('/integrations/twitter')
```

---

## 📊 Migration Timeline

| Week | Tasks | Deliverable |
|------|-------|-------------|
| 1 | Setup TezzeractApp structure | Working monorepo |
| 2 | Copy & update components | All components migrated |
| 3 | Convert API routes | All APIs working |
| 4 | Database & auth integration | Data persistence working |
| 5 | Testing & bug fixes | Production-ready |

---

## 🎯 Post-Migration

### Cleanup
1. Archive old TezzeractDash repo
2. Update documentation
3. Train team on new structure

### Optimization
1. Add loading states
2. Implement error boundaries
3. Add analytics
4. Performance optimization

### New Features
1. Add features to other tabs (Talent, Chat)
2. Implement real-time features
3. Add mobile support

---

**Need help? Check ARCHITECTURE.md or ask the team!**

