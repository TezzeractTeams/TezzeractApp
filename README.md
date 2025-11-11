# TezzeractApp

A modern multi-tab platform built with React, Express, and TypeScript. Features a VS Code-style vertical sidebar navigation with three main applications: Talent Search, Social Media Dashboard, and Chat.

## 🏗️ Architecture

```
TezzeractApp/
├── client/              # React + Vite frontend
├── server/              # Express backend
├── shared/              # Shared TypeScript types
└── package.json         # Root workspace config
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Router v6 (routing)
- Tailwind CSS (styling)
- Axios (API calls)
- Zustand (state management)

**Backend:**
- Node.js + Express
- TypeScript
- JWT authentication
- bcrypt (password hashing)
- Zod (validation)

**Monorepo:**
- pnpm workspaces
- Shared types between client/server

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

### Installation

1. **Install dependencies:**
```bash
cd TezzeractApp
pnpm install
```

2. **Set up environment variables:**

Create `server/.env` file (see `ENV_EXAMPLE.md` for template):
```env
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Running the App

**Development mode (runs both client and server):**
```bash
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Run individually:**
```bash
# Frontend only
pnpm dev:client

# Backend only
pnpm dev:server
```

### Building for Production

```bash
pnpm build
```

## 📱 Features

### 1. Talent Search (Tab 1)
- Candidate management
- Job postings
- Application tracking
- Search and filtering

### 2. Social Media Dashboard (Tab 2)
- Multi-platform analytics (Twitter, Facebook, Instagram, LinkedIn)
- Engagement metrics
- Content calendar
- Post scheduling

### 3. Chat (Tab 3)
- Real-time messaging
- Channels and direct messages
- User presence
- Message threading

### 4. Authentication
- JWT-based authentication
- Access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- Secure password hashing

## 🎨 UI/UX

- **Vertical Sidebar Navigation** - VS Code style activity bar
- **Gradient Theme** - Blue gradient primary colors
- **Responsive Design** - Works on all screen sizes
- **Smooth Animations** - Fade-in, slide-up, scale-in effects
- **Custom Scrollbar** - Gradient-styled scrollbars

## 📁 Project Structure

### Client Structure
```
client/
├── src/
│   ├── features/           # Feature-based organization
│   │   ├── auth/          # Login, signup
│   │   ├── talent/        # Talent search pages
│   │   ├── social/        # Social media pages
│   │   └── chat/          # Chat pages
│   ├── shared/
│   │   ├── components/    # Reusable UI components
│   │   ├── layouts/       # Layout components
│   │   └── utils/         # Utility functions
│   ├── App.tsx            # Main router
│   └── main.tsx           # Entry point
```

### Server Structure
```
server/
├── src/
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic
│   ├── middleware/        # Auth, validation
│   └── server.ts          # Express app
```

## 🔐 Authentication Flow

1. User logs in → Server creates JWT tokens
2. Frontend stores `accessToken` in localStorage
3. All API requests include `Authorization: Bearer <token>`
4. Server verifies token on protected routes
5. When token expires → Frontend refreshes using `refreshToken`

## 🛠️ Development

### Adding a New Feature

1. Create feature folder in `client/src/features/`
2. Add routes in `App.tsx`
3. Create API endpoints in `server/src/routes/`
4. Add controllers in `server/src/controllers/`
5. Define types in `shared/types/`

### API Endpoints

**Auth:**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

**Talent:**
- `GET /api/talent/candidates` - Get candidates
- `GET /api/talent/jobs` - Get jobs

**Social:**
- `GET /api/social/platforms` - Get connected platforms
- `GET /api/social/analytics` - Get analytics

**Chat:**
- `GET /api/chat/channels` - Get channels
- `GET /api/chat/messages/:channelId` - Get messages

## 🎯 Next Steps

### Immediate TODOs:
1. Connect to real database (PostgreSQL/Supabase)
2. Implement proper user authentication
3. Add Socket.io for real-time chat
4. Integrate external APIs (Twitter, Facebook, etc.)
5. Add form validation with Zod
6. Implement error boundaries
7. Add loading states
8. Write tests

### Future Enhancements:
- Mobile app (React Native)
- Push notifications
- File uploads
- Advanced analytics
- AI-powered insights
- Multi-language support

## 📚 Documentation

- See `ENV_EXAMPLE.md` for environment setup
- API documentation coming soon
- Component documentation coming soon

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 🔄 Recent Updates

**November 11, 2025** - Project structure refined and documentation updated

---

**Built with ❤️ by the Tezzeract Team**

