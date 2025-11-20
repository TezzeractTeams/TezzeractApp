# Environment Setup

Create a `.env` file in the `server` directory with the following content:

```env
# Server Configuration
PORT=5001
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Supabase Configuration
SUPABASE_URL=https://zxuyluplyamcdfruxhxc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTE1MDUsImV4cCI6MjA3MDU2NzUwNX0.ckraA5wFHekxNewcPeTC2U98Xc5DBjhXHRlgMi6Nhjo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5MTUwNSwiZXhwIjoyMDcwNTY3NTA1fQ.mQA03QR3SXeR_ZpiVnZm1hQ1kYDRNXM_wAZwYQDZuP0
OPENAI_API_KEY=your-openai-key
```

## Quick Setup Command

Run this command in the `server` directory to create the .env file:

```bash
cat > .env << 'EOF'
PORT=5001
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
SUPABASE_URL=https://zxuyluplyamcdfruxhxc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTE1MDUsImV4cCI6MjA3MDU2NzUwNX0.ckraA5wFHekxNewcPeTC2U98Xc5DBjhXHRlgMi6Nhjo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dXlsdXBseWFtY2RmcnV4aHhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5MTUwNSwiZXhwIjoyMDcwNTY3NTA1fQ.mQA03QR3SXeR_ZpiVnZm1hQ1kYDRNXM_wAZwYQDZuP0
EOF
```

