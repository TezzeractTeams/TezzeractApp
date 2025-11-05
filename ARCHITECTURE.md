# 🏗️ TezzeractApp Architecture Guide

## Overview

TezzeractApp is a multi-tab platform built using a **monorepo architecture** with **React + Express**. This document explains the architectural decisions, patterns, and best practices used in the project.

---

## 🎯 Architecture Pattern: Monorepo

### Why Monorepo?

```
TezzeractApp/
├── client/          # Frontend (React)
├── server/          # Backend (Express)
├── shared/          # Shared code
└── package.json     # Workspace root
```

**Benefits:**
- ✅ **Single source of truth** - All code in one repository
- ✅ **Shared types** - TypeScript interfaces used by both client & server
- ✅ **Atomic commits** - Frontend + backend changes in one commit
- ✅ **Easier refactoring** - Change shared code, see impact everywhere
- ✅ **Simplified deployment** - One repo to deploy

**Trade-offs:**
- ❌ Larger repository size
- ❌ Need workspace management (pnpm workspaces)
- ❌ All developers need access to full codebase

---

## 📐 Frontend Architecture (React)

### Feature-Based Organization

```
client/src/
├── features/              # Feature modules
│   ├── auth/             # Authentication feature
│   │   └── pages/
│   │       └── LoginPage.tsx
│   ├── talent/           # Talent search feature
│   │   └── pages/
│   │       └── TalentPage.tsx
│   ├── social/           # Social media feature
│   │   └── pages/
│   │       └── SocialPage.tsx
│   └── chat/             # Chat feature
│       └── pages/
│           └── ChatPage.tsx
│
├── shared/               # Shared across features
│   ├── components/       # Reusable UI components
│   │   └── ui/          # shadcn/ui components
│   ├── layouts/         # Layout components
│   │   ├── PlatformLayout.tsx
│   │   └── VerticalSidebar.tsx
│   └── utils/           # Utility functions
│
└── App.tsx              # Main router
```

**Why Feature-Based?**
- Each feature is self-contained
- Easy to find related code
- Can be extracted to separate package later
- Clear boundaries between features

### Component Hierarchy

```
App.tsx (Router)
  └── PlatformLayout (Shell)
      ├── VerticalSidebar (Navigation)
      └── Outlet (Current Page)
          ├── TalentPage
          ├── SocialPage
          ├── ChatPage
          └── SettingsPage
```

### State Management Strategy

**Current:** React Context (minimal state)
**Future:** Zustand for complex state

```typescript
// Example: Auth Context
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});
```

**When to use what:**
- **Local state (useState)** - Component-specific data
- **Context** - Auth, theme, organization
- **Zustand** - Complex app state (if needed)
- **TanStack Query** - Server state (API data)

---

## 🔧 Backend Architecture (Express)

### Layered Architecture

```
server/src/
├── routes/              # Route definitions (thin)
│   ├── auth.routes.ts
│   ├── talent.routes.ts
│   ├── social.routes.ts
│   └── chat.routes.ts
│
├── controllers/         # Business logic (thick)
│   ├── auth.controller.ts
│   ├── talent.controller.ts
│   ├── social.controller.ts
│   └── chat.controller.ts
│
├── middleware/          # Request processing
│   └── auth.middleware.ts
│
└── server.ts           # Express app setup
```

**Request Flow:**

```
Client Request
    ↓
Express Server (server.ts)
    ↓
CORS Middleware
    ↓
JSON Parser Middleware
    ↓
Route Handler (routes/*.ts)
    ↓
Auth Middleware (if protected)
    ↓
Controller (controllers/*.ts)
    ↓
Business Logic
    ↓
Response
```

### API Design Pattern: RESTful

```
GET    /api/talent/candidates      # List all
GET    /api/talent/candidates/:id  # Get one
POST   /api/talent/candidates      # Create
PUT    /api/talent/candidates/:id  # Update
DELETE /api/talent/candidates/:id  # Delete
```

**Response Format:**

```typescript
// Success
{
  data: { ... },
  message?: "Success message"
}

// Error
{
  error: "Error message",
  code?: "ERROR_CODE"
}
```

---

## 🔐 Authentication Architecture

### JWT-Based Authentication

```
┌─────────────────────────────────────────────────┐
│                  Login Flow                      │
└─────────────────────────────────────────────────┘

1. User submits email/password
        ↓
2. Server verifies credentials
        ↓
3. Server creates 2 tokens:
   - accessToken (15 min)
   - refreshToken (7 days)
        ↓
4. Client stores tokens:
   - accessToken → localStorage
   - refreshToken → localStorage (or httpOnly cookie)
        ↓
5. Client includes token in requests:
   Authorization: Bearer <accessToken>
```

### Token Structure

**Access Token:**
```json
{
  "userId": "123",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790  // 15 minutes later
}
```

**Refresh Token:**
```json
{
  "userId": "123",
  "iat": 1234567890,
  "exp": 1235172690  // 7 days later
}
```

### Protected Routes

```typescript
// Server-side
router.get('/api/talent/candidates', 
  authenticateToken,  // Middleware
  getCandidates       // Controller
);

// Middleware checks:
1. Token exists in Authorization header
2. Token is valid (not expired)
3. Token signature is correct
4. Adds user info to request object
```

---

## 🗄️ Data Flow Architecture

### Client → Server Communication

```typescript
// 1. API Client Setup (client/src/shared/utils/api.ts)
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// 2. Request Interceptor (add auth token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response Interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired → refresh or logout
    }
    return Promise.reject(error);
  }
);

// 4. API Call
const candidates = await api.get('/talent/candidates');
```

### Server → Database (Future)

```typescript
// Current: Mock data in controllers
const mockCandidates = [ ... ];

// Future: Database queries
const candidates = await db.candidates.findMany({
  where: { organizationId: req.user.orgId }
});
```

---

## 🎨 UI/UX Architecture

### Design System

**Colors:**
- Primary: Blue gradient (#00378A → #00A9EE)
- Success: Green (#22c55e)
- Error: Red (#ef4444)
- Warning: Yellow (#f59e0b)

**Typography:**
- Font: Figtree (Google Fonts)
- Headings: Bold, 24-32px
- Body: Regular, 14-16px

**Components:**
- Based on shadcn/ui
- Tailwind CSS utility classes
- Consistent spacing (4px grid)

### Navigation Pattern: Vertical Sidebar

```
┌────┬──────────────────────────┐
│ T  │                          │
│    │                          │
│ 👥 │     Main Content         │
│ 📊 │                          │
│ 💬 │                          │
│ ⚙️ │                          │
│    │                          │
│ 🚪 │                          │
└────┴──────────────────────────┘
```

**Benefits:**
- More vertical space for content
- Familiar pattern (VS Code, Figma)
- Easy to add/remove tabs
- Clear visual hierarchy

---

## 🔄 Real-Time Architecture (Future)

### Socket.io Integration

```typescript
// Server setup
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
  });
  
  socket.on('send-message', (data) => {
    io.to(data.channelId).emit('new-message', data);
  });
});

// Client setup
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('new-message', (message) => {
  // Update UI with new message
});
```

---

## 📦 Deployment Architecture

### Development

```
Local Machine
├── Frontend: localhost:3000 (Vite dev server)
├── Backend: localhost:5000 (Express server)
└── Database: localhost:5432 (PostgreSQL)
```

### Production (Recommended)

```
Vercel (Frontend)
  ↓ API calls
Railway/Render (Backend)
  ↓ Database queries
Supabase (Database + Auth)
```

**Alternative: Single Server**

```
VPS (DigitalOcean/AWS)
├── Nginx (Reverse Proxy)
│   ├── / → React build (static files)
│   └── /api → Express server
├── Node.js (Express)
└── PostgreSQL
```

---

## 🔒 Security Architecture

### Current Security Measures

1. **CORS** - Only allow requests from frontend domain
2. **JWT** - Stateless authentication
3. **bcrypt** - Password hashing (10 rounds)
4. **Environment variables** - Secrets not in code

### Future Security Enhancements

1. **Rate limiting** - Prevent brute force attacks
2. **Helmet.js** - Security headers
3. **Input validation** - Zod schemas
4. **SQL injection prevention** - Parameterized queries
5. **XSS prevention** - Sanitize user input
6. **CSRF tokens** - For state-changing operations
7. **httpOnly cookies** - For refresh tokens

---

## 📈 Scalability Considerations

### Current Scale: Single Server

```
Load: < 1000 concurrent users
Database: Single PostgreSQL instance
Deployment: Single server
```

### Future Scale: Horizontal Scaling

```
Load Balancer
    ↓
Multiple Express Servers (stateless)
    ↓
Database Connection Pool
    ↓
PostgreSQL Primary + Read Replicas
```

### Microservices Migration Path

```
Current Monolith:
TezzeractApp → All features in one backend

Future Microservices:
├── Auth Service (Node.js)
├── Talent Service (Node.js)
├── Social Service (Python + AI)
├── Chat Service (Node.js + Socket.io)
└── API Gateway (Kong/AWS API Gateway)
```

---

## 🧪 Testing Strategy (Future)

### Frontend Testing

```typescript
// Unit tests (Vitest)
describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});

// Integration tests (React Testing Library)
describe('LoginPage', () => {
  it('logs in user', async () => {
    render(<LoginPage />);
    // ... test login flow
  });
});

// E2E tests (Playwright)
test('user can navigate to talent page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="talent-tab"]');
  await expect(page).toHaveURL('/talent');
});
```

### Backend Testing

```typescript
// Unit tests (Jest)
describe('AuthController', () => {
  it('creates JWT token on login', async () => {
    const result = await login(mockReq, mockRes);
    expect(result.accessToken).toBeDefined();
  });
});

// Integration tests (Supertest)
describe('POST /api/auth/login', () => {
  it('returns 200 on valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    expect(response.status).toBe(200);
  });
});
```

---

## 📊 Monitoring & Observability (Future)

### Logging

```typescript
// Structured logging with Winston
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date(),
  ip: req.ip
});
```

### Error Tracking

```typescript
// Sentry integration
Sentry.captureException(error, {
  user: { id: req.user.id },
  tags: { feature: 'talent' }
});
```

### Performance Monitoring

```typescript
// New Relic / DataDog
newrelic.recordMetric('API/talent/candidates', duration);
```

---

## 🎯 Key Architectural Decisions

### Decision 1: Monorepo vs Multi-repo
**Choice:** Monorepo  
**Reason:** Easier to share types, simpler deployment, atomic commits

### Decision 2: React + Express vs Next.js
**Choice:** React + Express  
**Reason:** Team expertise in MERN, need full backend control

### Decision 3: JWT vs Session-based Auth
**Choice:** JWT  
**Reason:** Stateless, scalable, works with mobile apps

### Decision 4: Feature-based vs Type-based Folders
**Choice:** Feature-based  
**Reason:** Better code organization, easier to find related code

### Decision 5: REST vs GraphQL
**Choice:** REST  
**Reason:** Simpler, team familiarity, adequate for current needs

---

## 📚 Further Reading

- [React Architecture Best Practices](https://react.dev)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Monorepo Tools Comparison](https://monorepo.tools)
- [JWT Security Best Practices](https://jwt.io/introduction)

---

**Questions? Check the README.md or ask the team!**

