# 🔧 Troubleshooting White Screen Issue

## Problem: White Screen on App Load

### Most Common Cause: Missing Clerk Publishable Key

The app now shows a helpful error message instead of a white screen if the Clerk key is missing.

## ✅ Solution Steps

### Step 1: Check Your `.env` File

Make sure you have a `.env` file in the **`client/`** directory with the following content:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here

# API Configuration  
VITE_API_URL=http://localhost:5001/api
```

**Important Notes:**
- The file must be named exactly `.env` (with the dot at the beginning)
- It must be in the `client/` directory, NOT the root directory
- Replace `pk_test_your_actual_key_here` with your actual Clerk publishable key
- Variable names MUST start with `VITE_` for Vite to expose them

### Step 2: Get Your Clerk Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### Step 3: Restart the Dev Server

After adding the `.env` file, you MUST restart the dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd "/Users/wehan/Documents/Tezzeract/Tezzeract AI/TezzeractApp"
pnpm --filter client dev
```

**Important:** Vite only reads `.env` files on startup, so changes require a restart.

---

## Other Possible Issues

### Issue 2: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm --filter client dev --port 3001
```

### Issue 3: Node Modules Issues

**Error:** Module not found errors

**Solution:**
```bash
cd "/Users/wehan/Documents/Tezzeract/Tezzeract AI/TezzeractApp"
pnpm install
```

### Issue 4: Cache Issues

**Error:** Stale imports or weird behavior

**Solution:**
```bash
# Clear Vite cache
cd client
rm -rf node_modules/.vite
pnpm dev
```

---

## 🧪 Testing the Fix

After following the steps above, you should see:

### If Key is Missing:
- A black screen with a helpful error message
- Instructions on how to add the Clerk key
- Link to Clerk Dashboard

### If Key is Present:
- The normal TezzeractApp home page
- "Sign In" and "Sign Up" buttons
- No white screen!

---

## 📋 Checklist

Before asking for help, verify:

- [ ] `.env` file exists in `client/` directory
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env`
- [ ] Key starts with `pk_test_` or `pk_live_`
- [ ] Dev server was restarted after adding `.env`
- [ ] No typos in variable name (must be exact)
- [ ] Browser console shows no errors (F12 → Console tab)

---

## 🆘 Still Having Issues?

### Check Browser Console

1. Open browser (Chrome/Firefox/Safari)
2. Press F12 or Right-click → Inspect
3. Go to Console tab
4. Look for error messages (red text)
5. Share the error message for help

### Check Terminal Output

Look for errors in the terminal where you ran `pnpm dev`:
- Module not found errors
- Syntax errors
- Port conflicts

### Verify Server is Running

Make sure both servers are running:

```bash
# Terminal 1 - Backend
cd "/Users/wehan/Documents/Tezzeract/Tezzeract AI/TezzeractApp"
pnpm --filter server dev
# Should show: 🚀 Server running on http://localhost:5001

# Terminal 2 - Frontend  
pnpm --filter client dev
# Should show: VITE ready in XXXms
# Local: http://localhost:3000
```

---

## 📝 Quick Reference: File Locations

```
TezzeractApp/
├── client/
│   ├── .env                    ← Add your Clerk key here!
│   ├── src/
│   │   └── main.tsx           ← Now shows helpful error
│   └── package.json
└── server/
    ├── .env                    ← Backend env vars
    └── src/
```

---

## ✅ Expected Behavior After Fix

1. Visit `http://localhost:3000`
2. See the home page with background image
3. See "Sign In" and "Sign Up" buttons
4. Click "Sign In" → Clerk modal opens
5. No white screen! 🎉

