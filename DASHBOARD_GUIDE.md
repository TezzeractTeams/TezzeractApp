# Social Media Dashboard Guide

## 🎉 Successfully Ported from Next.js to React!

The comprehensive social media analytics dashboard from `tezzeractDash` has been successfully implemented in your React application.

## ✨ Features Implemented

### 1. **Dashboard Analytics** (`/social`)
- 📊 Real-time metrics cards (Impressions, Reach, Engagement, Clicks, Conversions, Followers)
- 📈 Performance trend charts with historical data
- 🤖 AI-powered insights and recommendations
- 📱 Platform-specific performance breakdown
- ⏰ Time range filtering (Today, 7d, 30d, 90d)

### 2. **Platform Connections** (`/social/settings`)
- Connect/disconnect social media accounts
- Support for:
  - Twitter/X
  - Facebook
  - Instagram
  - YouTube
  - LinkedIn
  - Google Analytics
- OAuth integration placeholders (ready for implementation)

### 3. **Content Calendar** (`/social/calendar`)
- Schedule posts across platforms
- View all scheduled content
- Edit and delete scheduled posts
- Platform-specific formatting

### 4. **Content Suggestions** (`/social/suggestions`)
- AI-powered content generation
- Platform-optimized suggestions
- Engagement score predictions
- Copy and schedule functionality
- Performance tips for each platform

## 📁 File Structure

```
client/src/
├── features/social/
│   ├── components/
│   │   ├── MetricCard.tsx           # Dashboard metric cards
│   │   ├── AIInsights.tsx           # AI insights panel
│   │   ├── PlatformCard.tsx         # Individual platform cards
│   │   ├── PerformanceTrendChart.tsx # Line chart component
│   │   └── BarChartComponent.tsx    # Bar chart component
│   └── pages/
│       ├── DashboardPage.tsx        # Main analytics dashboard
│       ├── SettingsPage.tsx         # Platform connections
│       ├── ContentCalendarPage.tsx  # Content scheduling
│       └── ContentSuggestionsPage.tsx # AI content suggestions
│
├── shared/
│   ├── services/
│   │   └── socialService.ts         # API service hooks
│   └── utils/
│       └── tokenManager.ts          # OAuth token management
│
└── App.tsx                          # Updated routing

server/src/
├── controllers/
│   └── social.controller.ts         # Backend API logic
└── routes/
    └── social.routes.ts             # API endpoints
```

## 🚀 Getting Started

### 1. Start the Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5001`

### 2. Start the Frontend Client

```bash
cd client
npm run dev
```

The client will run on `http://localhost:3000`

### 3. Navigate to the Dashboard

Once logged in, click "Social" in the sidebar or navigate to `/social`

## 📡 API Endpoints

All endpoints require Clerk authentication.

### Dashboard Analytics
- `GET /api/social/dashboard/analytics?timeRange=30d` - Get dashboard metrics
- `GET /api/social/dashboard/insights?timeRange=30d` - Get AI insights

### Platform Management
- `GET /api/social/platforms` - List all platforms
- `POST /api/social/platforms/:platform/connect` - Initiate OAuth
- `DELETE /api/social/platforms/:platform/disconnect` - Disconnect platform

### Content Management
- `GET /api/social/content/calendar` - Get scheduled posts
- `POST /api/social/content/schedule` - Schedule a new post
- `GET /api/social/content/suggestions` - Get AI content suggestions

## 🎨 UI Components

### MetricCard
Displays key performance metrics with trend indicators.

```tsx
<MetricCard
  title="Total Impressions"
  value={metrics.impressions}
  change={12.5}
  trend="up"
  icon={Eye}
/>
```

### AIInsights
Shows AI-generated performance summaries and recommendations.

```tsx
<AIInsights insights={aiInsights} />
```

### PlatformCard
Individual platform performance metrics.

```tsx
<PlatformCard
  platform="twitter"
  metrics={platformData}
  onViewDetails={() => console.log('Details')}
/>
```

### Charts
Interactive data visualization using Recharts.

```tsx
<PerformanceTrendChart 
  data={chartData} 
  timeRange="30d"
  loading={false}
/>
```

## 🔐 OAuth Integration (Next Steps)

The platform connections are ready for OAuth implementation. To add real OAuth:

1. **Set up OAuth apps** for each platform:
   - Twitter: https://developer.twitter.com/
   - Facebook: https://developers.facebook.com/
   - Google: https://console.cloud.google.com/

2. **Add environment variables** to `.env`:
   ```
   TWITTER_CLIENT_ID=your_id
   TWITTER_CLIENT_SECRET=your_secret
   META_APP_ID=your_id
   META_APP_SECRET=your_secret
   # ... etc
   ```

3. **Implement OAuth flows** in `social.controller.ts`:
   - Generate authorization URLs
   - Handle OAuth callbacks
   - Store tokens securely
   - Refresh expired tokens

4. **Fetch real data** from platform APIs:
   - Twitter API v2
   - Facebook Graph API
   - Instagram Graph API
   - YouTube Data API
   - Google Analytics Data API

## 🤖 AI Integration

The dashboard has placeholders for AI-powered features:

### Current Mock Data
- Performance insights
- Content suggestions
- Engagement predictions

### To Add Real AI
Update these functions in `social.controller.ts`:

```typescript
// In getAIInsights()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: "You are a social media analytics expert..."
    },
    {
      role: "user",
      content: `Analyze this data: ${JSON.stringify(metrics)}`
    }
  ],
});

// In getContentSuggestions()
// Similar OpenAI integration for content generation
```

## 📊 Data Flow

```
User Action
    ↓
React Component
    ↓
useSocialService Hook
    ↓
API Request (with Clerk auth)
    ↓
Express Server (/api/social/...)
    ↓
Controller (social.controller.ts)
    ↓
[Future: Database/External APIs]
    ↓
Response Data
    ↓
React Component Update
```

## 🎯 Next Steps

1. **Connect Real Platforms**
   - Implement OAuth flows
   - Fetch real data from APIs
   - Store tokens in database (instead of localStorage)

2. **Database Integration**
   - Store scheduled posts
   - Save user preferences
   - Cache analytics data

3. **Enhanced AI Features**
   - Real-time content analysis
   - Sentiment analysis
   - Competitor tracking
   - Optimal posting times

4. **Additional Features**
   - Post directly from dashboard
   - Bulk scheduling
   - Analytics reports
   - Team collaboration

## 🐛 Troubleshooting

### Charts not rendering?
Make sure `recharts` is installed:
```bash
cd client && npm install recharts
```

### API calls failing?
Check that:
- Backend server is running on port 5001
- You're logged in with Clerk
- CORS is properly configured

### Types errors?
Rebuild the TypeScript:
```bash
cd server && npm run build
```

## 📚 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express, TypeScript, Node.js
- **Auth**: Clerk
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6

## 🎨 Design System

Colors used throughout the dashboard:
- Primary: Blue (#3b82f6)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)
- Gradient: `bg-gradient-to-br from-blue-800 to-blue-400`

## 📝 Notes

- All API endpoints return mock data currently
- OAuth integration is placeholder-ready
- AI insights are template-based (ready for real AI)
- Token management uses localStorage (move to secure backend storage)
- Dashboard is fully responsive and mobile-friendly

## 🚀 Ready to Launch!

Your social media dashboard is now fully functional with:
✅ Beautiful UI components
✅ Interactive charts
✅ API infrastructure
✅ Routing configured
✅ Authentication integrated
✅ Mock data for testing

The foundation is solid and ready for connecting real social media APIs! 🎉

